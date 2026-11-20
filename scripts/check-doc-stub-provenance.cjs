/**
 * docs:stub:provenance:check —— 阶段产物文档的「溯源 + 骨架超期」门禁（2026-11-20 v2 定位修复②）。
 *
 * 定位（v2 文档七层表）：docs/02_requirements|03_design|07_release 顶层的 *.md 是**交付阶段产物**。
 * 两条硬规矩：
 *  1. 溯源 —— 每份产物必须首部带 `> 上游真源: <仓内路径>`，能回答「我响应了哪条真源」；
 *     指针必须存在且不得自指（模板生成的 stub 不许再匿名躺平）。
 *  2. 骨架超期 —— 文件 <15 行（骨架）且出生提交超过 14 天 = 红线（骨架不算完成：
 *     要么填真内容，要么删除该产物；不许永久躺平假占位）。
 *
 * 用法：
 *   node scripts/check-doc-stub-provenance.cjs                # 检查，违规即 exit 1
 *   node scripts/check-doc-stub-provenance.cjs --root <dir>   # 测试注入根目录
 */
const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

const argv = process.argv.slice(2)
const rootIdx = argv.indexOf("--root")
const ROOT = rootIdx >= 0 ? path.resolve(argv[rootIdx + 1]) : path.resolve(__dirname, "..")
const STALE_DAYS = 14
const SKELETON_MAX_LINES = 15
const STAGE_DOC_DIRS = ["docs/02_requirements", "docs/03_design", "docs/07_release"]

function collectStageDocs(dirRel) {
  const abs = path.join(ROOT, dirRel)
  if (!fs.existsSync(abs)) return []
  return fs
    .readdirSync(abs)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.posix.join(dirRel, name))
}

function birthAgeDays(rel) {
  try {
    const out = execFileSync("git", ["log", "--diff-filter=A", "--format=%ct", "-1", "--", rel], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim()
    if (!out) return 0
    return (Date.now() / 1000 - Number(out)) / 86400
  } catch {
    return 0 // 非 git 环境（沙盘等）不做超期判定，只查溯源
  }
}

function targetExists(rel) {
  if (!rel || rel.includes("://")) return false
  const clean = rel.replace(/[)】>。，；]*$/, "")
  if (path.isAbsolute(clean)) return false
  return fs.existsSync(path.join(ROOT, clean))
}

const violations = []
const stageDocs = STAGE_DOC_DIRS.flatMap(collectStageDocs)

if (stageDocs.length === 0) {
  console.log("[doc-stub-provenance] PASS: 无阶段产物文档（派生工程早期属正常）")
  process.exit(0)
}

for (const rel of stageDocs) {
  const text = fs.readFileSync(path.join(ROOT, rel), "utf8")
  if (rel === text.match(/上游真源[:：]\s*(\S+)/)?.[1]) {
    violations.push(`${rel}: 上游真源指向自己（自指无效）`)
    continue
  }
  const m = text.match(/^>\s*上游真源[:：]\s*(\S+)/m)
  if (!m) {
    violations.push(`${rel}: 缺「> 上游真源: <仓内路径>」溯源头 —— 每份产物必须能回答它响应了哪条真源`)
    continue
  }
  if (!targetExists(m[1])) {
    violations.push(`${rel}: 上游真源 "${m[1]}" 在仓内不存在（编造出处）`)
  }
  const lineCount = text.split("\n").length
  const age = birthAgeDays(rel)
  if (lineCount < SKELETON_MAX_LINES && age > STALE_DAYS) {
    violations.push(
      `${rel}: 骨架超期（${lineCount} 行, 出生 ${Math.round(age)} 天）—— 骨架不算完成：填真内容或删除`,
    )
  }
}

if (violations.length > 0) {
  console.error(`[doc-stub-provenance] ✗ ${violations.length} 处违规：`)
  for (const v of violations) console.error(`  · ${v}`)
  process.exit(1)
}

console.log(`[doc-stub-provenance] PASS: ${stageDocs.length} 份阶段产物全部有溯源且无骨架超期`)
