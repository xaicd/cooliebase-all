#!/usr/bin/env node
/**
 * project-init.cjs - CoolieBase-All-Next 业务项目初始化与重构引擎
 *
 * 核心用途：
 * 任何团队或开发者将 cooliebase-all 作为真实业务项目底座时，
 * 能够一键完成「自定义英文工程名、中文业务系统名称、Git 远程仓库地址、数据库名与端口、品牌版权」的原地重构或派生克隆。
 *
 * 用法:
 *   # 原地重构当前底座仓库 (In-place Refactor)
 *   node scripts/project-init.cjs --in-place --name my-mall --title "九夏智居数字化商城" --git git@github.com:org/my-mall.git
 *
 *   # 交互式引导重构 (如果未传参数)
 *   pnpm run project:init
 *
 *   # 克隆派生到新目录 (Clone & Hatch)
 *   node scripts/project-init.cjs --target ../my-mall --name my-mall --title "九夏智居数字化商城"
 */

const fs = require("node:fs")
const path = require("node:path")
const readline = require("node:readline")
const { execFileSync, execSync, spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const PROJECT_PROFILE_PATH = path.join(ROOT, "packages", "shared", "contract", "project-profile.json")
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json")
const ENV_PATH = path.join(ROOT, ".env")
const ENV_LOCAL_PATH = path.join(ROOT, ".env.local")

/**
 * 改名是**裸串替换** —— 工程名若恰好是常见词/子串，会破坏代码里的标识符。
 * 实测：临时目录名为 `init` 时，`const definition = {` 变成 `const def<名字>ion = {`，
 * 产物直接 SyntaxError；而改名自身的退出码是 **0**。
 *
 * 所以这里 fail-loud：改完对 scripts/ prisma/ deploy/ 下所有脚本跑 `node --check`，
 * 有任何一个不能解析 → **拒绝产出**（宁可失败，也不产一个"下一步就崩"的工程）。
 */
function assertProductScriptsParse(targetDir) {
  const { spawnSync } = require("node:child_process")
  const broken = []
  const scan = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) scan(full)
      else if (/\.(cjs|mjs|js)$/.test(entry.name)) {
        if (spawnSync("node", ["--check", full], { stdio: "ignore" }).status !== 0) {
          broken.push(path.relative(targetDir, full))
        }
      }
    }
  }
  for (const sub of ["scripts", "prisma", "deploy"]) scan(path.join(targetDir, sub))
  if (broken.length) {
    throw new Error(
      `改名后产物里有 ${broken.length} 个脚本无法解析 —— 拒绝产出坏工程：\n` +
        broken.slice(0, 10).map((f) => `  · ${f}`).join("\n") +
        `\n  常见原因：工程名是常见词/子串（如 init / app / web），裸串替换破坏了标识符。换个更独特的名字。`,
    )
  }
  console.log(`[project-init] ✓ 产物脚本语法自检通过（scripts / prisma / deploy 全部可解析）`)
}

function parseArgs(args) {
  const options = {
    inPlace: false,
    target: null,
    name: null,
    title: null,
    shortName: null,
    git: null,
    dbName: null,
    port: 3200,
    author: null,
    profile: "standard",
    // vertical profile 需要；此前 project-init 完全不认 --bundle，
    // 于是 `--profile vertical --bundle mall` 会在 clone 阶段报
    // "vertical profile 必须提供 --bundle"（参数在转发时被丢弃，实测）。
    bundle: [],
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--help" || arg === "-h") options.help = true
    else if (arg === "--in-place") options.inPlace = true
    else if (arg === "--target" && args[i + 1]) options.target = args[++i]
    else if (arg.startsWith("--target=")) options.target = arg.split("=")[1]
    else if (arg === "--name" && args[i + 1]) options.name = args[++i]
    else if (arg.startsWith("--name=")) options.name = arg.split("=")[1]
    else if (arg === "--title" && args[i + 1]) options.title = args[++i]
    else if (arg.startsWith("--title=")) options.title = arg.split("=")[1]
    else if (arg === "--short-name" && args[i + 1]) options.shortName = args[++i]
    else if (arg.startsWith("--short-name=")) options.shortName = arg.split("=")[1]
    else if (arg === "--git" && args[i + 1]) options.git = args[++i]
    else if (arg.startsWith("--git=")) options.git = arg.split("=")[1]
    else if (arg === "--db" || arg === "--db-name") options.dbName = args[++i]
    else if (arg.startsWith("--db=") || arg.startsWith("--db-name=")) options.dbName = arg.split("=")[1]
    else if (arg === "--port" && args[i + 1]) options.port = parseInt(args[++i], 10) || 3200
    else if (arg.startsWith("--port=")) options.port = parseInt(arg.split("=")[1], 10) || 3200
    else if (arg === "--author" && args[i + 1]) options.author = args[++i]
    else if (arg.startsWith("--author=")) options.author = arg.split("=")[1]
    else if (arg === "--profile" && args[i + 1]) options.profile = args[++i]
    else if (arg.startsWith("--profile=")) options.profile = arg.split("=")[1]
    else if (arg === "--bundle" && args[i + 1]) options.bundle = String(args[++i]).split(",").map((v) => v.trim()).filter(Boolean)
    else if (arg.startsWith("--bundle=")) options.bundle = arg.split("=")[1].split(",").map((v) => v.trim()).filter(Boolean)
  }

  return options
}

function prompt(rl, question, defaultValue) {
  return new Promise((resolve) => {
    const hint = defaultValue ? ` [默认: ${defaultValue}]: ` : ": "
    rl.question(question + hint, (answer) => {
      resolve(answer.trim() || defaultValue || "")
    })
  })
}

async function collectInteractive(opts) {
  if (opts.name && opts.title) return opts

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log("\n🚀 [cooliebase-all] 业务项目初始化向导 (Project Refactor Wizard)\n")
  console.log("准备将当前底座快速重构并适配至您的真实业务系统：\n")

  if (!opts.target && !opts.inPlace) {
    const mode = await prompt(rl, "1. 重构模式 (1: 原地重构当前仓库, 2: 派生克隆至新目录)", "1")
    if (mode === "2") {
      opts.target = await prompt(rl, "   请输入新工程目标路径", "../my-business-app")
    } else {
      opts.inPlace = true
    }
  }

  if (!opts.name) {
    opts.name = await prompt(rl, "2. 英文工程标识/目录名 (kebab-case)", "my-business-project")
  }
  if (!opts.title) {
    opts.title = await prompt(rl, "3. 中文业务系统全称", "企业数字化智能业务中台")
  }
  if (!opts.shortName) {
    const defaultShort = opts.title.slice(0, 4)
    opts.shortName = await prompt(rl, "4. 中文简称 (用于侧栏/顶栏)", defaultShort)
  }
  if (!opts.git) {
    opts.git = await prompt(rl, "5. 新业务远程 Git 仓库地址 (留空跳过)", "")
  }
  if (!opts.author) {
    opts.author = await prompt(rl, "6. 公司/作者版权信息", "My Company Team")
  }

  rl.close()
  return opts
}

function updateProjectProfile(targetDir, opts) {
  const profileFile = path.join(targetDir, "packages", "shared", "contract", "project-profile.json")
  if (!fs.existsSync(profileFile)) return

  const profile = JSON.parse(fs.readFileSync(profileFile, "utf8"))
  profile.platformName = opts.title
  profile.shortName = opts.shortName || opts.title.slice(0, 4)
  profile.description = `${opts.title} — 基于 cooliebase-all 高阶工程底座构建的企业级数字化业务中台。`
  profile.copyright = `© ${new Date().getFullYear()} ${opts.author || opts.shortName || "Business"} Team`
  profile.loginHeadline = opts.title
  profile.loginTagline = "模块化单体与微服务平滑演进，开箱即用的全栈企业级研发基座。"

  fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2), "utf8")
  console.log(`[project-init] ✓ 已更新业务身份契约: ${path.relative(ROOT, profileFile)}`)
}

function updatePackageJson(targetDir, opts) {
  const pkgFile = path.join(targetDir, "package.json")
  if (!fs.existsSync(pkgFile)) return

  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"))
  pkg.name = opts.name
  if (pkg.scripts && pkg.scripts.dev) {
    pkg.scripts.dev = pkg.scripts.dev.replace(/-p \d+/, `-p ${opts.port}`)
  }
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2), "utf8")
  console.log(`[project-init] ✓ 已重构工程坐标: package.json (name: ${opts.name}, dev port: ${opts.port})`)
}

/** SQLite 库路径的**唯一解析处** —— .env 写入与实际 bootstrap 必须用同一个，否则应用会连到不存在的库。 */
function resolveSqliteDbPath(opts) {
  return `data/${opts.name}.db`
}

function updateEnvFiles(targetDir, opts) {
  const dbName = opts.dbName || opts.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
  const sqliteDbPath = resolveSqliteDbPath(opts)

  const envUpdates = {
    NEXT_PUBLIC_APP_TITLE: opts.title,
    NEXT_PUBLIC_APP_SHORT_NAME: opts.shortName || opts.title.slice(0, 4),
    PORT: String(opts.port),
    DB_NAME: dbName,
    SQLITE_DB_PATH: sqliteDbPath,
  }

  // 零配置 SQLite 路径必须把**运行时真正读取的变量**一起写全，否则会出现
  // "工程起得来、/readyz 200、登录永远 401"（实测三连）：
  //   1. `DB_DRIVER` 缺省 → 驱动默认 `memory`（datasource-manager），跑在进程内存里；
  //   2. 运行时用 **`DATABASE_URL`** 作为 SQLite 文件名（kysely-client.createSqliteDialect(url)），
  //      而 `SQLITE_DB_PATH` **只有 bootstrap 脚本读** —— 只写它等于没写；
  //   3. `DATABASE_URL` 为空时 url 会退化成 `memory://cooliebase-all` 这个占位符。
  // 已有 `DATABASE_URL`（如克隆到 PostgreSQL 的路径）时一律不动，避免把 postgres 覆盖成 sqlite。
  const existingEnvs = [".env", ".env.local"]
    .map((name) => (fs.existsSync(path.join(targetDir, name)) ? fs.readFileSync(path.join(targetDir, name), "utf8") : ""))
    .join("\n")
  // **只在"已指向非 SQLite 库"时才跳过** —— 判断必须看**取值**，不能只看"有没有这个键"。
  // 实测踩到的坑：重新初始化（或孵化链里改两次身份）时，`SQLITE_DB_PATH` 会被更新成新工程名，
  // 而 `DATABASE_URL` 因为"已存在"被原样留下 → **两个变量指向不同的库**：
  //   SQLITE_DB_PATH=data/e2e-probe.db   （被更新，bootstrap 往这里种子）
  //   DATABASE_URL=file:./data/demo-mall.db （没更新，应用读的是这里）
  // 应用于是连到一个**没有种子**的库 —— 表现为"工程起得来、healthz 200、登录 500/401"，
  // 正是 AGENTS 里记录过的那个失败模式。
  const existingUrl = (/^DATABASE_URL=(.*)$/m.exec(existingEnvs)?.[1] ?? "").trim()
  const pointsAtNonSqlite = existingUrl !== "" && !/^(file:|sqlite:)/i.test(existingUrl) && !/\.db(\?|$)/i.test(existingUrl)
  if (!pointsAtNonSqlite) {
    envUpdates.DB_DRIVER = "sqlite"
    // file: 前缀让 detectDriverFromUrl 也能识别为 sqlite；相对路径以工程根为基准。
    envUpdates.DATABASE_URL = `file:./${sqliteDbPath}`
  }
  // 生产启动要求 JWT_SECRET ≥32 字节且非默认值。孵化时就生成，避免 `npm start` 起不来。
  if (!/^JWT_SECRET=/m.test(existingEnvs)) {
    envUpdates.JWT_SECRET = require("node:crypto").randomBytes(32).toString("hex")
  }

  for (const envFileName of [".env", ".env.local"]) {
    const filePath = path.join(targetDir, envFileName)
    let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : ""
    const lines = content.split("\n")
    const seen = new Set()
    const result = []

    for (const line of lines) {
      const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/)
      if (match) {
        const key = match[1]
        if (key in envUpdates) {
          result.push(`${key}=${envUpdates[key]}`)
          seen.add(key)
          continue
        }
      }
      result.push(line)
    }

    for (const [key, val] of Object.entries(envUpdates)) {
      if (!seen.has(key)) {
        result.push(`${key}=${val}`)
      }
    }

    fs.writeFileSync(filePath, result.join("\n").trim() + "\n", "utf8")
    console.log(`[project-init] ✓ 已更新环境变量: ${envFileName}`)
  }
}

function updateGitRemote(targetDir, gitUrl) {
  if (!gitUrl) return
  try {
    const hasOrigin = spawnSync("git", ["remote", "get-url", "origin"], { cwd: targetDir }).status === 0
    if (hasOrigin) {
      execSync(`git remote set-url origin "${gitUrl}"`, { cwd: targetDir, stdio: "inherit" })
      console.log(`[project-init] ✓ 已重定向 Git Remote origin -> ${gitUrl}`)
    } else {
      execSync(`git remote add origin "${gitUrl}"`, { cwd: targetDir, stdio: "inherit" })
      console.log(`[project-init] ✓ 已新增 Git Remote origin -> ${gitUrl}`)
    }
  } catch (err) {
    console.warn(`[project-init] ⚠️ Git 远程地址配置提示: ${err.message}`)
  }
}

/**
 * 确保派生工程有 git 仓库。
 *
 * 为什么必须在这里补：`degit` 下载的骨架**没有 `.git`**，而 `project:init` 是这条路径的最后一步。
 * 不补的话，后续 `pnpm run check` 里依赖 git 的门禁会直接红 —— 实测
 * `docs:commands:check`：「无法列出 git 跟踪文件（拒绝在未知文件集上判定）」，
 * 而 README 声称这条 degit 流程「已实测验证」。**承诺与实际不符，必须在代码里补上。**
 *
 * **必须 `git add -A` 而不只是 `git init`**：空仓库的 `git ls-files` 返回空列表，
 * 检查器会「扫 0 个文件 → 通过」—— 那是假绿，比报错更糟。
 */
function ensureGitRepo(dir) {
  if (fs.existsSync(path.join(dir, ".git"))) return
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir })
    const hasEmail = spawnSync("git", ["config", "user.email"], { cwd: dir }).status === 0
    if (!hasEmail) {
      execFileSync("git", ["config", "user.email", "bot@local"], { cwd: dir })
      execFileSync("git", ["config", "user.name", "ProjectInit"], { cwd: dir })
    }
    execFileSync("git", ["add", "-A"], { cwd: dir })
    try {
      execFileSync("git", ["commit", "-q", "-m", "chore: 派生工程初始快照"], { cwd: dir })
    } catch {
      /* 提交失败不影响可用性：索引已建立，git 依赖门禁可正常工作 */
    }
    console.log("[project-init] ✓ 已初始化 git 仓库（任务痕迹与指纹依赖它）")
  } catch (error) {
    console.warn(
      `[project-init] ⚠ git 初始化失败（不影响启动，但依赖 git 的门禁会失败）：${String(error.message)}`,
    )
  }
}

/**
 * 派生工程的需求文档里有一张「规模事实表」——它的数字**随裁剪而变**，
 * 而基座口径（17 域 / 15 插件 / 38 Skills）会被原样带过来，于是**必然是错的**。
 * 实测：minimal 产物只剩 3 个插件，而文档仍写 15 →
 * 产物自己的 `check`（含 `docs:claims:check`）**exit=1**，孵化出的是"坏工程"。
 *
 * 这里按**产物自身的真源**改写那几行 —— 与 llms.txt 的 `--restamp` 同一思路：
 * 数字由**同一脚本**判真值并改写，而不是靠人记得同步。
 */
/**
 * 派生工程的需求文档里有一张「规模事实表」——它的数字**随裁剪而变**，
 * 而基座口径（17 域 / 15 插件 / 21 门禁）会被原样带过来，于是**必然是错的**。
 * 实测：minimal 产物只剩 3 个插件，文档仍写 15 → 产物自己的 `check`
 * （含 `docs:claims:check`）**exit=1** —— 孵化出的是"坏工程"。
 *
 * 做法：把该表整体换成**只引用命令**的形式（"能引用的不写死"，本仓自己的规矩）。
 * 这样产物里不再有会漂的数字，`docs:claims:check` 也就无事可查 —— 而不是靠人记得同步。
 */
/**
 * 棘轮基线是**按基座的文件集合**冻结的，而派生工程会裁剪掉大量文件 / 改写若干行 ——
 * 于是「found − baseline」在产物里必然出现**假阳性**（实测：`no-new-npm-run` 报 new debt: 9）。
 *
 * 棘轮的语义是「冻结**当前**状态、只拦新增」，所以孵化后应当**按产物自身重新冻结**。
 * 这不是掩盖欠债：基线文件与 `--audit` 都能看到冻结了什么。
 */
function refreshStandardsBaseline(targetDir) {
  const script = path.join(targetDir, "scripts/check-engineering-standards.cjs")
  if (!fs.existsSync(script)) return
  try {
    execSync("node scripts/check-engineering-standards.cjs --write-baseline", { cwd: targetDir, stdio: "pipe" })
    console.log("[project-init] ✓ 已按产物自身重新冻结规范棘轮基线（基座基线是按基座文件集合算的）")
  } catch (err) {
    console.warn("[project-init] 提示: 重新冻结棘轮基线失败:", err.message)
  }
}

function restampSizeClaims(targetDir) {
  const rel = "docs/02_requirements/non-functional-reqs.md"
  const abs = path.join(targetDir, rel)
  if (!fs.existsSync(abs)) return
  const text = fs.readFileSync(abs, "utf8")
  if (!/##\s*5\.\s*可维护性与治理/.test(text)) return

  const table = [
    "| 指标 | 值 | 真源（**派生工程请以命令输出为准**） |",
    "|---|---|---|",
    "| 原生域 | 见命令 | `ls packages/domains/* -d` + `packages/shared/backend/constants/domain-catalog.json` |",
    "| 第一方插件 | 见命令 | `ls -d packages/plugins/plugin-* \\| wc -l` |",
    "| Agent Skills | 见命令 | `ls -d .agents/skills/*/SKILL.md \\| wc -l` |",
    "| 静态交付门禁 | 见命令 | `pnpm run compat:check`（打印当前条数） |",
    "| 工程规范机检规则 | 见命令 | `pnpm run standards:check --audit` |",
  ].join("\n")

  // 只替换该小节的表格（从表头到下一个空行为止），其余内容不动
  const next = text.replace(
    /(\| 指标 \| 值 \| 真源 \|\n\|[-\s|]+\|\n)(?:\|[^\n]*\|\n)+/,
    `${table}\n`,
  )
  if (next !== text) {
    fs.writeFileSync(abs, next)
    console.log("[project-init] ✓ 已把规模事实表改为「引用命令」（派生工程的数字与基座必然不同）")
  }
}
function refreshArtifacts(targetDir, opts) {
  try {
    console.log("[project-init] 正在同步契约与 Seam 图谱...")
    execSync("node scripts/write-seam-graph.cjs", { cwd: targetDir, stdio: "pipe" })
    execSync("node scripts/write-domain-manifests.cjs", { cwd: targetDir, stdio: "pipe" })
    if (fs.existsSync(path.join(targetDir, "scripts", "sync-agent-surface.cjs"))) {
      execSync("node scripts/sync-agent-surface.cjs", { cwd: targetDir, stdio: "pipe" })
    }
    // **必须重生成 wiki**：sanitizeProjectFiles 会删掉 `docs/specs/archive` 与
    // `docs/architecture/archive`（派生工程不继承基座历史），而 wiki 里仍有指向它们的链接。
    // 不重生成 → `gen:paths:check` 在派生工程里必红（实测：wiki/cmmi/cmmi-lifecycle.md）。
    if (fs.existsSync(path.join(targetDir, "scripts", "sync-openwiki.cjs"))) {
      execSync("node scripts/sync-openwiki.cjs --write", { cwd: targetDir, stdio: "pipe" })
    }
    console.log("[project-init] ✓ 契约图谱与发现表面已重新编译对齐")
  } catch (err) {
    console.warn("[project-init] 提示: 契约图谱同步警告", err.message)
  }

  try {
    if (!fs.existsSync(path.join(targetDir, "node_modules"))) {
      // 目标工程尚未安装依赖时，`pnpm exec tsx` 解析不到依赖，bootstrap 必然失败。
      // 之前会打印一大段 Node 栈、随后仍然宣布 SUCCESS —— 属于"把失败报成成功"。
      console.log("[project-init] 跳过 SQLite 本地库：目标工程尚未安装依赖。")
      console.log("  安装后如需零配置 SQLite 库：pnpm install 后重跑本命令，或直接")
      console.log("  SQLITE_DB_PATH=data/<工程名>.db pnpm exec tsx scripts/bootstrap-sqlite.ts")
    } else if (fs.existsSync(path.join(targetDir, "scripts", "bootstrap-sqlite.ts"))) {
      const sqliteDbPath = resolveSqliteDbPath(opts)
      console.log(`[project-init] 正在自动初始化零配置 SQLite 本地库 (${sqliteDbPath})...`)
      // 必须显式传路径：bootstrap 默认 data/cooliebase.db，与 .env.local 的派生路径不一致时，
      // 应用会连到从未被种子的空库 —— 表现为"工程起得来、但登录永远 401"（实测）。
      execSync("pnpm exec tsx scripts/bootstrap-sqlite.ts", {
        cwd: targetDir,
        stdio: "inherit",
        env: { ...process.env, SQLITE_DB_PATH: sqliteDbPath },
      })
      console.log("[project-init] ✓ 本地 SQLite 数据库已就绪 (预置平台超级管理员账号: supervip，随机安全密码已写入 .env.local)")
    }
  } catch (err) {
    console.warn("[project-init] 提示: SQLite 初始化提示:", err.message)
  }
}

function sanitizeProjectFiles(targetDir, opts) {
  console.log(`[project-init] 🧹 执行白标化脱敏与品牌清洗 (ProjectReactor)...`)
  const exts = new Set([".vue", ".html", ".json", ".yaml", ".yml", ".ts", ".js", ".mjs", ".md", ".java", ".xml", ".sql", ".sh", ".cjs"])
  const ignoreDirs = new Set(["node_modules", ".git", ".next", ".next-cooliebase", ".next-ruoyi", ".claude", ".commandcode", "dist", "build"])

  const replacements = [
    [/芋道四位一体企业级管理中台/g, `${opts.title} · 企业级管理中台`],
    [/芋道四位一体管理系统/g, `${opts.title} · 业务管理系统`],
    [/芋道四位一体业务工作台/g, `${opts.title} · 业务工作台`],
    [/芋道四位一体云商中台/g, `${opts.title} · 业务中台`],
    [/芋道四位一体/g, `${opts.title} · 多端中台`],
    [/芋道管理中台/g, `${opts.title} · 管理中台`],
    [/芋道管理后台/g, `${opts.title} · 管理后台`],
    [/芋道管理系统/g, `${opts.title} · 业务系统`],
    [/芋道源码/g, "企业级开源底座"],
    [/芋道/g, opts.title],
    [/yudao-quad-terminal/g, `${opts.name}-quad`],
    [new RegExp("yudao-ui-admin-vue3", "g"), `@${opts.name}/admin`],
    [new RegExp("yudao-cloud-backend", "g"), `@${opts.name}/backend`],
    [/yudao-server/g, `${opts.name}-server`],
    [/yudao-monorepo/g, `@${opts.name}`],
    [new RegExp("yudao-native-app", "g"), `@${opts.name}/app`],
    [/yudao-boot-mini/g, `${opts.name}-boot`],
    [/yudao-cloud/g, `${opts.name}-cloud`],
    [/cn\.iocoder\.cloud/g, `com.${opts.name}`],
    [/cn\.iocoder\.boot/g, `com.${opts.name}`],
    [/cn\.iocoder\.yudao/g, `com.${opts.name}.server`],
    [/yudao/gi, (match) => {
      if (match === "Yudao") return opts.name.charAt(0).toUpperCase() + opts.name.slice(1)
      if (match === "YUDAO") return opts.name.toUpperCase()
      return opts.name.toLowerCase()
    }],
  ]

  function walk(dir) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (ignoreDirs.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (!exts.has(ext)) continue
        try {
          let content = fs.readFileSync(fullPath, "utf8")
          let modified = false
          for (const [re, rep] of replacements) {
            if (re.test(content)) {
              content = content.replace(re, rep)
              modified = true
            }
          }
          if (modified) {
            fs.writeFileSync(fullPath, content, "utf8")
          }
        } catch {}
      }
    }
  }

  try {
    fs.rmSync(path.join(targetDir, "docs", "architecture", "archive"), { recursive: true, force: true })
    fs.rmSync(path.join(targetDir, "docs", "specs", "archive"), { recursive: true, force: true })
  } catch {}

  walk(targetDir)
  console.log(`[project-init] ✓ 白标化脱敏清洗完毕`)
}

async function run() {
  const parsed = parseArgs(process.argv.slice(2))
  if (parsed.help) {
    console.log(`
CoolieBase-All-Next 业务项目初始化引擎 (project-init)

用法:
  node scripts/project-init.cjs [选项]

选项:
  --in-place             原地重构当前仓库
  --target <path>        克隆派生至新目录
  --name <name>          英文项目名/标识 (例如: my-mall-app)
  --title <title>        中文业务系统全称 (例如: 九夏智居数字化中台)
  --short-name <short>   中文简称 (例如: 九夏智居)
  --git <url>            新业务 Git 远程仓库地址
  --db <dbname>          自定义数据库名称 (默认按英文名转换)
  --port <port>          启动端口 (默认: 3200)
  --author <author>      公司或作者名称 (用于版权声明)
  --profile <profile>    保留域模板: standard (全量 17 域) | minimal | base
  --bundle <a,b>         vertical profile 的业务域白名单 (例如: mall,crm)
`)
    return
  }

  const opts = await collectInteractive(parsed)

  if (!opts.name || !opts.title) {
    console.error("[project-init] 错误: 必须指定 --name 和 --title！")
    process.exit(1)
  }

  if (opts.target) {
    console.log(`\n[project-init] 正在派生克隆底座到目标目录: ${opts.target} ...`)
    const cloneScript = path.join(ROOT, "scripts", "clone-project-base.cjs")
    const cloneArgs = [cloneScript, opts.target, "--profile", opts.profile]
    // 本入口产物走 **SQLite**（见下方 updateEnvFiles），克隆阶段不该被 Postgres 拦住。
    cloneArgs.push("--no-provision-db")
    if (Array.isArray(opts.bundle) && opts.bundle.length > 0) cloneArgs.push("--bundle", opts.bundle.join(","))
    execFileSync("node", cloneArgs, { stdio: "inherit" })
    const targetDir = path.resolve(process.cwd(), opts.target)
    sanitizeProjectFiles(targetDir, opts)
    updateProjectProfile(targetDir, opts)
    updatePackageJson(targetDir, opts)
    updateEnvFiles(targetDir, opts)
    updateGitRemote(targetDir, opts.git)
    refreshArtifacts(targetDir, opts)
    assertProductScriptsParse(targetDir)
    restampSizeClaims(targetDir)
    refreshStandardsBaseline(targetDir)
    ensureGitRepo(targetDir)
    console.log(`\n🎉 [SUCCESS] 业务项目已成功初始化在: ${targetDir}`)
  } else {
    console.log(`\n[project-init] 正在对当前底座进行【原地业务重构】...`)
    const targetDir = ROOT
    sanitizeProjectFiles(targetDir, opts)
    updateProjectProfile(targetDir, opts)
    updatePackageJson(targetDir, opts)
    updateEnvFiles(targetDir, opts)
    updateGitRemote(targetDir, opts.git)
    refreshArtifacts(targetDir, opts)
    assertProductScriptsParse(targetDir)
    restampSizeClaims(targetDir)
    refreshStandardsBaseline(targetDir)
    ensureGitRepo(targetDir)
    console.log(`\n🎉 [SUCCESS] 当前底座已成功重构为专属业务工程: [${opts.title} (${opts.name})]`)
  }

  console.log(`
后续启动步骤:
  1. pnpm dev                       # 启动本地开发服务 (http://localhost:${opts.port})
  2. pnpm run check                 # 门禁自检全绿验证
`)
}

run().catch((err) => {
  console.error("[project-init ERROR]", err)
  process.exit(1)
})
