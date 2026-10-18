/**
 * cooliebase-all-base 跨平台快速启动脚本
 * 用法: node scripts/quick-start-runner.cjs [mode]
 * mode: local(默认) | docker
 */

const { execSync, spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const mode = process.argv[2] || "local"

function log(tag, msg) {
  const colors = { INFO: "\x1b[32m", STEP: "\x1b[34m", WARN: "\x1b[33m", ERROR: "\x1b[31m" }
  const reset = "\x1b[0m"
  console.log(`${colors[tag] || ""}[${tag}]${reset} ${msg}`)
}

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: "inherit", ...opts })
  } catch (e) {
    if (!opts.ignoreError) {
      log("ERROR", `命令失败: ${cmd}`)
      process.exit(1)
    }
  }
}

function fileExists(p) {
  return fs.existsSync(path.join(ROOT, p))
}

// ============================================================

console.log("")
console.log("  ╔══════════════════════════════════════╗")
console.log("  ║     cooliebase-all-base Quick Start       ║")
console.log(`  ║     Mode: ${mode.padEnd(26)}║`)
console.log("  ╚══════════════════════════════════════╝")
console.log("")

if (mode === "docker") {
  log("STEP", "启动 Docker 容器...")
  run("docker compose -f deploy/docker-compose.local.yml up --build -d")
  log("INFO", "容器已启动")
  log("INFO", "访问: http://localhost:3100")
  log("INFO", "登录: supervip (密码见 .env.local 或终端初始化日志)")
  process.exit(0)
}

// === Local 模式 ===

// Step 1: 检查 Node.js
log("STEP", "1/5 检查环境...")
try {
  const ver = execSync("node -v", { encoding: "utf8" }).trim()
  log("INFO", `Node.js ${ver} ✓`)
} catch {
  log("ERROR", "Node.js 未安装")
  process.exit(1)
}

// Step 2: 安装依赖
log("STEP", "2/5 安装依赖...")
if (!fileExists("node_modules")) {
  run("npm install --legacy-peer-deps")
  log("INFO", "依赖安装完成 ✓")
} else {
  log("INFO", "依赖已存在 ✓")
}

// Step 3: 环境配置
log("STEP", "3/5 配置环境...")
if (!fileExists(".env.local")) {
  const envContent = [
    "# cooliebase-all-base 本地开发配置（自动生成）",
    "DB_DRIVER=memory",
    "DATABASE_URL=file:./dev.db",
    "JWT_SECRET=cooliebase-all-base-dev-secret-key-2026",
    "JWT_EXPIRES_IN=86400",
  ].join("\n")
  fs.writeFileSync(path.join(ROOT, ".env.local"), envContent)
  log("INFO", ".env.local 已生成 ✓")
} else {
  log("INFO", ".env.local 已存在 ✓")
}

// Step 4: Prisma
log("STEP", "4/5 Prisma 初始化...")
if (fileExists("prisma/schema.prisma")) {
  run("npx prisma generate", { ignoreError: true })
}
log("INFO", "Prisma ✓")

// Step 5: 启动
log("STEP", "5/5 启动开发服务器...")
console.log("")
log("INFO", "═══════════════════════════════════════")
log("INFO", "  应用地址: http://localhost:3100")
log("INFO", "  登录页面: http://localhost:3100/login")
log("INFO", "  平台账号: supervip (密码见 .env.local 或终端初始化日志)")
log("INFO", "  数据模式: 内存（重启后数据重置）")
log("INFO", "═══════════════════════════════════════")
console.log("")

// 启动 next dev（非阻塞方式让 Ctrl+C 正常工作）
const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
})

child.on("close", (code) => process.exit(code ?? 0))
process.on("SIGINT", () => { child.kill(); process.exit(0) })
process.on("SIGTERM", () => { child.kill(); process.exit(0) })
