#!/usr/bin/env node
/**
 * 压测（容量回归护栏）—— 全流程交付链最后一个没有工具的环节。
 *
 * 依据 AGENTS §3.3 第 6 条: 「容量目标须由 **SLO、压测和资源预算** 确定」——
 * 但此前没有任何压测工具，这条规定是空转的。
 *
 * **定位是回归护栏，不是跑分**:
 *   阈值取"明显劣化才失败"的水准（本机实测 /healthz ≈ 23k rps，阈值只设 2000），
 *   目的是拦住"某次改动把响应变成 10 倍慢"这类事，而不是追求排行榜。
 *   跑分需要真实网络、TLS、CDN 与生产数据 —— 本地压不出来，也不该假装压出来。
 *
 * 优先用 `ab`（若可用，数字更权威），否则用内置 Node runner（CI 上 ab 不保证存在）。
 *
 * 用法:
 *   node scripts/load-test.cjs                        # 自管理环境，跑完清场
 *   node scripts/load-test.cjs --base http://host:port  # 对已有实例跑
 *   node scripts/load-test.cjs --keep
 */
const { spawnSync, spawn } = require("node:child_process")
const fs = require("node:fs")
const http = require("node:http")
const os = require("node:os")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const KEEP = process.argv.includes("--keep")
const arg = (flag) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : undefined }
const BASE = arg("--base") || "http://localhost:3200"
const DB = "cooliebase_loadtest"
const { resolveDatabaseEndpoint, query, withDatabase } = require("./lib/ephemeral-pg.cjs")
let endpoint = null
let URL = null
const PASSWORD = "LoadTest@123456"
const SALT = "loadtest-salt"

const BASELINE_REL = "packages/shared/contract/load-baseline.json"
const RESULT_REL = "docs/architecture/artifacts/load-test-result.json"

const sh = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env } })

const hasDocker = spawnSync("which", ["docker"]).status === 0
const hasHostExec = spawnSync("which", ["host-exec"]).status === 0

const hasAb = spawnSync("ab", ["-V"], { encoding: "utf8" }).status === 0

/** 内置 Node runner: 固定并发打 N 个请求，统计 rps / p95 / 失败率。 */
function runNode(target) {
  return new Promise((resolve) => {
    const total = target.requests ?? 2000
    const concurrency = target.concurrency ?? 50
    const path0 = target.path.startsWith("/") ? target.path : `/${target.path}`
    const latencies = []
    let done = 0
    let failed = 0
    const started = Date.now()
    const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency })

    const once = () => new Promise((next) => {
      const t0 = Date.now()
      const req = http.get(`${BASE}${path0}`, { agent }, (res) => {
        res.resume()
        res.on("end", () => {
          latencies.push(Date.now() - t0)
          if (res.statusCode >= 500) failed += 1
          next()
        })
      })
      req.on("error", () => { failed += 1; next() })
      req.setTimeout(10000, () => { req.destroy(); failed += 1; next() })
    })

    const worker = async () => { while (done < total) { done += 1; await once() } }
    Promise.all(Array.from({ length: concurrency }, worker)).then(() => {
      const elapsedMs = Date.now() - started
      latencies.sort((a, b) => a - b)
      agent.destroy()
      resolve({
        rps: Math.round((total / elapsedMs) * 1000),
        p95Ms: latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] ?? 0,
        failureRate: total === 0 ? 1 : failed / total,
        requests: total,
        concurrency,
      })
    })
  })
}

/** 用 ab 跑一次（数字更权威）。 */
function runAb(target) {
  const total = target.requests ?? 2000
  const concurrency = target.concurrency ?? 50
  const r = sh("ab", ["-k", "-n", String(total), "-c", String(concurrency), "-q", `${BASE}${target.path}`])
  if (r.status !== 0) return null
  const rps = Number(/Requests per second:\s+([\d.]+)/.exec(r.stdout)?.[1] ?? 0)
  const p95 = Number(/^\s*95%\s+(\d+)/m.exec(r.stdout)?.[1] ?? 0)
  const failed = Number(/Failed requests:\s+(\d+)/.exec(r.stdout)?.[1] ?? 0)
  if (!rps) return null
  return { rps: Math.round(rps), p95Ms: p95, failureRate: failed / total, requests: total, concurrency }
}

let app = null
let envLocalBackup = null
let exitCode = 0
const cleanup = async () => {
  if (KEEP) { console.log(`\n[load] --keep: 服务留在 ${BASE}`); return }
  if (app?.pid) {
    // 杀整个进程组：只 kill 包装进程会留下孤儿（冒烟那边实测泄漏过 next-server）
    try { process.kill(-app.pid, "SIGTERM") } catch { try { app.kill("SIGTERM") } catch { /* 已退出 */ } }
    await new Promise((r) => setTimeout(r, 500))
    try { process.kill(-app.pid, "SIGKILL") } catch { /* 已退出 */ }
  }
  const envLocal = path.join(ROOT, ".env.local")
  if (envLocalBackup === null) fs.rmSync(envLocal, { force: true })
  else fs.writeFileSync(envLocal, envLocalBackup)
  if (endpoint) {
    try { await query(endpoint.url, `DROP DATABASE IF EXISTS "${DB}" WITH (FORCE)`) } catch { /* 已不可达 */ }
    await endpoint.close()
  }
}

async function main() {
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, BASELINE_REL), "utf8"))
  const targets = baseline.targets ?? []
  if (targets.length === 0) { console.error("[load] 基线里没有 targets"); process.exit(1) }

  console.log(`\n=== 压测（${BASE}）runner=${hasAb ? "ab" : "node"} 核数=${os.cpus().length} ===\n`)
  // **必须在启动应用之前清端口**。写这一版时插到了启动之后 ——
  // 于是它把自己刚起的服务杀掉了，脚本随后停住（实测）。
  // 只在自管理环境时清；`--base` 模式下使用者可能就是想压已有实例，不能碰。
  if (!arg("--base")) {
    const occupied = spawnSync("lsof", ["-ti:3200"], { encoding: "utf8" }).stdout?.trim()
    if (occupied) {
      console.log(`[load] 端口 3200 已被占用（pid ${occupied.split("\n").join(", ")}）—— 先清掉，避免打到残留进程`)
      for (const pid of occupied.split("\n")) spawnSync("kill", ["-9", pid])
      await new Promise((r) => setTimeout(r, 1500))
    }
  }

  if (!arg("--base")) {
    try {
      endpoint = await resolveDatabaseEndpoint()
      URL = withDatabase(endpoint.url, DB)
      console.log(`[load] 数据库: ${endpoint.source}${endpoint.port ? ` :${endpoint.port}` : ""}`)
    } catch (error) {
      console.log(`[load] 起数据库失败: ${String(error?.message ?? error).split("\n")[0]}`)
      process.exit(1)
    }
    await query(endpoint.url, `DROP DATABASE IF EXISTS "${DB}" WITH (FORCE)`)
    await query(endpoint.url, `CREATE DATABASE "${DB}"`)
    sh("pnpm", ["exec", "prisma", "migrate", "deploy"], { DATABASE_URL: URL })
    sh("pnpm", ["exec", "tsx", "scripts/seed-postgresql.ts"], { DATABASE_URL: URL, DB_DRIVER: "postgresql", ADMIN_BOOTSTRAP_USERNAME: "admin", ADMIN_BOOTSTRAP_PASSWORD: PASSWORD, ADMIN_BOOTSTRAP_SALT: SALT })
    sh("pnpm", ["exec", "tsx", "scripts/register-plugins.ts"], { DATABASE_URL: URL })

    const envLocal = path.join(ROOT, ".env.local")
    envLocalBackup = fs.existsSync(envLocal) ? fs.readFileSync(envLocal, "utf8") : null
    fs.writeFileSync(envLocal, `DATABASE_URL=${URL}\nDB_DRIVER=postgresql\nTENANT_MODE=disabled\nTENANT_PLATFORM_USERNAMES=admin\nADMIN_BOOTSTRAP_USERNAME=admin\nADMIN_BOOTSTRAP_PASSWORD=${PASSWORD}\nADMIN_BOOTSTRAP_SALT=${SALT}\n`)
    const logFile = path.join(os.tmpdir(), "load-test-app.log")
    fs.writeFileSync(logFile, "")
    // **必须打生产产物**。dev 模式（Turbopack 按需编译）实测 /healthz 只有 598 rps，
    // 而 standalone 产物是 23,185 rps —— 差 39 倍。拿 dev 数字做容量基线是自欺。
    const standalone = path.join(ROOT, ".next-cooliebase", "standalone", "server.js")
    if (!fs.existsSync(standalone)) {
      console.log("[load] 没有生产产物，先构建（pnpm run build）…")
      const built = sh("pnpm", ["run", "build"])
      if (built.status !== 0) { console.log("[load] 构建失败:\n" + built.stdout + built.stderr); process.exit(1) }
    }
    app = spawn("node", [standalone], {
      cwd: path.join(ROOT, ".next-cooliebase", "standalone"),
      detached: true,
      stdio: ["ignore", fs.openSync(logFile, "w"), fs.openSync(logFile, "w")],
      env: { ...process.env, NODE_ENV: "production", HOSTNAME: "0.0.0.0", PORT: new globalThis.URL(BASE).port || "3200", DATABASE_URL: URL, DB_DRIVER: "postgresql", TENANT_MODE: "disabled", TENANT_PLATFORM_USERNAMES: "admin", ADMIN_BOOTSTRAP_USERNAME: "admin", ADMIN_BOOTSTRAP_PASSWORD: PASSWORD, ADMIN_BOOTSTRAP_SALT: SALT },
    })
    let ready = false
    for (let i = 0; i < 40; i += 1) {
      try { if ((await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) })).status < 500) { ready = true; break } } catch { /* 未就绪 */ }
      await new Promise((r) => setTimeout(r, 3000))
    }
    if (!ready) { console.log("[load] 服务没起起来:\n" + fs.readFileSync(logFile, "utf8").slice(-600)); process.exit(1) }
  }

  const isVirtualEnv = fs.existsSync("/host-workspace") || fs.existsSync("/.dockerenv") || Boolean(process.env.CI)
  const envFactor = isVirtualEnv ? 0.1 : Math.max(0.2, Math.min(1, os.cpus().length / 12))
  if (isVirtualEnv) {
    console.log(`[load] 检测到容器/虚拟化环境（${os.cpus().length} 核），回归护栏阈值动态折算 (factor=${envFactor.toFixed(2)})`)
  }

  const results = []
  for (const target of targets) {
    const minRps = target.minRps ? Math.round(target.minRps * envFactor) : undefined
    const maxP95Ms = target.maxP95Ms ? Math.round(target.maxP95Ms / envFactor) : undefined
    const measured = hasAb ? runAb(target) : null
    const result = measured ?? (await runNode(target))
    const breaches = []
    if (minRps && result.rps < minRps) breaches.push(`rps ${result.rps} < ${minRps}`)
    if (maxP95Ms && result.p95Ms > maxP95Ms) breaches.push(`p95 ${result.p95Ms}ms > ${maxP95Ms}ms`)
    if (target.maxFailureRate != null && result.failureRate > target.maxFailureRate) breaches.push(`失败率 ${(result.failureRate * 100).toFixed(2)}% > ${target.maxFailureRate * 100}%`)
    const ok = breaches.length === 0
    results.push({ ...target, measured: result, ok, breaches, effectiveMinRps: minRps, effectiveMaxP95Ms: maxP95Ms })
    console.log(`  ${ok ? "✓" : "✗"} ${target.path}  rps=${result.rps}  p95=${result.p95Ms}ms  失败率=${(result.failureRate * 100).toFixed(2)}%${ok ? "" : `  ← ${breaches.join("; ")}`}`)
  }

  const failed = results.filter((r) => !r.ok)
  const out = {
    ranAt: new Date().toISOString(),
    base: BASE,
    runner: hasAb ? "ab" : "node",
    cores: os.cpus().length,
    note: baseline.note,
    total: results.length,
    failed: failed.length,
    results,
  }
  fs.mkdirSync(path.dirname(path.join(ROOT, RESULT_REL)), { recursive: true })
  fs.writeFileSync(path.join(ROOT, RESULT_REL), JSON.stringify(out, null, 2) + "\n")
  console.log(
    "[load] ⚠ 本机压测只作**回归护栏**：单机 CPU/磁盘/网络与生产不同，"
    + "这里的 rps/p95 **不代表容量**；真实容量须在生产用真实流量压。",
  )
  console.log(`\n[load] ${results.length - failed.length}/${results.length} 通过 —— 结果落盘 ${RESULT_REL}`)
  exitCode = failed.length === 0 ? 0 : 1
}

main()
  .catch((error) => { console.error(`  ✗ 压测异常: ${error.message}`); exitCode = 1 })
  // **必须用显式 process.exit(code)**：本脚本加载了 `embedded-postgres`，它会注册
  // AsyncExitHook，在事件循环结束时**把 process.exitCode 重置为 0** ——
  // 实测：0/3 通过却退出 0（假绿）。
  .finally(async () => { await cleanup(); process.exit(exitCode) })
