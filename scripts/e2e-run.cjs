#!/usr/bin/env node
/**
 * `e2e:run` —— **一条命令把写链路 E2E 真跑起来**。
 *
 * ## 为什么需要它
 *
 * Playwright 早就能跑，但 E2E 一直**真跑不起来**：`pnpm start`（生产模式）的就绪屏障要求
 * `DATABASE_URL`（生产禁止内存驱动）与 `JWT_SECRET`（≥32 字节非默认）。
 * 于是 `test:e2e` 只能永远 skip —— 而 skip 的用例不算覆盖。
 *
 * 这个脚本把整条链串起来并**保证清场**（进程与数据库都不留）：
 *
 * ```
 * ① resolveDatabaseEndpoint()   起嵌入式 Postgres（或复用已有 DATABASE_URL）
 * ② prisma migrate deploy       建表
 * ③ db:seed                     种子（管理员等）
 * ④ pnpm start（独立端口）       起生产构建
 * ⑤ 轮询 /readyz = 200          就绪才继续（不就绪直接失败，不"假装开始"）
 * ⑥ playwright test             PLAYWRIGHT_BASE_URL 指向它
 * ⑦ finally：杀掉应用 + 关闭数据库（零残留）
 * ```
 *
 * ## 与 `test:e2e` 的关系
 *
 * `test:e2e` 是**裸跑**（要求你自备可达应用）；`e2e:run` 是**自给自足**版本：
 * 自己起库、自己起应用、自己清场。CI 与本机都该用后者。
 *
 * 用法：
 *   pnpm run e2e:run                          # 跑 test/e2e 全部
 *   pnpm run e2e:run -- e2e/write-path.member.spec.ts
 */
const path = require("node:path")
const crypto = require("node:crypto")
const { spawn, spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const PORT = Number(process.env.E2E_PORT || 3111)
const BASE = `http://127.0.0.1:${PORT}`

const { resolveDatabaseEndpoint } = require("./lib/ephemeral-pg.cjs")

/** 脱敏：只显示协议+主机+库名，不打印口令 */
function maskUrl(url) {
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.username ? "***@" : ""}${u.host}${u.pathname}`
  } catch {
    return "<unparsable>"
  }
}

function run(cmd, args, env) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } })
  return r.status ?? 1
}

async function waitReadyz(timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/readyz`)
      if (r.status === 200) return true
      if (r.status === 503) {
        // 就绪失败：把原因打出来，别只说"超时"
        const body = await r.text().catch(() => "")
        console.error(`[e2e] /readyz=503：${body.slice(0, 300)}`)
      }
    } catch {
      /* 服务还没监听 */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

async function main() {
  const extraArgs = process.argv.slice(2).filter((a) => a !== "--")
  const db = await resolveDatabaseEndpoint({})
  // **不能盲信继承来的 JWT_SECRET**：实测本机 shell 里带着一个 14 字节的占位值，
  // 直接继承会让生产模式的校验永远失败（而且报错看起来像"没配"）。
  // 只有 ≥32 字节的才用，否则自己生成一个 —— 并说明用了哪条路径（不打印值）。
  const inheritedJwt = process.env.JWT_SECRET
  const inheritedOk = Boolean(inheritedJwt) && Buffer.byteLength(inheritedJwt) >= 32
  const jwt = inheritedOk ? inheritedJwt : crypto.randomBytes(32).toString("hex")
  let server = null

  console.log(`[e2e] 数据库：${db.source} → ${maskUrl(db.url)}`)
  console.log(
    `[e2e] 应用端口：${PORT}（JWT_SECRET 用${inheritedOk ? "继承值（≥32 字节）" : "临时生成值"}，不落盘）`,
  )

  try {
    // ② 建表
    const migrate = run("pnpm", ["exec", "prisma", "migrate", "deploy"], { DATABASE_URL: db.url })
    if (migrate !== 0) throw new Error(`prisma migrate deploy 失败（exit ${migrate}）`)

    // ③ 种子（失败也继续？不 —— 种子缺失会让登录/注册用例假失败，必须 fail-loud）
    const seed = run("pnpm", ["run", "db:seed"], { DATABASE_URL: db.url })
    if (seed !== 0) throw new Error(`db:seed 失败（exit ${seed}）`)

    // ③b 注册插件 —— **漏了它，插件自有 API 一律 404「未找到插件」**（实测）
    const plugins = run("pnpm", ["run", "plugins:register"], {
      DATABASE_URL: db.url,
      DB_DRIVER: "postgresql",
    })
    if (plugins !== 0) throw new Error(`plugins:register 失败（exit ${plugins}）`)

    // ④ 起应用（独立子进程组，便于整组回收）
    server = spawn("pnpm", ["start"], {
      cwd: ROOT,
      detached: true,
      stdio: ["ignore", "inherit", "inherit"],
      // **显式给 DB_DRIVER=postgresql**（不是 postgres —— 驱动校验会拒，实测报错里写明了）；
      // 仓里的 .env 设的是 DB_DRIVER=memory，而应用会加载 .env —— 只传 DATABASE_URL 不够。
      env: {
        ...process.env,
        DATABASE_URL: db.url,
        DB_DRIVER: "postgresql",
        JWT_SECRET: jwt,
        PORT: String(PORT),
      },
    })

    // ⑤ 就绪
    const ready = await waitReadyz()
    if (!ready) throw new Error(`应用在 120s 内未就绪（${BASE}/readyz 不是 200）`)
    console.log("[e2e] /readyz=200，开始跑 Playwright")

    // ⑥ 跑测试（把前置条件也传给 Playwright，否则用例会自己 skip）
    const code = run("pnpm", ["exec", "playwright", "test", ...extraArgs], {
      PLAYWRIGHT_BASE_URL: BASE,
      DATABASE_URL: db.url,
      JWT_SECRET: jwt,
    })
    return code
  } finally {
    // ⑦ 清场：先杀进程组，再关数据库
    if (server && server.pid) {
      try {
        process.kill(-server.pid, "SIGKILL")
      } catch {
        try {
          server.kill("SIGKILL")
        } catch {
          /* 已退出 */
        }
      }
      console.log(`[e2e] 已停止应用（pid ${server.pid}）`)
    }
    await db.close()
    console.log("[e2e] 已关闭数据库")
    // 端口兜底检查：留一句提示，不静默
    const still = spawnSync("sh", ["-c", `lsof -ti:${PORT} 2>/dev/null | head -1`], { encoding: "utf8" })
    if (still.stdout.trim()) console.error(`[e2e] ⚠ 端口 ${PORT} 仍被占用（pid ${still.stdout.trim()}）`)
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`[e2e] ✗ ${error?.message ?? error}`)
    process.exit(1)
  })
