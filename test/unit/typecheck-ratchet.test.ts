import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(__dirname, "../..")
const SCRIPT = "scripts/check-typecheck-ratchet.cjs"
// 注入点必须在 tsc 的 include 范围内（实测：`test/**` 被包含 —— 基线的 byDir 里有 `test/e2e`）。
// 用**非 .test.ts** 名字，避免被 vitest 当成用例收集。
const PROBE = path.join(ROOT, "test/unit/_probe-typecheck-ratchet.ts")

function runGate(): { status: number; out: string } {
  try {
    const out = execFileSync("node", [SCRIPT], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, out }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

describe("typecheck 棘轮：只拦新增", () => {
  it("当前代码在基线上 → exit 0", () => {
    const { status, out } = runGate()
    expect(status).toBe(0)
    expect(out).toContain("无新增类型错误")
  }, 180_000)

  it("注入一个类型错误 → 必须 exit 1 且点名该文件", () => {
    // 这是本 spec 的核心判据：门禁如果不红，那它只是装饰。
    const broken = 'export const probe: number = "not-a-number"\n'
    try {
      fs.writeFileSync(PROBE, broken)
      const { status, out } = runGate()
      expect(status).toBe(1)
      expect(out).toContain("新增")
      expect(out).toContain("_probe-typecheck-ratchet")
    } finally {
      fs.rmSync(PROBE, { force: true })
    }

    // 清理后必须回绿 —— 证明失败来自注入，而不是别的
    expect(runGate().status).toBe(0)
  }, 240_000)

  it("基线缺失时必须 exit 2（不允许「找不到基线 ⇒ 静默通过」）", () => {
    const src = fs.readFileSync(path.join(ROOT, SCRIPT), "utf8")
    expect(src).toContain("基线缺失")
    expect(src).toContain("process.exit(2)")
    // 反向：确认它没有把"缺失"当成"通过"
    expect(src).not.toMatch(/基线缺失[\s\S]{0,120}process\.exit\(0\)/)
  }, 30_000)
})
