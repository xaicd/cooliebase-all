#!/usr/bin/env node
/**
 * Harness 接线健康检查（**金丝雀**）：证明各家 CLI **真的执行了**我们的 hook，
 * 而不只是"配置文件合法"。
 *
 * 为什么需要：配置文件合法 ≠ 生效。CLI 完全可能因为
 *   · hooks schema 变更、· 首次使用未 allowlist、· 工作目录不同而找不到脚本、
 *   · matcher 拼错、· 根本没装这家 CLI
 * 而**静默不执行**。这种情况下 `npm run check` 全绿，但守卫形同虚设。
 *
 * 机制：`.agents/hooks/spec-gate.sh` 每次被调用都会往 `harness-heartbeat.jsonl` 追加一行
 * （kind / decision / protocol / file）。本脚本读它并与各家的配置交叉核对：
 *
 *   · 配了 + 有心跳            → ✅ 真的生效
 *   · 配了 + 没有心跳          → ⚠️ 可疑：配置在但从未触发（多半没加载 / 没 allowlist）
 *   · 没配 + 有心跳            → 正常（git 兜底等场景）
 *
 * 用法:
 *   node scripts/harness-health.cjs                     # 报告（不失败）
 *   node scripts/harness-health.cjs --require cmd,agy   # 指定家必须近期有心跳，否则 exit 1
 *   node scripts/harness-health.cjs --window 120        # 窗口（分钟），默认 1440
 *   node scripts/harness-health.cjs --trim              # 心跳文件压到最近 500 行
 */
const fs = require("node:fs")
const { spawnSync } = require("node:child_process")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : fallback
}

const HEARTBEAT = process.env.AGENT_ROUTE_HEARTBEAT ?? path.join(ROOT, "docs", "architecture", "artifacts", "harness-heartbeat.jsonl")
const windowMinutes = Number(arg("--window", "1440"))
const requireKinds = (arg("--require", "") || "").split(",").map((s) => s.trim()).filter(Boolean)
const trim = argv.includes("--trim") || !argv.includes("--no-trim") // 默认自动收敛

/** 各家配置在哪（用于交叉核对"配了但没跑过"） */
const CONFIGS = [
  ["cmd", ".commandcode/settings.json"],
  ["claude", ".claude/settings.json"],
  ["agy", ".agents/hooks.json"],
]

function configured(kind) {
  // Hermes 的 hooks **只能**配在用户级 `~/.hermes/config.yaml`（不在本仓）。
  // 判据：该文件里是否出现本仓安装器写入的标记块。
  if (kind === "hermes") {
    const file = path.join(require("node:os").homedir(), ".hermes", "config.yaml")
    if (!fs.existsSync(file)) return null
    return fs.readFileSync(file, "utf8").includes("cooliebase-all spec-gate") ? "~/.hermes/config.yaml" : null
  }
  const entry = CONFIGS.find(([name]) => name === kind)
  if (!entry) return null
  return fs.existsSync(path.join(ROOT, entry[1])) ? entry[1] : null
}

function loadHeartbeat() {
  if (!fs.existsSync(HEARTBEAT)) return []
  const lines = fs.readFileSync(HEARTBEAT, "utf8").split("\n").filter(Boolean)
  const events = []
  for (const line of lines) {
    try {
      const event = JSON.parse(line)
      if (event && event.at) events.push(event)
    } catch {
      /* 坏行忽略 */
    }
  }
  return events
}

const events = loadHeartbeat()
const now = Date.now()
const within = (event) => now - new Date(event.at).getTime() <= windowMinutes * 60 * 1000

const stats = new Map()
for (const event of events) {
  const record = stats.get(event.kind) ?? { total: 0, denies: 0, lastAt: null, lastDenyAt: null }
  record.total += 1
  if (event.decision === "deny") {
    record.denies += 1
    record.lastDenyAt = event.at
  }
  if (!record.lastAt || event.at > record.lastAt) record.lastAt = event.at
  stats.set(event.kind, record)
}

const humanAge = (iso) => {
  if (!iso) return "从未"
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} 小时前`
  return `${Math.round(hours / 24)} 天前`
}

console.log(`[harness-health] 窗口 ${windowMinutes} 分钟 · 心跳文件 ${path.relative(ROOT, HEARTBEAT) || HEARTBEAT}`)
if (events.length === 0) {
  console.log("  （心跳为空 —— 要么还没在任何 CLI 里触发过 hook，要么 hook 根本没被加载）")
}

const kinds = ["cmd", "claude", "hermes", "agy", "unknown"]
let suspicious = 0
for (const kind of kinds) {
  const config = configured(kind)
  const record = stats.get(kind)
  const active = record && within({ at: record.lastAt })
  const mark = !config ? "—" : active ? "✅" : "⚠️"
  if (config && !active) suspicious += 1
  const detail = record
    ? `近窗口 ${active ? "有" : "无"}心跳 · 总计 ${record.total} · 拦截 ${record.denies} · 最后 ${humanAge(record.lastAt)}`
    : "无心跳"
  const note = !config ? "（无配置文件，靠文本层 + git 兜底）" : active ? "" : "（配置在但从未触发 —— 多半没加载 / 没 allowlist）"
  console.log(`  ${mark} ${kind.padEnd(8)} ${detail}${note}`)
}

const KEEP_LINES = 2000
// ── git 兜底是否启用（`core.hooksPath` 是本机配置，不可提交 → 新克隆默认没有）────────
{
  const hooksPath = spawnSync("git", ["config", "--local", "--get", "core.hooksPath"], {
    cwd: ROOT,
    encoding: "utf8",
  })
  const value = hooksPath.status === 0 ? hooksPath.stdout.trim() : ""
  const preCommit = path.join(ROOT, ".githooks", "pre-commit")
  const executable = fs.existsSync(preCommit) && (fs.statSync(preCommit).mode & 0o111) !== 0
  const ok = value === ".githooks" && executable
  console.log(
    `  ${ok ? "✅" : "⚠️"} git 兜底    core.hooksPath=${value || "（未设置）"} · pre-commit ${executable ? "可执行" : "不可执行"}` +
      (ok ? "" : " → 跑 `npm run setup:hooks`（或重新 pnpm install）"),
  )
}

if (trim && fs.existsSync(HEARTBEAT)) {
  const lines = fs.readFileSync(HEARTBEAT, "utf8").split("\n").filter(Boolean)
  if (lines.length > KEEP_LINES) {
    fs.writeFileSync(HEARTBEAT, `${lines.slice(-KEEP_LINES).join("\n")}\n`)
    console.log(`  [trim] 心跳 ${lines.length} → ${KEEP_LINES} 行（默认自动收敛，--no-trim 可关闭）`)
  }
}

if (requireKinds.length > 0) {
  const missing = requireKinds.filter((kind) => {
    const record = stats.get(kind)
    return !record || !within({ at: record.lastAt })
  })
  if (missing.length > 0) {
    console.error(
      `\n[harness-health] FAIL: 这些 CLIs 在最近 ${windowMinutes} 分钟内**没有心跳** —— ${missing.join(", ")}\n` +
        "  请在该 CLI 里触发任意一次写操作，然后重跑本命令。\n" +
        "  常见原因：hooks schema 变更 / 首次使用未 allowlist / 工作目录不同导致脚本找不到 / matcher 拼错。\n",
    )
    process.exit(1)
  }
  console.log(`\n[harness-health] PASS: ${requireKinds.join(", ")} 均在最近 ${windowMinutes} 分钟内有心跳`)
} else if (suspicious > 0) {
  console.log(`\n[harness-health] 提示：${suspicious} 家配置存在但近窗口无心跳 —— 用 --require 可让这种情况直接失败`)
}
