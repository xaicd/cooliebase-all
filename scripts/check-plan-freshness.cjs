#!/usr/bin/env node
/**
 * WBS 时效性门禁：**能力面变了，计划就必须跟随**。
 *
 * 为什么需要：这一轮做了 32 个提交，而 `project-plan.md` 只在被追问时才更新一次 ——
 * WBS 没有像 `check` 那样的触发点，全靠人记得。结果是"计划"与"事实"长期脱节
 * （快照里写着 436/816 测试、10 道门禁，实际早已 465/938、20 道）。
 *
 * 设计上刻意分两档，避免"每次改代码都要改计划"这种会被直接绕过的规则：
 *
 *   **硬失败**（能力面变了，计划必须跟随）：
 *     · 新增 / 删除 npm script（对外可调用面）
 *     · `consumptionSurface.gates` 集合变化（质量门禁数变了）
 *     · `domain-catalog.json` 的域集合变化（新增/删除了域）
 *
 *   **软提示**（不阻断）：
 *     · 触及 `packages/**` 但没有同时改计划 —— 只是提醒"确认一下是否该记一笔"
 *
 * 用法:
 *   node scripts/check-plan-freshness.cjs              # 看暂存区（pre-commit 用）
 *   node scripts/check-plan-freshness.cjs --range origin/main...HEAD
 *   node scripts/check-plan-freshness.cjs --json
 *
 * 退出码：0 = 通过（或仅软提示）；1 = 硬失败；2 = 用法/环境错误。
 */
const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

// ROOT 可被环境变量覆盖：测试用临时 git 仓库，避免污染真实索引。
const ROOT = process.env.PLAN_FRESHNESS_ROOT || path.resolve(__dirname, "..")
const PLAN = "docs/01_management/project-plan.md"
const argv = process.argv.slice(2)
const asJson = argv.includes("--json")
const rangeIndex = argv.indexOf("--range")
const range = rangeIndex >= 0 ? argv[rangeIndex + 1] : null

function git(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" })
}

/** 变更文件集合 */
function changedFiles() {
  if (range) {
    const result = git(["diff", "--name-only", range])
    if (result.status !== 0) {
      console.error(`[plan-freshness] 无法解析范围 ${range}: ${(result.stderr || "").trim()}`)
      process.exit(2)
    }
    return new Set(result.stdout.split("\n").filter(Boolean))
  }
  const result = git(["diff", "--cached", "--name-only"])
  if (result.status !== 0) {
    console.error(`[plan-freshness] 无法读取暂存区: ${(result.stderr || "").trim()}`)
    process.exit(2)
  }
  return new Set(result.stdout.split("\n").filter(Boolean))
}

/** 读取"变更后"与"HEAD"两个版本的某个 JSON 文件 */
function readJsonAt(content, label) {
  if (!content) return null
  try {
    return JSON.parse(content)
  } catch (error) {
    console.error(`[plan-freshness] ${label} 不是合法 JSON: ${String(error.message)}`)
    return null
  }
}

function stagedOrWorking(rel) {
  // 暂存区优先（pre-commit 场景），回退到工作区
  const staged = git(["show", `:${rel}`])
  if (staged.status === 0) return staged.stdout
  const working = path.join(ROOT, rel)
  return fs.existsSync(working) ? fs.readFileSync(working, "utf8") : null
}

function headVersion(rel) {
  const result = git(["show", `HEAD:${rel}`])
  return result.status === 0 ? result.stdout : null
}

function diffSets(before, after) {
  const a = new Set(before)
  const b = new Set(after)
  return {
    added: [...b].filter((item) => !a.has(item)),
    removed: [...a].filter((item) => !b.has(item)),
  }
}

const files = changedFiles()
const hard = []
const soft = []

// ① npm scripts 集合
{
  const before = readJsonAt(headVersion("package.json"), "HEAD:package.json")
  const after = readJsonAt(stagedOrWorking("package.json"), "package.json")
  if (before && after) {
    const delta = diffSets(Object.keys(before.scripts || {}), Object.keys(after.scripts || {}))
    if (delta.added.length > 0) hard.push(`新增 npm script: ${delta.added.join(", ")}`)
    if (delta.removed.length > 0) hard.push(`删除 npm script: ${delta.removed.join(", ")}`)
  }
}

// ② 质量门禁集合
{
  const rel = "packages/shared/contract/compat-manifest.json"
  const before = readJsonAt(headVersion(rel), `HEAD:${rel}`)
  const after = readJsonAt(stagedOrWorking(rel), rel)
  if (before && after) {
    const delta = diffSets(before.consumptionSurface?.gates || [], after.consumptionSurface?.gates || [])
    if (delta.added.length > 0) hard.push(`新增门禁: ${delta.added.join(", ")}`)
    if (delta.removed.length > 0) hard.push(`删除门禁: ${delta.removed.join(", ")}`)
  }
}

// ③ 域集合
{
  const rel = "packages/shared/backend/constants/domain-catalog.json"
  const before = readJsonAt(headVersion(rel), `HEAD:${rel}`)
  const after = readJsonAt(stagedOrWorking(rel), rel)
  const ids = (catalog) => (catalog?.domains || []).map((domain) => domain.id).sort()
  if (before && after) {
    const delta = diffSets(ids(before), ids(after))
    if (delta.added.length > 0) hard.push(`新增域: ${delta.added.join(", ")}`)
    if (delta.removed.length > 0) hard.push(`删除域: ${delta.removed.join(", ")}`)
  }
}

// ④ 软提示：触及 packages/** 但没改计划
const touchedPackages = [...files].filter((file) => file.startsWith("packages/"))
if (touchedPackages.length > 0 && !files.has(PLAN)) {
  soft.push(`触及 packages/ 下 ${touchedPackages.length} 个文件，但本次没更新 ${PLAN}`)
}

const planUpdated = files.has(PLAN)
const passed = hard.length === 0 || planUpdated

if (asJson) {
  console.log(JSON.stringify({ passed, planUpdated, hard, soft, changedFiles: [...files] }, null, 2))
  process.exit(passed ? 0 : 1)
}

if (passed) {
  if (soft.length > 0) {
    console.log("[plan-freshness] 提示（不阻断）：")
    for (const item of soft) console.log(`  · ${item}`)
    console.log("  若确实属于「计划级」变化，请补 §4 WBS 或 §5 进展快照。")
  }
  process.exit(0)
}

console.error("[plan-freshness] FAIL：能力面变了，但本次没有更新计划。")
for (const item of hard) console.error(`  · ${item}`)
console.error(`\n修法：更新 ${PLAN} 的 §4 WBS（对应工作流）或 §5「当前进展快照」，`)
console.error("      让「计划」与「事实」在同一次提交里对齐。")
console.error("      确认本次不该记入计划时：AGENT_ROUTE_SKIP=1 git commit …（并说明理由）。")
process.exit(1)
