#!/usr/bin/env node
/**
 * AI 运行时开关（T2）—— **可选**地拉起外部 agent（dsh），默认不开。
 *
 * 设计前提（`docs/specs/infra/dsh-product-integration/`）：
 *   · **本仓不实现 agent loop** —— 这里只做「探测 / 起 / 停 / 指引」，不 import 任何运行时内部模块；
 *   · **AI 必须可关** —— 不开也不影响业务界面与 API（`delivery:boundary:check` 守着）；
 *   · **dsh 的 MCP 配置语法我没读过** —— 所以 `up` 只**打印**接线指引，**不臆造配置文件**。
 *
 * 用法：
 *   pnpm run agent:runtime:status   # 只读：装了没 / 在跑没 / MCP 面是否就绪
 *   pnpm run agent:runtime:up       # 起 dsh（pnpm dlx，首次会下载），并打印 MCP 接线步骤
 *   pnpm run agent:runtime:down     # 停
 */
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { spawn, spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const PID_FILE = path.join(ROOT, ".agent-runtime.pid")
const LOG_FILE = path.join(ROOT, ".agent-runtime.log")
const DEFAULT_PORT = Number(process.env.AGENT_RUNTIME_PORT || 3080)

const MCP_SERVER = "scripts/mcp/cooliebase-mcp-server.cjs"

function which(bin) {
  const r = spawnSync("sh", ["-c", `command -v ${bin}`], { encoding: "utf8" })
  return r.status === 0 ? r.stdout.trim() : null
}

function runningPid() {
  if (!fs.existsSync(PID_FILE)) return null
  const pid = Number(fs.readFileSync(PID_FILE, "utf8").trim())
  if (!pid) return null
  try {
    process.kill(pid, 0)
    return pid
  } catch {
    return null
  }
}

function probe() {
  const dshHome = path.join(os.homedir(), ".dsh")
  const dshBin = which("dsh")
  const pid = runningPid()
  const mcpExists = fs.existsSync(path.join(ROOT, MCP_SERVER))

  // MCP 工具数从真源读，不写死
  let toolCount = 0
  try {
    const compat = JSON.parse(
      fs.readFileSync(path.join(ROOT, "packages/shared/contract/compat-manifest.json"), "utf8"),
    )
    toolCount = (compat.consumptionSurface?.mcp?.tools || []).length
  } catch {
    /* 由 compat:check 负责，这里只做展示 */
  }

  return { dshHome: fs.existsSync(dshHome), dshBin, pid, mcpExists, toolCount }
}

function status() {
  const s = probe()
  const ok = "✓"
  const no = "✗"
  console.log("=== AI 运行时状态（只读）===")
  console.log(`  ${s.dshHome ? ok : no} dsh harness home: ${path.join(os.homedir(), ".dsh")}`)
  console.log(`  ${s.dshBin ? ok : no} dsh 在 PATH: ${s.dshBin || "（未安装，用 pnpm dlx 也可运行）"}`)
  console.log(`  ${s.pid ? ok : "·"} 本仓拉起的进程: ${s.pid ? `pid ${s.pid}` : "（未运行）"}`)
  console.log(`  ${s.mcpExists ? ok : no} MCP server: ${MCP_SERVER}（${s.toolCount} 个工具）`)
  console.log("")
  console.log("  AI 是**可选项**：未运行时业务界面与 API 照常可用。")
  return 0
}

function wiring() {
  console.log("")
  console.log("=== 把本仓接进 dsh（MCP）—— 需要你在 dsh 侧操作 ===")
  console.log("")
  console.log("  要接的东西（stdio）：")
  console.log(`    命令: node ${MCP_SERVER}`)
  console.log(`    工作目录: ${ROOT}`)
  console.log("")
  console.log("  **具体配置语法以 dsh 自己的文档为准** —— 本文不臆造它的配置格式")
  console.log("  （写错的配置比没有更糟）。核实位置：dsh 仓库的 `docs/user/guide` 与 `packages/mcp/`。")
  console.log("")
  console.log(`  接上后应能在 dsh 里看到 ${probe().toolCount} 个工具。**没看到就说明没通，别当成通了。**`)
}

function up() {
  const s = probe()
  if (s.pid) {
    console.log(`[agent-runtime] 已在运行（pid ${s.pid}）。要重启先跑 down。`)
    return 0
  }
  const hasBin = Boolean(s.dshBin)
  const cmd = hasBin ? s.dshBin : "pnpm"
  const args = hasBin ? ["web", "--no-open"] : ["dlx", "@deepseek-ai/dsh", "web", "--no-open"]

  console.log(`[agent-runtime] 启动: ${cmd} ${args.join(" ")}`)
  if (!hasBin) console.log("[agent-runtime] 未检测到 dsh，走 pnpm dlx（首次会下载，可能较慢）")

  const out = fs.openSync(LOG_FILE, "a")
  const child = spawn(cmd, args, {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", out, out],
    env: { ...process.env, PORT: String(DEFAULT_PORT) },
  })
  child.unref()
  fs.writeFileSync(PID_FILE, String(child.pid))
  console.log(`[agent-runtime] 已拉起 pid ${child.pid} · 端口 ${DEFAULT_PORT} · 日志 ${path.basename(LOG_FILE)}`)
  console.log("[agent-runtime] 注意：**MCP 接线还没做** —— 下面是需要你在 dsh 侧完成的步骤。")
  wiring()
  return 0
}

function down() {
  const pid = runningPid()
  if (!pid) {
    if (fs.existsSync(PID_FILE)) fs.rmSync(PID_FILE, { force: true })
    console.log("[agent-runtime] 未在运行。")
    return 0
  }
  try {
    process.kill(-pid, "SIGKILL")
  } catch {
    try {
      process.kill(pid, "SIGKILL")
    } catch {
      // 进程可能已自行退出；下面清理 pid 文件即可
    }
  }
  fs.rmSync(PID_FILE, { force: true })
  console.log(`[agent-runtime] 已停止 pid ${pid}。业务界面不受影响。`)
  return 0
}

const sub = (process.argv[2] || "status").toLowerCase()
if (sub === "status" || sub === "check") process.exit(status())
else if (sub === "up" || sub === "start") process.exit(up())
else if (sub === "down" || sub === "stop") process.exit(down())
else if (sub === "wiring") { wiring(); process.exit(0) }
else {
  console.error(`[agent-runtime] 未知子命令: ${sub}（status | up | down | wiring）`)
  process.exit(2)
}
