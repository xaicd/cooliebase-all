#!/usr/bin/env node
/**
 * 登录冒烟：**建库 → 迁移 → 种子 → 登记插件 → 起服务 → 登录 → 受保护接口**。
 *
 * 为什么必须有一条这个（实测教训）:
 *   今天所有门禁（check / build / fingerprint / task:verify / delivery:check）**全绿**，
 *   而**登录链是断的** —— 报错还时好时坏（一次 401、一次 404）。
 *   没有任何一条测试覆盖"种子 → 登录 → 受保护接口"，所以它可以静默断掉，
 *   而所有门禁都以为一切正常。
 *
 *   **门禁测的是机制，这条测的是产品能不能用。**
 *
 * 与 `verify:real-db` 同一模式: 自管理环境（起库/建库/种子/起服务），跑完清场。
 *
 * 用法:
 *   node scripts/smoke-login.cjs            # 跑完清场
 *   node scripts/smoke-login.cjs --keep     # 保留现场（起着的服务与库不动）
 */
const { execFileSync, spawn } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const KEEP = process.argv.includes("--keep")
const DB = "cooliebase_smoke"
// 端口必须与 `pnpm run dev` 实际监听的一致 —— 仓库的 dev 脚本是
// `prisma generate && next dev -p 3200`，**写死了 3200**，给 PORT 环境变量无效。
// 实测踩到: 冒烟探 3201 而应用在 3200，报起服务失败（其实服务是好的）。
const PORT = process.env.SMOKE_PORT || "3200"
const BASE = `http://localhost:${PORT}`
const PASSWORD = "Smoke@123456"
const SALT = "smoke-salt"
const PG_HOST = process.env.PGHOST || (fs.existsSync("/host-workspace") ? "172.19.0.1" : "localhost")
const URL = `postgresql://cooliebase:cooliebase123@${PG_HOST}:5433/${DB}?schema=public`
const CONTAINER = "cooliebase-dev-postgres-1"

const results = []
const step = (name, ok, detail = "") => {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? `  ${detail}` : ""}`)
}
const sh = (command, args, env = {}) => {
  const result = require("node:child_process").spawnSync(command, args, {
    cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env },
  })
  return { ok: result.status === 0, out: `${result.stdout ?? ""}${result.stderr ?? ""}` }
}

function dockerExec(args) {
  const hasDocker = require("node:child_process").spawnSync("which", ["docker"]).status === 0
  if (hasDocker) {
    const r = require("node:child_process").spawnSync("docker", args, { cwd: ROOT, encoding: "utf8" })
    return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}` }
  }
  const hasHostExec = require("node:child_process").spawnSync("which", ["host-exec"]).status === 0
  if (hasHostExec) {
    const cmd = args.map((a) => `'${String(a).replace(/'/g, "'\\''")}'`).join(" ")
    const r = require("node:child_process").spawnSync("host-exec", [`docker ${cmd}`], { cwd: ROOT, encoding: "utf8" })
    return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}` }
  }
  return { ok: false, out: "docker and host-exec not found" }
}

function psql(database, sql) {
  const hasDocker = require("node:child_process").spawnSync("which", ["docker"]).status === 0
  if (hasDocker) {
    const r = require("node:child_process").spawnSync("docker", ["exec", CONTAINER, "psql", "-U", "cooliebase", "-d", database, "-t", "-A", "-c", sql], { cwd: ROOT, encoding: "utf8" })
    return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}` }
  }
  const hasHostExec = require("node:child_process").spawnSync("which", ["host-exec"]).status === 0
  if (hasHostExec) {
    const escapedSql = sql.replace(/'/g, "'\\''")
    const cmd = `docker exec ${CONTAINER} psql -U cooliebase -d ${database} -t -A -c '${escapedSql}'`
    const r = require("node:child_process").spawnSync("host-exec", [cmd], { cwd: ROOT, encoding: "utf8" })
    return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}` }
  }
  return { ok: false, out: "docker and host-exec not found" }
}

let app = null
let smokeEnvLocalBackup = null
let startedPostgres = false
const cleanup = async () => {
  if (KEEP) {
    console.log(`\n[smoke] --keep: 服务留在 ${BASE}，库 ${DB} 未删`)
    return
  }
  if (app) app.kill("SIGTERM")
  if (smokeEnvLocalBackup) {
    if (smokeEnvLocalBackup.content === null) fs.rmSync(smokeEnvLocalBackup.file, { force: true })
    else fs.writeFileSync(smokeEnvLocalBackup.file, smokeEnvLocalBackup.content)
  }
  psql("postgres", `DROP DATABASE IF EXISTS ${DB} WITH (FORCE)`)
  // **只在本次是自己起的 postgres 时才停它** —— 否则会把使用者正在用的库停掉
  // （实测: 上一次冒烟清场停了 postgres，紧接着的诊断全部连不上）
  if (startedPostgres) {
    const hasDocker = require("node:child_process").spawnSync("which", ["docker"]).status === 0
    if (hasDocker) sh("pnpm", ["run", "db:down"])
    else require("node:child_process").spawnSync("host-exec", ["docker", "compose", "-f", "deploy/docker-compose.dev.yml", "stop", "postgres"], { cwd: ROOT, encoding: "utf8" })
  }
}

async function main() {
  console.log(`\n=== 登录冒烟（库 ${DB} / 端口 ${PORT}）===\n`)

  const alreadyUp = dockerExec(["inspect", "--format={{.State.Health.Status}}", CONTAINER]).out.trim() === "healthy"
  if (!alreadyUp) {
    startedPostgres = true
    const hasDocker = require("node:child_process").spawnSync("which", ["docker"]).status === 0
    if (hasDocker) {
      if (!sh("pnpm", ["run", "db:up"]).ok) { step("起 postgres", false); return }
    } else {
      require("node:child_process").spawnSync("host-exec", ["docker", "compose", "-f", "deploy/docker-compose.dev.yml", "up", "-d", "postgres"], { cwd: ROOT, encoding: "utf8" })
    }
  }
  for (let i = 0; i < 20; i += 1) {
    const health = dockerExec(["inspect", "--format={{.State.Health.Status}}", CONTAINER])
    if (health.out.trim() === "healthy") break
    await new Promise((r) => setTimeout(r, 2000))
  }
  step("起 postgres 并等健康", true)

  psql("postgres", `DROP DATABASE IF EXISTS ${DB} WITH (FORCE)`)
  step("建库", psql("postgres", `CREATE DATABASE ${DB}`).ok)

  step("迁移", sh("npx", ["prisma", "migrate", "deploy"], { DATABASE_URL: URL }).ok)
  step("种子", sh("npx", ["tsx", "scripts/seed-postgresql.ts"], {
    DATABASE_URL: URL, DB_DRIVER: "postgresql",
    ADMIN_BOOTSTRAP_USERNAME: "admin", ADMIN_BOOTSTRAP_PASSWORD: PASSWORD, ADMIN_BOOTSTRAP_SALT: SALT,
  }).ok)
  step("登记插件", sh("npx", ["tsx", "scripts/register-plugins.ts"], { DATABASE_URL: URL }).ok)

  const seeded = psql(DB, 'SELECT count(*) FROM "system_user" WHERE username = \'admin\'')
  step("库里确有 admin（注意表名要加引号）", seeded.out.trim() === "1", `count=${seeded.out.trim()}`)

  // 起服务（与人工操作一致: 环境变量显式给全）
  const logFile = path.join(require("node:os").tmpdir(), "smoke-login-app.log")
  fs.writeFileSync(logFile, "")
  // **必须用 .env.local**，不能只给环境变量:
  // Next 启动时打印 `Environments: .env` —— 而 `.env` 里是 DB_DRIVER=memory，
  // 于是应用跑在**内存库**上，种子写进 Postgres 的 admin 它根本看不见 → 401。
  // 实测: 只给环境变量时稳定复现 401；写 .env.local 才与真实开发一致。
  const envLocal = path.join(ROOT, ".env.local")
  const envLocalBackup = fs.existsSync(envLocal) ? fs.readFileSync(envLocal, "utf8") : null
  fs.writeFileSync(envLocal, [
    `DATABASE_URL=${URL}`, "DB_DRIVER=postgresql",
    // **这一项必须显式给**: 它决定 admin 算不算平台用户。
    // 基座的 .env 里曾是别的机器残留（vps_adm），admin 不被认作平台用户 →
    // 登录按租户找用户 → 找不到 → 401。实测就是这个原因，
    // 而冒烟脚本当时没设它，才靠 .env 的状态碰运气。
    "TENANT_MODE=disabled", "TENANT_PLATFORM_USERNAMES=admin",
    "ADMIN_BOOTSTRAP_USERNAME=admin", `ADMIN_BOOTSTRAP_PASSWORD=${PASSWORD}`, `ADMIN_BOOTSTRAP_SALT=${SALT}`,
  ].join("\n") + "\n")
  app = spawn("pnpm", ["run", "dev"], {
    cwd: ROOT, stdio: ["ignore", fs.openSync(logFile, "a"), fs.openSync(logFile, "a")],
    // **这四项必须走进程环境变量，不能只写 .env.local**:
    // Next 不会覆盖已存在的 process.env，优先级是 shell > .env.local > .env。
    // 实测: 只写 .env.local 时 admin 仍不被认作平台用户 → 401；
    // 作为进程环境变量传入才稳定（手工验证过 200）。
    env: {
      ...process.env,
      PORT,
      DATABASE_URL: URL,
      DB_DRIVER: "postgresql",
      TENANT_MODE: "disabled",
      TENANT_PLATFORM_USERNAMES: "admin",
      ADMIN_BOOTSTRAP_USERNAME: "admin",
      ADMIN_BOOTSTRAP_PASSWORD: PASSWORD,
      ADMIN_BOOTSTRAP_SALT: SALT,
    },
  })
  // 跑完恢复 .env.local（它是 gitignore 的本机文件，不该被冒烟留下）
  smokeEnvLocalBackup = { file: envLocal, content: envLocalBackup }
  let ready = false
  for (let i = 0; i < 40; i += 1) {
    try {
      const probe = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) })
      if (probe.status < 500) { ready = true; break }
    } catch { /* 还没起来 */ }
    await new Promise((r) => setTimeout(r, 3000))
  }
  step("起服务", ready, BASE)
  if (!ready) { console.log(fs.readFileSync(logFile, "utf8").slice(-800)); return }

  // === 被测对象: 登录 ===
  const loginResponse = await fetch(`${BASE}/api/v1/admin/system/auth`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: PASSWORD }), signal: AbortSignal.timeout(30000),
  })
  const loginBody = await loginResponse.text()
  step("POST 登录接口返回 200", loginResponse.status === 200, `HTTP ${loginResponse.status}`)
  if (loginResponse.status !== 200) {
    console.log(`\n  —— 登录失败，原始响应 ——\n  ${loginBody.slice(0, 400)}\n`)
    console.log("  —— 应用日志尾部 ——")
    console.log(fs.readFileSync(logFile, "utf8").split("\n").slice(-8).map((l) => `  ${l}`).join("\n"))
    return
  }

  let token = null
  try { token = JSON.parse(loginBody)?.data?.token } catch { /* 交给下面的断言 */ }
  step("登录响应里有 token", Boolean(token))

  if (token) {
    const protectedResponse = await fetch(`${BASE}/api/v1/admin/system/menus/sidebar`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000),
    })
    step("带 token 访问受保护接口返回 200", protectedResponse.status === 200, `HTTP ${protectedResponse.status}`)
  }
}

main()
  .catch((error) => { console.error(`  ✗ 冒烟异常: ${error.message}`); results.push({ name: "冒烟异常", ok: false }) })
  .finally(async () => {
    const failed = results.filter((item) => !item.ok)
    console.log(`\n[smoke] ${results.length - failed.length}/${results.length} 通过`)
    await cleanup()
    process.exit(failed.length === 0 ? 0 : 1)
  })
