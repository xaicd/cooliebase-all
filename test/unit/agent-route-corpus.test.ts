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
 * 规则表在**真实历史语料**上的覆盖率回归门禁。
 *
 * 历史语料已脱敏沉淀为 `test/fixtures/agent-route-corpus.json`（避免母本归档需求日志随派生泄露）；
 * 若工作区存在按需追加的 `docs/features/sprint-prod/*.md`，一并纳入统计。
 */
function corpus(): string[] {
  const samples: string[] = []
  const fixturePath = path.join(ROOT, "test", "fixtures", "agent-route-corpus.json")
  if (fs.existsSync(fixturePath)) {
    const parsed = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as { samples?: string[] }
    for (const item of parsed.samples ?? []) {
      const val = String(item || "").trim()
      if (val) samples.push(val)
    }
  }
  const dir = path.join(ROOT, "docs", "features", "sprint-prod")
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue
      const text = fs.readFileSync(path.join(dir, file), "utf8")
      for (const match of text.matchAll(/\*\*用户原始输入\*\*：`([^`]+)`/g)) {
        const value = match[1].trim().replace(/\s+/g, " ")
        if (value) samples.push(value)
      }
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

  it("语料足够（来自脱敏固化语料集，>= 30 条）", () => {
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
