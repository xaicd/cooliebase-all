/**
 * 插件包发现与扫描。
 *
 * 部署模型：插件包放在一个**实例级目录**下，宿主扫描它；宿主源码树不含插件代码。
 * 开发期的第一方插件另放 `packages/plugins/*`（见 packages/shared/backend/plugins/__tests__/fixtures/hello-world）。
 *
 * 安全要点：`cooliebasePlugin.manifest` 指针**来自插件包自己**，因此解析后必须确认
 * 仍落在该插件包目录内 —— 否则一个恶意包可以用 `../../` 让宿主读取任意文件。
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

import { parsePluginManifest } from "./manifest"
import type { PluginManifest, PluginPackagePointer } from "./types"

/** 插件包 package.json 中的入口指针键名。 */
export const PLUGIN_POINTER_KEY = "cooliebasePlugin"

/** 仓内第一方插件根（Paperclip 的 packages/plugins/* 形态）。 */
export function firstPartyPluginRoots(repoRoot: string = process.cwd()): string[] {
  return [path.join(repoRoot, "packages", "plugins")]
}

/** 插件目录：可用 COOLIEBASE_PLUGIN_DIR 覆盖；默认落在仓库内的 .cooliebase/plugins（已 gitignore）。 */
export function resolvePluginDir(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.COOLIEBASE_PLUGIN_DIR?.trim()
  if (configured) return path.resolve(configured)
  return path.join(process.cwd(), ".cooliebase", "plugins")
}

export type DiscoveredPlugin = {
  /** 插件包目录（绝对路径）。 */
  packageDir: string
  /** package.json 的 name。 */
  packageName: string
  /** package.json 声明的入口指针；缺失或形状不对时为 undefined。 */
  pointer?: PluginPackagePointer
  /** 校验通过的 manifest。 */
  manifest?: PluginManifest
  /** 该包被拒的原因（空数组表示通过）。 */
  errors: string[]
}

function readJson(file: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(readFileSync(file, "utf8")) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function readPointer(pkg: Record<string, unknown>): PluginPackagePointer | undefined {
  const raw = pkg[PLUGIN_POINTER_KEY]
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined
  const pointer = raw as Record<string, unknown>
  const manifest = typeof pointer.manifest === "string" ? pointer.manifest : ""
  const worker = typeof pointer.worker === "string" ? pointer.worker : undefined
  const merged = typeof pointer.merged === "string" ? pointer.merged : undefined
  const ui = typeof pointer.ui === "string" ? pointer.ui : undefined
  // worker / merged 至少一个 —— 只有 ui 之类而没有可运行入口的包不算插件。
  if (!manifest || (!worker && !merged)) return undefined
  return { manifest, ...(worker ? { worker } : {}), ...(merged ? { merged } : {}), ...(ui ? { ui } : {}) }
}

/**
 * 把包内相对路径解析为绝对路径，并**确认未逃出插件包目录**。
 * 越界返回 undefined（调用方按拒绝处理）。
 */
function resolveInside(packageDir: string, relative: string): string | undefined {
  const resolved = path.resolve(packageDir, relative)
  const root = path.resolve(packageDir) + path.sep
  return resolved.startsWith(root) ? resolved : undefined
}

/** 扫描一个插件包目录；任何不合法都体现在 errors 里，不抛异常（一个坏包不该中断整轮扫描）。 */
export function scanPluginPackage(packageDir: string): DiscoveredPlugin | undefined {
  const pkgFile = path.join(packageDir, "package.json")
  if (!existsSync(pkgFile)) return undefined

  const pkgRead = readJson(pkgFile)
  if (!pkgRead.ok) {
    return { packageDir, packageName: path.basename(packageDir), errors: [`package.json 解析失败: ${pkgRead.error}`] }
  }
  const pkg = pkgRead.value as Record<string, unknown>
  const packageName = typeof pkg.name === "string" ? pkg.name : path.basename(packageDir)

  const pointer = readPointer(pkg)
  if (!pointer) {
    return {
      packageDir,
      packageName,
      errors: [`package.json 缺少合法的 ${PLUGIN_POINTER_KEY} 指针（需 manifest，以及 worker/merged 至少一个）`],
    }
  }

  const manifestFile = resolveInside(packageDir, pointer.manifest)
  if (!manifestFile) {
    return { packageDir, packageName, pointer, errors: [`${PLUGIN_POINTER_KEY}.manifest 越出插件包目录: ${pointer.manifest}`] }
  }
  if (!existsSync(manifestFile)) {
    return { packageDir, packageName, pointer, errors: [`manifest 文件不存在: ${pointer.manifest}`] }
  }

  const manifestRead = readJson(manifestFile)
  if (!manifestRead.ok) {
    return { packageDir, packageName, pointer, errors: [`manifest 解析失败: ${manifestRead.error}`] }
  }

  const validation = parsePluginManifest(manifestRead.value)
  if (!validation.ok) return { packageDir, packageName, pointer, errors: validation.errors }

  const errors: string[] = []
  // 入口文件必须真实存在，否则安装成功但启动必失败
  for (const [key, relative] of Object.entries({ worker: pointer.worker, merged: pointer.merged, ui: pointer.ui })) {
    if (!relative) continue
    const resolved = resolveInside(packageDir, relative)
    if (!resolved) errors.push(`${PLUGIN_POINTER_KEY}.${key} 越出插件包目录: ${relative}`)
    else if (!existsSync(resolved)) errors.push(`${PLUGIN_POINTER_KEY}.${key} 指向的路径不存在: ${relative}`)
  }

  return {
    packageDir,
    packageName,
    pointer,
    // 语义统一：有 errors 即不可安装，不返回可用的 manifest。
    // （调用方只看 errors 是否为空来决定放行，不该出现"有错也有 manifest"的中间态。）
    ...(errors.length === 0 ? { manifest: validation.manifest } : {}),
    errors,
  }
}

/**
 * 扫描**全部**插件来源：实例插件目录 + 仓内第一方插件根。
 *
 * 为什么要多根：第一方插件（例如某个域改造而来的插件）应该**留在仓内开发**
 * —— 这与 Paperclip 把第一方插件放在 `packages/plugins/*` 是同一做法；
 * 实例目录留给运行时装入的第三方插件。
 *
 * 识别方式是"目录里的 package.json 有没有 cooliebasePlugin 指针"，不做路径硬编码排除 ——
 * 因此 packages/plugins/sdk 这类没有指针的目录会被自然跳过。
 */
export type PluginScanRoot = {
  dir: string
  /**
   * 该根下"不是插件的目录"要不要作为**被拒插件**报出来。
   *
   * 两个根的语义本就不同：
   *   - 实例插件目录（运行时装入第三方插件）：放进去的每个子目录**都应该是插件**，
   *     不合格就要报出来（rejected），否则操作员不知道装失败了。
   *   - 仓内第一方插件根（packages/plugins/**）：这里同时住着 sdk 这类**普通的包**，
   *     它们不是"被拒的插件"，不该出现在 rejected 里制造噪音 —— 静默跳过即可。
   */
  reportSkipped: boolean
}

export function scanAllPluginPackages(
  roots: Array<string | PluginScanRoot> = [
    { dir: resolvePluginDir(), reportSkipped: true },
    ...firstPartyPluginRoots().map((dir) => ({ dir, reportSkipped: false })),
  ],
): DiscoveredPlugin[] {
  const discovered: DiscoveredPlugin[] = []
  const seenDirs = new Set<string>()

  for (const root of roots) {
    const { dir: rootDir, reportSkipped } = typeof root === "string" ? { dir: root, reportSkipped: false } : root
    if (!existsSync(rootDir)) continue
    const candidates = reportSkipped
      ? readdirSync(rootDir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules")
          .map((entry) => path.join(rootDir, entry.name))
      : walkCandidateDirs(rootDir, 0)

    for (const dir of candidates) {
      const resolved = path.resolve(dir)
      if (seenDirs.has(resolved)) continue
      seenDirs.add(resolved)
      const found = scanPluginPackage(dir)
      if (!found) continue
      if (!reportSkipped && found.errors.length > 0) continue // 该根下只认"确实是插件"的目录
      discovered.push(found)
    }
  }

  // 跨来源的 id 冲突同样要拦（两个根里放了同一个插件 id 是配置错误）
  const idOwners = new Map<string, string>()
  for (const item of discovered) {
    if (!item.manifest) continue
    const previous = idOwners.get(item.manifest.id)
    if (previous) {
      item.errors.push(`插件 id "${item.manifest.id}" 与 ${previous} 冲突`)
      delete item.manifest
    } else {
      idOwners.set(item.manifest.id, item.packageName)
    }
  }

  return discovered.sort((a, b) => a.packageDir.localeCompare(b.packageDir))
}

/** 在一个根目录下找候选插件目录（根自身 + 往下若干层，跳过 node_modules 等）。 */
function walkCandidateDirs(root: string, depth: number, maxDepth = 3): string[] {
  if (depth > maxDepth) return []
  const out: string[] = []
  // 注意: 不要给 entries 标注 ReturnType<typeof readdirSync> —— readdirSync 重载的返回类型
  // 不一致（Dirent<string> vs Dirent<NonSharedBuffer>），显式标注会引入类型错。
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch {
    return []
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") continue
    const full = path.join(root, entry.name)
    out.push(full)
    out.push(...walkCandidateDirs(full, depth + 1, maxDepth))
  }
  return out
}

/** 扫描插件目录下的全部插件包，并检查跨包 id 冲突。 */
export function scanPluginPackages(pluginDir: string = resolvePluginDir()): DiscoveredPlugin[] {
  if (!existsSync(pluginDir)) return []

  const candidates = readdirSync(pluginDir)
    .filter((entry) => !entry.startsWith(".") && entry !== "node_modules")
    .map((entry) => path.join(pluginDir, entry))
    .filter((full) => {
      try {
        return statSync(full).isDirectory()
      } catch {
        return false
      }
    })
    .sort()

  const discovered: DiscoveredPlugin[] = []
  const idOwners = new Map<string, string>()

  for (const dir of candidates) {
    const found = scanPluginPackage(dir)
    if (!found) continue
    if (found.manifest) {
      const previous = idOwners.get(found.manifest.id)
      if (previous) {
        found.errors.push(`插件 id "${found.manifest.id}" 与 ${previous} 冲突`)
        delete found.manifest
      } else {
        idOwners.set(found.manifest.id, found.packageName)
      }
    }
    discovered.push(found)
  }

  return discovered
}
