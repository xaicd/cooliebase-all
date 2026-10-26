import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

const ROOT = path.resolve(__dirname, "../..")
const HARNESS = path.join(ROOT, "scripts/harness.cjs")
const CHECK = path.join(ROOT, "scripts/check-harness-trunk-dispatch.cjs")

function runCheck(): { code: number; out: string } {
  try {
    const out = execFileSync(process.execPath, [CHECK], { cwd: ROOT, encoding: "utf8" })
    return { code: 0, out }
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` }
  }
}

/** 改 harness.cjs 跑一次，无论成败都还原；还原后必须与原文逐字节相同 */
function withMutatedHarness(mutate: (src: string) => string): { code: number; out: string } {
  const original = fs.readFileSync(HARNESS, "utf8")
  try {
    fs.writeFileSync(HARNESS, mutate(original))
    return runCheck()
  } finally {
    fs.writeFileSync(HARNESS, original)
    expect(fs.readFileSync(HARNESS, "utf8")).toBe(original)
  }
}

describe("harness-trunk-dispatch：主干表与分派必须一致", () => {
  it("当前仓是绿的，且真的解析出了主干（不是「解析不到就算过」）", () => {
    const { code, out } = runCheck()
    expect(code).toBe(0)
    const m = out.match(/主干 (\d+) 条/)
    expect(m).toBeTruthy()
    expect(Number(m![1])).toBeGreaterThanOrEqual(8)
    for (const t of ["route", "spec", "check", "test", "e2e", "deliver", "agent", "ops", "evolve"]) {
      expect(out).toContain(t)
    }
  })

  it("反向对照①：表里加一条「假广告」（没有对应 case）必须红", () => {
    const { code, out } = withMutatedHarness((src) =>
      src.replace(
        /^(\s*\["route",)/m,
        '  ["ghost-trunk", "pnpm harness ghost-trunk", "故意加的假广告（测试注入）"],\n$1',
      ),
    )
    expect(code).toBe(1)
    expect(out).toContain("假广告")
    expect(out).toContain("ghost-trunk")
  })

  it("反向对照②：加一个「隐藏能力」（有 case 但表里没有）必须红", () => {
    const { code, out } = withMutatedHarness((src) =>
      src.replace(/^(\s*case "doctor":)/m, '$1\n    case "ghost-hidden":\n      return 0'),
    )
    expect(code).toBe(1)
    expect(out).toContain("隐藏能力")
    expect(out).toContain("ghost-hidden")
  })

  it("反向对照③：主干表被清空必须红（不许静默通过）", () => {
    const { code, out } = withMutatedHarness((src) =>
      src.replace(/^\s*\["[a-z][a-z0-9-]*",\s*"pnpm harness.*$/gm, ""),
    )
    expect(code).toBe(1)
    expect(out).toContain("0 条")
  })
})
