/**
 * 测试空转度审计（**仅报告，永不失败**）。
 *
 * 为什么是 report 而不是 gate —— 这是实测结论，不是偏好：
 * 当初的假设是"仓里存在大量结构性强转断言"。**测量推翻了它**（见下方基线数字），
 * 而且我试过的三个启发式**全部产生 100% 误报**：
 *
 *   1. `toBeDefined()` 计数 → 1381 处。但 `expect(result.id).toBeDefined()` 不是空转
 *      （值确实可能是 undefined）；把它当违规会产生海量误报，而**误报会逼出无意义豁免**。
 *   2. "一个测试块里全部断言都是弱断言" → 命中 2 处，人工判读**两处都是对的**：
 *      · `plugin-registry` 的 `not.toBeNull()` 正是该用例要断言的（"记录还在"）；
 *      · `i18n` 的 `toBeTruthy()` 在循环里跑 12 键 × 4 语言 = 48 次非空校验。
 *   3. "条件内的断言" → 27 处，全部是合法模式：`if (!hasRealDatabase()) return` 提前返回、
 *      判别联合收窄、`if (rejected.success) throw new Error(...)`。
 *
 * 所以本工具**只做测量**：把真实分布打出来，供人判断趋势；它绝不阻断构建。
 * 想让它变成门禁，前提是**先有一类真正零误报的模式** —— 目前没有。
 *
 * Usage:
 *   node scripts/audit-test-vacuity.cjs            # 人读报告
 *   node scripts/audit-test-vacuity.cjs --json     # 机器可读
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const asJson = process.argv.includes("--json")

/** 弱断言：**不代表违规**，只是"单独使用时不构成有效证据"。 */
const WEAK_PATTERN = /\.(toBeDefined|toBeTruthy|toBeFalsy)\s*\(|\.not\.toBeNull\s*\(/

/** 结构上恒真/恒假的字面量断言 —— 这类**确实**没有价值（已被 standards 规则 enforce）。 */
const LITERAL_PATTERN =
  /expect\(\s*(\{[^}]*\}|\[[^\]]*\]|"[^"]*"|'[^']*'|`[^`]*`|\d+|true|false)\s*\)\s*\.(toBeDefined|toBeTruthy|toBeFalsy)/

function trackedTestFiles() {
  const result = spawnSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  if (result.status !== 0) {
    console.error("[vacuity] ✗ 无法列出 git 跟踪文件")
    process.exit(1)
  }
  return (result.stdout || "").split("\n").filter((f) => f && /\.(test|spec)\.tsx?$/.test(f))
}

/** 取出 `it(...)` / `test(...)` 的块体（花括号配平）。 */
function testBlocks(text) {
  const blocks = []
  // 必须**行首锚定**（`^[ \t]*` + `m`）。理由是两个实测踩到的坑：
  //   · `\b(test)\s*\(` 会匹配 `/regex/.test(name)` 里的 `.test(`（`\b` 在 `.` 与 `t` 之间成立）；
  //   · 只看 `test(` 还会匹配**标题字符串内部**的 `test()`（如 `it("... test() ...")`）。
  // 两者都会凭空造出"测试块"，进而报出**假的"零断言块"**，让人去"修"本来没问题的用例。
  // 测试声明按惯例都在行首，行首锚定即可同时排除这两种情况。
  const re = /^[ \t]*(it|test)(\.each\s*\([^)]*\))?\s*\(/gm
  let match
  while ((match = re.exec(text)) !== null) {
    // 必须**先跳到 `=>` 再找函数体 `{`**：否则会被
    //   · 标题字符串里的大括号（如 `it("... { files } payloads", ...)`）
    //   · 解构参数（如 `async ({ page }) => {`）
    // 提前闭合，把块体截成一段标题 —— 实测这样会报出 9 个**假**的"零断言块"。
    const arrow = text.indexOf("=>", match.index)
    const start = text.indexOf("{", arrow >= 0 ? arrow : match.index)
    if (start < 0) continue
    let depth = 0
    let end = -1
    for (let i = start; i < text.length; i += 1) {
      if (text[i] === "{") depth += 1
      else if (text[i] === "}") {
        depth -= 1
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end < 0) continue
    blocks.push({ line: text.slice(0, match.index).split("\n").length, body: text.slice(start, end) })
  }
  return blocks
}

const files = trackedTestFiles()
const report = {
  kind: "test-vacuity-audit",
  note: "report-only：本工具永不失败。弱断言单独出现时通常是**正确**的（见文件头说明）。",
  files: files.length,
  assertions: 0,
  weakAssertions: { toBeDefined: 0, toBeTruthy: 0, toBeFalsy: 0, notToBeNull: 0 },
  testBlocks: 0,
  blocksWithoutAssertion: [],
  literalSubjectAssertions: [],
  allWeakBlocks: [],
}

for (const rel of files) {
  let text
  try {
    text = fs.readFileSync(path.join(ROOT, rel), "utf8")
  } catch {
    continue
  }
  report.assertions += (text.match(/expect\s*\(/g) || []).length
  report.weakAssertions.toBeDefined += (text.match(/\.toBeDefined\s*\(/g) || []).length
  report.weakAssertions.toBeTruthy += (text.match(/\.toBeTruthy\s*\(/g) || []).length
  report.weakAssertions.toBeFalsy += (text.match(/\.toBeFalsy\s*\(/g) || []).length
  report.weakAssertions.notToBeNull += (text.match(/\.not\.toBeNull\s*\(/g) || []).length

  text.split("\n").forEach((line, index) => {
    if (LITERAL_PATTERN.test(line)) {
      report.literalSubjectAssertions.push({ file: rel, line: index + 1, text: line.trim().slice(0, 120) })
    }
  })

  for (const block of testBlocks(text)) {
    report.testBlocks += 1
    const assertions = (block.body.match(/expect\s*\(/g) || []).length
    if (assertions === 0) {
      report.blocksWithoutAssertion.push({ file: rel, line: block.line })
      continue
    }
    const weak = (block.body.match(new RegExp(WEAK_PATTERN.source, "g")) || []).length
    if (weak === assertions) {
      report.allWeakBlocks.push({ file: rel, line: block.line, assertions, weak })
    }
  }
}

if (asJson) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(0)
}

const weakTotal =
  report.weakAssertions.toBeDefined
  + report.weakAssertions.toBeTruthy
  + report.weakAssertions.toBeFalsy
  + report.weakAssertions.notToBeNull

console.log("[vacuity] 测试空转度审计（仅报告，永不失败）")
console.log(`  测试文件 ${report.files} · 断言 ${report.assertions} · 测试块 ${report.testBlocks}`)
console.log(`  弱断言合计 ${weakTotal}（toBeDefined ${report.weakAssertions.toBeDefined} / toBeTruthy ${report.weakAssertions.toBeTruthy} / toBeFalsy ${report.weakAssertions.toBeFalsy} / not.toBeNull ${report.weakAssertions.notToBeNull}）`)
console.log("  注意：弱断言**单独出现通常是正确的**，不要据此判定违规。")
console.log("")

console.log(`  ℹ 无字面 expect() 的测试块: ${report.blocksWithoutAssertion.length}（**需人工判读**：经助手断言的（如 expectValidation()、把回调传给辅助函数的）是合法的）`)
for (const item of report.blocksWithoutAssertion.slice(0, 10)) console.log(`      ${item.file}:${item.line}`)

console.log(`  ⚠ 对字面量断言 defined/truthy: ${report.literalSubjectAssertions.length}（应为 0 —— 已被 standards 规则 enforce）`)
for (const item of report.literalSubjectAssertions.slice(0, 10)) console.log(`      ${item.file}:${item.line}  ${item.text}`)

console.log(`  ℹ 全部断言皆为弱的测试块: ${report.allWeakBlocks.length}（**需人工判读**，多数是正确写法）`)
for (const item of report.allWeakBlocks.slice(0, 10)) {
  console.log(`      ${item.file}:${item.line}  ${item.assertions} 条断言全弱`)
}
console.log("")
console.log("[vacuity] 完成（report-only：退出码恒为 0）")
process.exit(0)
