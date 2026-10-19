import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-version-consistency.cjs"
const PKG = path.join(ROOT, "package.json")
const RELEASE_DIR = path.join(ROOT, "docs", "07_release")

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
 * 版本一致性门禁：守的是**策略**，不是"把版本号对齐"。
 *
 * 本仓刻意区分「渠道版本（tag，可带语义后缀）」与「模板版本（package/compat）」，
 * 依据 `RELEASE_NOTES_v1.4.0-brand-shorthand.md` 的 R3/R11。故此处断言：
 *   ① 模板版本两处同步；
 *   ② 最新 tag 有发布说明；
 *   ③ tag 与模板版本不同时，发布说明必须记录策略。
 * 每条都要有**会失败**的反向对照 —— 否则就是又一个"看起来在跑"的空壳门禁。
 */
describe("版本一致性门禁", () => {
  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
  })

  it("★ 反向 1：模板版本不同步 → 必须失败", () => {
    const original = fs.readFileSync(PKG, "utf8")
    try {
      const parsed = JSON.parse(original)
      parsed.version = "9.9.9"
      fs.writeFileSync(PKG, `${JSON.stringify(parsed, null, 2)}\n`)
      const result = runGate()
      expect(result.status).not.toBe(0)
      expect(result.stderr).toMatch(/template-version-desync/)
    } finally {
      fs.writeFileSync(PKG, original)
    }
    expect(runGate().status).toBe(0)
  })

  it("★ 反向 2：最新 tag 没有发布说明 → 必须失败", () => {
    const notes = fs
      .readdirSync(RELEASE_DIR)
      .filter((name) => /^RELEASE_NOTES_.*\.md$/.test(name) && name.includes("v1.4.0"))
    expect(notes.length, "缺少 v1.4.0 发布说明，反向对照无法成立").toBeGreaterThan(0)

    const target = path.join(RELEASE_DIR, notes[0])
    const stashed = `${target}.test-stashed`
    fs.renameSync(target, stashed)
    try {
      const result = runGate()
      expect(result.status).not.toBe(0)
      expect(result.stderr).toMatch(/release-notes-missing/)
    } finally {
      fs.renameSync(stashed, target)
    }
    expect(runGate().status).toBe(0)
  })
})
