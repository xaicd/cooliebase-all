import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const AUDIT = "scripts/audit-test-vacuity.cjs"
// 探针必须注入到**已跟踪**的测试文件里：审计只扫 `git ls-files`，
// 新写的未跟踪文件对它不可见（这一点我踩过 —— 探针文件永远不被扫描）。
const HOST_FILE = path.join(ROOT, "test", "unit", "i18n.test.ts")

type Report = {
  files: number
  testBlocks: number
  blocksWithoutAssertion: { file: string; line: number }[]
  literalSubjectAssertions: { file: string; line: number }[]
  allWeakBlocks: { file: string; line: number; assertions: number }[]
}

function runAudit(): Report {
  const stdout = execFileSync("node", [AUDIT, "--json"], { cwd: ROOT, encoding: "utf8" })
  return JSON.parse(stdout) as Report
}

/**
 * 测试空转度审计（report-only 工具）。
 *
 * 本审计**刻意不是门禁** —— 这是测量结论：试过的三个启发式在真实代码上全部产生 100% 误报
 * （`toBeDefined()` 计数、全弱断言块、条件内断言），而**误报会逼出无意义豁免**。
 *
 * 因此这一组测试守的不是"测试有没有空转"，而是**审计工具自身的正确性**：
 * 它一旦退化，就会报出假的"零断言块"，让人去"修"根本没问题的用例。
 * 其中两条反向对照锁的正是我实际踩过的两个解析 bug。
 */
describe("测试空转度审计工具", () => {
  function withProbe<T>(block: string, body: (report: Report) => T): T {
    const original = fs.readFileSync(HOST_FILE, "utf8")
    try {
      fs.writeFileSync(HOST_FILE, `${original}\n${block}\n`)
      return body(runAudit())
    } finally {
      fs.writeFileSync(HOST_FILE, original)
      if (fs.readFileSync(HOST_FILE, "utf8") !== original) throw new Error("宿主测试文件未逐字还原")
    }
  }

  const isProbe = (item: { file: string }) => item.file.includes("i18n.test.ts")

  it("正向：能跑通并返回结构完整的报告", () => {
    const report = runAudit()
    expect(report.files).toBeGreaterThan(400)
    expect(report.testBlocks).toBeGreaterThan(500)
    // 本仓实测基线：字面量断言为 0（已被 standards 规则 enforce）
    expect(report.literalSubjectAssertions).toHaveLength(0)
  })

  it("★ 反向 1：真正零断言的测试块 → 必须被报出来", () => {
    withProbe('it("没有任何断言", () => {\n  const unused = 1 + 1\n})', (report) => {
      const flagged = report.blocksWithoutAssertion.filter(isProbe)
      expect(flagged).toHaveLength(1)
    })
  })

  it("★ 反向 2：标题含大括号 / 解构参数且有断言 → **不得**被误报为零断言（解析 bug 1）", () => {
    // 曾经的 bug：块解析先找 `{`，会被标题字符串里的大括号（`{ files }`）或解构参数（`({ page })`）
    // 提前闭合，把块体截成一段标题 —— 实测因此报出 9 个**假**的"零断言块"。
    withProbe(
      'it("wraps payloads as { files } shape", async ({ page }) => {\n  expect(page).toBeUndefined()\n  expect(1).toBeGreaterThan(0)\n})',
      (report) => {
        expect(report.blocksWithoutAssertion.filter(isProbe)).toHaveLength(0)
      },
    )
  })

  it("★ 反向 3：正则 `.test(` 不得被当成测试块（解析 bug 2）", () => {
    // 曾经的 bug：`\b(test)\s*\(` 会匹配到 `/regex/.test(name)`（`\b` 在 `.` 与 `t` 之间成立），
    // 凭空多出一个"测试块"。
    const baseline = runAudit().testBlocks
    withProbe(
      'it("uses regex test()", () => {\n  expect(/^RELEASE_NOTES_.*\\.md$/.test("a.md")).toBe(true)\n})',
      (report) => {
        // 探针只应新增 **1** 个测试块（那个 it）；若 `.test(` 被误判，这里会变成 2。
        expect(report.testBlocks).toBe(baseline + 1)
      },
    )
  })
})
