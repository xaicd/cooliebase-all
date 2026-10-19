import fs from "node:fs"
import net from "node:net"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

// helper 是 CJS，测试用 createRequire 载入（与仓内其它脚本测试一致）
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { resolveDatabaseEndpoint, findFreePort } = require("../../scripts/lib/ephemeral-pg.cjs")

const ENV_KEYS = ["DATABASE_URL", "PGHOST", "PGPORT", "PGUSER", "PGPASSWORD"] as const
let saved: Record<string, string | undefined> = {}

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
  for (const key of ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

const isPortOpen = (port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = net.connect(port, "127.0.0.1")
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.once("error", () => resolve(false))
  })

const silentLogger = { log: () => {}, error: () => {} }

/**
 * `ephemeral-pg` 端点解析器。
 *
 * 它决定三件套连哪个数据库。三条不变量都必须有反向对照，
 * 否则「看起来在跑」和「真的连上了」分不开：
 *   ① 外部 `DATABASE_URL` 永远优先（不能劫持 CI / 已有库）；
 *   ② 不是 Postgres 的连接串必须 **fail-loud**（不许悄悄退回内存模式）；
 *   ③ 嵌入式实例关闭后**端口必须释放、临时目录必须删除**（否则一次冒烟留一堆垃圾）。
 */
describe("ephemeral-pg 端点解析", () => {
  it("正向：无外部配置时启动嵌入式 Postgres，并返回可用端点", async () => {
    const endpoint = await resolveDatabaseEndpoint({ logger: silentLogger })
    try {
      expect(endpoint.source).toBe("embedded")
      expect(endpoint.port).toBeGreaterThan(0)
      expect(endpoint.url).toMatch(/^postgresql:\/\/postgres:postgres@127\.0\.0\.1:\d+\/postgres$/)
      expect(await isPortOpen(endpoint.port)).toBe(true)
      expect(endpoint.dataDir && fs.existsSync(endpoint.dataDir)).toBe(true)
    } finally {
      await endpoint.close()
    }
    // ③ 关闭后零残留
    expect(await isPortOpen(endpoint.port)).toBe(false)
    expect(endpoint.dataDir && fs.existsSync(endpoint.dataDir)).toBe(false)
  }, 120000)

  it("★ 反向 1：已设置 DATABASE_URL → 必须直接复用，且**不启动**任何进程", async () => {
    const external = "postgresql://someone:secret@db.example.com:6543/prod"
    process.env.DATABASE_URL = external
    const endpoint = await resolveDatabaseEndpoint({ logger: silentLogger })
    expect(endpoint.source).toBe("external")
    expect(endpoint.url).toBe(external)
    expect(endpoint.port).toBeNull()
    expect(endpoint.dataDir).toBeNull()
    await endpoint.close() // 外部库的 close 必须是 no-op，不能去停别人的库
  })

  it("★ 反向 2：DATABASE_URL 不是 Postgres → 必须 fail-loud（不得退回内存模式）", async () => {
    process.env.DATABASE_URL = "file:./data/cooliebase.db"
    await expect(resolveDatabaseEndpoint({ logger: silentLogger })).rejects.toThrow(/Postgres/)
  })

  it("★ 反向 3：PGHOST 走外部路径（历史用法保持可用）", async () => {
    process.env.PGHOST = "172.19.0.1"
    process.env.PGPORT = "5433"
    const endpoint = await resolveDatabaseEndpoint({ logger: silentLogger })
    expect(endpoint.source).toBe("external")
    expect(endpoint.port).toBe(5433)
    expect(endpoint.url).toContain("172.19.0.1:5433")
  })

  it("findFreePort 返回的端口确实是空闲的", async () => {
    const port = await findFreePort()
    expect(port).toBeGreaterThan(0)
    expect(await isPortOpen(port)).toBe(false)
  })
})
