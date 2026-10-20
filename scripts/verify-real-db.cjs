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
 *
 * **默认覆盖范围（重要）**：只跑 `test/unit` + `test/integration`。
 * `packages` 下各域的 `__tests__`（域级 Service/Repository 测试）**不在默认范围**，但它们恰恰最依赖仓储。
 * 实测（2026-10-19，`plugin-mall`）：域级测试在真实库下暴露过 1 处内存模式永远看不到的缺陷
 * （text 列返回字符串 vs 内存回显 number）。要覆盖域级测试请显式传路径：
 *   `npm run verify:real-db -- packages/plugins/plugin-mall`
 * 全量跑会显著变慢，且可能一次暴露多处既有分歧 —— 建议按域逐步推进，而不是默认全开。
 */
const { spawnSync } = require("node:child_process")
const { randomBytes } = require("node:crypto")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const VERIFY_DB = "cooliebase_verify" // 只有这个名字允许被本脚本重建
const { resolveDatabaseEndpoint, query, withDatabase } = require("./lib/ephemeral-pg.cjs")
let endpoint = null

const argv = process.argv.slice(2)
const keep = argv.includes("--keep")
const reuse = argv.includes("--reuse")

function run(command, args, options = {}) {
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

async function main() {
  console.log("[verify:real-db] 解析数据库端点（外部 DATABASE_URL 优先，否则嵌入式 Postgres）…")
  try {
    endpoint = await resolveDatabaseEndpoint()
    console.log(`[verify:real-db] 数据库来源: ${endpoint.source}${endpoint.port ? ` :${endpoint.port}` : ""}`)
  } catch (error) {
    fail(`起数据库失败: ${String(error?.message ?? error).split("\n")[0]}`)
  }

  const existsResult = await query(endpoint.url, "SELECT 1 FROM pg_database WHERE datname=$1", [VERIFY_DB])
  const exists = (existsResult.rowCount ?? 0) > 0
  if (!reuse || !exists) {
    // 只允许重建本脚本自己的验证库 —— 名字不符就拒绝，绝不误伤开发库。
    if (VERIFY_DB !== "cooliebase_verify") fail(`拒绝重建非验证库: ${VERIFY_DB}`)
    console.log(`[verify:real-db] ${exists ? "重建" : "创建"}验证库 ${VERIFY_DB}…`)
    await query(endpoint.url, `DROP DATABASE IF EXISTS "${VERIFY_DB}" WITH (FORCE)`)
    await query(endpoint.url, `CREATE DATABASE "${VERIFY_DB}"`)
  } else {
    console.log(`[verify:real-db] 复用已有验证库 ${VERIFY_DB}`)
  }

  const databaseUrl = withDatabase(endpoint.url, VERIFY_DB)
  // 必须**显式**传: shell 里若已存在 DATABASE_URL，其优先级高于 .env，
  // 会让迁移与测试悄悄跑到另一个库上（本仓踩过）。
  // `NODE_ENV` 也必须**显式钉住**，理由同 `DATABASE_URL`：外部 shell 若设了
  // `NODE_ENV=production`（CI 与不少本地环境都会），业务代码会走生产分支 ——
  // 实测 `member-auth.service.test.ts` 因此报「生产环境必须配置至少 32 字节且非默认值的
  // JWT_SECRET」，看起来像产品缺陷，其实是**环境泄漏**造成的假失败。
  // 验证入口跑的是"测试"，就该是 test。
  const env = { DATABASE_URL: databaseUrl, DB_DRIVER: "postgresql", NODE_ENV: "test" }

  console.log("[verify:real-db] 应用迁移 …")
  if (run("pnpm", ["run", "db:migrate"], { env }) !== 0) fail("迁移失败")

  try {
    const tableCount = await query(databaseUrl, "select count(*)::int as n from information_schema.tables where table_schema='public'")
    console.log(`[verify:real-db] 表数: ${tableCount.rows?.[0]?.n ?? "?"}`)
  } catch (error) {
    fail(`查询表数失败: ${String(error?.message ?? error)}`)
  }

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
  // **必须串行文件执行**：真实库模式下所有测试文件共享**同一个数据库**，
  // 而"对整张表断言"的测试（如 transactional-outbox 断言 `listOutbox()` 为空/为 1）
  // 会被并行文件插入的行破坏 —— 实测该文件单独跑 6/6 通过，混跑才失败。
  // 验证入口要的是**可信**，不是快：宁可慢，也不要随机的红。
  const status = run("pnpm", ["exec", "vitest", "run", "--no-file-parallelism", ...vitestArgs], { env })

  if (!keep) {
    console.log("\n[verify:real-db] 收尾: 删除验证库并关闭数据库 …")
    try {
      await query(endpoint.url, `DROP DATABASE IF EXISTS "${VERIFY_DB}" WITH (FORCE)`)
    } catch (error) {
      console.warn(`  ! 删除验证库失败: ${String(error?.message ?? error).split("\n")[0]}`)
    }
    await endpoint.close()
  } else {
    console.log(`\n[verify:real-db] 保留: 库 ${VERIFY_DB}（服务留在 ${endpoint.url.replace(/:[^:@/]+@/, ":***@")}）`)
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

main().catch(async (error) => {
  console.error(`\n[verify:real-db] 异常: ${error?.stack ?? error}`)
  // 崩溃时也必须关库 —— 否则会留下嵌入式 Postgres 进程与临时 dataDir（实测踩过）
  if (endpoint) {
    try { await query(endpoint.url, `DROP DATABASE IF EXISTS "${VERIFY_DB}" WITH (FORCE)`) } catch { /* 忽略 */ }
    await endpoint.close().catch(() => undefined)
  }
  process.exit(2)
})
