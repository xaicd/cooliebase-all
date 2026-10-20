import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const LIB = path.join(ROOT, "scripts", "lib", "load-verdict.cjs")

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadLib = (): { loadVerdict: (input: { failed: number; loadavg1: number; cores: number }) => string } =>
  require(LIB)

/**
 * 压测判定三态的反向对照。
 *
 * 为什么这条必须存在：本仓实测过「12 核但被虚拟化实例压住」的机器 ——
 * 吞吐 26,900 → 2,700，护栏报红。那次**红是对的**，但如果只区分"过/不过"，
 * 下一个人会先去查代码；而真正的坑是另一种改法：**因为负载高就放行**（假绿）。
 * 所以这里既验"该绿时绿"，也验"拿负载当免死金牌时必须被判死"。
 */
describe("压测判定: passed / inconclusive / failed", () => {
  it("达标即 passed（与负载无关）", () => {
    const { loadVerdict } = loadLib()
    expect(loadVerdict({ failed: 0, loadavg1: 30, cores: 12 })).toBe("passed")
  })

  it("未达标 + 机器过载 ⇒ inconclusive（不是回归证据）", () => {
    const { loadVerdict } = loadLib()
    expect(loadVerdict({ failed: 3, loadavg1: 20, cores: 12 })).toBe("inconclusive")
  })

  it("未达标 + 机器空闲 ⇒ failed（这是真回归）", () => {
    const { loadVerdict } = loadLib()
    expect(loadVerdict({ failed: 3, loadavg1: 2, cores: 12 })).toBe("failed")
  })

  it("边界：负载恰好等于核数 ⇒ inconclusive（>= 判据）", () => {
    const { loadVerdict } = loadLib()
    expect(loadVerdict({ failed: 1, loadavg1: 12, cores: 12 })).toBe("inconclusive")
  })

  it("反向对照：把「负载高就放行」注入实现，正确断言必须判死", () => {
    const original = fs.readFileSync(LIB, "utf8")
    expect(loadLib().loadVerdict({ failed: 3, loadavg1: 20, cores: 12 })).toBe("inconclusive")
    try {
      // 模拟"假绿"改法：机器过载时直接放行（这正是必须被拦住的写法）
      const mutated = original.replace(
        'return ratio >= 1 ? "inconclusive" : "failed"',
        'return ratio >= 1 ? "passed" : "failed"',
      )
      expect(mutated, "变异必须真的改到判定分支，否则这条对照是空的").not.toBe(original)
      fs.writeFileSync(LIB, mutated, "utf8")
      delete require.cache[LIB]

      // 关键：**正确语义的断言在变异实现下必须失败**。
      // 若它仍然通过，说明我上面那些断言是空的（测的不是这个分支）。
      let caughtTheFakeGreen = false
      try {
        expect(loadLib().loadVerdict({ failed: 3, loadavg1: 20, cores: 12 })).toBe("inconclusive")
      } catch {
        caughtTheFakeGreen = true
      }
      expect(caughtTheFakeGreen, "变异实现竟然通过了正确断言 —— 说明断言是空的").toBe(true)
    } finally {
      fs.writeFileSync(LIB, original, "utf8")
      delete require.cache[LIB]
    }
    expect(loadLib().loadVerdict({ failed: 3, loadavg1: 20, cores: 12 })).toBe("inconclusive")
  })
})
