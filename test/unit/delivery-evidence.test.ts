import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const ROOT = path.resolve(__dirname, "../..")
const DIR = path.join(ROOT, "docs", "features", "__ev__")

/** 造一份 evidence.json 跑检查器，返回 evidence 段。 */
function inspect(gates: Record<string, unknown>) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(path.join(DIR, "feature.json"), JSON.stringify({ name: "__ev__", domain: "x" }))
  fs.writeFileSync(path.join(DIR, "evidence.json"), JSON.stringify({ schemaVersion: 1, gates }))
  const out = execFileSync("node", ["scripts/check-delivery.cjs", "--feature", "__ev__", "--json"], { cwd: ROOT, encoding: "utf8" })
  return JSON.parse(out).evidence as { totals: Record<string, number>; problems: string[] }
}

afterEach(() => fs.rmSync(DIR, { recursive: true, force: true }))

/**
 * 证据账本的三条硬规则 —— 都是为了治**「自报」**。
 * 对齐 CMMI: 证据不可跨角色借用；not_applicable 必须给理由。
 */
describe("证据账本", () => {
  it("passed 没有证据 → 拦下（『我说过了』不算证据）", () => {
    const result = inspect({ G0_DAR: { status: "passed", owner: "a", evidence: [], summary: "口头通过" } })
    expect(result.problems.some((p) => p.includes("passed 却没有证据"))).toBe(true)
  })

  it("not_applicable 没写理由 → 拦下（静默跳过会变成『没做也没事』）", () => {
    const result = inspect({ G1_FDA: { status: "not_applicable", owner: "b", evidence: [], summary: "" } })
    expect(result.problems.some((p) => p.includes("没写理由"))).toBe(true)
  })

  it("状态写错字 → 拦下，且不当成已知状态统计", () => {
    const result = inspect({ G2_CoreSWE: { status: "已通过", owner: "c", evidence: ["x"], summary: "" } })
    expect(result.problems.some((p) => p.includes("状态不认识"))).toBe(true)
    expect(result.totals["已通过"]).toBeUndefined()
  })

  it("多个阶段共用同一 gate 时**只报一次**（不去重会把同一问题报 3 次）", () => {
    const result = inspect({}) // 全部未登记
    const g4 = result.problems.filter((p) => p.startsWith("G4_DS"))
    expect(g4).toHaveLength(1) // 需求/运营/实施 三个阶段共用 G4_DS
  })

  it("G5_PRE 标 passed 但没跑过安全扫描 → 拦下（上线前必须扫过）", () => {
    // 规则读的是仓库级产物（packages/shared/contract/gate-assets/security-scan-result.json），
    // 所以必须**临时移开再恢复** —— 否则本机跑过扫描时这条测试永远不会触发。
    const scan = path.join(ROOT, "packages", "shared", "contract", "gate-assets", "security-scan-result.json")
    const backup = fs.existsSync(scan) ? fs.readFileSync(scan, "utf8") : null
    fs.rmSync(scan, { force: true })
    const all = ["G0_DAR", "G1_FDA", "G2_CoreSWE", "G3_FDSE", "G4_DS"]
    const pending = Object.fromEntries(all.map((gate) => [gate, { status: "pending", owner: "-", evidence: [], summary: "" }]))
    const result = inspect({
      ...pending,
      // G5 同时要求 runbook-result 与 security-scan-result；这里只给 runbook，
      // 且故意清掉扫描结果，验证"缺安全扫描"能被单独识别。
      G5_PRE: { status: "passed", owner: "sre", evidence: ["runbook-result.json: 2 步，全过"], summary: "指纹一致" },
    })
    const mentionSecurity = result.problems.some((item) => item.includes("安全扫描") || item.includes("security-scan"))
    if (backup !== null) { fs.mkdirSync(path.dirname(scan), { recursive: true }); fs.writeFileSync(scan, backup) }
    expect(mentionSecurity).toBe(true)
  })

  it("合法的 passed（有证据 + 有说明）不被误伤 —— 未登记的 gate 才是问题", () => {
    const all = ["G0_DAR", "G1_FDA", "G2_CoreSWE", "G3_FDSE", "G4_DS", "G5_PRE"]
    const pending = Object.fromEntries(all.map((gate) => [gate, { status: "pending", owner: "-", evidence: [], summary: "" }]))
    const result = inspect({
      ...pending,
      G0_DAR: { status: "passed", owner: "a", evidence: ["docs/features/x/selection.md"], summary: "加权打分结论" },
      G1_FDA: { status: "not_applicable", owner: "b", evidence: [], summary: "文档-only 任务，无领域边界变更" },
    })
    expect(result.problems).toHaveLength(0)
    expect(result.totals.passed).toBe(1)
    expect(result.totals.not_applicable).toBe(1)
  })
})
