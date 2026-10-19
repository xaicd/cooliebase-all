/**
 * 交付链三件套（冒烟/渗透/压测）共用的**数据库端点解析器**。
 *
 * 解决的问题：这三个脚本原先各自写死「docker 里的 Postgres」（`docker exec psql` +
 * 容器名 + 端口 5433）。一旦本机 docker/colima 的端口转发不可用，本地就完全无法验证，
 * 只能推到 CI —— 而「本地从没验过」正是这条链最危险的盲区。
 *
 * 解析优先级（**外部环境永远优先**，不劫持 CI 与已有库）：
 *   ① `DATABASE_URL` 已设置 → 直接用它，不启动任何进程；
 *   ② `PGHOST` 已设置（历史用法，用于容器内访问宿主库）→ 据此拼 URL；
 *   ③ 都没有 → 启动**嵌入式真实 Postgres**（`embedded-postgres`，下载并运行 PG 二进制）；
 *   ④ 启动失败 → **fail-loud**，带上 Postgres 最近日志，绝不静默降级为内存模式。
 *
 * 实现要点（都是实测/精读参考实现得出的，不是猜的）：
 *   · `embedded-postgres` 是 **ESM-only**（`type: module`，无 CJS 构建）→ CJS 里必须动态 `import()`；
 *   · 最新版**不需要** paperclip 维护的那个 patch（`getBestLocale()` 与 `process.env` 继承都已在上游）；
 *   · `persistent: false` 时 `stop()` 会**连带删除 dataDir** —— 这正是我们想要的「零残留」；
 *   · 端口冲突：先探测空闲端口；真正的监听端口以 `<dataDir>/postmaster.pid` 为准（参考实现的经验）；
 *   · 失败信息必须带最近若干行 Postgres 日志，否则只剩 exit code，无从排查。
 *
 * 参考实现：本地 fork `workspace/xaicd/coolie`（上游 paperclipai/paperclip）`server/src/index.ts:545`。
 */

const fs = require("node:fs")
const net = require("node:net")
const os = require("node:os")
const path = require("node:path")

// `pg` 是本仓的直接依赖（^8.13.1）—— 外部库与嵌入式库共用同一个客户端。
const { Client } = require("pg")

const LOG_BUFFER_LIMIT = 40

function createLogBuffer() {
  const lines = []
  return {
    push(line) {
      const text = String(line ?? "").trimEnd()
      if (!text) return
      lines.push(text)
      if (lines.length > LOG_BUFFER_LIMIT) lines.shift()
    },
    recent(count = 12) {
      return lines.slice(-count)
    },
  }
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      const port = typeof address === "object" && address ? address.port : 0
      server.close(() => (port ? resolve(port) : reject(new Error("无法探测空闲端口"))))
    })
  })
}

function waitForPortClosed(port, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve) => {
    const attempt = () => {
      const socket = net.connect(port, "127.0.0.1")
      socket.once("connect", () => {
        socket.destroy()
        if (Date.now() > deadline) return resolve(false)
        setTimeout(attempt, 150)
      })
      socket.once("error", () => resolve(true))
    }
    attempt()
  })
}

/** 从 `postmaster.pid` 读实际监听端口（配置端口在冲突避让后可能不同）。 */
function actualPortFromPidFile(dataDir, fallbackPort) {
  try {
    const body = fs.readFileSync(path.join(dataDir, "postmaster.pid"), "utf8")
    const portText = body.split("\n")[3]
    const port = Number(portText)
    return Number.isSafeInteger(port) && port > 0 && port < 65536 ? port : fallbackPort
  } catch {
    return fallbackPort
  }
}

function assertExplicitUrl(url) {
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error(
      `DATABASE_URL 不是 Postgres 连接串（当前以 "${url.slice(0, 12)}..." 开头）。`
      + " 本 helper 只服务 Postgres —— 不会回退到 sqlite/内存（那会换掉被测对象）。",
    )
  }
}

/**
 * @param {{ logger?: Pick<Console, "log" | "error">, persistent?: boolean }} [options]
 * @returns {Promise<{
 *   url: string,
 *   source: "external" | "embedded",
 *   port: number | null,
 *   dataDir: string | null,
 *   recentLogs: () => string[],
 *   close: () => Promise<void>,
 * }>}
 */
async function resolveDatabaseEndpoint(options = {}) {
  const logger = options.logger ?? console
  const logs = createLogBuffer()

  const explicit = process.env.DATABASE_URL
  if (explicit) {
    assertExplicitUrl(explicit)
    logger.log("[pg-endpoint] 使用外部 DATABASE_URL（不启动嵌入式 Postgres）")
    return {
      url: explicit,
      source: "external",
      port: null,
      dataDir: null,
      recentLogs: () => logs.recent(),
      close: async () => {},
    }
  }

  const pgHost = process.env.PGHOST
  if (pgHost) {
    const port = process.env.PGPORT || "5433"
    const url = `postgresql://${process.env.PGUSER || "cooliebase"}:${process.env.PGPASSWORD || "cooliebase123"}@${pgHost}:${port}/postgres?schema=public`
    logger.log(`[pg-endpoint] 使用 PGHOST 指定的数据库 ${pgHost}:${port}`)
    return {
      url,
      source: "external",
      port: Number(port),
      dataDir: null,
      recentLogs: () => logs.recent(),
      close: async () => {},
    }
  }

  const port = await findFreePort()
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-epg-"))
  logger.log(`[pg-endpoint] 启动嵌入式 Postgres（port=${port}, dataDir=${dataDir}）`)

  // ESM-only 包：CJS 里必须动态 import
  const mod = await import("embedded-postgres")
  const EmbeddedPostgres = mod.default ?? mod

  const instance = new EmbeddedPostgres({
    databaseDir: dataDir,
    port,
    user: "postgres",
    password: "postgres",
    persistent: options.persistent ?? false,
    initdbFlags: ["--encoding=UTF8"],
    onLog: (line) => logs.push(line),
    onError: (line) => logs.push(line),
  })

  let started = false
  let actualPort = port
  const close = async () => {
    if (!started) return
    started = false
    try {
      await instance.stop()
    } catch (error) {
      logger.error(`[pg-endpoint] 停止嵌入式 Postgres 失败: ${error?.message ?? error}`)
    }
    const released = await waitForPortClosed(actualPort)
    if (!released) logger.error(`[pg-endpoint] ✗ 端口 ${actualPort} 在 stop 后仍被占用`)
  }

  try {
    await instance.initialise()
    await instance.start()
    started = true
    actualPort = actualPortFromPidFile(dataDir, port)
  } catch (error) {
    await close()
    const tail = logs.recent().join("\n")
    throw new Error(
      `嵌入式 Postgres 启动失败: ${error?.message ?? error}`
      + (tail ? `\n--- Postgres 最近日志 ---\n${tail}` : "\n（未捕获到 Postgres 日志）"),
    )
  }

  const url = `postgresql://postgres:postgres@127.0.0.1:${actualPort}/postgres`
  return {
    url,
    source: "embedded",
    port: actualPort,
    dataDir,
    recentLogs: () => logs.recent(),
    close,
  }
}

/**
 * 对给定连接串执行 SQL。外部库与嵌入式库共用同一条路径，避免"两套客户端"。
 * @param {string} url
 * @param {string} sql
 * @param {string[]} [params]
 */
async function query(url, sql, params = []) {
  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    const result = await client.query(sql, params)
    return result
  } finally {
    await client.end().catch(() => undefined)
  }
}

/** 把连接串里的数据库名换掉（用于「在 postgres 库上建目标库」这类操作）。 */
function withDatabase(url, database) {
  const parsed = new URL(url)
  parsed.pathname = `/${database}`
  return parsed.toString()
}

module.exports = { resolveDatabaseEndpoint, findFreePort, waitForPortClosed, query, withDatabase }
