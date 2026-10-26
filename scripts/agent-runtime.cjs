#!/usr/bin/env node
/**
 * AI 运行时装配器（T2/T3）—— **可选**地拉起外部 agent（dsh），默认不开。
 *
 * 本文件在 2026-10-26 **实跑验证**后重写：此前 `up` 只打印接线指引（因为我没读过 dsh 的配置格式），
 * 现在格式已确认（见 `docs/guides/dsh-integration.md` §2.4），所以 `up` 能真的接线。
 *
 * ## 三条铁律
 * 1. **不实现 loop** —— 只做探测 / 装配 / 起停，不 import 任何运行时内部模块；
 * 2. **不自动接受风险** —— `dsh plugin allow-version --accept-risk` 会明说"可能损坏数据"，
 *    这个决定必须由人做；脚本只**打印**那条命令，不替他执行；
 * 3. **接线成功要有证据** —— 起完之后**轮询**确认 dsh 真的 spawn 了我们的 MCP server，
 *    而不是"进程起来了就算通"。
 *
 * 用法：
 *   pnpm harness agent status   # 只读：dsh / profile / mcp-client / patch / 本仓进程
 *   pnpm harness agent up       # 装配 patch + 起 dsh + 轮询验证 MCP 已连上
 *   pnpm harness agent down     # 停
 */
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { spawn, spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const PID_FILE = path.join(ROOT, ".agent-runtime.pid")
const LOG_FILE = path.join(ROOT, ".agent-runtime.log")
const PROFILE = process.env.AGENT_RUNTIME_PROFILE || "web"
const PORT = Number(process.env.AGENT_RUNTIME_PORT || 3080)
const MCP_SERVER_REL = "scripts/mcp/cooliebase-mcp-server.cjs"
const MCP_SERVER_ABS = path.join(ROOT, MCP_SERVER_REL)
const MCP_CLIENT_PKG = "@deepseek-ai/dsh-mcp-client"

/** $DSH_HOME：dsh 的默认是 ~/.dsh；允许覆盖，测试时用独立目录别碰用户环境 */
function dshHome() {
  return process.env.DSH_HOME || path.join(os.homedir(), ".dsh")
}
function patchFile() {
  return path.join(dshHome(), "profiles", PROFILE, "cordis.patch.yml")
}

/** dsh 可执行：$DSH_BIN > PATH > null（null 表示要走 pnpm dlx） */
function dshBin() {
  if (process.env.DSH_BIN) return process.env.DSH_BIN
  const r = spawnSync("sh", ["-c", "command -v dsh"], { encoding: "utf8" })
  return r.status === 0 ? r.stdout.trim() : null
}

/** 统一调用方式：有二进制就直接调，否则 pnpm dlx */
function dshArgs(rest) {
  const bin = dshBin()
  return bin ? { cmd: bin, args: rest } : { cmd: "pnpm", args: ["dlx", "@deepseek-ai/dsh", ...rest] }
}

function runDsh(rest, opts = {}) {
  const { cmd, args } = dshArgs(rest)
  return spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", ...opts })
}

function mcpClientInstalled() {
  const pj = path.join(dshHome(), "profiles", PROFILE, "package.json")
  if (!fs.existsSync(pj)) return false
  try {
    const d = JSON.parse(fs.readFileSync(pj, "utf8"))
    return Boolean(d.dependencies && d.dependencies[MCP_CLIENT_PKG])
  } catch {
    return false
  }
}

/** patch 里是否已经有我们的 insert（幂等：重复 up 不会写出两条） */
function patchHasMcp() {
  const f = patchFile()
  if (!fs.existsSync(f)) return false
  const src = fs.readFileSync(f, "utf8")
  return src.includes("mcp-cooliebase") && src.includes("dsh-mcp-client")
}

function writePatch() {
  const f = patchFile()
  fs.mkdirSync(path.dirname(f), { recursive: true })
  const block = `- insert:
    - id: mcp-cooliebase
      name: '${MCP_CLIENT_PKG}'
      config:
        serverName: cooliebase
        transport: stdio
        command: node
        args:
          - ${MCP_SERVER_REL}
        cwd: ${ROOT}
`
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, block)
    return "created"
  }
  const src = fs.readFileSync(f, "utf8")
  if (src.includes("mcp-cooliebase") && src.includes("dsh-mcp-client")) return "already"
  // 已有其它 patch：保留原文，追加我们的 insert（YAML 数组项之间换行即可）
  fs.writeFileSync(f, `${src.replace(/\s*$/, "\n")}${block}`)
  return "appended"
}

function pidRunning() {
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

/** 证据：dsh 是否 spawn 了我们的 MCP server（按命令行精确匹配，避免误判） */
function mcpChildPids() {
  const r = spawnSync("sh", ["-c", `ps -eo pid,ppid,command | grep -F ${MCP_SERVER_REL} | grep -v grep`], {
    encoding: "utf8",
  })
  if (r.status !== 0) return []
  return r.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split(/\s+/)
      return { pid: Number(parts[0]), ppid: Number(parts[1]) }
    })
}

function status() {
  const ok = "✓"
  const no = "✗"
  const home = dshHome()
  const running = pidRunning()
  const children = mcpChildPids()
  let tools = 0
  try {
    const compat = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/shared/contract/compat-manifest.json"), "utf8"))
    tools = (compat.consumptionSurface?.mcp?.tools || []).length
  } catch {
    /* compat:check 负责，这里只展示 */
  }

  console.log("=== AI 运行时状态（只读）===")
  console.log(`  ${dshBin() ? ok : "·"} dsh 可执行: ${dshBin() || "（不在 PATH，将用 pnpm dlx）"}`)
  console.log(`  ${fs.existsSync(path.join(home, "profiles", PROFILE)) ? ok : no} profile: ${path.join(home, "profiles", PROFILE)}`)
  console.log(`  ${mcpClientInstalled() ? ok : no} ${MCP_CLIENT_PKG}: ${mcpClientInstalled() ? "已装" : "未装（up 会提示怎么装）"}`)
  console.log(`  ${patchHasMcp() ? ok : no} MCP patch: ${patchHasMcp() ? "已插入" : "未插入（up 会写）"}`)
  console.log(`  ${running ? ok : "·"} 本仓拉起的 dsh: ${running ? `pid ${running}` : "（未运行）"}`)
  console.log(`  ${children.length ? ok : "·"} MCP 子进程: ${children.length ? children.map((c) => `pid ${c.pid}←${c.ppid}`).join(" ") : "（无）"}`)
  console.log(`  ${fs.existsSync(MCP_SERVER_ABS) ? ok : no} MCP server: ${MCP_SERVER_REL}（${tools} 个工具）`)
  console.log("")
  console.log("  AI 是**可选项**：未运行时业务界面与 API 照常可用。")
  return 0
}

function up() {
  if (pidRunning()) {
    console.log(`[agent-runtime] 已在运行（pid ${pidRunning()}）。要重启先跑 down。`)
    return 0
  }
  if (!fs.existsSync(MCP_SERVER_ABS)) {
    console.error(`[agent-runtime] ✗ 找不到 MCP server: ${MCP_SERVER_REL}`)
    return 1
  }

  // ① 保证 profile 存在（dump-config 会创建目录与默认 patch）
  runDsh(["--profile", PROFILE, "--dump-config"], { stdio: "ignore" })

  // ② mcp-client 没装就提示（**不自动 accept-risk**）
  if (!mcpClientInstalled()) {
    console.log("")
    console.log("[agent-runtime] 还差一个包：@deepseek-ai/dsh-mcp-client")
    console.log("  生态里它的版本与 dsh 主版本不匹配，安装需要**显式接受风险**（会提示可能损坏数据）：")
    console.log("")
    console.log(`    dsh plugin --profile ${PROFILE} allow-version ${MCP_CLIENT_PKG}@0.0.1-rc.1 \\`)
    console.log(`      --dsh-version <你的 dsh 版本> --accept-risk`)
    console.log(`    dsh plugin --profile ${PROFILE} add ${MCP_CLIENT_PKG}`)
    console.log("")
    console.log("  装好后重跑 `pnpm harness agent up`。**这一步我不替你执行** —— 风险要你点头。")
    return 2
  }

  // ③ 写 patch（幂等）
  const how = writePatch()
  console.log(`[agent-runtime] patch ${how}: ${patchFile()}`)

  // ④ 起 dsh
  const { cmd, args } = dshArgs(["--profile", PROFILE, "--no-open", "--port", String(PORT)])
  console.log(`[agent-runtime] 启动: ${cmd} ${args.join(" ")}`)
  const out = fs.openSync(LOG_FILE, "a")
  const child = spawn(cmd, args, { cwd: ROOT, detached: true, stdio: ["ignore", out, out], env: { ...process.env } })
  child.unref()
  fs.writeFileSync(PID_FILE, String(child.pid))

  // ⑤ **轮询验证**：dsh 必须真的 spawn 我们的 MCP server
  for (let i = 0; i < 40; i += 1) {
    const kids = mcpChildPids().filter((c) => c.ppid === child.pid)
    if (kids.length) {
      console.log(`[agent-runtime] ✓ MCP 已连上：dsh(pid ${child.pid}) → mcp-server(pid ${kids[0].pid})`)
      console.log(`[agent-runtime] dsh Web UI: http://127.0.0.1:${PORT}（日志 ${path.basename(LOG_FILE)}）`)
      return 0
    }
    spawnSync("sleep", ["1"])
  }
  console.error(`[agent-runtime] ✗ 30s 内没看到 dsh spawn 我们的 MCP server —— **不要当成已接通**`)
  console.error(`  排查：tail ${path.basename(LOG_FILE)}；确认 patch 内容与 ${MCP_CLIENT_PKG} 是否已挂载`)
  return 1
}

function down() {
  const pid = pidRunning()
  if (!pid) {
    fs.rmSync(PID_FILE, { force: true })
    console.log("[agent-runtime] 未在运行。")
    return 0
  }
  try {
    process.kill(-pid, "SIGKILL")
  } catch {
    try {
      process.kill(pid, "SIGKILL")
    } catch {
      /* 进程可能已退出 */
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
else {
  console.error(`[agent-runtime] 未知子命令: ${sub}（status | up | down）`)
  process.exit(2)
}
