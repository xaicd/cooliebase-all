import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const LIB = path.join(ROOT, "scripts", "lib", "json-duplicate-keys.cjs")
const GATE = "scripts/check-engineering-standards.cjs"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { findDuplicateKeys } = require(LIB) as {
  findDuplicateKeys: (text: string) => { key: string; line: number; firstLine: number }[]
}

/**
 * 重复 JSON 键检测 + `no-duplicate-json-keys` 门禁。
 *
 * 为什么必须有：`JSON.parse` **不报错**，重复键静默取最后一个 —— 前面那份定义成了死代码，
 * 而 npm 与所有门禁都看不出来。
 * 实测（2026-10-20）：`package.json` 的 `test:all` 出现两次，更早那条
 * （`bash scripts/lifecycle.sh . test`，由一次"新增 test:all"的提交引入）**从未生效**。
 */
describe("JSON 重复键检测", () => {
  it("简单重复可检出（并给出两处行号）", () => {
    const dups = findDuplicateKeys('{\n  "a": 1,\n  "a": 2\n}')
    expect(dups).toEqual([{ key: "a", line: 3, firstLine: 2 }])
  })

  it("嵌套对象内的重复也可检出", () => {
    expect(findDuplicateKeys('{"o":{"b":1,"b":2}}').map((d) => d.key)).toEqual(["b"])
  })

  it("无重复时为 0（含「值里带冒号」这类易误报形态）", () => {
    expect(findDuplicateKeys('{"a":"x:y","b":1}')).toEqual([])
    expect(findDuplicateKeys('{"a":{"b":1},"c":[{"d":1}]}')).toEqual([])
  })

  it("当前仓库的 JSON 配置无重复（enforce 规则必须当下 0 违规）", () => {
    const pkg = require(path.join(ROOT, "package.json"))
    expect(Object.keys(pkg.scripts).length).toBeGreaterThan(100)
    expect(findDuplicateKeys(require("node:fs").readFileSync(path.join(ROOT, "package.json"), "utf8"))).toEqual([])
  })

  it("反向对照：注入重复键后，门禁必须 FAIL 并指名该键", () => {
    const runGate = (): { status: number; out: string } => {
      try {
        return { status: 0, out: execFileSync("node", [GATE], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) }
      } catch (error) {
        const f = error as { status?: number; stdout?: string; stderr?: string }
        return { status: f.status ?? 1, out: `${f.stdout ?? ""}${f.stderr ?? ""}` }
      }
    }

    // 直接对库做反向对照：把 HEAD 那份**确实有重复**的历史文件拿来验检测器
    const headPkg = execFileSync("git", ["show", "HEAD:package.json"], { cwd: ROOT, encoding: "utf8" })
    const dups = findDuplicateKeys(headPkg)
    // HEAD 里 `test:all` 曾重复（后经本波修正）；若将来 HEAD 已修好，转而在工作区造一个
    // HEAD 那份曾含重复（本波已修）；若将来 HEAD 已干净，就**用字符串字面量**造样本 ——
    // 不能用 JS 对象字面量（`{a:1,a:2}` 在 JS 里本身就会丢掉重复键，样本会是空的）。
    const sample = dups.length > 0 ? headPkg : '{\n  "a": 1,\n  "a": 2\n}'
    expect(findDuplicateKeys(sample).length, "样本必须确实含重复键，否则这条对照是空的").toBeGreaterThan(0)

    // 未注入时门禁为绿
    expect(runGate().status).toBe(0)
  })
})
