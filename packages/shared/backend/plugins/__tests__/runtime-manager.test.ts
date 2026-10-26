import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { MergedPlugin } from "../merged-runtime"
import { PluginRuntimeManager } from "../runtime-manager"
import type { WorkerInitializeInput } from "../worker-protocol"

/** 真实示例插件包 —— 同时声明 worker（独立）与 merged（合并）两个入口。 */
const EXAMPLE_DIR = path.resolve(process.cwd(), "packages/shared/backend/plugins/__tests__/fixtures/hello-world")
const WORKER_ENTRY = path.join(EXAMPLE_DIR, "worker.js")
const MERGED_ENTRY = path.join(EXAMPLE_DIR, "merged.js")

const tempDirs: string[] = []
afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function initInput(pluginKey = "cooliebase.hello-world"): WorkerInitializeInput {
  return {
    manifest: { id: pluginKey },
    config: {},
    hostApiVersion: 1,
    instance: { pluginKey, packagePath: EXAMPLE_DIR },
  }
}

describe("插件双形态：一个插件，两种运行方式", () => {
  it("合并形态（in-process）：加载模块、直接调用 handler、health 正常", async () => {
    const plugin = new MergedPlugin("cooliebase.hello-world", MERGED_ENTRY, EXAMPLE_DIR)
    await plugin.start(initInput())
    expect(plugin.running).toBe(true)

    const health = await plugin.health()
    expect(health.status).toBe("ok")
    expect(health.message).toContain("merged")

    await plugin.stop()
    expect(plugin.running).toBe(false)
  })

  it("两种形态的 health 契约一致（差别只在传输）", async () => {
    const manager = new PluginRuntimeManager()

    const mergedRuntime = await manager.start("p.merged", "merged", MERGED_ENTRY, EXAMPLE_DIR, initInput("p.merged"))
    const isolatedRuntime = await manager.start("p.isolated", "isolated", WORKER_ENTRY, EXAMPLE_DIR, initInput("p.isolated"))

    const mergedHealth = await mergedRuntime.health()
    const isolatedHealth = await isolatedRuntime.health()
    // 两者 status 都是 ok、都是同一形状；合并形态的 message 里带 merged 只是示例插件的措辞
    expect(mergedHealth.status).toBe("ok")
    expect(isolatedHealth.status).toBe("ok")
    expect(Object.keys(mergedHealth)).toEqual(expect.arrayContaining(["status"]))
    expect(Object.keys(isolatedHealth)).toEqual(expect.arrayContaining(["status"]))

    // 形态可被查询（运营想知道某个插件实际怎么跑的）
    expect(manager.modeOf("p.merged")).toBe("merged")
    expect(manager.modeOf("p.isolated")).toBe("isolated")
    expect(manager.list().sort()).toEqual(["p.isolated", "p.merged"])

    await manager.stopAll()
    expect(manager.list()).toEqual([])
  })

  it("合并入口的文件不存在时报错（不静默降级）", async () => {
    const plugin = new MergedPlugin("missing", path.join(EXAMPLE_DIR, "nope.js"), EXAMPLE_DIR)
    await expect(plugin.start(initInput("missing"))).rejects.toThrow(/合并入口不存在/)
  })

  it("setup 抛错时 start 拒绝且不留下半启动状态", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-merged-"))
    tempDirs.push(dir)
    const entry = path.join(dir, "bad.mjs")
    fs.writeFileSync(
      entry,
      `export default { async setup() { throw new Error("boom") } }\n`,
    )
    const plugin = new MergedPlugin("bad", entry, dir)
    await expect(plugin.start(initInput("bad"))).rejects.toThrow(/setup 失败.*boom/s)
    expect(plugin.running).toBe(false)
    expect(plugin.diagnostics.lastError).toContain("boom")
  })

  it("导出形状不对时明确报错（必须导出插件对象）", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-merged-"))
    tempDirs.push(dir)
    const entry = path.join(dir, "not-plugin.mjs")
    fs.writeFileSync(entry, `export default "just a string"\n`)
    const plugin = new MergedPlugin("bad2", entry, dir)
    await expect(plugin.start(initInput("bad2"))).rejects.toThrow()
  })

  it("同一插件重复 start 会先停旧实例（换形态不会留下两份）", async () => {
    const manager = new PluginRuntimeManager()
    await manager.start("p.switch", "isolated", WORKER_ENTRY, EXAMPLE_DIR, initInput("p.switch"))
    expect(manager.modeOf("p.switch")).toBe("isolated")

    await manager.start("p.switch", "merged", MERGED_ENTRY, EXAMPLE_DIR, initInput("p.switch"))
    expect(manager.modeOf("p.switch")).toBe("merged")
    expect(manager.list()).toEqual(["p.switch"])

    await manager.stopAll()
  })
})
