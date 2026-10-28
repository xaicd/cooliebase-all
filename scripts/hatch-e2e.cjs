#!/usr/bin/env node
/**
 * 孵化端到端（hatch E2E）：**产物自身能不能跑通它自己的门禁**。
 *
 * 为什么必须真跑，而不是靠别的门禁间接保证：
 * 本仓的 `check` 只保证**基座自己**是绿的。孵化会「克隆 → 裁剪 → 改身份 → 建库 → 种子」，
 * 每一步都可能留下**只在新工程里才暴露**的残留。实测（2026-10-20）就抓到：
 *   · `project:create` 的产物 `pnpm run check` **exit=1** —— 374 处悬空引用，
 *     来自被裁域的 wiki 词条（生成物只写不删）与 llms/README 里的「17 域 / 342 契约」声明；
 *   · 而基座自己的 `check` **完全看不到**这些 —— 因为基座 17 个域都在。
 * 所以这条判据只能靠**真造一个工程再跑它的门禁**来守。
 *
 * 两条入口都要跑（它们走的不是同一段代码）：
 *   · `project:init --target`：SQLite、零外部依赖；
 *   · `project:create`      ：reactor 克隆 + hatch 裁剪 + **真实 Postgres**（这里用嵌入式，零 Docker）。
 *
 * 用法:
 *   pnpm run hatch:e2e                    # 两条入口 × minimal
 *   pnpm run hatch:e2e -- --profile base  # 指定 profile（vertical 需要 --bundle，默认 mall,crm）
 *   pnpm run hatch:e2e -- --only init     # 只跑一条
 *   pnpm run hatch:e2e -- --skip-install  # 迭代用（产物复用已装依赖会失败，谨慎）
 *   pnpm run hatch:e2e -- --keep          # 保留产物目录便于排查
 *   pnpm run hatch:e2e -- --fast          # 只跑到产物的 check（跳过 build 与起服务登录）
 *
 * **本机（macOS）已知限制 —— 别追成产品问题**：
 * `smoke:login` 会起产物 dev（Turbopack）。Turbopack 在 macOS 上用 FSEvent 监视文件，
 * 而 FSEvent 流是**按用户**限额的。机器上同时跑着别的项目的 watcher 时（实测：66 个 node 进程、
 * 其中隔壁 `coolie` 的 dev-watch 常驻），会报 `TurbopackInternalError: unable to start FSEvent stream`
 * —— 日志先打印 `✓ Ready in …ms` **再** panic，于是表现为「起来了但探针连不上 /healthz」。
 *
 * **判定方法（我实测过的对照）**：同一时刻跑**基座自己**的 `pnpm run dev` ——
 * 若它也报同样的 FSEvent panic，就是机器级资源问题，与产物无关。
 *
 * 换 webpack（`next dev --webpack`）**不是**解法：它改用 watchpack，会撞 `EMFILE: too many open files`。
 * 真正的解法是**关掉其它 watcher 或重启机器**。
 *
 * **在被 FSEvent 堵住的机器上，怎样仍然验「产物能跑能访问」**（实测通过）：
 * 改用生产模式 —— `pnpm run build` + `pnpm exec next start -p <port>`。
 * `next start` **不启文件监视**，因此绕开 FSEvent 与 watchpack：
 * 实测 `/healthz` `/` `/login` 全部 **200**，日志只有 `Ready`、无 FSEvent。
 * 这能把问题**定位**到"dev 的 watcher"，而不是产物本身 —— 但它**不能替代** `smoke:login`
 * （smoke 验的是 dev 模式 + 建库/迁移/种子/插件登记/登录整条链）。
 *
 * 退出码：任一环节非 0 即非 0（**不做任何降级**）。
 */
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
// Windows 上 Node **不能**直接 spawn(PNPM) —— 必须 "pnpm.cmd"（或 shell:true）。
// 本仓其它脚本（check-client-build / check-deps-audit / generate-sbom）都是这么写的，
// 我这份漏了 —— 那会在 windows-latest 上直接 ENOENT。
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
const argv = process.argv.slice(2)
const hasFlag = (name) => argv.includes(`--${name}`)
const valueOf = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}

const profile = valueOf("profile", "minimal")
// `vertical` 必须给 `--bundle`（否则 reactor 直接拒绝：vertical profile 必须提供 --bundle）。
// 矩阵验证时**不能因此判产品失败** —— 那是 harness 的调用方式问题，不是产物问题。
const bundle = valueOf("bundle", profile === "vertical" ? "mall,crm" : "")
const bundleArgs = bundle ? ["--bundle", bundle] : []
const only = valueOf("only", "both")
const skipInstall = hasFlag("skip-install")
// 默认**连运行时一起验**（build + 起服务 + 登录）；`--fast` 只跑到产物 check。
const fast = hasFlag("fast")
const keep = hasFlag("keep")
const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "hatch-e2e-"))

const failures = []

function step(label, cmd, args, cwd, env = {}) {
  process.stdout.write(`\n[hatch-e2e] === ${label} ===\n`)
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env, HATCH_E2E: "1" },
    // **Windows 上 `pnpm.cmd` 必须经 shell**（同 check 链里那批 spawn 的坑）。
    // 实测：不加这一项，`产物依赖安装` 会**一行输出都没有**、只报 exit=1 ——
    // 因为 spawn 本身就没起来，而 `result.error` 之前被忽略掉了。
    shell: process.platform === "win32",
  })
  const code = result.status ?? 1
  process.stdout.write(`[hatch-e2e] ${label} → exit=${code}\n`)
  // **起进程失败必须说出来**：否则只剩一个 exit=1，看不出是"跑挂了"还是"没跑起来"。
  if (result.error) {
    process.stdout.write(`[hatch-e2e] ✗ ${label} 启动失败: ${result.error.message}\n`)
  }
  return code
}

/** 跑一条入口：造工程 → 装依赖 → **跑工程自己的 check**。 */
async function runEntry(kind) {
  const target = path.join(baseDir, `probe-${kind}`)
  const env = {}

  process.stdout.write(`\n${"=".repeat(64)}\n[hatch-e2e] 入口: ${kind}  profile=${profile}\n${"=".repeat(64)}\n`)

  if (kind === "create") {
    // `project:create` 需要一台真实 Postgres。这里用**嵌入式**（零容器）——
    // 与 verify:real-db / smoke:login 等入口同一条路，不为 E2E 引入 Docker 依赖。
    const { resolveDatabaseEndpoint } = require("./lib/ephemeral-pg.cjs")
    const endpoint = await resolveDatabaseEndpoint()
    env.PROJECT_PG_ADMIN_URL = endpoint.url
    process.stdout.write(`[hatch-e2e] 嵌入式 Postgres: ${endpoint.url}\n`)
  }

  const initCode = kind === "init"
    ? step("project:init --target", "node",
        [path.join(ROOT, "scripts", "project-init.cjs"), "--target", target, "--name", `e2e-${kind}`, "--title", "E2E Probe", "--profile", profile, ...bundleArgs],
        ROOT, env)
    : step("project:create", "node",
        [path.join(ROOT, "scripts", "clone-project-base.cjs"), target, "--profile", profile, ...bundleArgs],
        ROOT, env)

  if (initCode !== 0) {
    failures.push(`${kind}: 孵化本身失败 (exit=${initCode})`)
    return
  }

  if (!skipInstall) {
    const installCode = step("产物依赖安装", PNPM, ["install", "--frozen-lockfile"], target)
    if (installCode !== 0) {
      failures.push(`${kind}: 产物 pnpm install 失败 (exit=${installCode})`)
      return
    }
  }

  // 「改成业务身份」是**文档里的下一步**，而且它做的是**全仓文本改名** ——
  // 最容易把产物写坏的一步（实测：替换值含 `/` 落进正则字面量 →
  // 产物的 `project-init.cjs` 直接 SyntaxError，而 `project:create` 当时是成功退出的）。
  // 所以它必须进 E2E：跑在产物 `check` **之前**（与文档顺序一致：建 → 装 → 改身份 → 用）。
  const initInPlaceCode = step(
    "产物 project:init --in-place（改业务身份）",
    PNPM,
    ["run", "project:init", "--", "--in-place", "--name", "e2e-probe", "--title", "E2E 探针工程"],
    target,
  )
  if (initInPlaceCode !== 0) {
    failures.push(`${kind}: 产物 project:init --in-place 失败 (exit=${initInPlaceCode}) —— 改名把产物写坏了`)
  }

  const checkCode = step("产物自身 check（静态判据）", PNPM, ["run", "check"], target)
  if (checkCode !== 0) {
    failures.push(`${kind}: 产物自身 check 失败 (exit=${checkCode}) —— 孵化出的是**坏工程**`)
  }

  // `check` 是**静态**门禁：它证明不了「工程能构建、能起来、能登录」。
  // 而 M4 的判据正是「产物能启动并跑通自身门禁」—— 裁剪掉的域可能让构建或启动挂在运行时。
  if (fast) return

  // 第三条判据：产物**自带**的库能不能登录（不注入外部库）
  await verifyOutOfTheBox(target, kind)

  const buildCode = step("产物生产构建", PNPM, ["run", "build"], target)
  if (buildCode !== 0) {
    failures.push(`${kind}: 产物 build 失败 (exit=${buildCode})`)
  }

  // 起服务 → 建库/迁移/种子/登记插件 → **登录 200** → 受保护接口 200。
  // 产物自带这条入口（与基座同源），所以这里不另写断言，直接复用 —— 避免第二真源。
  const smokeCode = step("产物 smoke:login（起服务 + 登录）", PNPM, ["run", "smoke:login"], target)
  if (smokeCode !== 0) {
    failures.push(`${kind}: 产物 smoke:login 失败 (exit=${smokeCode}) —— 工程起不来或登不进去`)
  }
}


/**
 * 第三条判据：**产物自带的库能不能登录**（不注入任何外部库）。
 *
 * 为什么必须单独验：`check` 是静态的；`smoke:login` 会**自起嵌入式库**、绕开产物自己的库。
 * 两条都盖不住"产物开箱是否真能用"。这里严格照**文档给的步骤**走：
 *   安装 → 跑文档里的 bootstrap（带产物自己的 SQLITE_DB_PATH）→ 干净环境起 dev → 用 .env.local 的账号登录。
 *
 * 用**干净环境**是关键：shell 里导出的 DB_DRIVER / DATABASE_URL / NODE_ENV / TENANT_*
 * 会覆盖产物配置（实测会导致"起得来但登录 401"），那验的就不是产物了。
 */
async function verifyOutOfTheBox(target, label) {
  const fsMod = require("node:fs")
  const pathMod = require("node:path")
  const { spawn, spawnSync } = require("node:child_process")

  const readEnv = (file) => {
    const abs = pathMod.join(target, file)
    return fsMod.existsSync(abs) ? fsMod.readFileSync(abs, "utf8") : ""
  }
  const pick = (text, key) => (new RegExp(`^${key}=(.*)$`, "m").exec(text)?.[1] ?? "").trim()

  const envFile = readEnv(".env")
  const envLocal = readEnv(".env.local")
  const sqlitePath = pick(envFile, "SQLITE_DB_PATH") || pick(envLocal, "SQLITE_DB_PATH")
  const devScript = JSON.parse(fsMod.readFileSync(pathMod.join(target, "package.json"), "utf8")).scripts?.dev ?? ""
  const port = Number(/-p\s+(\d+)/.exec(devScript)?.[1] ?? 0)
  const base = `http://127.0.0.1:${port || 3200}`

  // 只对**自带持久库**的产物做开箱验活。`project:create` 用的是 PostgreSQL，
  // 而在 e2e 里那台是**嵌入式、随 reactor 进程结束而消失**的 —— 产物 `.env` 里
  // 留下的是一个**已关闭的端口**，登录必然 401。那不是产物缺陷，是"临时库不能当交付库"
  // 的固有事实（AGENTS 也写了：embed 只用于瞬时校验）。
  // 故：非 sqlite 产物**显式跳过并说明理由**（与 `clients` 缺席时的处理同族：跳过而非失败）。
  // 判据必须看**驱动/连接串**，不能看"SQLITE_DB_PATH 这个键在不在" ——
  // `project:init` 会把 `SQLITE_DB_PATH` **无条件**写进 .env（即使产物用的是 PostgreSQL），
  // 于是"看键"的写法**永远不跳过**，会把 PG 产物当成 SQLite 来验 → 必然 401（实测）。
  // （同一个毛病我在 `project:init` 里也犯过一次：守卫"看键是否存在"而不是"看取值"。）
  const dbUrl = (pick(envLocal, "DATABASE_URL") || pick(envFile, "DATABASE_URL")).trim()
  const usesSqlite = dbUrl === "" || /^(file:|sqlite:)/i.test(dbUrl) || /\.db(\?|$)/i.test(dbUrl)
  if (!usesSqlite) {
    process.stdout.write(
      `[hatch-e2e] SKIP ${label} 开箱验活：产物连接的是 PostgreSQL（e2e 内为临时嵌入式实例，进程结束即消失），` +
        `无法作为持久库验证登录。\n`,
    )
    return
  }
  if (!sqlitePath) {
    process.stdout.write(`[hatch-e2e] SKIP ${label} 开箱验活：产物未声明 SQLITE_DB_PATH。\n`)
    return
  }

  // ① 照文档 bootstrap（只在依赖已装、且脚本存在时）
  if (sqlitePath && fsMod.existsSync(pathMod.join(target, "scripts", "bootstrap-sqlite.ts"))) {
    const r = spawnSync(PNPM, ["exec", "tsx", "scripts/bootstrap-sqlite.ts"], {
      cwd: target, stdio: "inherit", env: { ...process.env, SQLITE_DB_PATH: sqlitePath },
    })
    if ((r.status ?? 1) !== 0) { failures.push(`${label}: 产物 bootstrap 失败 (exit=${r.status})`); return }
  }

  // **必须在 bootstrap 之后重读**：bootstrap 会生成随机管理员密码并**写进 .env.local**。
  // （首次实现我在 bootstrap 之前读了一次，于是永远读到空凭据 —— 被这条判据自己抓出来。）
  const envLocalAfter = readEnv(".env.local")
  const user = pick(envLocalAfter, "ADMIN_BOOTSTRAP_USERNAME") || pick(envFile, "ADMIN_BOOTSTRAP_USERNAME")
  const pass = pick(envLocalAfter, "ADMIN_BOOTSTRAP_PASSWORD") || pick(envFile, "ADMIN_BOOTSTRAP_PASSWORD")

  if (!user || !pass) {
    failures.push(`${label}: 产物缺少引导凭据（.env.local 里没有 ADMIN_BOOTSTRAP_*）—— 无法验证开箱登录`)
    return
  }

  // ② 干净环境起 dev
  const cleanEnv = { ...process.env }
  for (const key of ["DB_DRIVER", "DATABASE_URL", "NODE_ENV", "TENANT_MODE", "TENANT_PLATFORM_USERNAMES"]) delete cleanEnv[key]
  process.stdout.write(`\n[hatch-e2e] === 产物开箱验活（${base}）===\n`)
  const child = spawn(PNPM, ["run", "dev"], { cwd: target, env: cleanEnv, stdio: "ignore", detached: true })
  const stop = () => { try { process.kill(-child.pid, "SIGKILL") } catch { try { child.kill("SIGKILL") } catch {} } }
  try {
    let up = false
    for (let i = 0; i < 90; i += 1) {
      try { const r = await fetch(`${base}/healthz`); if (r.ok) { up = true; break } } catch {}
      await new Promise((res) => setTimeout(res, 1000))
    }
    if (!up) { failures.push(`${label}: 产物 dev 起来后 /healthz 未在 90s 内返回 200`); return }

    const res = await fetch(`${base}/api/v1/admin/system/auth`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    })
    const body = await res.json().catch(() => null)
    const token = body?.data?.token
    if (res.status !== 200 || !token) {
      failures.push(`${label}: 产物开箱登录失败（HTTP ${res.status}）—— 库/凭据未就绪，属"能起但登不进去"`)
      return
    }
    const guarded = await fetch(`${base}/api/v1/admin/system/users`, { headers: { Authorization: `Bearer ${token}` } })
    if (!guarded.ok) { failures.push(`${label}: 登录成功但受保护接口 ${guarded.status}`); return }
    process.stdout.write(`[hatch-e2e] ✓ ${label} 开箱可用：/healthz 200 · 登录 200 · 受保护接口 ${guarded.status}\n`)
  } finally {
    stop()
    await new Promise((res) => setTimeout(res, 500))
  }
}

async function main() {
  const kinds = only === "both" ? ["init", "create"] : [only]
  for (const kind of kinds) await runEntry(kind)

  process.stdout.write(`\n${"=".repeat(64)}\n`)
  if (failures.length > 0) {
    for (const line of failures) process.stdout.write(`[hatch-e2e] ✗ ${line}\n`)
    process.stdout.write(`[hatch-e2e] 结论: FAIL（${failures.length} 项）\n`)
  } else {
    process.stdout.write(`[hatch-e2e] 结论: PASS —— ${kinds.join(" + ")} 的产物均通过自身门禁\n`)
  }
  process.stdout.write(`[hatch-e2e] 产物目录: ${baseDir}${keep ? "（--keep 保留）" : "（将清理）"}\n`)

  if (!keep) fs.rmSync(baseDir, { recursive: true, force: true })
  process.exit(failures.length > 0 ? 1 : 0)
}

main().catch((error) => {
  process.stdout.write(`[hatch-e2e] ✗ 异常: ${error?.message ?? error}\n`)
  if (!keep) fs.rmSync(baseDir, { recursive: true, force: true })
  process.exit(1)
})
