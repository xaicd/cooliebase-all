#!/usr/bin/env node
/**
 * 真实库验证入口（内存模式的补充，不是替代）。
 *
 * 为什么必须有这个入口：本仓的仓储在 `hasRealDatabase()` 为 false 时走**内存回退**，
 * 而内存回退**不校验任何数据库约束**。于是有一整类缺陷只在真实库上才暴露，
 * 本地"配好库再跑"反而从全绿变成一片红，看起来像自己改坏了代码 —— 本仓已实测过
 * 四层同类问题：表不存在 → 必填列没填 → 缺租户上下文 → DB 插入路径没生成 id。
 *
 * 内存模式跑得快、用来做日常回归；**改过仓储/迁移/多租户逻辑后必须再跑一次本入口**。
 *
 * 用法:
 *   npm run verify:real-db            # 全新验证库 + 迁移 + 全量测试，跑完停库
 *   npm run verify:real-db -- --keep  # 跑完保留数据库与容器（调试用）
 *   npm run verify:real-db -- --reuse # 复用已有验证库（不重建，更快但可能有残留数据）
 *
 * 注意: 验证库默认是独立的 `cooliebase_verify`，**不碰**开发库。
 */
const { spawnSync } = require("node:child_process")
const { randomBytes } = require("node:crypto")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const VERIFY_DB = "cooliebase_verify" // 只有这个名字允许被本脚本重建
const DB_USER = process.env.VERIFY_DB_USER || "cooliebase"
const DB_PASSWORD = process.env.VERIFY_DB_PASSWORD || "cooliebase123"
const DB_PORT = process.env.VERIFY_DB_PORT || "5433"
const PG_HOST = process.env.PGHOST || (require("node:fs").existsSync("/host-workspace") ? "172.19.0.1" : "localhost")

/** 跨平台同步等待（不用 sleep —— Unix-only，且不该靠外部命令计时）。 */
function waitMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

const argv = process.argv.slice(2)
const keep = argv.includes("--keep")
const reuse = argv.includes("--reuse")

const hasDocker = spawnSync("which", ["docker"]).status === 0
const hasHostExec = spawnSync("which", ["host-exec"]).status === 0

function run(command, args, options = {}) {
  if (command === "docker" && !hasDocker && hasHostExec) {
    const cmd = args.map((a) => `'${String(a).replace(/'/g, "'\\''")}'`).join(" ")
    const result = spawnSync("host-exec", [`docker ${cmd}`], {
      cwd: ROOT,
      stdio: options.capture ? "pipe" : "inherit",
      encoding: "utf8",
      env: { ...process.env, ...options.env },
    })
    if (options.capture) return (result.stdout || "").trim()
    return result.status
  }
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
    env: { ...process.env, ...options.env },
  })
  if (options.capture) return (result.stdout || "").trim()
  return result.status
}

function fail(message) {
  console.error(`\n[verify:real-db] ${message}\n`)
  process.exit(2)
}

const COMPOSE_FILE = "deploy/docker-compose.dev.yml"

/**
 * 找到 compose 起的 postgres 容器名。
 * 用 compose 自己查询而不是 `docker ps --filter ancestor` —— 后者实测会漏
 * （容器刚起、或镜像名前缀不匹配时返回空，然后误报"找不到容器"）。
 */
function findContainer() {
  const id = run("docker", ["compose", "-f", COMPOSE_FILE, "ps", "-q", "postgres"], { capture: true })
  if (!id) return null
  const name = run("docker", ["inspect", "--format", "{{.Name}}", id], { capture: true })
  return name ? name.replace(/^\//, "") : null
}

function waitHealthy(container, attempts = 20) {
  for (let index = 0; index < attempts; index++) {
    const status = run("docker", ["inspect", "--format", "{{.State.Health.Status}}", container], { capture: true })
    if (status === "healthy") return true
    waitMs(2000)
  }
  return false
}

function psql(container, database, sql) {
  return run("docker", ["exec", container, "psql", "-U", DB_USER, "-d", database, "-tAc", sql], { capture: true })
}

function main() {
  console.log("[verify:real-db] 启动 postgres …")
  if (hasDocker) {
    if (run("pnpm", ["run", "db:up"]) !== 0) fail("db:up 失败：请确认 Docker 在运行")
  } else if (hasHostExec) {
    if (run("docker", ["compose", "-f", COMPOSE_FILE, "up", "-d", "postgres"]) !== 0) fail("db:up 失败：请确认 Docker 在运行")
  }

  const container = findContainer()
  if (!container) fail("找不到运行中的 postgres 容器")
  if (!waitHealthy(container)) fail("postgres 未在预期时间内变为 healthy")

  const exists = psql(container, "postgres", `SELECT 1 FROM pg_database WHERE datname='${VERIFY_DB}'`).includes("1")
  if (!reuse || !exists) {
    // 只允许重建本脚本自己的验证库 —— 名字不符就拒绝，绝不误伤开发库。
    if (VERIFY_DB !== "cooliebase_verify") fail(`拒绝重建非验证库: ${VERIFY_DB}`)
    console.log(`[verify:real-db] ${exists ? "重建" : "创建"}验证库 ${VERIFY_DB}…`)
    psql(container, "postgres", `DROP DATABASE IF EXISTS ${VERIFY_DB} WITH (FORCE);`)
    psql(container, "postgres", `CREATE DATABASE ${VERIFY_DB} OWNER ${DB_USER}`)
  }

  const databaseUrl = `postgresql://${DB_USER}:${DB_PASSWORD}@${PG_HOST}:${DB_PORT}/${VERIFY_DB}?schema=public`
  // 必须**显式**传: shell 里若已存在 DATABASE_URL，其优先级高于 .env，
  // 会让迁移与测试悄悄跑到另一个库上（本仓踩过）。
  const env = { DATABASE_URL: databaseUrl, DB_DRIVER: "postgresql" }

  console.log("[verify:real-db] 应用迁移 …")
  if (run("pnpm", ["run", "db:migrate"], { env }) !== 0) fail("迁移失败")

  const tables = psql(container, VERIFY_DB, "select count(*) from information_schema.tables where table_schema='public'")
  console.log(`[verify:real-db] 表数: ${tables}`)

  // 必须种子: 一部分测试依赖字典项/绑定租户的账号（rpc-protocol、member-auth 等），
  // 不种子就会把"环境缺数据"混进真实缺口里，报告就失去判读价值。
  // 种子脚本要求 ADMIN_BOOTSTRAP_* 存在（缺了直接 fail-fast），这里生成一次性凭据 —— 验证库用完即弃。
  console.log("[verify:real-db] 注入种子数据 …")
  const seedEnv = {
    ...env,
    ADMIN_BOOTSTRAP_USERNAME: "verify_adm",
    // 种子脚本会校验强度（>=12 位且含大小写/数字/符号）。随机串**不保证**满足这几类，
    // 所以显式补齐前缀，剩下随机 —— 否则会随机地失败，比一直失败更难查。
    ADMIN_BOOTSTRAP_PASSWORD: `Vf1!${randomBytes(10).toString("hex")}`,
    ADMIN_BOOTSTRAP_SALT: randomBytes(8).toString("hex"),
  }
  if (run("pnpm", ["run", "db:seed"], { env: seedEnv }) !== 0) {
    console.warn("[verify:real-db] ⚠ 种子失败 —— 后续失败里会混入「环境缺数据」项，判读时留意")
  }

  const extraArgs = argv.filter((a) => !["--keep", "--reuse"].includes(a))
  const vitestArgs = extraArgs.length > 0 ? extraArgs : ["test/unit", "test/integration"]
  console.log(`[verify:real-db] 跑测试（真实库）: ${vitestArgs.join(" ")}…\n`)
  const status = run("npx", ["vitest", "run", ...vitestArgs], { env })

  if (!keep) {
    console.log("\n[verify:real-db] 收尾: 停止 postgres …")
    if (hasDocker) {
      run("pnpm", ["run", "db:down"])
    } else if (hasHostExec) {
      run("docker", ["compose", "-f", COMPOSE_FILE, "stop", "postgres"])
    }
  } else {
    console.log(`\n[verify:real-db] 保留: 容器 ${container} / 库 ${VERIFY_DB}`)
  }

  console.log(`
[verify:real-db] 完成，测试退出码 ${status}

判读提示（本仓已知的分类，不必从头查）:
  - relation "..." does not exist  -> 表定义缺口，看 npm run tables:inventory
  - null value in column "..."     -> 两条路径语义分叉（内存有生成/DB 没有），或生成器模板漏填必填列
  - 计数/长度断言不合预期          -> 测试假设了空库或"世界里只有我造的记录"，属测试隔离问题
  - 内存模式（不设 DATABASE_URL）通常全绿 —— 全绿不代表真实库正确
`)
  process.exit(status === 0 ? 0 : 1)
}

main()
