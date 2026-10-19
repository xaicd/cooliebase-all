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
    // 口径对齐：vitest include 是 `*.test.ts`（不含 Playwright 的 `*.spec.ts`）
    expect(declared).toBe(trackedTestFileCount())
  })

  it("★ 反向 1：报告里的文件总数被改错 → 守卫必须发现（不是永远为真）", () => {
    const text = fs.readFileSync(REPORT, "utf8")
    const tampered = text.replace(/(\|\s*\*\*测试文件总数\*\*\s*\|\s*\*\*)\d+(\*\*\s*\|)/, "$114$2")
    expect(headlineFileCount(tampered)).toBe(14)
    expect(headlineFileCount(tampered)).not.toBe(trackedTestFileCount())
  })

  it("★ 反向 2：把整行删掉 → 解析必须返回 null（删声明不能绕过）", () => {
    const text = fs.readFileSync(REPORT, "utf8")
    const stripped = text.replace(/\|\s*\*\*测试文件总数\*\*[^\n]*\n/, "")
    expect(headlineFileCount(stripped)).toBeNull()
  })
})
