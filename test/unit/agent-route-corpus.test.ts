import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "agent-route-corpus-"))

afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

/**
 * 规则表在**真实历史语料**上的覆盖率。
 *
 * 为什么需要：规则表最初是照着"典型需求"写的，7 条规则看起来合理 ——
 * 但拿本仓历史上真实记录的用户原话一跑，**65% 的输入一条规则都没命中**，
 * 全靠 fail-safe 兜底。也就是说它**在大多数真实输入上并没有在分类**，只是默认"需要规格"。
 * （这正是"全都需要规格 = 没人会遵守 = 机制自己死掉"的老问题换个面貌重现。）
 *
 * 本用例把这个数字**钉成回归指标**：补规则后 65% → 51% → 32%，
 * 要求不得回退到 40% 以上。语料直接取自 `docs/features/sprint-prod/*.md` 里的
 * `**用户原始输入**：` 记录（§15 的产物），不是编的。
 */
function corpus(): string[] {
  const dir = path.join(ROOT, "docs", "features", "sprint-prod")
  const samples: string[] = []
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue
    const text = fs.readFileSync(path.join(dir, file), "utf8")
    for (const match of text.matchAll(/\*\*用户原始输入\*\*：`([^`]+)`/g)) {
      const value = match[1].trim().replace(/\s+/g, " ")
      if (value) samples.push(value)
    }
  }
  return samples
}

function classify(requirement: string): { verdict: string; matched: string[]; exempted: string[]; noTask: string[] } {
  const stdout = execFileSync("node", ["scripts/agent-route.cjs", "--json", requirement], {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      AGENT_ROUTE_LOG_DIR: path.join(TMP, "log"),
      AGENT_ROUTE_ARTIFACT: path.join(TMP, "last.json"),
    },
  })
  return JSON.parse(stdout)
}

describe("规则表在真实历史语料上的覆盖率", () => {
  const samples = corpus()

  it("语料足够（来自 §15 的真实记录，不是编的）", () => {
    expect(samples.length).toBeGreaterThanOrEqual(30)
  })

  it("★ 未命中率不得回退到 40% 以上（现状约 32%）", () => {
    let noHit = 0
    const misses: string[] = []
    for (const sample of samples) {
      const result = classify(sample)
      if (result.matched.length === 0 && result.exempted.length === 0 && result.noTask.length === 0) {
        noHit += 1
        misses.push(sample)
      }
    }
    const rate = noHit / samples.length
    if (rate > 0.4) {
      throw new Error(
        `未命中率 ${(rate * 100).toFixed(0)}% 超过阈值 40% —— 规则表对真实输入覆盖不足。\n` +
          `未命中的样例：\n${misses.slice(0, 8).map((item) => `  · ${item.slice(0, 60)}`).join("\n")}\n` +
          "补规则请改 scripts/lib/spec-necessity-rules.cjs（并给每条新规则写理由）。",
      )
    }
    expect(rate).toBeLessThanOrEqual(0.4)
  })

  it("★ 真实语料里的短确认不得被判成「需要规格」", () => {
    for (const sample of ["搞吧", "要的", "开", "1,2,3", "2 ,push", "你做吧"]) {
      expect(classify(sample).verdict, `${sample} 被判成了需要规格`).toBe("NOT_A_REQUIREMENT")
    }
  })

  it("★ 真实语料里的状态提问不得被判成「需要规格」", () => {
    for (const sample of ["当前项目 什么进展", "进度如何了"]) {
      expect(classify(sample).verdict, `${sample} 被判成了需要规格`).toBe("NOT_A_REQUIREMENT")
    }
  })
})
