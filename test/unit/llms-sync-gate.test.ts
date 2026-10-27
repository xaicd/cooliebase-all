import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * `llms.txt` 事实同步门禁。
 *
 * 它守的是"**数字与真源一致**"：这两个文件是手写的，且面向正要下载本仓的 AI Agent
 * —— 里面的数字就是 Agent 对仓库的第一印象。此前已实际漂移过
 * （12+ 工具 / 8 层 Gate / 26 技能，真值分别是 17 / 11 / 38）。
 *
 * 每条断言都要有**会失败**的反向对照，否则就是又一个"看起来在跑"的空壳门禁。
 * 特别是「删掉声明」必须同样失败 —— 否则删句子就成了绕过门禁的手段。
 *
 * ## 为什么跑在**隔离根**上
 *
 * 本文件要改 `llms.txt` / `AGENTS.md` / `README.md` 三份仓库文件。早先直接改真仓，
 * 探针实测 `AGENTS.md` 在整套运行期间被改 4 次 —— 别的测试读到中间态就会随机红
 * （见 `docs/specs/infra/test-shared-file-isolation/research.md` §7）。
 */

const GATE = "scripts/check-llms-sync.cjs"

const LLMS = "llms.txt"
const AGENTS = "AGENTS.md"
const README = "README.md"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("llms-sync")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = () => root.run(GATE)

describe("llms.txt 事实同步门禁（跑在隔离根上）", () => {
  function withMutatedLlms<T>(mutate: (text: string) => string, body: () => T): T {
    const original = root.read(LLMS)
    try {
      root.write(LLMS, mutate(original))
      return body()
    } finally {
      root.write(LLMS, original)
      if (root.read(LLMS) !== original) throw new Error("llms.txt 未逐字还原")
    }
  }

  /** 改任意一份仓库文件跑一次门禁，无论成败都还原 */
  function withMutatedFile<T>(file: string, mutate: (text: string) => string, body: () => T): T {
    const original = root.read(file)
    try {
      root.write(file, mutate(original))
      return body()
    } finally {
      root.write(file, original)
      if (root.read(file) !== original) throw new Error(`${file} 未逐字还原`)
    }
  }

  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.code).toBe(0)
    expect(result.out).toMatch(/PASS/)
  }, 120_000)

  it("★ 反向 1：中文写法「N 个 Agent 专属技能」数字写错 → 必须失败", () => {
    withMutatedLlms(
      (text) => text.replace(/(\d+) 个 Agent 专属技能/, "26 个 Agent 专属技能"),
      () => {
        const result = runGate()
        expect(result.code).toBe(1)
        expect(result.out).toMatch(/技能数/)
      },
    )
  }, 120_000)

  it("★ 反向 2：英文写法「N 个专业 Agent Skills」数字写错 → 必须失败", () => {
    // 这条曾真实漏检：早期 pattern 只写 `技能`，把英文写法的数字改成 99 门禁仍然绿。
    withMutatedLlms(
      (text) => text.replace(/(\d+) 个专业 Agent Skills/, "99 个专业 Agent Skills"),
      () => {
        const result = runGate()
        expect(result.code).toBe(1)
        expect(result.out).toMatch(/技能数/)
      },
    )
  }, 120_000)

  it("★ 反向 6：AGENTS.md 引用了不存在的章节号 → 必须失败", () => {
    // 章节号只有"存在/不存在"两种状态 —— 零误报。
    // 实测曾有 1 处断裂：`§11.2`，而 §11 下并没有子小节（它是列表第 2 条）。
    withMutatedFile(AGENTS, (text) => `${text}\n引用一个不存在的章节 §99.99。\n`, () => {
      const result = runGate()
      expect(result.code).toBe(1)
      expect(result.out).toMatch(/§99\.99/)
    })
  }, 120_000)

  it("★ 反向 5：Agent 契约份数（README.md）写错 → 必须失败", () => {
    // 「324 份机器可读契约」曾全线滞后（真值 326）。份数随开发变化，写死必然漂移 ——
    // 这条断言就是为了让它在漂移的那一刻变红，而不是等人工发现。
    withMutatedFile(README, (text) => text.replace(/(\d+) 份机器可读/, "999 份机器可读"), () => {
      const result = runGate()
      expect(result.code).toBe(1)
      expect(result.out).toMatch(/Agent 契约数/)
    })
  }, 120_000)

  it("★ 反向 4：AGENTS.md 的裸写法「N 个技能」写错 → 必须失败", () => {
    // AGENTS.md 用的是裸写法「共 38 个技能」，与 llms.txt 的「N 个 Agent 专属技能」不同，
    // 由独立断言 skill-count-bare 覆盖 —— 这条锁住它，避免将来只剩 llms.txt 被检。
    withMutatedFile(AGENTS, (text) => text.replace(/(\d+) 个技能/, "26 个技能"), () => {
      const result = runGate()
      expect(result.code).toBe(1)
      expect(result.out).toMatch(/AGENTS\.md/)
    })
  }, 120_000)

  it("★ 反向 3：把声明整句删掉 → 必须失败（删句子不能成为绕过门禁的手段）", () => {
    // 注意：该事实在 llms.txt 里出现**两次**（中英各一）。只删一处，另一处仍在声明，
    // 门禁不报"找不到"是**正确**行为 —— 所以这里必须两处都删，才真正验证"删声明"这条路径。
    withMutatedLlms(
      (text) =>
        text
          .replace(/(\d+) 个 Agent 专属技能/g, "若干 Agent 专属技能")
          .replace(/(\d+) 个专业 Agent Skills/g, "若干专业 Agent Skills"),
      () => {
        const result = runGate()
        expect(result.code).toBe(1)
        expect(result.out).toMatch(/找不到/)
      },
    )
  }, 120_000)
})
