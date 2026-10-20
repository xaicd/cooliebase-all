import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const HOOK = path.join(ROOT, ".agents/hooks/spec-gate.sh")
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "spec-gate-test-"))

afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

/**
 * 跨 CLI 守卫 `.agents/hooks/spec-gate.sh`。
 *
 * 它只用 **stdin JSON + exit 2 + stderr** —— 这是实测确认的三家通用协议：
 * Command Code 文档规定 PreToolUse `exit 2` 跳过工具；Hermes 源码注释写明
 * `Exit code 2 blocks a pre_tool_call even without JSON (Claude-Code / Cursor)`。
 *
 * 载荷差异是**实测**出来的（不是猜）：cmd/Claude 用 `tool_input.file_path`，
 * Hermes 用 `args.path`。只支持一种就会在其中一家静默失效 —— 而"静默失效"正是本仓最怕的形态。
 */
function runHook(payload: unknown, env: Record<string, string> = {}): number {
  try {
    execFileSync("bash", [HOOK], {
      cwd: ROOT,
      input: JSON.stringify(payload),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, AGENT_ROUTE_ARTIFACT: path.join(TMP, "agent-route-last.json"), ...env },
    })
    return 0
  } catch (error) {
    return (error as { status?: number }).status ?? 1
  }
}

function writeRecord(verdict: string) {
  const record = path.join(TMP, "agent-route-last.json")
  fs.writeFileSync(record, JSON.stringify({ verdict, at: new Date().toISOString() }))
  return record
}

describe("跨 CLI 规格守卫（exit 2 协议）", () => {
  it("CMD/Claude 载荷（tool_input.file_path）命中受保护路径且需规格 → exit 2", () => {
    writeRecord("SPEC_REQUIRED")
    expect(runHook({ tool_name: "write_file", tool_input: { file_path: `${ROOT}/packages/x.ts` } })).toBe(2)
  })

  it("★ Hermes 载荷（args.path）同样要能拦住 —— 字段名不同，只认一种就会静默失效", () => {
    writeRecord("SPEC_REQUIRED")
    expect(runHook({ tool_name: "write_file", args: { path: `${ROOT}/packages/x.ts` } })).toBe(2)
  })

  /**
   * ★ Antigravity (agy) 的协议**不一样**：它不看退出码，而是读 stdout 上的 JSON
   *   `{"decision":"deny"|"allow"|"ask"|"force_ask","reason":"..."}`
   * （取自 agy 二进制内嵌的 hooks 文档）。载荷是 `{"toolCall":{"args":{"TargetFile":...}}}`。
   * 只按 exit 2 处理就会在 agy 上**静默放行** —— 故单列一条用例。
   */
  it("★ Antigravity 载荷（toolCall.args.TargetFile）→ stdout 返回 deny JSON，且退出码为 0", () => {
    writeRecord("SPEC_REQUIRED")
    const payload = {
      toolCall: { name: "write_to_file", args: { TargetFile: `${ROOT}/packages/x.ts` } },
      stepIdx: 1,
    }
    let stdout = ""
    try {
      stdout = execFileSync("bash", [HOOK], {
        cwd: ROOT,
        input: JSON.stringify(payload),
        encoding: "utf8",
        env: { ...process.env, AGENT_ROUTE_ARTIFACT: path.join(TMP, "agent-route-last.json") },
      })
    } catch (error) {
      throw new Error(`Antigravity 协议应以 exit 0 + stdout JSON 表达拦截，实际抛错: ${String(error)}`)
    }
    const decision = JSON.parse(stdout) as { decision: string; reason: string }
    expect(decision.decision).toBe("deny")
    expect(decision.reason).toMatch(/需要规格|SPEC_REQUIRED/)
  })

  it("非受保护路径 → 放行", () => {
    writeRecord("SPEC_REQUIRED")
    expect(runHook({ tool_input: { file_path: `${ROOT}/docs/notes.md` } })).toBe(0)
  })

  it("分诊判为 DIRECT_OK → 放行（不为流程拖住小改）", () => {
    writeRecord("DIRECT_OK")
    expect(runHook({ tool_input: { file_path: `${ROOT}/packages/x.ts` } })).toBe(0)
  })

  it("分诊判为 NOT_A_REQUIREMENT → 放行", () => {
    writeRecord("NOT_A_REQUIREMENT")
    expect(runHook({ tool_input: { file_path: `${ROOT}/packages/x.ts` } })).toBe(0)
  })

  it("逃生阀 AGENT_ROUTE_SKIP=1 → 放行", () => {
    writeRecord("SPEC_REQUIRED")
    expect(
      runHook({ tool_input: { file_path: `${ROOT}/packages/x.ts` } }, { AGENT_ROUTE_SKIP: "1" }),
    ).toBe(0)
  })

  it("没有分诊记录时不拦（避免在尚未接入的仓库里卡死）", () => {
    const absent = path.join(TMP, "absent-record.json")
    if (fs.existsSync(absent)) fs.rmSync(absent)
    expect(
      runHook({ tool_input: { file_path: `${ROOT}/packages/x.ts` } }, { AGENT_ROUTE_ARTIFACT: absent }),
    ).toBe(0)
  })
})
