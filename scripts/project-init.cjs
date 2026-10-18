#!/usr/bin/env node
/**
 * project-init.cjs - CoolieBase-All-Next 业务项目初始化与重构引擎
 * (对标并超越 cooliebase-vue-pro 的 ProjectReactor.java / projectRefactor.java)
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
 *   npm run project:init
 *
 *   # 克隆派生到新目录 (Clone & Hatch)
 *   node scripts/project-init.cjs --target ../my-mall --name my-mall --title "九夏智居数字化商城"
 */

const fs = require("node:fs")
const path = require("node:path")
const readline = require("node:readline")
const { execSync, spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const PROJECT_PROFILE_PATH = path.join(ROOT, "packages", "shared", "contract", "project-profile.json")
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json")
const ENV_PATH = path.join(ROOT, ".env")
const ENV_LOCAL_PATH = path.join(ROOT, ".env.local")

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

function updateEnvFiles(targetDir, opts) {
  const dbName = opts.dbName || opts.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
  const sqliteDbPath = `data/${opts.name}.db`

  const envUpdates = {
    NEXT_PUBLIC_APP_TITLE: opts.title,
    NEXT_PUBLIC_APP_SHORT_NAME: opts.shortName || opts.title.slice(0, 4),
    PORT: String(opts.port),
    DB_NAME: dbName,
    SQLITE_DB_PATH: sqliteDbPath,
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

function refreshArtifacts(targetDir) {
  try {
    console.log("[project-init] 正在同步契约与 Seam 图谱...")
    execSync("node scripts/write-seam-graph.cjs", { cwd: targetDir, stdio: "pipe" })
    execSync("node scripts/write-domain-manifests.cjs", { cwd: targetDir, stdio: "pipe" })
    if (fs.existsSync(path.join(targetDir, "scripts", "sync-agent-surface.cjs"))) {
      execSync("node scripts/sync-agent-surface.cjs", { cwd: targetDir, stdio: "pipe" })
    }
    console.log("[project-init] ✓ 契约图谱与发现表面已重新编译对齐")
  } catch (err) {
    console.warn("[project-init] 提示: 契约图谱同步警告", err.message)
  }

  try {
    if (fs.existsSync(path.join(targetDir, "scripts", "bootstrap-sqlite.ts"))) {
      console.log("[project-init] 正在自动初始化零配置 SQLite 本地库 (data/cooliebase.db)...")
      execSync("npx tsx scripts/bootstrap-sqlite.ts", { cwd: targetDir, stdio: "inherit" })
      console.log("[project-init] ✓ 本地 SQLite 数据库已就绪 (预置平台超级管理员账号: supervip，随机安全密码已写入 .env.local)")
    }
  } catch (err) {
    console.warn("[project-init] 提示: SQLite 初始化提示:", err.message)
  }
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
    execSync(`node "${cloneScript}" "${opts.target}" --profile ${opts.profile}`, { stdio: "inherit" })
    const targetDir = path.resolve(process.cwd(), opts.target)
    updateProjectProfile(targetDir, opts)
    updatePackageJson(targetDir, opts)
    updateEnvFiles(targetDir, opts)
    updateGitRemote(targetDir, opts.git)
    refreshArtifacts(targetDir)
    console.log(`\n🎉 [SUCCESS] 业务项目已成功初始化在: ${targetDir}`)
  } else {
    console.log(`\n[project-init] 正在对当前底座进行【原地业务重构】...`)
    const targetDir = ROOT
    updateProjectProfile(targetDir, opts)
    updatePackageJson(targetDir, opts)
    updateEnvFiles(targetDir, opts)
    updateGitRemote(targetDir, opts.git)
    refreshArtifacts(targetDir)
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
