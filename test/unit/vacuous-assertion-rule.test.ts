import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-engineering-standards.cjs"
/** 探针文件本身必须匹配被扫描的命名（`.test.ts`），否则规则看不到它。 */
const PROBE = path.join(ROOT, "test", "unit", "__vacuous_probe__.test.ts")

function runStandards(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

/**
 * `no-vacuous-test-assertions`（AGENTS.md §8 / RSK-007）的反向对照。
 *
 * 这条规则存在的理由就是本仓真实踩过的假绿：断言看起来在跑、实际恒真。
 * 所以它自己**也必须被证明会 fire** —— 否则就是"用一条空壳规则去防空壳测试"。
 */
describe("规范机检: 空壳断言规则", () => {
  it("当前仓库为绿（enforce 规则必须当下 0 违规）", () => {
    const result = runStandards()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS {2}no-vacuous-test-assertions/)
  })

  it("★ 反向对照：注入字面恒真断言后必须 FAIL，且指名该规则", () => {
    expect(fs.existsSync(PROBE), "探针文件残留，上一次未清理干净").toBe(false)
    try {
      fs.writeFileSync(
        PROBE,
        [
          'import { expect, it } from "vitest"',
          "",
          'it("vacuous probe", () => {',
          // 用拼接构造探针内容：若在本文件里写出完整字面量，规则会先扫到这里
          // （即"测试自己触发了被测规则"），那样永远无法验证规则的 green 态。
          `  ${
            "expect(" + "true).toBe(" + "true)"
          }`,
          "})",
          "",
        ].join("\n"),
      )
      const result = runStandards()
      expect(result.status).not.toBe(0)
      expect(`${result.stdout}${result.stderr}`).toMatch(/FAIL {2}no-vacuous-test-assertions/)
    } finally {
      fs.rmSync(PROBE, { force: true })
    }
    // 清理后必须立刻回到绿 —— 证明这条用例不会把仓库留在红态
    expect(runStandards().status).toBe(0)
  })
})
