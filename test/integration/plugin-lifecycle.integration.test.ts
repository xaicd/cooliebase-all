/**
 * 插件生命周期端到端：真实插件目录 + 真实 PG + 真实 worker 进程。
 *
 * 为什么单列这个文件：插件系统的单测（`packages/shared/backend/plugins/__tests__/`）
 * 只覆盖到协议与纯函数层面，"装一个插件进去它到底会不会变成 ready" 从来没被验证过 ——
 * 服务级测试用的是内存/桩，而 PluginRepository 直接走 cooliebasePrisma，没有内存回退。
 *
 * 本文件补上这条链路：磁盘扫描 → manifest 校验 → 落库 → spawn worker → initialize
 * → 状态推进到 ready，以及 worker 起不来时是否**只影响它自己**。
 *
 * 前置：需要真实 PG（DATABASE_URL）。无则整体跳过，避免把环境缺失伪装成通过。
 */
import fs from "node:fs"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { pluginRegistryService } from "@/shared/backend/plugins/plugin-registry.service"
import { pluginRuntimeManager } from "@/shared/backend/plugins/runtime-manager"
import { listPluginCatalog } from "@/app/api/v1/admin/plugins/_lib/plugin-catalog"
import { pluginSchemaName, runPluginMigrations } from "@/shared/backend/plugins/plugin-migrations"
import { cooliebasePrisma } from "@/shared/backend/prisma"
import { PluginRepository } from "@/shared/backend/plugins/plugin.repository"

const HAS_DB = Boolean(process.env.DATABASE_URL?.trim())

/** 插件目录必须落在仓库内：示例插件 `import "@cooliebase/plugin-sdk"` 要靠 node 逐级上溯到根 node_modules 才能解析。 */
const REPO_ROOT = process.cwd()
const PLUGIN_DIR = path.join(REPO_ROOT, ".cooliebase", "plugins-integration")
const EXAMPLE_SRC = path.join(REPO_ROOT, "packages/plugins/examples/hello-world")
const GOOD_KEY = "itest.lifecycle.plugin"
const BROKEN_KEY = "cooliebase.broken-worker"

function copyDirRecursive(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
    const srcPath = path.join(src, entry.name)
    const dstPath = path.join(dst, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath)
    } else {
      fs.copyFileSync(srcPath, dstPath)
    }
  }
}

function removeDirSafe(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  }
}

function copyExamplePlugin(targetName: string): string {
  const dir = path.join(PLUGIN_DIR, targetName)
  removeDirSafe(dir)
  // 整个包目录一起拷 —— 示例插件新增 merged.js 后整包拷贝不漏文件。
  // 跳过 node_modules，避免孤儿符号链接与宿主挂载权限冲突。
  copyDirRecursive(EXAMPLE_SRC, dir)
  // 必须改 id: 示例插件本体就在 `packages/plugins/examples/` 下，**也属于扫描的第一方根**。
  // 沿用它的 id 会让"包从磁盘移除"这个前提**不成立**（副本删了、原件还在，
  // 于是记录仍然是 ready）—— 实测就是这么挂的。用本用例自己的 id，前提才为真。
  const manifestPath = path.join(dir, "plugin.manifest.json")
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  manifest.id = GOOD_KEY
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  return dir
}

function writeBrokenPlugin(): string {
  const dir = copyExamplePlugin("broken-worker")
  // manifest 声明了 worker，但文件不存在 —— 安装期就该被拒（scanPluginPackage 校验入口存在性）
  fs.rmSync(path.join(dir, "worker.js"))
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "plugin.manifest.json"), "utf8"))
  manifest.id = BROKEN_KEY
  fs.writeFileSync(path.join(dir, "plugin.manifest.json"), JSON.stringify(manifest, null, 2))
  return dir
}

/** 只清本测试用到的 key —— 不要动库里其它记录。 */
async function purgeTestRecords(): Promise<void> {
  await cooliebasePrisma.plugin.deleteMany({ where: { pluginKey: { in: [GOOD_KEY, BROKEN_KEY] } } })
}

describe.skipIf(!HAS_DB)("插件安装 → ready 端到端（真实 PG + 真实 worker）", { timeout: 30000 }, () => {
  beforeAll(async () => {
    removeDirSafe(PLUGIN_DIR)
    fs.mkdirSync(PLUGIN_DIR, { recursive: true })
    await purgeTestRecords()
  })

  afterAll(async () => {
    await pluginRuntimeManager.stopAll()
    removeDirSafe(PLUGIN_DIR)
    await purgeTestRecords()
  })

  it("磁盘上一个合法插件包 → reconcile 后状态推进到 ready，且 worker 真的活着", async () => {
    copyExamplePlugin("hello-world")

    const result = await pluginRegistryService.reconcile(PLUGIN_DIR)
    // 断言**自己这个包**的状态，而不是全局计数 —— reconcile 是全实例级的，
    // 同时会把 16 个第一方插件一并安装，`installed` 永远不是 1（实测 16）。
    expect(result.rejected.flatMap((r) => r.pluginKey ?? [])).not.toContain(GOOD_KEY)
    // reconcile 遍历的是库中**全部**安装记录（安装是实例级的），故用包含断言
    expect(result.started).toContain(GOOD_KEY)

    const record = await PluginRepository.findByKey(GOOD_KEY)
    expect(record, "插件应已落库（真实 PG）").toBeTruthy()
    expect(record!.status).toBe("ready")
    expect(record!.lastError).toBeNull()

    // 不只是状态字段为 ready —— 进程确实在跑，且健康检查真的应答
    const worker = pluginRuntimeManager.get(GOOD_KEY)
    expect(worker?.running).toBe(true)
    expect((await worker!.health()).status).toBe("ok")
  })

  it("worker 入口缺失的插件被拒绝安装，且不影响同时存在的合法插件", async () => {
    writeBrokenPlugin()
    copyExamplePlugin("hello-world")

    const result = await pluginRegistryService.reconcile(PLUGIN_DIR)

    // 坏包在扫描期就被拒（入口不存在），不是等到 spawn 才发现
    const rejectedErrors = result.rejected.flatMap((r) => r.errors).join(" ")
    expect(rejectedErrors).toMatch(/worker.*不存在|指向的路径不存在/)

    // 失败隔离：合法插件不受坏包影响，仍然是 ready
    const good = await PluginRepository.findByKey(GOOD_KEY)
    expect(good!.status).toBe("ready")
    expect(pluginRuntimeManager.get(GOOD_KEY)?.running).toBe(true)
  })

  it("统一视图：内置插件(域)与已安装插件出现在同一张表，kind 可区分", async () => {
    copyExamplePlugin("hello-world")
    await pluginRegistryService.reconcile(PLUGIN_DIR)

    const catalog = await listPluginCatalog()

    // 内置插件 = 有 module.manifest.json 的域（由域契约派生，不落库）。
    // 注意是 16 不是 17: `online` 域的 manifestMode 是 handwritten，生成器会跳过它，
    // 因此它没有 module.manifest.json、也就进不了域注册表 —— 这是**已知缺口**，
    // 不是本用例的口径问题；修它要给 online 补生成式模块声明（会让它的手写 manifest 与生成物并存）。
    const builtin = catalog.filter((entry) => entry.kind === "builtin")
    expect(builtin.length).toBeGreaterThanOrEqual(16)
    expect(builtin.map((entry) => entry.pluginKey)).toContain("cooliebase.system")
    // 内置插件随宿主发布，恒为 ready、恒为同进程
    for (const entry of builtin) {
      expect(entry.status).toBe("ready")
      expect(entry.runtimeMode).toBe("merged")
    }

    // 真实插件包是 kind=installed
    const installed = catalog.filter((entry) => entry.kind === "installed")
    expect(installed.map((entry) => entry.pluginKey)).toContain(GOOD_KEY)
  })

  it("把插件切成 merged 形态 → 同进程运行、状态仍为 ready（一个插件两种形态）", async () => {
    copyExamplePlugin("hello-world")
    // 先按默认形态装一次，拿到记录
    await pluginRegistryService.reconcile(PLUGIN_DIR)
    await PluginRepository.setMode(GOOD_KEY, "merged")

    const result = await pluginRegistryService.reconcile(PLUGIN_DIR)
    expect(result.modes?.[GOOD_KEY]).toBe("merged")
    expect(pluginRuntimeManager.modeOf(GOOD_KEY)).toBe("merged")

    const record = await PluginRepository.findByKey(GOOD_KEY)
    expect(record!.status).toBe("ready")
    expect((await pluginRuntimeManager.get(GOOD_KEY)!.health()).status).toBe("ok")

    // 复位，避免影响后续用例
    await PluginRepository.setMode(GOOD_KEY, "isolated")
  })

  it("第一方插件自带迁移：表落在插件自己的 schema，宿主 public 里看不到，且幂等", async () => {
    const pluginKey = "cooliebase.hello-world"
    const schema = pluginSchemaName(pluginKey)

    // 先清掉上一次的口径，保证断言确定
    await cooliebasePrisma.pluginMigration.deleteMany({ where: { pluginKey } })
    await cooliebasePrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)

    // 1) 不信任 -> 跳过，并给出原因（第三方插件的路径）
    const untrusted = await runPluginMigrations({
      pluginKey, packagePath: EXAMPLE_SRC, dir: "./migrations", trusted: false,
    })
    expect(untrusted.applied).toEqual([])
    expect(untrusted.skippedReason).toContain("未信任")

    // 2) 信任 -> 真的执行
    const first = await runPluginMigrations({
      pluginKey, packagePath: EXAMPLE_SRC, dir: "./migrations", trusted: true,
    })
    expect(first.applied).toEqual(["001_init.sql"])
    expect(first.schema).toBe(schema)

    // 关键断言: 落子在插件的 schema 里
    const inPluginSchema = await cooliebasePrisma.$queryRawUnsafe<Array<{ n: bigint }>>(
      `SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'hello_items'`,
    )
    expect(Number(inPluginSchema[0].n)).toBe(1)

    // 关键断言: 宿主 public 里**没有**这张表（隔离生效）
    const inPublic = await cooliebasePrisma.$queryRawUnsafe<Array<{ n: bigint }>>(
      `SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hello_items'`,
    )
    expect(Number(inPublic[0].n)).toBe(0)

    // 3) 幂等: 再跑一次不会重复执行
    const second = await runPluginMigrations({
      pluginKey, packagePath: EXAMPLE_SRC, dir: "./migrations", trusted: true,
    })
    expect(second.applied).toEqual([])
    expect(second.skipped).toEqual(["001_init.sql"])

    // 收尾
    await cooliebasePrisma.pluginMigration.deleteMany({ where: { pluginKey } })
    await cooliebasePrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
  })

  it("插件包从磁盘移除 → 得到诚实处理（不谎报 ready）", async () => {
    removeDirSafe(path.join(PLUGIN_DIR, "hello-world"))
    await pluginRegistryService.reconcile(PLUGIN_DIR)

    // findByKey 只返回未逻辑删除的记录，故它查不到是预期路径之一
    const visible = await PluginRepository.findByKey(GOOD_KEY)
    if (visible) {
      // 未逻辑删除 → 必须标 error。**绝不能仍是 ready**（这正是本用例要守的底线）
      expect(visible.status).toBe("error")
    } else {
      // 已被逻辑删除：用原始查询确认行确实存在且 deleted=true，
      // 而不是把"查不到"（可能因为压根没落库）当成功
      const raw = await cooliebasePrisma.plugin.findFirst({ where: { pluginKey: GOOD_KEY } })
      expect(raw, "记录应存在（此前已成功安装）").toBeTruthy()
      expect(raw!.deleted).toBe(true)
      expect(raw!.status).toBe("error")
    }
  })
})
