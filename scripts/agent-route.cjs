#!/usr/bin/env node
/**
 * 需求分诊：判断一条需求**要不要走规格（spec）流程**，并给出下一步确切命令。
 *
 * 为什么需要：此前入口文件写的是「所有 feature/bugfix/enhancement/refactor 都归规格管」——
 * 等于**全都需要**，也等于**没判断**。结果是两头都失控：小改被流程拖住，大改靠人自觉。
 * 这里把"是否需要"变成一个**确定性的仓内命令**：同一段输入永远得到同一个结论，
 * 并且**说明命中了哪几条规则**，可溯源、可反驳。
 *
 * 判定规则真源：`scripts/lib/spec-necessity-rules.cjs`（带理由、可审阅、可修改）。
 *
 * 顺带兑现 AGENTS §15：把用户原始输入追加到 `docs/features/sprint-prod/{MMDD}.md`
 * （此前只有条文、**没有任何强制**）。
 *
 * 用法:
 *   node scripts/agent-route.cjs "<需求原文>"
 *   node scripts/agent-route.cjs --json "<需求原文>"     # 只输出机器可读结论
 *   node scripts/agent-route.cjs --no-log "<需求原文>"   # 不写 §15 日志（自测用）
 *
 * 退出码：0 = 已判定（**不是**"无需规格"的意思）；2 = 用法错误。
 * 判定结论请看输出里的 `SPEC_REQUIRED` / `DIRECT_OK`（或 `--json` 的 `verdict`）。
 */
const fs = require("node:fs")
const path = require("node:path")
const crypto = require("node:crypto")

const { SPEC_SIGNALS, DIRECT_SIGNALS, TYPE_SIGNALS } = require("./lib/spec-necessity-rules.cjs")

const ROOT = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const json = argv.includes("--json")
const noLog = argv.includes("--no-log")
const requirement = argv.filter((item) => !item.startsWith("--")).join(" ").trim()

if (!requirement) {
  console.error('用法: node scripts/agent-route.cjs "<需求原文>"   （可加 --json / --no-log）')
  process.exit(2)
}

/** 命中判定：返回命中的信号列表（带 reason） */
function match(text, signals) {
  const hit = []
  for (const signal of signals) {
    if (signal.patterns.some((pattern) => pattern.test(text))) {
      hit.push(signal)
    }
  }
  return hit
}

const specHits = match(requirement, SPEC_SIGNALS)
const directHits = match(requirement, DIRECT_SIGNALS)
const typeHits = match(requirement, TYPE_SIGNALS)

// 判定：命中任一 SPEC 信号 → 需要规格；两边都不命中 → **宁严勿宽**，也要规格。
const verdict = specHits.length > 0 || directHits.length === 0 ? "SPEC_REQUIRED" : "DIRECT_OK"
const specType = typeHits[0]?.type ?? "feature"

/** 归一化一个可用的规格标识名（kebab-case，取需求里的中文/英文片段） */
function suggestName() {
  const words = requirement
    .replace(/[，。！？、；：""''（）()【】\[\]，,.!?]/g, " ")
    .split(/\s+/)
    .filter((word) => /^[A-Za-z0-9-]{3,}$/.test(word))
  if (words.length > 0) return words.slice(0, 3).join("-").toLowerCase()
  return "new-spec"
}

const record = {
  at: new Date().toISOString(),
  verdict,
  specType,
  requirement,
  requirementHash: crypto.createHash("sha256").update(requirement).digest("hex").slice(0, 16),
  matched: specHits.map((hit) => hit.id),
  exempted: directHits.map((hit) => hit.id),
  rulesVersion: "scripts/lib/spec-necessity-rules.cjs",
}

// ── §15：把用户原始输入追加进当日记录（此前无任何强制） ────────────────────────
let loggedAt = null
if (!noLog) {
  const now = new Date()
  const stamp = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  // 日志目录可被环境变量覆盖：测试用临时目录，避免把测试噪声灌进真实的 §15 记录。
  const logDir = process.env.AGENT_ROUTE_LOG_DIR ?? path.join(ROOT, "docs", "features", "sprint-prod")
  const file = path.join(logDir, `${stamp}.md`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""
  const nextIndex = (existing.match(/^###\s+(\d+)\./gm) ?? []).length + 1
  const block =
    `\n### ${nextIndex}. ${now.toISOString()}\n\n` +
    `**需求原文**：${requirement}\n\n` +
    `**分诊结论**：\`${verdict}\`（类型 \`${specType}\`；命中 \`${record.matched.join(", ") || "无"}\`；` +
    `豁免 \`${record.exempted.join(", ") || "无"}\`）\n`
  fs.appendFileSync(file, block)
  loggedAt = file.startsWith(ROOT) ? path.relative(ROOT, file) : file
  record.loggedAt = loggedAt
  record.logIndex = nextIndex
}

// ── 机器可读记录：供 hooks / 门禁核对"这条需求跑过分诊没有" ────────────────────
const artifact = process.env.AGENT_ROUTE_ARTIFACT ?? path.join(ROOT, "docs", "architecture", "artifacts", "agent-route-last.json")
fs.mkdirSync(path.dirname(artifact), { recursive: true })
fs.writeFileSync(artifact, `${JSON.stringify(record, null, 2)}\n`)

if (json) {
  console.log(JSON.stringify(record, null, 2))
  process.exit(0)
}

console.log(`\n[agent-route] 分诊结论: ${verdict}${verdict === "SPEC_REQUIRED" ? "（需要规格）" : "（可直接改）"}`)
console.log(`  规格类型: ${specType}`)
console.log(`  需求: ${requirement}`)
if (specHits.length > 0) {
  console.log("  命中「需要规格」的规则:")
  for (const hit of specHits) console.log(`    ✓ [${hit.id}] ${hit.kind} —— ${hit.reason}`)
}
if (directHits.length > 0) {
  console.log("  命中「可豁免」的规则（不因自身要求规格）:")
  for (const hit of directHits) console.log(`    · [${hit.id}] ${hit.kind} —— ${hit.reason}`)
}
if (specHits.length === 0 && directHits.length === 0) {
  console.log("  未命中任何规则 → **宁严勿宽**，按需要规格处理（判不准时多走一步流程，优于漏掉一次）")
}
if (loggedAt) console.log(`\n  §15 记录: ${loggedAt}（第 ${record.logIndex} 条）`)
console.log(`  机器可读: ${artifact.startsWith(ROOT) ? path.relative(ROOT, artifact) : artifact}`)

console.log("\n  下一步:")
if (verdict === "SPEC_REQUIRED") {
  console.log(`    npm run speckit:new -- --name ${suggestName()} --domain <域> --type ${specType} --title "<标题>"`)
  console.log("    然后编辑 brief.json → npm run speckit:build -- --name <名> → npm run speckit:check -- --spec <名>")
} else {
  console.log("    直接改即可；改完仍须 `npm run check` 全绿。若过程中发现影响面超出预期，回来重跑本命令。")
}
console.log("")
