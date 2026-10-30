#!/usr/bin/env node
/**
 * `db:embedded` —— 本机开发用的**常驻**嵌入式 Postgres（不需要 docker）。
 *
 * 与 `scripts/lib/ephemeral-pg.cjs` 的分工：
 *   · ephemeral-pg：**测试用**，mkdtemp 临时 dataDir，跑完 stop() 连带删除，零残留；
 *   · 本脚本：**开发用**，固定 dataDir + 固定端口，可反复重启、数据不丢。
 *
 * 为什么需要它：插件域（ai/aigw/bpm/crm/…）走 Prisma（provider=postgresql），
 * 没有可达的 Postgres 就一律 `DatabaseNotReachable` 500。而本仓本就依赖
 * `embedded-postgres`，**不必为了本地开发再拉一个 docker**（实测 Docker Desktop
 * 的端口转发在宿主机上可能根本连不通，docker 那条路并不可靠）。
 *
 * 用法：
 *   node scripts/dev-db-embedded.cjs            # 前台常驻，打印 DATABASE_URL
 *   EMBEDDED_PG_PORT=55432 EMBEDDED_PG_DATA_DIR=./.embedded-pg node scripts/dev-db-embedded.cjs
 *   node scripts/dev-db-embedded.cjs --print    # 只打印 URL 然后退出（给 CI/脚本拼环境用）
 */
const fs = require("node:fs")
const path = require("node:path")
const net = require("node:net")

const ROOT = path.resolve(__dirname, "..")
const DATA_DIR = path.resolve(process.env.EMBEDDED_PG_DATA_DIR || path.join(ROOT, ".embedded-pg", "data"))
const PORT = Number(process.env.EMBEDDED_PG_PORT || 55432)
const USER = process.env.EMBEDDED_PG_USER || "postgres"
const PASSWORD = process.env.EMBEDDED_PG_PASSWORD || "postgres"
const DATABASE = process.env.EMBEDDED_PG_DATABASE || "postgres"

const printOnly = process.argv.includes("--print")
const url = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}?schema=public`

function isPortBusy(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1")
    const done = (busy) => {
      socket.destroy()
      resolve(busy)
    }
    socket.once("connect", () => done(true))
    socket.once("error", () => done(false))
    setTimeout(() => done(false), 800)
  })
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true })

  if (printOnly) {
    console.log(url)
    return 0
  }

  // 端口预检 —— 否则 embedded-postgres 会以 `reject(undefined)` 收场，
  // 只剩一行 "✗ undefined"，看不出是端口冲突（实测踩过）。
  if (await isPortBusy(PORT)) {
    console.error(`[db:embedded] ✗ 端口 ${PORT} 已被占用。换一个：EMBEDDED_PG_PORT=<port> node scripts/dev-db-embedded.cjs`)
    return 1
  }

  // ESM-only 包：CJS 里必须动态 import（与 ephemeral-pg.cjs 同因）
  const mod = await import("embedded-postgres")
  const EmbeddedPostgres = mod.default ?? mod

  // 保留 Postgres 日志：失败时**必须**带出来，否则只剩 "undefined" 无从排查
  const logs = []
  const instance = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    port: PORT,
    user: USER,
    password: PASSWORD,
    persistent: true, // 保留 dataDir —— 这是"开发用"与"测试用"的关键差别
    initdbFlags: ["--encoding=UTF8"],
    onLog: (line) => logs.push(line),
    onError: (line) => logs.push(`[error] ${line}`),
  })

  // 首次跑要 initialise；已有 dataDir（PG_VERSION 存在）时重复 initialise 会失败 —— 属正常。
  const alreadyInitialised = fs.existsSync(path.join(DATA_DIR, "PG_VERSION"))
  try {
    if (!alreadyInitialised) {
      console.log(`[db:embedded] 初始化 dataDir ${DATA_DIR}`)
      await instance.initialise()
    }
    await instance.start()
  } catch (error) {
    const { inspect } = require("node:util")
    console.error(`[db:embedded] ✗ 启动失败: ${inspect(error, { depth: 3 })}`)
    if (logs.length) console.error(`--- Postgres 最近日志 ---\n${logs.slice(-20).join("\n")}`)
    process.exit(1)
  }
  console.log(`[db:embedded] 已启动: ${url}`)
  console.log(`[db:embedded] dataDir: ${DATA_DIR}（Ctrl+C 停止，数据保留）`)

  const shutdown = async (signal) => {
    console.log(`\n[db:embedded] ${signal}，正在停止…`)
    try {
      await instance.stop()
    } catch (error) {
      console.error(`[db:embedded] 停止失败: ${error?.message ?? error}`)
    }
    // 注意：加载了 embedded-postgres 的脚本不能用 process.exitCode（它注册的 AsyncExitHook
    // 会把退出码重置为 0），必须显式 process.exit。
    process.exit(0)
  }
  process.on("SIGINT", () => void shutdown("SIGINT"))
  process.on("SIGTERM", () => void shutdown("SIGTERM"))

  // 常驻：保持事件循环活着，直到收到信号
  await new Promise(() => {})
  return 0
}

main().catch((error) => {
  console.error(`[db:embedded] ✗ ${error?.message ?? error}`)
  process.exit(1)
})
