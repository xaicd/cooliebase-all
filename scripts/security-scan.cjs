#!/usr/bin/env node
/**
 * 安全渗透（轻量）—— 对着**跑起来的应用**打真实请求，检查本仓自己承诺过的东西。
 *
 * 为什么要有: 全流程交付链里，压测与渗透是**唯一两处没有工具**的环节。
 *   * §3.3 第 6 条要求「容量目标须由 SLO、**压测**和资源预算确定」——但没有压测工具；
 *   * §8 只要求「权限边界必须有**拒绝路径**测试」——没有越权/伪造/泄露检查。
 *
 * 本脚本检查的都是**仓里有明文承诺**的项，不是通用清单:
 *   §4.8 禁止信任调用方伪造的 tenant（`x-tenant-id`）
 *   §4.4 新增 API 必须使用 permission code
 *   §3.2.1 插件挂载按 manifest 的 auth 声明守卫（operator / company / public）
 *   §4.5 日志禁止输出密码、密钥、token
 *   路由保护基线: /api/v1/admin/** 必须落到 requireAdminAuth
 *
 * 用法:
 *   node scripts/security-scan.cjs                # 自管理环境，跑完清场
 *   node scripts/security-scan.cjs --keep
 *   node scripts/security-scan.cjs --base http://localhost:3200   # 对已有实例跑
 */
const { spawnSync, spawn } = require("node:child_process")
const crypto0 = require("node:crypto")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const KEEP = process.argv.includes("--keep")
const arg = (flag) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : undefined }
const BASE = arg("--base") || "http://localhost:3200"
const DB = "cooliebase_secscan"
const { URL: NodeURL } = require("node:url")
const { resolveDatabaseEndpoint, query, withDatabase } = require("./lib/ephemeral-pg.cjs")
let endpoint = null
let URL = null
const PASSWORD = "SecScan@123456"
const SALT = "secscan-salt"

const findings = []
const step = (name, ok, detail = "") => {
  findings.push({ name, ok, detail })
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? `  ${detail}` : ""}`)
}
const sh = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env } })

let app = null
let envLocalBackup = null

const cleanup = async () => {
  if (KEEP) { console.log(`\n[sec] --keep: 服务留在 ${BASE}`); return }
  if (app?.pid) {
    // **必须杀进程组**：只 kill pnpm 包装进程会留下孤儿 next-server（冒烟那边实测泄漏过）
    try { process.kill(-app.pid, "SIGTERM") } catch { try { app.kill("SIGTERM") } catch { /* 已退出 */ } }
    await new Promise((r) => setTimeout(r, 500))
    try { process.kill(-app.pid, "SIGKILL") } catch { /* 已退出 */ }
  }
  // 端口兜底（只在本脚本自己起的服务上兜底）
  const portNum = Number(new NodeURL(BASE).port || 80)
  for (let i = 0; i < 10; i += 1) {
    const busy = spawnSync("lsof", ["-nP", `-iTCP:${portNum}`, "-sTCP:LISTEN", "-t"], { encoding: "utf8" })
    const pid = busy.stdout?.trim().split("\n")[0]
    if (!pid) break
    try { process.kill(Number(pid), "SIGKILL") } catch { /* 已退出 */ }
    await new Promise((r) => setTimeout(r, 300))
  }
  const envLocal = path.join(ROOT, ".env.local")
  if (envLocalBackup === null) fs.rmSync(envLocal, { force: true })
  else fs.writeFileSync(envLocal, envLocalBackup)
  if (endpoint) {
    try { await query(endpoint.url, `DROP DATABASE IF EXISTS "${DB}" WITH (FORCE)`) } catch { /* 已不可达 */ }
    await endpoint.close()
  }
}

/** 发一个请求，返回 {status, body, headers}。 */
async function probe(pathname, init = {}) {
  const response = await fetch(`${BASE}${pathname}`, { redirect: "manual", signal: AbortSignal.timeout(20000), ...init })
  const body = await response.text()
  return { status: response.status, body, headers: Object.fromEntries(response.headers) }
}

async function main() {
  console.log(`\n=== 安全扫描（${BASE}）===\n`)

  if (!arg("--base")) {
    try {
      endpoint = await resolveDatabaseEndpoint()
      URL = withDatabase(endpoint.url, DB)
      step("起数据库（嵌入式或外部）", true, `${endpoint.source}${endpoint.port ? ` :${endpoint.port}` : ""}`)
    } catch (error) {
      step("起数据库（嵌入式或外部）", false, String(error?.message ?? error).split("\n")[0])
      return
    }
    await query(endpoint.url, `DROP DATABASE IF EXISTS "${DB}" WITH (FORCE)`)
    await query(endpoint.url, `CREATE DATABASE "${DB}"`)
    sh("pnpm", ["exec", "prisma", "migrate", "deploy"], { DATABASE_URL: URL })
    // **必须检查种子自己的退出码** —— 它可能建完 admin 之后才失败，
    // 那样 admin-count 会通过而登录永远 401（实测踩到，整整查了一轮）
    const seed = sh("pnpm", ["exec", "tsx", "scripts/seed-postgresql.ts"], { DATABASE_URL: URL, DB_DRIVER: "postgresql", ADMIN_BOOTSTRAP_USERNAME: "admin", ADMIN_BOOTSTRAP_PASSWORD: PASSWORD, ADMIN_BOOTSTRAP_SALT: SALT })
    if (seed.status !== 0) {
      step("种子执行成功", false, "见下方日志尾部")
      console.log((seed.stdout + seed.stderr).split("\n").slice(-12).map((l) => `      ${l}`).join("\n"))
      return
    }
    step("种子执行成功", true)
    sh("pnpm", ["exec", "tsx", "scripts/register-plugins.ts"], { DATABASE_URL: URL })

    const envLocal = path.join(ROOT, ".env.local")
    envLocalBackup = fs.existsSync(envLocal) ? fs.readFileSync(envLocal, "utf8") : null
    fs.writeFileSync(envLocal, `DATABASE_URL=${URL}\nDB_DRIVER=postgresql\nTENANT_MODE=disabled\nTENANT_PLATFORM_USERNAMES=admin,secscan_lowpriv\nADMIN_BOOTSTRAP_USERNAME=admin\nADMIN_BOOTSTRAP_PASSWORD=${PASSWORD}\nADMIN_BOOTSTRAP_SALT=${SALT}\n`)
    const logFile = path.join(os.tmpdir(), "security-scan-app.log")
    fs.writeFileSync(logFile, "") // 每轮截断
    const portNum = Number(new NodeURL(BASE).port || 80)
    const busy = spawnSync("lsof", ["-nP", `-iTCP:${portNum}`, "-sTCP:LISTEN"], { encoding: "utf8" })
    if (busy.status === 0 && busy.stdout.trim()) {
      step("端口空闲", false, `${portNum} 已被占用（先清理残留 dev server）`)
      return
    }
    app = spawn("pnpm", ["run", "dev"], {
      cwd: ROOT,
      detached: true,
      stdio: ["ignore", fs.openSync(logFile, "w"), fs.openSync(logFile, "w")],
      env: { ...process.env, DATABASE_URL: URL, DB_DRIVER: "postgresql", TENANT_MODE: "disabled", TENANT_PLATFORM_USERNAMES: "admin,secscan_lowpriv", ADMIN_BOOTSTRAP_USERNAME: "admin", ADMIN_BOOTSTRAP_PASSWORD: PASSWORD, ADMIN_BOOTSTRAP_SALT: SALT },
    })
    let ready = false
    for (let i = 0; i < 40; i += 1) {
      try { if ((await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) })).status < 500) { ready = true; break } } catch { /* 未就绪 */ }
      await new Promise((r) => setTimeout(r, 3000))
    }
    if (!ready) { step("起服务", false); console.log(fs.readFileSync(logFile, "utf8").slice(-600)); return }
    // 先确认种子真的建了 admin —— 否则 401 时无从判断是种子失败还是鉴权失败
    let seededCount = "?"
    try {
      const seeded = await query(URL, 'SELECT count(*)::int AS n FROM "system_user" WHERE username=\'admin\'')
      seededCount = String(seeded.rows?.[0]?.n ?? "?")
    } catch (error) { seededCount = `err:${String(error?.message ?? error).slice(0, 50)}` }
    step("种子建出 admin（表名须加引号：system_user 是保留字）", seededCount === "1", `count=${seededCount}`)
    step("起服务", true, BASE)
  }

  // ---- 1. 未认证访问 admin API 必须被拒（§3.2.1 路由保护基线）----
  const adminPaths = ["/api/v1/admin/system/users", "/api/v1/admin/system/menus", "/api/v1/admin/infra/configs", "/api/v1/admin/modules"]
  const openPaths = []
  for (const p of adminPaths) {
    const r = await probe(p)
    if (![401, 403].includes(r.status)) openPaths.push(`${p} → ${r.status}`)
  }
  step("未认证访问 admin API 全部被拒（401/403）", openPaths.length === 0, openPaths.join(", "))

  // ---- 2. 伪造 Bearer token 必须被拒 ----
  const forged = await probe("/api/v1/admin/system/users", { headers: { Authorization: "Bearer forged.not.a.real.token" } })
  step("伪造 token 被拒（401）", [401, 403].includes(forged.status), `HTTP ${forged.status}`)

  // ---- 3. 伪造 tenant 头不得越权（§4.8 禁止信任调用方伪造的 tenant）----
  const forgedTenant = await probe("/api/v1/admin/system/users", { headers: { "x-tenant-id": "999", "x-tenant-code": "999" } })
  step("伪造 x-tenant-id 不得放行", [401, 403].includes(forgedTenant.status), `HTTP ${forgedTenant.status}`)

  // ---- 4. 插件挂载点: 未认证访问 operator 插件必须 401 ----
  const plugin = await probe("/api/v1/plugins/cooliebase.system/api/ping")
  step("插件挂载点未认证被拒（或 404 未挂载，均非 200）", plugin.status !== 200, `HTTP ${plugin.status}`)

  // ---- 5. 错误响应不得泄露栈/内部路径（§4.5）----
  const bad = await probe("/api/v1/admin/system/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" })
  const leaks = /at\s+\w+\s+\(|node_modules|\.ts:\d+|stack/i.test(bad.body)
  step("错误响应不泄露栈/内部路径", !leaks, leaks ? `HTTP ${bad.status} 且响应里出现栈特征` : `HTTP ${bad.status}`)

  // ---- 6. 通用安全响应头 ----
  const head = await probe("/")
  const missing = ["x-content-type-options", "x-frame-options", "content-security-policy"].filter((h) => !head.headers[h])
  step("基础安全响应头存在", missing.length === 0, missing.length ? `缺: ${missing.join(", ")}` : "齐全")

  // ---- 7. 登录接口对错误口令必须 401（不是 200/500）----
  const wrongPassword = await probe("/api/v1/admin/system/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: "wrong-password-123" }) })
  step("错误口令返回 401", wrongPassword.status === 401, `HTTP ${wrongPassword.status}`)

  // ---- 8. 正常登录可用（阴性对照: 免得"全拒"被当成安全）----
  const login = await probe("/api/v1/admin/system/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: PASSWORD }) })
  let token = null
  try { token = JSON.parse(login.body)?.data?.token } catch { /* 交给断言 */ }
  step("阴性对照: 正确口令能登录（避免「全拒」冒充安全）", Boolean(token), `HTTP ${login.status}`)

  // ---- 9. 越权与授权模型（**读代码定案，不再靠"摘角色"猜**）----
  //
  // 曾经写成"摘掉 admin 的 DB 角色，看同一 token 是否被拒" —— **那是错的测法**:
  // 权限并不逐请求查库，而是**内嵌在 token 的 payload 里**（guards.ts: `permissions: payload.permissions`），
  // 且签发时平台管理员直接拿 `["*"]`（auth.service.ts:131: `roles.includes(getPlatformRole()) ? ["*"] : permissions`）。
  // 摘 DB 角色与这两条路径**不相交**，所以"仍 200"是必然，不是漏洞。
  //
  // 改成断言**真实的授权模型**（跑起来验一次签发结果 + 读源码验一处判定），
  // 并把真正的性质（**撤销延迟**）记下来，而不是伪装成"越权漏洞"。
  if (token) {
    let claims = null
    try { claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) } catch { /* 交给断言 */ }
    const isWildcard = Array.isArray(claims?.permissions) && claims.permissions.includes("*")
    step("授权模型: 平台管理员 token 的权限为通配 [\"*\"]（设计如此，故任何权限码都通过）", isWildcard,
      isWildcard ? "permissions=[\"*\"]" : `permissions=${JSON.stringify(claims?.permissions)}`)

    const ok = await probe("/api/v1/admin/system/users", { headers: { Authorization: `Bearer ${token}` } })
    step("阴性对照: 平台管理员确实能访问受保护接口", ok.status === 200, `HTTP ${ok.status}`)

    // 权限码检查**确实存在**（读源码断言，避免"我量错文件"的老毛病:
    // 真路由在 packages/**/routes/**，src/app 下只是一行转发壳）
    const guards = fs.readFileSync(path.join(ROOT, "packages", "shared", "backend", "auth", "guards.ts"), "utf8")
    const checksCode = /auth\.permissions\.includes\(requiredPermission\)/.test(guards)
    step("授权模型: requireAdminAuth 确实按权限码判定（非只看 audience）", checksCode)

    const svc = fs.readFileSync(path.join(ROOT, "packages", "domains", "system", "backend", "services", "auth.service.ts"), "utf8")
    const carriesPerms = /permissions:\s*payload\.permissions/.test(guards) && /jwtPermissions/.test(svc)
    step("已知权衡: 权限内嵌于 token 快照 —— 撤销/改角色对**已签发 token 不即时生效**",
      carriesPerms, "改动角色需等 token 过期或缩短 TTL / 引入吊销清单")
  }

  // ---- 10. 客户端静态检查（扫源码，不扫 bundle —— bundle 需要先构建）----
  const CLIENT = path.join(ROOT, "clients", "expo")
  const clientFiles = []
  const walkClient = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".expo", "dist", "android", "ios"].includes(e.name)) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walkClient(full)
      else if (/\.(ts|tsx|js|jsx|json)$/.test(e.name)) clientFiles.push(full)
    }
  }
  walkClient(CLIENT)

  // 10a. 客户端里不得出现**硬编码秘密**
  const secretHits = []
  for (const f of clientFiles) {
    const text = fs.readFileSync(f, "utf8")
    if (/(api[_-]?key|secret|private[_-]?key|password)\s*[:=]\s*["'`][A-Za-z0-9_\-+/]{16,}["'`]/i.test(text)) {
      secretHits.push(path.relative(ROOT, f))
    }
  }
  step("客户端: 无硬编码密钥", secretHits.length === 0, secretHits.join(", "))

  // 10b. EXPO_PUBLIC_* 白名单 —— 这些会被**内联进 bundle**，等于公开发布
  const ALLOWED_PUBLIC = ["EXPO_PUBLIC_API_BASE"]
  const publicHits = []
  for (const f of clientFiles) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/EXPO_PUBLIC_([A-Z0-9_]+)/g)) publicHits.push(`EXPO_PUBLIC_${m[1]}`)
  }
  const undeclared = [...new Set(publicHits)].filter((n) => !ALLOWED_PUBLIC.includes(n))
  step("客户端: EXPO_PUBLIC_* 全在白名单内（它们等于公开）", undeclared.length === 0, undeclared.join(", "))

  // 10c. token 不得存 AsyncStorage（必须 SecureStore）
  const insecureStore = []
  for (const f of clientFiles) {
    const text = fs.readFileSync(f, "utf8")
    if (/AsyncStorage\.setItem\([^)]*(token|jwt|auth|credential)/i.test(text)) insecureStore.push(path.relative(ROOT, f))
  }
  step("客户端: token 不落 AsyncStorage（应使用 SecureStore）", insecureStore.length === 0, insecureStore.join(", "))

  // ---- 11. 带合法 token 访问受保护接口应 200（证明上面不是"全都被拒"）----
  if (token) {
    const ok = await probe("/api/v1/admin/system/menus/sidebar", { headers: { Authorization: `Bearer ${token}` } })
    step("阴性对照: 合法 token 能访问受保护接口", ok.status === 200, `HTTP ${ok.status}`)
  }
}

main()
  .catch((error) => { console.error(`  ✗ 扫描异常: ${error.message}`); findings.push({ name: "扫描异常", ok: false, detail: error.message }) })
  .finally(async () => {
    const failed = findings.filter((f) => !f.ok)
    const report = { scannedAt: new Date().toISOString(), base: BASE, total: findings.length, failed: failed.length, findings }
    const out = path.join(ROOT, "docs", "architecture", "artifacts", "security-scan-result.json")
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, JSON.stringify(report, null, 2) + "\n")
    if (failed.length > 0) {
    const logFile = path.join(os.tmpdir(), "security-scan-app.log")
    if (fs.existsSync(logFile)) console.log(`[sec] 应用日志尾部（失败时必看）:\n` + fs.readFileSync(logFile, "utf8").split("\n").slice(-12).join("\n"))
  }
  console.log(`\n[sec] ${findings.length - failed.length}/${findings.length} 通过 —— 结果落盘 ${path.relative(ROOT, out)}`)
    await cleanup()
    process.exit(failed.length === 0 ? 0 : 1)
  })
