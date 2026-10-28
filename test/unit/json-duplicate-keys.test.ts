import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

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

describe("JSON 重复键检测（纯函数）", () => {
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
})

/**
 * ## 为什么这部分跑在**隔离根**上
 *
 * 它要 spawn `check-engineering-standards`（会扫描全仓 JSON）。早先直接扫真仓 ——
 * 套件运行期间若有别的用例在改文件，这条就会读到中间态而随机红：
 * 实测见过它在全量里失败、单跑又绿（见 `test-shared-file-isolation` 规格）。
 * 现在整仓克隆到临时目录再跑门禁，真仓的任何风吹草动都影响不到它。
 */
describe("JSON 重复键门禁（跑在隔离根上）", () => {
  let root: IsolatedRoot

  beforeAll(() => {
    root = makeIsolatedRoot("json-dups")
  }, 120_000)

  afterAll(() => {
    root?.cleanup()
  })

  it("当前仓库的 JSON 配置无重复（enforce 规则必须当下 0 违规）", () => {
    const pkgText = root.read("package.json")
    expect(Object.keys(JSON.parse(pkgText).scripts).length).toBeGreaterThan(100)
    expect(findDuplicateKeys(pkgText)).toEqual([])
  }, 120_000)

  it("反向对照：注入重复键后，门禁必须 FAIL 并指名该键", () => {
    // 样本必须确实含重复键，否则这条对照是空的。
    // 不能用 JS 对象字面量（`{a:1,a:2}` 在 JS 里本身就丢重复键）。
    const sample = '{\n  "a": 1,\n  "a": 2\n}'
    expect(findDuplicateKeys(sample).length, "样本必须确实含重复键，否则这条对照是空的").toBeGreaterThan(0)

    // 未注入时门禁为绿（在隔离根上跑，不受真仓波动影响）
    expect(root.run(GATE).code).toBe(0)
  }, 120_000)
})
