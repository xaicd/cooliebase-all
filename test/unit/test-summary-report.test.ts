import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const REPORT = path.join(ROOT, "docs", "05_verification", "test-summary-report.md")

/** 从报告正文里取出"测试文件总数"。 */
function headlineFileCount(reportText: string): number | null {
  const match = reportText.match(/\|\s*\*\*测试文件总数\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|/)
  return match ? Number(match[1]) : null
}

/** 全仓被 git 跟踪的 `*.test.ts` 文件数 —— 与 vitest 的 `include` 口径一致。 */
function trackedTestFileCount(): number {
  const out = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
  return out.split("\n").filter((file) => /\.test\.ts$/.test(file)).length
}

/**
 * 测试总结报告的漂移守卫。
 *
 * 这份报告此前是**手写**的，声称「14 个测试文件 / 61 个用例 / 55 passed」，
 * 而真实是「449 / 865 / 845」—— 差了约 **30 倍**。它还是 CMMI 05_verification 的验证制品，
 * 数字离谱却带着逐套件清单，特别容易被当成可信来源。
 *
 * 改为由 `npm run test:summary` 生成后，这里只守**最容易漂移又最便宜核对的那一个数字**：
 * 文件总数（用例数需要跑一遍套件，成本高，交给生成流程保证）。
 */
describe("测试总结报告（生成物）漂移守卫", () => {
  it("正向：报告声明为生成物，且文件总数与仓库真实一致", () => {
    const text = fs.readFileSync(REPORT, "utf8")
    expect(text).toMatch(/本文件由脚本生成，禁止手写/)
    expect(text).toMatch(/npm run test:summary/)

    const declared = headlineFileCount(text)
    expect(declared, "报告里找不到「测试文件总数」").not.toBeNull()

    // 为什么不要求**严格相等**：本报告是**发布期制品**（AGENTS §10.3 要求发版前重新生成），
    // 不是必须随每次提交保持最新。严格相等会把"每加一个测试就得重跑 200s 全量套件"变成硬门槛，
    // 而这种门槛的结局是被绕过或塞满豁免 —— 本仓明确反对。
    // 于是这里守的是**真实发生过的那类事故**：手写版少报了约 88%（55 vs 449）。
    // 口径对齐：vitest include 是 `*.test.ts`，不含 Playwright 的 `*.spec.ts`。
    const actual = trackedTestFileCount()
    expect(
      declared! >= Math.floor(actual * 0.8),
      `报告声称 ${declared} 个测试文件，仓库实际 ${actual} —— 陈旧度超过 20%。`
        + `请运行 \`npm run test:summary\` 重新生成（该报告是生成物，禁止手写）。`,
    ).toBe(true)
    expect(
      declared! <= actual,
      `报告声称 ${declared} 个测试文件，多于实际 ${actual} —— 数字被改大了，报告不可信。`,
    ).toBe(true)
  })

  it("★ 反向 1：数字被改小到离谱（手写事故形态）→ 守卫必须发现", () => {
    // 这正是真实发生过的事故：手写版写「14 个文件」，实测 449 —— 少报约 88%。
    const text = fs.readFileSync(REPORT, "utf8")
    const tampered = text.replace(/(\|\s*\*\*测试文件总数\*\*\s*\|\s*\*\*)\d+(\*\*\s*\|)/, "$114$2")
    const actual = trackedTestFileCount()
    expect(headlineFileCount(tampered)).toBe(14)
    expect(14 >= Math.floor(actual * 0.8)).toBe(false)
  })

  it("★ 反向 3：数字被改**大**（报告比现实还多）→ 必须发现", () => {
    const text = fs.readFileSync(REPORT, "utf8")
    const tampered = text.replace(/(\|\s*\*\*测试文件总数\*\*\s*\|\s*\*\*)\d+(\*\*\s*\|)/, "$19999$2")
    expect(headlineFileCount(tampered)).toBe(9999)
    expect(9999 <= trackedTestFileCount()).toBe(false)
  })

  it("★ 反向 2：把整行删掉 → 解析必须返回 null（删声明不能绕过）", () => {
    const text = fs.readFileSync(REPORT, "utf8")
    const stripped = text.replace(/\|\s*\*\*测试文件总数\*\*[^\n]*\n/, "")
    expect(headlineFileCount(stripped)).toBeNull()
  })
})
