import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const SCRIPT = "scripts/harness-health.cjs"
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "harness-health-"))

afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

/**
 * 金丝雀自检（`npm run harness:health`）。
 *
 * 它守的是一个**很容易被忽略的事实**：配置合法 ≠ 生效。
 * CLI 可能 schema 变更、首次未 allowlist、cwd 不同找不到脚本、matcher 拼错、
 * 或者干脆没装 —— 这些情况下 `npm run check` 全绿，但守卫形同虚设。
 *
 * 机制：守卫每次被调用写一行心跳；本脚本把心跳与配置交叉核对。
 */
let seq = 0
function heartbeat(events: Array<Record<string, unknown>>): string {
  seq += 1
  const file = path.join(TMP, `hb-${seq}.jsonl`)
  fs.writeFileSync(file, events.map((event) => JSON.stringify(event)).join("\n") + "\n")
  return file
}

function run(file: string, args: string[] = []): { status: number; out: string } {
  try {
    const out = execFileSync("node", [SCRIPT, ...args], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, AGENT_ROUTE_HEARTBEAT: file },
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, out }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

const now = () => new Date().toISOString()
const old = () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

describe("Harness 接线健康检查（金丝雀）", () => {
  it("没有任何心跳 → 报告出来，且 --require 会失败", () => {
    const file = path.join(TMP, "empty.jsonl")
    fs.writeFileSync(file, "")
    const result = run(file, ["--require", "cmd"])
    expect(result.status).toBe(1)
    expect(result.out).toMatch(/没有心跳/)
  })

  it("有心跳 → --require 通过", () => {
    const file = heartbeat([{ at: now(), kind: "cmd", decision: "allow", protocol: "exit2", file: "" }])
    const result = run(file, ["--require", "cmd"])
    expect(result.status).toBe(0)
    expect(result.out).toMatch(/PASS/)
  })

  it("★ 老心跳不算数（窗口过滤）—— 否则「配置在但半年没跑过」会被误判为健康", () => {
    const file = heartbeat([{ at: old(), kind: "cmd", decision: "allow", protocol: "exit2", file: "" }])
    const result = run(file, ["--require", "cmd", "--window", "60"])
    expect(result.status).toBe(1)
  })

  it("★ 配了但没跑过 → 标记为可疑（这正是「配置合法 ≠ 生效」的可见化）", () => {
    const file = heartbeat([{ at: now(), kind: "agy", decision: "deny", protocol: "antigravity", file: "/x/packages/a.ts" }])
    const result = run(file)
    expect(result.status).toBe(0)
    expect(result.out).toMatch(/⚠️.*claude|claude.*⚠️|配置在但从未触发/)
    expect(result.out).toMatch(/agy/)
  })

  it("统计拦截次数（证明守卫真的拦过，而不只是被调用过）", () => {
    const file = heartbeat([
      { at: now(), kind: "cmd", decision: "deny", protocol: "exit2", file: "/x/packages/a.ts" },
      { at: now(), kind: "cmd", decision: "allow", protocol: "exit2", file: "" },
    ])
    const result = run(file)
    expect(result.out).toMatch(/拦截 1/)
  })
})
