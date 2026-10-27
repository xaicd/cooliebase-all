import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * `docs:claims:check` —— 文档声明必须对标真源。
 *
 * ## 为什么跑在**隔离根**上
 *
 * 反向对照要改 `docs/02_requirements/rtm-traceability-matrix.md` 这份**真仓文件**。
 * 这个写方是**探针扩了观测清单之后才现身的** —— 我最初用 grep 列的清单里没有它，
 * 也就是说：**写方清单必须以探针为准，grep 会漏**（见
 * `docs/specs/infra/test-shared-file-isolation/research.md` §7）。
 */

const SCRIPT = "scripts/check-doc-claims.cjs"
const VICTIM = "docs/02_requirements/rtm-traceability-matrix.md"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("doc-claims")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = () => root.run(SCRIPT)

describe("docs:claims:check —— 文档声明必须对标真源（跑在隔离根上）", () => {
  it("当前文档与真源一致（exit 0）", () => {
    const result = runGate()
    expect(result.code).toBe(0)
    expect(result.out).toContain("[doc-claims] ✓")
  }, 120_000)

  it("反向对照：把「活跃规格」改错，门禁必须失败", () => {
    const original = root.read(VICTIM)
    const broken = original.replace(/## 4\. 活跃规格（\d+ 份/, "## 4. 活跃规格（8 份".replace("）", ""))
    // 断言替换真的发生了，否则这个"反向对照"本身就是空转的
    expect(broken).not.toBe(original)

    try {
      root.write(VICTIM, broken)
      const result = runGate()
      expect(result.code).toBe(1)
      expect(result.out).toContain("活跃规格数")
      expect(result.out).toContain("真源实测")
    } finally {
      root.write(VICTIM, original)
    }

    // 还原后必须回绿 —— 证明失败来自注入，而不是别处
    expect(runGate().code).toBe(0)
  }, 120_000)

  it("真源缺失时失败而不是静默通过", () => {
    // 这条是只读断言（读门禁源码），放在隔离根上同样成立
    const script = root.read(SCRIPT)
    expect(script).toContain("真源缺失")
    expect(script).toContain("process.exit(1)")
    expect(script).not.toMatch(/catch\s*\([^)]*\)\s*\{\s*\}/)
  }, 120_000)
})
