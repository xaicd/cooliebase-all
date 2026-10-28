import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, describe, expect, it } from "vitest"

/**
 * `docs:claims:check` 的反向对照 —— 证明它对 `docs/architecture/` 真的在管。
 *
 * ## 动机
 *
 * 2026-10-28 把扫描面从 2 个目录扩到 3 个（加 `docs/architecture/`），
 * 当天就抓到一处真漂移：架构文档里的「326 份契约」实际已是 342。
 * 但"这次抓到了"不等于"以后能抓到" —— 所以要有一条**能失败**的对照。
 *
 * 探针把一份带假数字的文档写进 `docs/architecture/`，跑门禁，要求 **exit 1**，
 * 并且报错里要点名是哪个数、真值是多少；`finally` 里删干净。
 */

const ROOT = path.resolve(__dirname, "../..")
const SCRIPT = path.join(ROOT, "scripts/check-doc-claims.cjs")
const PROBE = path.join(ROOT, "docs/architecture/__claims-probe__.md")

function runGate(): { code: number; out: string } {
  try {
    return { code: 0, out: execFileSync("node", [SCRIPT], { cwd: ROOT, encoding: "utf8", stdio: "pipe" }) }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

afterAll(() => {
  fs.rmSync(PROBE, { force: true })
})

describe("docs:claims 对 docs/architecture 的管辖", () => {
  it("正向：当前仓库无漂移 → exit 0", () => {
    const r = runGate()
    expect(r.code, `门禁应当通过，实际输出：\n${r.out.slice(0, 600)}`).toBe(0)
  })

  it("反向对照：架构文档里写错 agent 契约数 → 必须 exit 1，并点名真值", () => {
    try {
      // 故意写一个不可能对的值；名词必须写全（只写「N 份契约」是歧义的，规则不认）
      fs.writeFileSync(PROBE, ["# 探针文档", "", "本基座自动读取 999 份 agent 契约。", ""].join("\n"))
      const r = runGate()
      expect(r.code, "架构文档里的假数字必须被拦下，否则扩扫描面只是摆设").toBe(1)
      expect(r.out, "报错里应当说明真值是多少").toContain("342")
    } finally {
      fs.rmSync(PROBE, { force: true })
    }
  })

  it("还原后仍然通过 —— 确认失败不是探针之外的东西造成的", () => {
    expect(runGate().code).toBe(0)
  })
})
