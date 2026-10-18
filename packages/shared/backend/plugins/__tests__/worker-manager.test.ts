import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { PluginWorker, PluginWorkerManager } from "../worker-manager"
import { WORKER_LIMITS, type WorkerInitializeInput } from "../worker-protocol"

/** 真实的示例插件包（packages/plugins/examples/hello-world）—— 不再手搓 fixture。 */
const EXAMPLE_DIR = path.resolve(process.cwd(), "packages/plugins/examples/hello-world")
const EXAMPLE_WORKER = path.join(EXAMPLE_DIR, "worker.js")

function initInput(pluginKey = "cooliebase.hello-world"): WorkerInitializeInput {
  return {
    manifest: { id: pluginKey },
    config: {},
    hostApiVersion: 1,
    instance: { pluginKey, packagePath: EXAMPLE_DIR },
  }
}

const tempDirs: string[] = []
afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

/** 写一个"顽固" worker：只回应 initialize，其余一律不答（用于超时与停机阶梯）。 */
function writeStubbornWorker(options: { ignoreSigterm?: boolean } = {}): { entry: string; dir: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-worker-"))
  tempDirs.push(dir)
  const entry = path.join(dir, "stubborn.js")
  fs.writeFileSync(
    entry,
    [
      `process.stdin.setEncoding("utf8")`,
      `let buf = ""`,
      options.ignoreSigterm ? `process.on("SIGTERM", () => {})` : ``,
      `process.stdin.on("data", (chunk) => {`,
      `  buf += chunk`,
      `  for (const line of buf.split("\\n")) {`,
      `    if (!line.trim()) continue`,
      `    const req = JSON.parse(line)`,
      `    // 只回应 initialize；health 与 shutdown 故意不答`,
      `    if (req.method === "initialize") {`,
      `      process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, result: { ok: true } }) + "\\n")`,
      `    }`,
      `  }`,
      `  buf = ""`,
      `})`,
    ]
      .filter(Boolean)
      .join("\n"),
  )
  return { entry, dir }
}

/** 断言进程是否存活。 */
function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

describe("PluginWorker", () => {
  it("能启动真实示例插件：initialize 成功、health 返回 ok、stop 干净退出", async () => {
    const worker = new PluginWorker("cooliebase.hello-world", EXAMPLE_WORKER, EXAMPLE_DIR)
    await worker.start(initInput())
    expect(worker.running).toBe(true)

    const health = await worker.health()
    expect(health.status).toBe("ok")

    await worker.stop()
    expect(worker.running).toBe(false)
  })

  it("worker 入口不存在时 start 抛出（不静默降级）", async () => {
    const worker = new PluginWorker("missing", path.join(EXAMPLE_DIR, "nope.js"), EXAMPLE_DIR)
    await expect(worker.start(initInput("missing"))).rejects.toThrow(/入口不存在/)
  })

  it("请求超时时拒绝，而不是挂住宿主", async () => {
    const { entry, dir } = writeStubbornWorker()
    const worker = new PluginWorker("stubborn", entry, dir, { gracefulShutdownMs: 150, sigtermGraceMs: 1_000 })
    await worker.start(initInput("stubborn"))

    await expect(worker.request("health", undefined, 250)).rejects.toThrow(/未在 250ms 内响应/)
    await worker.stop()
  })

  it("停机阶梯：不回应 shutdown 时升级到 SIGTERM 并真正退出", async () => {
    const { entry, dir } = writeStubbornWorker()
    const worker = new PluginWorker("stubborn", entry, dir, { gracefulShutdownMs: 150, sigtermGraceMs: 1_000 })
    await worker.start(initInput("stubborn"))
    const pid = worker.diagnostics.pid as number
    expect(isAlive(pid)).toBe(true)

    await worker.stop()
    expect(isAlive(pid)).toBe(false)
  })

  it("阶梯末端：连 SIGTERM 也忽略时升级到 SIGKILL", async () => {
    const { entry, dir } = writeStubbornWorker({ ignoreSigterm: true })
    const worker = new PluginWorker("unkillable", entry, dir, { gracefulShutdownMs: 150, sigtermGraceMs: 250 })
    await worker.start(initInput("unkillable"))
    const pid = worker.diagnostics.pid as number

    await worker.stop()
    expect(isAlive(pid)).toBe(false)
  })
})

describe("PluginWorkerManager", () => {
  it("失败隔离：一个 worker 起不来不影响已启动的其它 worker", async () => {
    const manager = new PluginWorkerManager()
    await manager.start("ok.plugin", EXAMPLE_WORKER, EXAMPLE_DIR, initInput("ok.plugin"))

    await expect(
      manager.start("bad.plugin", path.join(EXAMPLE_DIR, "nope.js"), EXAMPLE_DIR, initInput("bad.plugin")),
    ).rejects.toThrow(/入口不存在/)

    // 关键断言：坏的那个失败之后，好的那个仍然活着且健康
    const stillRunning = manager.get("ok.plugin")
    expect(stillRunning?.running).toBe(true)
    expect((await stillRunning!.health()).status).toBe("ok")

    await manager.stopAll()
    expect(manager.list()).toEqual([])
  })

  it("停机阶梯：stop() 会让 worker 进程真正退出", async () => {
    const manager = new PluginWorkerManager()
    const worker = await manager.start("cooliebase.hello-world", EXAMPLE_WORKER, EXAMPLE_DIR, initInput())
    const pid = worker.diagnostics.pid
    expect(typeof pid).toBe("number")

    await manager.stop("cooliebase.hello-world")

    // 进程应已退出（停机阶梯走完），PID 不再存活
    await new Promise((resolve) => setTimeout(resolve, 100))
    let alive = true
    try {
      process.kill(pid as number, 0)
    } catch {
      alive = false
    }
    expect(alive).toBe(false)
    expect(WORKER_LIMITS.gracefulShutdownMs).toBeGreaterThan(0)
  })
})

/**
 * isolated 形态的**路由转发**（worker 协议的可选方法 invokeRoute）。
 *
 * 这是插件"能独立运行"与"能对外服务"的交点: 没有它，isolated 插件进程活着
 * 但路由不可达 —— 对外等于空转，而且宿主只能回 501。
 * 这里用**真实的示例插件 worker** 走一遍 JSON-RPC 往返，不手搓 fixture。
 */
describe("PluginWorker: isolated 路由转发 (invokeRoute)", () => {
  it("把 routeKey 派发到 worker 的 routes 处理器，并原样带回响应", async () => {
    const worker = new PluginWorker("cooliebase.hello-world", EXAMPLE_WORKER, EXAMPLE_DIR)
    await worker.start(initInput())
    try {
      const result = (await worker.request("invokeRoute", {
        routeKey: "hello",
        request: {
          method: "GET",
          path: "/api/v1/plugins/cooliebase.hello-world/api/hello",
          query: { from: "test" },
          body: undefined,
          headers: {},
          pluginKey: "cooliebase.hello-world",
        },
      })) as { status: number; body: Record<string, unknown> }

      expect(result.status).toBe(200)
      expect(result.body.message).toContain("hello from plugin")
      // 处理器真的收到了请求上下文（不是被丢弃后返回固定值）
      expect(result.body.pluginKey).toBe("cooliebase.hello-world")
      expect(result.body.query).toEqual({ from: "test" })
    } finally {
      await worker.stop()
    }
  })

  it("未声明的 routeKey -> methodNotFound（明确报错，不静默返回空）", async () => {
    const worker = new PluginWorker("cooliebase.hello-world", EXAMPLE_WORKER, EXAMPLE_DIR)
    await worker.start(initInput())
    try {
      await expect(
        worker.request("invokeRoute", { routeKey: "not-implemented", request: {} }),
      ).rejects.toThrow(/未实现路由|methodNotFound/)
    } finally {
      await worker.stop()
    }
  })
})
