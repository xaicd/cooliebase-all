import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-llms-sync.cjs"
const LLMS = path.join(ROOT, "llms.txt")

function runGate(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

/**
 * `llms.txt` 事实同步门禁。
 *
 * 它守的是"**数字与真源一致**"：这两个文件是手写的，且面向正要下载本仓的 AI Agent
 * —— 里面的数字就是 Agent 对仓库的第一印象。此前已实际漂移过
 * （12+ 工具 / 8 层 Gate / 26 技能，真值分别是 17 / 11 / 38）。
 *
 * 每条断言都要有**会失败**的反向对照，否则就是又一个"看起来在跑"的空壳门禁。
 * 特别是「删掉声明」必须同样失败 —— 否则删句子就成了绕过门禁的手段。
 */
describe("llms.txt 事实同步门禁", () => {
  function withMutatedLlms<T>(mutate: (text: string) => string, body: () => T): T {
    const original = fs.readFileSync(LLMS, "utf8")
    try {
      fs.writeFileSync(LLMS, mutate(original))
      return body()
    } finally {
      fs.writeFileSync(LLMS, original)
      const restored = fs.readFileSync(LLMS, "utf8")
      if (restored !== original) throw new Error("llms.txt 未逐字还原")
    }
  }

  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
  })

  it("★ 反向 1：中文写法「N 个 Agent 专属技能」数字写错 → 必须失败", () => {
    withMutatedLlms(
      (text) => text.replace(/(\d+) 个 Agent 专属技能/, "26 个 Agent 专属技能"),
      () => {
        const result = runGate()
        expect(result.status).toBe(1)
        expect(`${result.stderr}${result.stdout}`).toMatch(/技能数/)
      },
    )
  })

  it("★ 反向 2：英文写法「N 个专业 Agent Skills」数字写错 → 必须失败", () => {
    // 这条曾真实漏检：早期 pattern 只写 `技能`，把英文写法的数字改成 99 门禁仍然绿。
    withMutatedLlms(
      (text) => text.replace(/(\d+) 个专业 Agent Skills/, "99 个专业 Agent Skills"),
      () => {
        const result = runGate()
        expect(result.status).toBe(1)
        expect(`${result.stderr}${result.stdout}`).toMatch(/技能数/)
      },
    )
  })

  it("★ 反向 5：Agent 契约份数（README.md）写错 → 必须失败", () => {
    // 「324 份机器可读契约」曾全线滞后（真值 326）。份数随开发变化，写死必然漂移 ——
    // 这条断言就是为了让它在漂移的那一刻变红，而不是等人工发现。
    const target = path.join(ROOT, "README.md")
    const original = fs.readFileSync(target, "utf8")
    try {
      fs.writeFileSync(target, original.replace(/(\d+) 份机器可读/, "999 份机器可读"))
      const result = runGate()
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/Agent 契约数/)
    } finally {
      fs.writeFileSync(target, original)
      if (fs.readFileSync(target, "utf8") !== original) throw new Error("README.md 未逐字还原")
    }
  })

  it("★ 反向 4：AGENTS.md 的裸写法「N 个技能」写错 → 必须失败", () => {
    // AGENTS.md 用的是裸写法「共 38 个技能」，与 llms.txt 的「N 个 Agent 专属技能」不同，
    // 由独立断言 skill-count-bare 覆盖 —— 这条锁住它，避免将来只剩 llms.txt 被检。
    const target = path.join(ROOT, "AGENTS.md")
    const original = fs.readFileSync(target, "utf8")
    try {
      fs.writeFileSync(target, original.replace(/(\d+) 个技能/, "26 个技能"))
      const result = runGate()
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/AGENTS\.md/)
    } finally {
      fs.writeFileSync(target, original)
      if (fs.readFileSync(target, "utf8") !== original) throw new Error("AGENTS.md 未逐字还原")
    }
  })

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
        expect(result.status).toBe(1)
        expect(`${result.stderr}${result.stdout}`).toMatch(/找不到/)
      },
    )
  })
})
