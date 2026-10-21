import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(__dirname, "../..")
const SCRIPT = "scripts/check-doc-claims.cjs"
const VICTIM = "docs/02_requirements/rtm-traceability-matrix.md"

function runGate(): { status: number; output: string } {
  try {
    const output = execFileSync("node", [SCRIPT], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, output }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

describe("docs:claims:check —— 文档声明必须对标真源", () => {
  it("当前文档与真源一致（exit 0）", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.output).toContain("[doc-claims] ✓")
  })

  it("反向对照：把「活跃规格」改错，门禁必须失败", () => {
    const abs = path.join(ROOT, VICTIM)
    const original = fs.readFileSync(abs, "utf8")
    const broken = original.replace(/## 4\. 活跃规格（\d+ 份/, "## 4. 活跃规格（8 份）".replace("）", ""))
    // 断言替换真的发生了，否则这个"反向对照"本身就是空转的
    expect(broken).not.toBe(original)

    try {
      fs.writeFileSync(abs, broken)
      const result = runGate()
      expect(result.status).toBe(1)
      expect(result.output).toContain("活跃规格数")
      expect(result.output).toContain("真源实测")
    } finally {
      fs.writeFileSync(abs, original)
    }

    // 还原后必须回绿 —— 证明失败来自注入，而不是别处
    expect(runGate().status).toBe(0)
  })

  it("真源缺失时失败而不是静默通过", () => {
    const script = fs.readFileSync(path.join(ROOT, SCRIPT), "utf8")
    // 真源读取必须显式抛错，且主流程必须捕获后 exit 1
    expect(script).toContain("真源缺失")
    expect(script).toContain("process.exit(1)")
    expect(script).not.toMatch(/catch\s*\([^)]*\)\s*\{\s*\}/)
  })
})
