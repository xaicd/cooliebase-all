#!/usr/bin/env node
/**
 * `db:embedded` —— 本机开发用的**常驻**嵌入式 Postgres（零 Docker）。
 *
 * 与 `scripts/lib/ephemeral-pg.cjs` 的分工：
 *   · ephemeral-pg：**测试用**，mkdtemp 临时 dataDir，跑完 stop() 连带删除，零残留；
 *   · 本脚本：**开发用**，固定 dataDir + 固定端口，可反复重启、数据不丢。
 *
 * 用法：
 *   node scripts/dev-db-embedded.cjs            # 前台常驻，打印 DATABASE_URL
 *   node scripts/dev-db-embedded.cjs -d         # 后台守护启动 (daemon)
 *   node scripts/dev-db-embedded.cjs --stop     # 停止后台守护进程
 *   node scripts/dev-db-embedded.cjs --print    # 只打印 URL 然后退出（给 CI/脚本拼环境用）
 */
const fs = require("node:fs")
const path = require("node:path")
const net = require("node:net")
const { spawn, execSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const DATA_DIR = path.resolve(process.env.EMBEDDED_PG_DATA_DIR || path.join(ROOT, ".embedded-pg", "data"))
const PID_FILE = path.join(ROOT, ".embedded-pg", "pg.pid")
const PORT = Number(process.env.EMBEDDED_PG_PORT || 55432)
const USER = process.env.EMBEDDED_PG_USER || "postgres"
const PASSWORD = process.env.EMBEDDED_PG_PASSWORD || "postgres"
const DATABASE = process.env.EMBEDDED_PG_DATABASE || "postgres"

const printOnly = process.argv.includes("--print")
const stopOnly = process.argv.includes("--stop")
const daemonMode = process.argv.includes("-d") || process.argv.includes("--daemon")
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

async function stopDaemon() {
  let pid = null
  if (fs.existsSync(PID_FILE)) {
    try {
      pid = Number(fs.readFileSync(PID_FILE, "utf8").trim())
    } catch (_err) { /* ignore error */ }
  }

  const isAlive = (p) => {
    try {
      process.kill(p, 0)
      return true
    } catch (_err) { /* process not running */ return false }
  }

  if (pid && isAlive(pid)) {
    console.log(`[db:embedded] 正在停止后台守护进程 (PID: ${pid})...`)
    try { process.kill(pid, "SIGTERM") } catch (_err) { /* ignore error */ }
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 200))
      if (!isAlive(pid)) break
    }
    if (isAlive(pid)) {
      try { process.kill(pid, "SIGKILL") } catch (_err) { /* ignore error */ }
    }
  }

  // 释放端口兜底
  if (await isPortBusy(PORT)) {
    try {
      execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`)
    } catch (_err) { /* ignore error */ }
  }

  try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE) } catch (_err) { /* ignore error */ }
  console.log(`[db:embedded] 嵌入式 Postgres 已停止 (端口: ${PORT})。`)
  return 0
}

async function main() {
  if (stopOnly) {
    return await stopDaemon()
  }

  if (printOnly) {
    console.log(url)
    return 0
  }

  if (daemonMode) {
    if (await isPortBusy(PORT)) {
      console.log(`[db:embedded] 端口 ${PORT} 已在运行: ${url}`)
      return 0
    }
    fs.mkdirSync(path.dirname(PID_FILE), { recursive: true })
    const child = spawn(process.execPath, [__filename], {
      detached: true,
      stdio: "ignore",
      env: process.env,
    })
    child.unref()
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 300))
      if (await isPortBusy(PORT)) {
        console.log(`[db:embedded] ✅ 嵌入式 Postgres 已在后台启动 (PID: ${child.pid}): ${url}`)
        return 0
      }
    }
    console.log(`[db:embedded] ⚠️ 正在后台启动 (PID: ${child.pid})，请稍候检测端口 ${PORT}`)
    return 0
  }

  fs.mkdirSync(DATA_DIR, { recursive: true })

  // 端口预检
  if (await isPortBusy(PORT)) {
    console.error(`[db:embedded] ✗ 端口 ${PORT} 已被占用。换一个：EMBEDDED_PG_PORT=<port> node scripts/dev-db-embedded.cjs`)
    return 1
  }

  fs.mkdirSync(path.dirname(PID_FILE), { recursive: true })
  fs.writeFileSync(PID_FILE, String(process.pid))

  // ESM-only 包：CJS 里必须动态 import
  const mod = await import("embedded-postgres")
  const EmbeddedPostgres = mod.default ?? mod

  const logs = []
  const instance = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    port: PORT,
    user: USER,
    password: PASSWORD,
    persistent: true,
    initdbFlags: ["--encoding=UTF8"],
    onLog: (line) => logs.push(line),
    onError: (line) => logs.push(`[error] ${line}`),
  })

  const alreadyInitialised = fs.existsSync(path.join(DATA_DIR, "PG_VERSION"))
  try {
    if (!alreadyInitialised) {
      console.log(`[db:embedded] 初始化 dataDir ${DATA_DIR}`)
      await instance.initialise()
    }
    await instance.start()
  } catch (error) {
    const { inspect } = require("node:util")
    const errMsg = error && error.message ? error.message : String(error)
    console.nerror(`[db:embedded] ✗ 启动失败: ${errMsg}`)
    if (logs.length) console.nerror(`--- Postgres 最近日志 ---\n${logs.slice(-20).join("\n")}`)
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE) } catch (_err) { /* ignore error */ }
    process.exit(1)
  }
  console.log(`[db:embedded] 已启动: ${url}`)
  console.log(`[db:embedded] dataDir: ${DATA_DIR}（PID: ${process.pid}，Ctrl+C 停止，数据保留）`)

  const shutdown = async (signal) => {
    console.log(`\n[db:embedded] ${signal}，正在停止…`)
    try {
      await instance.stop()
    } catch (error) {
      console.error(`[db:embedded] 停止失败: ${error?.message ?? error}`)
    }
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE) } catch (_err) { /* ignore error */ }
    process.exit(0)
  }
  process.on("SIGINT", () => void shutdown("SIGINT"))
  process.on("SIGTERM", () => void shutdown("SIGTERM"))

  await new Promise(() => {})
  return 0
}

main().catch((error) => {
  console.error(`[db:embedded] ✗ ${error?.message ?? error}`)
  try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE) } catch (_err) { /* ignore error */ }
  process.exit(1)
})
