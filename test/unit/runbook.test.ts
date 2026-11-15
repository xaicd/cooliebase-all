import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const ROOT = path.resolve(__dirname, "../..")
const DIR = path.join(ROOT, "docs", "features", "__rb_test__")

function run(args: string[]): { status: number; output: string } {
  fs.writeFileSync(path.join(DIR, "feature.json"), JSON.stringify({ name: "__rb_test__", domain: "x" }))
  try {
    const output = execFileSync("node", ["scripts/agent/run-runbook.cjs", "--feature", "__rb_test__", ...args], { cwd: ROOT, encoding: "utf8", stdio: "pipe" })
    return { status: 0, output }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

function writeRunbook(body: unknown) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(path.join(DIR, "runbook.json"), JSON.stringify(body))
}

afterEach(() => fs.rmSync(DIR, { recursive: true, force: true }))

/**
 * 实施轨的可执行 runbook。
 *
 * 守的是实施现场的三个真实事故:
 *  1. **骨架被当成可执行方案**（命令里还是占位符）→ 跑起来必然失败
 *  2. **不可逆步骤没有回滚路径** → 一旦失败就卡死
 *  3. **失败不回滚** → 半割接状态，比不割接更糟
 */
describe("实施轨 runbook", () => {
  it("占位符还在命令里 → 拦下（骨架不是可执行方案）", () => {
    writeRunbook({ window: { minutes: 10 }, steps: [{ id: "S1", name: "跑点什么", command: "echo <!-- 待填 -->" }], rollback: [] })
    expect(run(["--check"]).status).toBe(1)
  })

  it("不可逆步骤没有 rollback → 拦下（失败就卡死）", () => {
    writeRunbook({
      window: { minutes: 10 },
      steps: [{ id: "S1", name: "改数据", command: "exit 0", irreversible: true }],
      rollback: [],
    })
    const result = run(["--check"])
    expect(result.status).toBe(1)
    expect(result.output).toContain("没有 rollback")
  })

  it("没有声明窗口 → 拦下（无法判断是否超时）", () => {
    writeRunbook({ steps: [{ id: "S1", name: "a", command: "exit 0" }], rollback: [] })
    expect(run(["--check"]).status).toBe(1)
  })

  it("失败 → 自动执行回滚，退出码非 0，并报告**实测**回滚耗时", () => {
    writeRunbook({
      window: { minutes: 5 },
      steps: [
        { id: "S1", name: "必过", command: "exit 0" },
        { id: "S2", name: "必失败", command: "exit 3", irreversible: true },
      ],
      rollback: [{ id: "R1", name: "回滚", command: "echo rolled-back" }],
    })
    const result = run(["--run"])
    expect(result.status).toBe(1)
    expect(result.output).toContain("执行回滚")
    expect(result.output).toContain("实测的回滚耗时")
  })

  it("合法的 runbook 不被误伤", () => {
    writeRunbook({
      window: { minutes: 5 },
      steps: [{ id: "S1", name: "跑门禁", command: "exit 0" }],
      rollback: [{ id: "R1", name: "回滚", command: "exit 0" }],
    })
    expect(run(["--check"]).status).toBe(0)
  })
})

/**
 * G5 的 passed 必须有**实测**支撑 —— 这是"证据不可自报"在实施轨上的落点。
 */
describe("G5 证据规则", () => {
  // afterEach 会删掉整个目录 —— 每个用例都要先建回来（写这条时踩到: 直接 ENOENT）
  beforeEach(() => fs.mkdirSync(DIR, { recursive: true }))
  const EVIDENCE = path.join(DIR, "evidence.json")
  const RESULT = path.join(DIR, "runbook-result.json")

  function inspectDelivery(): { output: string; status: number } {
    fs.writeFileSync(path.join(DIR, "feature.json"), JSON.stringify({ name: "__rb_test__", domain: "x" }))
    try {
      return { status: 0, output: execFileSync("node", ["scripts/check-delivery.cjs", "--feature", "__rb_test__", "--json"], { cwd: ROOT, encoding: "utf8" }) }
    } catch (error) {
      const e = error as { status?: number; stdout?: string }
      return { status: e.status ?? 1, output: e.stdout ?? "" }
    }
  }

  // 六个 gate 都要登记 —— 只登记 G5 会让未登记污染断言（写这条时踩到）
  const gate = (status: string, evidence: string[]) => ({
    schemaVersion: 1,
    gates: {
      ...Object.fromEntries(
        ["G0_DAR", "G1_FDA", "G2_CoreSWE", "G3_FDSE", "G4_DS"].map((g) => [g, { status: "pending", owner: "-", evidence: [], summary: "" }]),
      ),
      G5_PRE: { status, owner: "sre", evidence, summary: "指纹一致" },
    },
  })

  it("G5=passed 但没有运行记录 → 拦下（声称 ≠ 实测）", () => {
    fs.mkdirSync(DIR, { recursive: true })
    fs.writeFileSync(EVIDENCE, JSON.stringify(gate("passed", ["pnpm run fingerprint --verify -> PASS"])))
    fs.rmSync(RESULT, { force: true })
    const out = JSON.parse(inspectDelivery().output)
    expect(out.evidence.problems.some((p: string) => p.includes("没有 runbook-result.json"))).toBe(true)
  })

  it("G5=passed 但运行记录显示失败 → 拦下", () => {
    fs.writeFileSync(EVIDENCE, JSON.stringify(gate("passed", ["runbook-result.json: x"])))
    fs.writeFileSync(RESULT, JSON.stringify({ feature: "__rb_test__", ok: false, steps: [{ id: "S4", ok: false }] }))
    const out = JSON.parse(inspectDelivery().output)
    expect(out.evidence.problems.some((p: string) => p.includes("运行记录显示失败"))).toBe(true)
  })

  it("G5=passed 且有全过的运行记录 → 不被误伤", () => {
    // G5 现在要**三样**: runbook 记录 + 安全扫描绿 + 压测达阈值（后两者是仓级产物）。
    // 夹具必须把三样都造齐，否则测的是"新规则拦下了夹具"，不是"不误伤"。
    const artifacts = path.join(ROOT, "docs", "architecture", "artifacts")
    const security = path.join(artifacts, "security-scan-result.json")
    const load = path.join(artifacts, "load-test-result.json")
    const backup = { security: fs.existsSync(security) ? fs.readFileSync(security, "utf8") : null, load: fs.existsSync(load) ? fs.readFileSync(load, "utf8") : null }
    fs.mkdirSync(artifacts, { recursive: true })
    fs.writeFileSync(security, JSON.stringify({ scannedAt: new Date().toISOString(), failed: 0 }))
    fs.writeFileSync(load, JSON.stringify({ ranAt: new Date().toISOString(), failed: 0 }))
    try {
      fs.writeFileSync(EVIDENCE, JSON.stringify(gate("passed", ["runbook-result.json: 2 步，全过，用时 1.0s"])))
      fs.writeFileSync(RESULT, JSON.stringify({ feature: "__rb_test__", ok: true, steps: [{ id: "S1", ok: true }, { id: "S2", ok: true }] }))
      const out = JSON.parse(inspectDelivery().output)
      expect(out.evidence.problems).toHaveLength(0)
    } finally {
      if (backup.security === null) fs.rmSync(security, { force: true }); else fs.writeFileSync(security, backup.security)
      if (backup.load === null) fs.rmSync(load, { force: true }); else fs.writeFileSync(load, backup.load)
    }
  })
})
