import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-agent-contract-coverage.cjs"
/** `report` 域只有 1 份契约 —— 临时移走它即可模拟"某域从有覆盖掉到零覆盖"。 */
const REPORT_CONTRACT = path.join(ROOT, "packages", "plugins", "plugin-report", "agent", "go-view-project.agent.json")
/** `online` 是已冻结的零覆盖域 —— 塞一份契约即可模拟"补齐"。 */
const ONLINE_AGENT_DIR = path.join(ROOT, "packages", "plugins", "plugin-online", "agent")
const ONLINE_PROBE = path.join(ONLINE_AGENT_DIR, "__probe__.agent.json")

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
 * `agent-contract-coverage`：每个域至少要有一份 agent 契约。
 *
 * 为什么需要：契约是 L4 无头探针的驱动源、`agent:ops` 的运营对象、wiki 实体表的来源。
 * **某域一份都没有时，这个域在 Agent 面上等于不存在** —— 而全仓测试与门禁都不会因此变红。
 * 实测：`online` / `wms` / `aigw` 三个域零覆盖（页面分别 4 / 33 / 8），已冻结为已知缺口。
 *
 * 本门禁**绝不代生成契约**：契约由 codegen 随代码产出，手写业务名/权限码/字段等于编造。
 */
describe("Agent 契约域级覆盖门禁", () => {
  it("正向：零覆盖域均为已冻结的已知缺口", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
    expect(result.stdout).toMatch(/online/)
  })

  it("★ 反向 1：某域从「有覆盖」掉到「零覆盖」→ 必须失败", () => {
    // 这正是要防的：新域/重构后契约没跟上，而其他门禁全绿。
    const backup = `${REPORT_CONTRACT}.probe-backup`
    fs.renameSync(REPORT_CONTRACT, backup)
    try {
      const result = runGate()
      expect(result.status).toBe(1)
      const output = `${result.stderr}${result.stdout}`
      expect(output).toMatch(/report/)
      expect(output).toMatch(/零覆盖/)
    } finally {
      fs.renameSync(backup, REPORT_CONTRACT)
    }
    expect(runGate().status).toBe(0)
  })

  it("★ 反向 3：零覆盖但**未写明原因** → 必须失败（「待补」不能含糊下去）", () => {
    // 把 report 域唯一的契约临时移走 → 它变成零覆盖，但它不在 ZERO_COVERAGE_REASONS 里。
    const backup = `${REPORT_CONTRACT}.probe-backup-reason`
    fs.renameSync(REPORT_CONTRACT, backup)
    try {
      const result = runGate()
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/未写明原因/)
    } finally {
      fs.renameSync(backup, REPORT_CONTRACT)
    }
    expect(runGate().status).toBe(0)
  })

  it("★ 反向 2：某已知零覆盖域被补齐 → 应 PASS 并提示收紧基线", () => {
    fs.mkdirSync(ONLINE_AGENT_DIR, { recursive: true })
    fs.writeFileSync(ONLINE_PROBE, "{}\n")
    try {
      const result = runGate()
      expect(result.status).toBe(0)
      expect(`${result.stderr}${result.stdout}`).toMatch(/已补齐契约/)
      expect(`${result.stderr}${result.stdout}`).toMatch(/--write-baseline/)
    } finally {
      fs.rmSync(ONLINE_PROBE, { force: true })
      if (fs.existsSync(ONLINE_AGENT_DIR) && fs.readdirSync(ONLINE_AGENT_DIR).length === 0) {
        fs.rmdirSync(ONLINE_AGENT_DIR)
      }
    }
  })
})
