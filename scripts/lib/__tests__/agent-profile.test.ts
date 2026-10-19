import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

const require = createRequire(import.meta.url)
const { PLATFORM_COMPANIONS } = require("../hatch-profile.cjs")
const { SEAM_GRAPH_REL } = require("../seam-graph.cjs")

const ROOT = path.resolve(__dirname, "../../..")

describe("agent-profile workspace bundle", () => {
  const profile = JSON.parse(
    readFileSync(path.join(ROOT, "packages/shared/contract/agent-profile.json"), "utf8"),
  )

  it("declares workspace-bundle and refuses to host the agent loop", () => {
    expect(profile.kind).toBe("workspace-bundle")
    expect(profile.not).toEqual(expect.arrayContaining(["agent-runtime", "cordis-host", "llm-loop"]))
    expect(profile.bundles.business.domains).toBeUndefined()
    expect(profile.bundles.business.source).toMatch(/domain-catalog\.json/)
    expect(profile.profiles.minimal.companions).toEqual([...PLATFORM_COMPANIONS])
    expect(profile.seamGraph.path).toBe(SEAM_GRAPH_REL)
    expect(profile.trace.sprintProd).toBe("docs/features/sprint-prod/")
    expect(profile.trace.writer).toBe("scripts/write-harness-trace.cjs")
    // 用 arrayContaining 而非 toEqual：技能列表会随能力增长而增长，
    // 精确全等会让每次往角色里加技能都把本用例打红（本次失效正是这么来的：
    // L0 后来补了 project-init，测试仍按旧的 3 项断言）。
    // 本用例真正要保证的是「这几个核心技能必须在」，而不是「只能有这几个」。
    expect(profile.npc.layers.L0.skills).toEqual(
      expect.arrayContaining(["coding", "automated-testing", "agent-harness"]),
    )
    expect(profile.npc.layers.L4.skills).toEqual(expect.arrayContaining(["devops"]))
    expect(profile.npc.forbiddenSkillSources).toEqual(expect.arrayContaining(["crush"]))
  })

  /**
   * 这条不变量替代了原先「精确全等」的严格度，而且**更强**：
   * 它能抓到拼错、已删除、以及「引用了已退役入口」这类悬空引用 ——
   * 正是本次 6 条失败中「测试引用了已退役的 spec-ops.ts」那一类的成因。
   */
  it("每一层声明的技能都必须在 skillsDir 下真实存在", () => {
    const skillsDir = path.join(ROOT, profile.npc?.skillsDir || ".agents/skills")
    const layers = profile.npc?.layers || {}

    const missing: string[] = []
    let declared = 0
    for (const [layer, spec] of Object.entries<{ skills?: string[] }>(layers)) {
      for (const skill of spec.skills || []) {
        declared += 1
        if (!existsSync(path.join(skillsDir, skill, "SKILL.md"))) missing.push(`${layer}:${skill}`)
      }
    }

    // 防止"一个都没读到"这种看起来通过、实际路径已失效的情况
    expect(declared, "npc.layers 未声明任何技能，说明读取路径已失效").toBeGreaterThan(0)
    expect(missing, "以下声明技能在 skillsDir 下不存在").toEqual([])
  })
})
