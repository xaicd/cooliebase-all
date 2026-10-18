#!/usr/bin/env node

/**
 * create-cooliebase-app
 * Zero-Git-History instant scaffolding CLI for cooliebase-all.
 *
 * Usage:
 *   npx create-cooliebase-app my-app
 *   npx create-cooliebase-app my-app --title "XX智慧管理平台" --profile base
 *   pnpm create cooliebase-app my-app
 */

const fs = require("node:fs")
const path = require("node:path")
const readline = require("node:readline")
const { execSync, spawnSync } = require("node:child_process")

const BANNER = `
   ___                   _   _ _   _          _   
  | _ \\_  _ ___ _  _ (_) / /_\\ | | |  | \\| | _____ _| |_ 
  |   / || / _ \\ || | | | / _ \\| | |  | .\` |/ -_) \\ /  _|
  |_|_\\\\_,_\\___/\\_,_| |_|/_/ \\_\\_|_|  |_|\\_|\\___/_\\_\\\\__|
     Enterprise Next.js 16 + React 19 Fullstack Foundation
`

function printHelp() {
  console.log(BANNER)
  console.log("用法:")
  console.log("  npx create-cooliebase-app <工程名或路径> [选项]")
  console.log("  pnpm create cooliebase-app <工程名或路径> [选项]\n")
  console.log("选项:")
  console.log("  --title <text>     项目中文系统全称 (如: \"XX智慧能源管理中台\")")
  console.log("  --profile <name>   骨架规模: base (默认, 纯净底座), minimal (含AI/低代码), standard (全量17域)")
  console.log("  --port <number>    开发服务端口 (默认: 3300)")
  console.log("  --install          拉取完成后自动执行 pnpm install")
  console.log("  -h, --help         显示帮助信息\n")
  console.log("Profile 规格说明:")
  console.log("  base      [推荐] 平台底座 (shared + system + infra) - 极轻量(~50MB), 秒级编译, 纯白板")
  console.log("  minimal   底座 + 伴生域 (online/ai/aigw) - 支持在线开发与大模型网关")
  console.log("  standard  全量 17 业务域与跨端客户端 (适合 DigitalStaff NPC 全能力工作区)")
  process.exit(0)
}

function prompt(rl, question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${question} (默认: ${defaultValue}): `, (answer) => {
      resolve(answer.trim() || defaultValue)
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes("-h") || args.includes("--help")) {
    printHelp()
  }

  let target = ""
  let title = ""
  let profile = "base"
  let port = "3300"
  let autoInstall = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--title" && args[i + 1]) title = args[++i]
    else if (arg.startsWith("--title=")) title = arg.split("=")[1]
    else if (arg === "--profile" && args[i + 1]) profile = args[++i]
    else if (arg.startsWith("--profile=")) profile = arg.split("=")[1]
    else if (arg === "--port" && args[i + 1]) port = args[++i]
    else if (arg.startsWith("--port=")) port = arg.split("=")[1]
    else if (arg === "--install") autoInstall = true
    else if (!arg.startsWith("-") && !target) target = arg
  }

  const isInteractive = !target && process.stdin.isTTY

  if (isInteractive) {
    console.log(BANNER)
    console.log("🚀 欢迎使用 cooliebase-all 极速创建向导！\n")
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    target = await prompt(rl, "1. 目标工程目录名 (kebab-case)", "my-cooliebase-app")
    title = await prompt(rl, "2. 中文业务系统全称", "企业数字化智能业务中台")
    profile = await prompt(rl, "3. 骨架规模 (base / minimal / standard)", "base")
    const installAns = await prompt(rl, "4. 是否自动安装依赖 (y/N)", "N")
    if (installAns.toLowerCase() === "y") autoInstall = true
    rl.close()
  } else if (!target) {
    target = "my-cooliebase-app"
  }

  if (!title) {
    title = `${target} 业务管理系统`
  }

  const targetDir = path.resolve(process.cwd(), target)
  const projectName = path.basename(targetDir)

  console.log(`\n📦 正在创建工程: ${projectName} -> ${targetDir}`)
  console.log(`🏷️ 系统标题: ${title}`)
  console.log(`📐 骨架规模: ${profile}`)

  if (fs.existsSync(targetDir)) {
    const existing = fs.readdirSync(targetDir)
    if (existing.length > 0) {
      console.error(`\n❌ 目标目录 ${targetDir} 已存在且不为空，请指定新目录或清空后再试。`)
      process.exit(1)
    }
  } else {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  // 1. 尝试 degit (0MB 历史极速拉取)
  console.log("\n[1/4] 正在拉取干净代码骨架 (Zero-Git-History)...")
  let pullSuccess = false
  try {
    const degitRes = spawnSync("npx", ["degit", "xaicd/cooliebase-all#main", targetDir, "--force"], {
      stdio: "inherit"
    })
    if (degitRes.status === 0) pullSuccess = true
  } catch {}

  if (!pullSuccess) {
    console.log("ℹ️ degit 拉取失败，自动降级为 git shallow clone...")
    try {
      execSync(`git clone --depth 1 https://github.com/xaicd/cooliebase-all.git "${targetDir}"`, {
        stdio: "inherit"
      })
      // 删除上游 Git 历史
      const dotGit = path.join(targetDir, ".git")
      if (fs.existsSync(dotGit)) {
        fs.rmSync(dotGit, { recursive: true, force: true })
      }
      pullSuccess = true
    } catch (e) {
      console.error("❌ 拉取骨架失败，请检查网络连接：", e.message)
      process.exit(1)
    }
  }

  // 2. 原地重构项目身份
  console.log("\n[2/4] 正在根据业务参数重构项目身份与配置契约...")
  try {
    const initCmd = [
      "node",
      "scripts/project-init.cjs",
      "--in-place",
      `--name="${projectName}"`,
      `--title="${title}"`,
      `--port=${port}`
    ]
    execSync(initCmd.join(" "), { cwd: targetDir, stdio: "inherit" })
  } catch (e) {
    console.warn("⚠️ 自动重塑项目参数出现提示，继续初始化：", e.message)
  }

  // 3. 自动建立独立的业务首提交
  console.log("\n[3/4] 正在初始化全新业务 Git 仓库...")
  try {
    execSync("git init && git add -A && git commit -m \"chore: initialize business project from cooliebase-all base\"", {
      cwd: targetDir,
      stdio: "ignore"
    })
    console.log("✓ 已创建独立 Git 仓库首提交 (0 脏历史)")
  } catch {}

  // 4. 依赖安装 (可选)
  if (autoInstall) {
    console.log("\n[4/4] 正在安装工程依赖 (pnpm install)...")
    try {
      execSync("pnpm install", { cwd: targetDir, stdio: "inherit" })
      console.log("✓ 依赖安装完成")
    } catch {
      console.warn("⚠️ pnpm install 提示手动执行")
    }
  }

  // 5. 提示完成
  console.log("\n🎉 工程创建成功！下一步操作指南：")
  console.log("--------------------------------------------------")
  console.log(`  cd ${target}`)
  if (!autoInstall) {
    console.log("  pnpm install               # 安装项目依赖")
  }
  console.log("  npm run db:bootstrap:sqlite# 初始化零配置本地数据库")
  console.log("  npm run dev                # 启动开发服务")
  console.log("--------------------------------------------------")
  console.log(`🔗 浏览器访问: http://localhost:${port}`)
  console.log("🚀 祝您业务研发愉快！\n")
}

main().catch((err) => {
  console.error("致命错误:", err)
  process.exit(1)
})
