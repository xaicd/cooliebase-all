/**
 * 模块注册表（Platform Module 声明的运行时索引）。
 *
 * 数据来自同目录的生成物 `module-registry.generated.ts`（由 `npm run domain:manifests`
 * 产出）。本文件**不维护任何清单** —— 清单只在生成物里，避免出现第二份真源。
 *
 * 为什么住在 src/app（组合根）而不是 modules/shared：
 * 1. **分层**：`shared` 是 L0 基础 SDK，从不静态依赖具体域（既有姿势是
 *    `import(\`@/modules/${domain}/...\`)` 动态导入）。本索引静态 import 全部 16 个域，
 *    放进 `shared` 会把依赖方向倒过来（foundation → 全部域）。
 * 2. **实害**：`domain:pack` 只打包 `[domain, ...dependsOnModules]`（即 domain + shared）。
 *    索引若在 `shared` 内，打包后会 import 到未随包拷贝的其它域而构建失败。
 *    网关不属于任何单域的 apiRouteDirs，故不会进入域包。
 *
 * 定位: 本仓的域是 **Platform Module**（可信/进程内/显式注册面），
 * 不是 §6.2 的可安装 Plugin。故本文件与产物一律用 module 命名。
 * 设计见 docs/architecture/cooliebase-all-module-to-plugin-migration.md。
 */
import { MODULE_MANIFESTS } from "./module-registry.generated"

export type ModuleManifest = (typeof MODULE_MANIFESTS)[number]

/** 全部已登记域模块（顺序与 domain-catalog 一致）。 */
export function listModules(): readonly ModuleManifest[] {
  return MODULE_MANIFESTS
}

/** 按域名解析模块。域名即 manifest 的 `domain` 字段（生成自 domain-catalog）。 */
export function getModuleByDomain(domain: string): ModuleManifest | undefined {
  return MODULE_MANIFESTS.find((manifest) => manifest.domain === domain)
}

export type ModuleDispatchTarget = {
  manifest: ModuleManifest
  method: string
}

export type ModuleDispatchResolution =
  | { ok: true; target: ModuleDispatchTarget }
  | { ok: false; status: 400 | 403 | 404; error: string }

/** 网关派发 facade 方法所要求的能力。声明是请求，这里是唯一的授权判定点。 */
export const DISPATCH_REQUIRED_CAPABILITY = "facade.invoke"

/**
 * 单个模块是否具备被派发的能力。
 * 抽成纯函数是为了可测：当前所有域都声明了该能力，走注册表无法构造反例。
 */
export function moduleCanDispatch(manifest: Pick<ModuleManifest, "capabilities">): boolean {
  return (manifest.capabilities as readonly string[]).includes(DISPATCH_REQUIRED_CAPABILITY)
}

/**
 * 把网关的 `[...path]` 解析为 `<domain>/<method>`。
 *
 * 只支持两级：更深的路径属于「模块自有子路由」，当前不承诺（需要 apiRoutes 声明面）。
 * 两道拒绝，避免声明面被绕过：
 *   1. 能力：未声明 `facade.invoke` 的模块不可被派发（403）
 *   2. 方法：未在 manifest facadeMethods 内的方法直接 404，不落到 `invokeAction` 的动态兜底
 */
export function resolveModuleDispatch(segments: readonly string[]): ModuleDispatchResolution {
  if (segments.length === 0) {
    return { ok: false, status: 400, error: "缺少模块路径，格式为 <domain>/<method>" }
  }
  if (segments.length !== 2) {
    return {
      ok: false,
      status: 400,
      error: `仅支持 <domain>/<method> 两级路径，收到 ${segments.length} 段`,
    }
  }

  const [domain, method] = segments
  const manifest = getModuleByDomain(domain)
  if (!manifest) {
    return { ok: false, status: 404, error: `未登记的域: ${domain}` }
  }
  if (!moduleCanDispatch(manifest)) {
    return {
      ok: false,
      status: 403,
      error: `${domain} 未声明能力 ${DISPATCH_REQUIRED_CAPABILITY}，拒绝派发`,
    }
  }
  if (!(manifest.facadeMethods as readonly string[]).includes(method)) {
    return { ok: false, status: 404, error: `${domain} 未声明 facade 方法: ${method}` }
  }
  return { ok: true, target: { manifest, method } }
}
