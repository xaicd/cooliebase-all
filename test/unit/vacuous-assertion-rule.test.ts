import fs from "node:fs"
import path from "node:path"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * `no-vacuous-test-assertions`（AGENTS.md §8 / RSK-007）的反向对照。
 *
 * 这条规则存在的理由就是本仓真实踩过的假绿：断言看起来在跑、实际恒真。
 * 所以它自己**也必须被证明会 fire** —— 否则就是"用一条空壳规则去防空壳测试"。
 *
 * ## 为什么跑在**隔离根**上
 *
 * 本文件要在 `test/unit/` 下写一个探针测试文件，再跑门禁扫描它。早先直接写进真仓 ——
 * 探针一旦在套件运行期间存在，别的测试与门禁就可能扫到它
 * （见 `docs/specs/infra/test-shared-file-isolation/research.md` §7）。
 * 现在写的是**临时根的拷贝**，真仓不会出现任何探针文件。
 */

const GATE = "scripts/check-engineering-standards.cjs"
/** 探针文件本身必须匹配被扫描的命名（`.test.ts`），否则规则看不到它。 */
const PROBE = "test/unit/__vacuous_probe__.test.ts"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("vacuous")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runStandards = () => root.run(GATE)

describe("规范机检: 空壳断言规则（跑在隔离根上）", () => {
  it("当前仓库为绿（enforce 规则必须当下 0 违规）", () => {
    const result = runStandards()
    expect(result.code).toBe(0)
    expect(result.out).toMatch(/PASS {2}no-vacuous-test-assertions/)
  }, 120_000)

  it("★ 反向对照：注入字面恒真断言后必须 FAIL，且指名该规则", () => {
    const probeAbs = path.join(root.dir, PROBE)
    expect(fs.existsSync(probeAbs), "探针文件残留，上一次未清理干净").toBe(false)
    try {
      root.write(
        PROBE,
        [
          'import { expect, it } from "vitest"',
          "",
          'it("vacuous probe", () => {',
          // 用拼接构造探针内容：若在本文件里写出完整字面量，规则会先扫到这里
          // （即"测试自己触发了被测规则"），那样永远无法验证规则的 green 态。
          `  ${"expect(" + "true).toBe(" + "true)"}`,
          "})",
          "",
        ].join("\n"),
      )
      const result = runStandards()
      expect(result.code).not.toBe(0)
      expect(result.out).toMatch(/FAIL {2}no-vacuous-test-assertions/)
    } finally {
      fs.rmSync(probeAbs, { force: true })
    }
    // 清理后必须立刻回到绿 —— 证明这条用例不会把仓库留在红态
    expect(runStandards().code).toBe(0)
  }, 120_000)
})
