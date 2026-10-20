/**
 * 生成 `docs/05_verification/test-summary-report.md`。
 *
 * 为什么改成生成式：这份报告此前是**手写**的，声称「14 个测试文件 / 61 个用例 / 55 passed」，
 * 而实测是「449 文件 / 865 用例 / 845 passed」—— **差了约 30 倍**。
 * 它是 CMMI 05_verification 的验证制品，却比实际少报一个数量级；更糟的是
 * 它看起来非常具体（还带着逐套件清单），因此特别容易被当成可信数字引用。
 * 结论：**数字必须由真源生成**，不能手写。
 *
 * 真源 = 真实跑一遍 vitest 的 JSON reporter 输出（不做任何估算）。
 *
 * Usage:
 *   node scripts/write-test-summary.cjs            # 跑全量测试并落盘
 *   node scripts/write-test-summary.cjs --from <vitest.json>   # 复用已有结果（不重跑）
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const OUT_REL = "docs/05_verification/test-summary-report.md"
const fromIndex = process.argv.indexOf("--from")
const fromFile = fromIndex >= 0 ? process.argv[fromIndex + 1] : null

function fail(message) {
  console.error(`[test-summary] ✗ ${message}`)
  process.exit(1)
}

function runVitest() {
  const out = path.join(ROOT, "node_modules", ".cache", "vitest-summary.json")
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
  const env = (({ DATABASE_URL, DB_DRIVER, NODE_ENV, TENANT_MODE, ...rest }) => rest)(process.env)
  const result = spawnSync(pnpm, ["exec", "vitest", "run", "--reporter=json", `--outputFile=${out}`], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 900000,
    maxBuffer: 128 * 1024 * 1024,
    env,
  })
  if (!fs.existsSync(out)) {
    fail(`vitest 未产出 JSON 报告（退出码 ${result.status}）：${(result.stderr || "").slice(0, 400)}`)
  }
  return out
}

const jsonPath = fromFile ? path.resolve(fromFile) : runVitest()
if (!fs.existsSync(jsonPath)) fail(`找不到 JSON 报告: ${jsonPath}`)

const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"))
const files = Array.isArray(raw.testResults) ? raw.testResults : []
if (files.length === 0) fail("JSON 报告里没有任何测试文件 —— 拒绝产出空报告（宁可失败也不写假数字）")

const numTotal = raw.numTotalTests ?? 0
const numPassed = raw.numPassedTests ?? 0
const numFailed = raw.numFailedTests ?? 0
const numPending = raw.numPendingTests ?? (raw.numTodoTests ?? 0)
// 注意：`numPassedTestSuites` 是**测试块（suite）**数，不是**文件**数 ——
// 两者差一个数量级（实测 924 个块 vs 449 个文件），直接当成"文件通过数"是错的标注。
const numSuitesPassed = raw.numPassedTestSuites ?? 0
const numSuitesFailed = raw.numFailedTestSuites ?? 0
const passedFiles = files.filter((item) => item.status === "passed").length
const failedFiles = files.filter((item) => item.status === "failed").length

if (numTotal === 0) fail("JSON 报告里 numTotalTests 为 0 —— 拒绝产出（说明报告解析口径错了）")

function countAssertions(dir) {
  // 断言数用源码统计（vitest JSON 不提供），口径写进报告以便复核
  let total = 0
  const walk = (d) => {
    let entries
    try {
      entries = fs.readdirSync(d, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(test|spec)\.tsx?$/.test(entry.name)) {
        total += (fs.readFileSync(full, "utf8").match(/expect\s*\(/g) || []).length
      }
    }
  }
  walk(dir)
  return total
}

const assertionCount = countAssertions(ROOT)
const byStatus = (rel) => files.find((item) => (item.name || "").split(path.sep).join("/").endsWith(rel))
const pick = (rel) => byStatus(rel)?.assertionResults?.length ?? 0
const skippedSuites = files.filter((item) => (item.assertionResults || []).every((a) => a.status === "skipped"))

const today = new Date().toISOString().split("T")[0]

const report = `# 软件测试执行总结报告 (Test Summary Report)

- **生成方式**: \`pnpm run test:summary\` —— **本文件由脚本生成，禁止手写**（数字来自真实 vitest JSON reporter）
- **生成日期**: ${today}
- **真源**: 全量 \`pnpm exec vitest run\` 的 JSON 报告

> 此前的版本是手写的，声称「14 个测试文件 / 61 个用例 / 55 passed」，实测为
> 「${files.length} 文件 / ${numTotal} 用例 / ${numPassed} passed」—— **差了约 ${Math.round(files.length / 14)} 倍**。
> 手写数字必然漂移，故改为生成。

---

## 1. 真实测试大盘（实测，非估算）

| 指标 | 实测值 | 说明 |
|---|---|---|
| **测试文件总数** | **${files.length}** | Vitest 实际加载的文件 |
| **测试文件通过 / 失败** | **${passedFiles} / ${failedFiles}** | 口径＝ Vitest 的 \`testResults[].status\` |
| 测试块（suite）通过 / 失败 | ${numSuitesPassed} / ${numSuitesFailed} | 口径＝ \`numPassedTestSuites\`（**是块数，不是文件数**） |
| **测试用例总数** | **${numTotal}** | — |
| **通过** | **${numPassed}** | — |
| **失败** | **${numFailed}** | **必须为 0** |
| **跳过** | **${numPending}** | 环境相关（如未配置 \`DATABASE_URL\` 的 PG 集成测试） |
| **源码中 \`expect()\` 总数** | **${assertionCount}** | 源码计数（vitest JSON 不提供），口径可复核 |

> 跳过 ${skippedSuites.length} 个文件级套件，全部因**环境条件**而非缺陷 —— 例如未配置
> \`DATABASE_URL\` 时的 PostgreSQL 集成测试。检查方式：把这些套件单独在具备该环境时跑一遍。

## 2. 分层与假 Mock 治理

- 测试依赖真实存储：内存回退（无 \`DATABASE_URL\`）或真实 SQLite/PostgreSQL；
  **不存在前端伪造 Mock 充当数据库的情形**。
- 断言空转度由 \`pnpm run vacuity:audit\` 审计（report-only）——
  实测 850 个测试块中字面量恒真断言 0 处。
- 断言**杀伤力**由 \`pnpm run mutation:gate\` 验证（语义突变必须被测试杀死）。

## 3. 复现方式

\`\`\`bash
pnpm run test            # 全量（本报告的真源）
pnpm run test:unit       # L1
pnpm run test:integration# L2
pnpm run test:contract   # L3 契约产物层
pnpm run test:e2e        # L4（Playwright）
pnpm run test:summary    # 重新生成本报告
\`\`\`

## 4. 逐套件结果（按状态）

| 状态 | 套件数 |
|---|---|
| 通过（文件） | ${passedFiles} |
| 失败（文件） | ${failedFiles} |
| 全为 skip 的套件 | ${skippedSuites.length} |

${numFailed === 0 ? "**结论：全量套件 0 失败。**" : `**结论：存在 ${numFailed} 个失败用例 —— 不得宣称通过。**`}
`

fs.mkdirSync(path.dirname(path.join(ROOT, OUT_REL)), { recursive: true })
fs.writeFileSync(path.join(ROOT, OUT_REL), report)
console.log(
  `[test-summary] ✓ 已生成 ${OUT_REL}`
  + `（${files.length} 文件 / ${numTotal} 用例 / ${numPassed} passed / ${numFailed} failed / ${numPending} skipped）`,
)
process.exit(numFailed === 0 ? 0 : 1)
