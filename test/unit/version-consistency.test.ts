import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * 版本一致性门禁：守的是**策略**，不是"把版本号对齐"。
 *
 * 本仓刻意区分「渠道版本（tag，可带语义后缀）」与「模板版本（package/compat）」，
 * 依据 `docs/07_release/release-notes.md` 的版本与渠道标签策略台账。故此处断言：
 *   ① 模板版本两处同步；
 *   ② 最新 tag 有发布说明登记；
 *   ③ tag 与模板版本不同时，发布说明必须记录 `templateVersion` 策略。
 */

const GATE = "scripts/check-version-consistency.cjs"
const PKG = "package.json"
const UNIFIED_NOTES = "docs/07_release/release-notes.md"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("version")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = () => root.run(GATE)

describe("版本一致性门禁（跑在隔离根上）", () => {
  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.code).toBe(0)
    expect(result.out).toMatch(/PASS/)
  }, 120_000)

  it("★ 反向 1：模板版本不同步 → 必须失败", () => {
    const original = root.read(PKG)
    try {
      const parsed = JSON.parse(original)
      parsed.version = "9.9.9"
      root.write(PKG, `${JSON.stringify(parsed, null, 2)}\n`)
      const result = runGate()
      expect(result.code).not.toBe(0)
      expect(result.out).toMatch(/template-version-desync/)
    } finally {
      root.write(PKG, original)
    }
    expect(runGate().code).toBe(0)
  }, 120_000)

  it("★ 反向 2：最新 tag 没有发布说明登记 → 必须失败", () => {
    const original = root.read(UNIFIED_NOTES)
    try {
      root.remove(UNIFIED_NOTES)
      const result = runGate()
      expect(result.code).not.toBe(0)
      expect(result.out).toMatch(/release-notes-missing/)
    } finally {
      root.write(UNIFIED_NOTES, original)
    }
    expect(runGate().code).toBe(0)
  }, 120_000)

  it("★ 反向 3：tag 与模板版本不同但未声明 templateVersion 策略 → 必须失败", () => {
    const original = root.read(UNIFIED_NOTES)
    try {
      root.write(UNIFIED_NOTES, original.replace(/templateVersion/g, "versionField"))
      const result = runGate()
      expect(result.code).not.toBe(0)
      expect(result.out).toMatch(/version-divergence-undocumented/)
    } finally {
      root.write(UNIFIED_NOTES, original)
    }
    expect(runGate().code).toBe(0)
  }, 120_000)
})
