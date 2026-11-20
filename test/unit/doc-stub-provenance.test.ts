import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const SCRIPT = path.resolve(__dirname, "../../scripts/check-doc-stub-provenance.cjs")

function runGate(root: string): { code: number; out: string } {
  try {
    const out = execFileSync("node", [SCRIPT, "--root", root], { encoding: "utf8" })
    return { code: 0, out }
  } catch (err: any) {
    return { code: err.status ?? 1, out: (err.stderr || "") + (err.stdout || "") }
  }
}

function makeRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stub-prov-"))
  fs.mkdirSync(path.join(root, "docs/02_requirements"), { recursive: true })
  fs.writeFileSync(path.join(root, "README.md"), "# fixture\n")
  return root
}

describe("check-doc-stub-provenance", () => {
  it("阶段产物缺溯源头 → 红线", () => {
    const root = makeRoot()
    fs.writeFileSync(path.join(root, "docs/02_requirements/req.md"), "# 需求\n\n正文\n")
    const r = runGate(root)
    expect(r.code).toBe(1)
    expect(r.out).toContain("req.md: 缺「> 上游真源")
  })

  it("溯源指针在仓内不存在（编造出处）→ 红线", () => {
    const root = makeRoot()
    fs.writeFileSync(path.join(root, "docs/02_requirements/ghost.md"), "# G\n\n> 上游真源: docs/no-such.md\n")
    const r = runGate(root)
    expect(r.code).toBe(1)
    expect(r.out).toContain(`在仓内不存在`)
  })

  it("有真实溯源头 + 仓内存在 → 放行；自指 → 红线", () => {
    const root = makeRoot()
    fs.writeFileSync(
      path.join(root, "docs/02_requirements/ok.md"),
      "# OK\n\n> 上游真源: README.md\n\n" + "内容行\n".repeat(16),
    )
    fs.mkdirSync(path.join(root, "docs/07_release"), { recursive: true })
    fs.writeFileSync(path.join(root, "docs/07_release/self.md"), "# S\n\n> 上游真源: docs/07_release/self.md\n\n正文\n")
    const r = runGate(root)
    expect(r.out).not.toContain("ok.md") // ok.md 不出现在违规里
    expect(r.out).toContain("self.md: 上游真源指向自己")
    expect(r.code).toBe(1)
  })

  it("空阶段目录（派生早期）→ 放行", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "stub-prov-empty-"))
    const r = runGate(root)
    expect(r.code).toBe(0)
  })
})
