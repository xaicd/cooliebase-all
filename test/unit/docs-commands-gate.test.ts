import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-docs-commands.cjs"

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
 * 文档命令真实性门禁。
 *
 * 它守的是"文档里写的 `npm run X`，X 真的存在"。这类漂移不会让别的门禁变红，
 * 但照着文档操作就是报错 —— 已实证：`AGENTS.md` 的发布门禁让人跑不存在的
 * `docs:sync-context`，`.kiro/steering/feature-scaffold.md` 让人跑 `feature:generate`（真名 `scaffold`）。
 */
describe("文档命令真实性门禁", () => {
  function withInjected<T>(file: string, injected: string, body: () => T): T {
    const target = path.join(ROOT, file)
    const original = fs.readFileSync(target, "utf8")
    try {
      fs.writeFileSync(target, `${original}\n\n${injected}\n`)
      return body()
    } finally {
      fs.writeFileSync(target, original)
      if (fs.readFileSync(target, "utf8") !== original) throw new Error(`${file} 未逐字还原`)
    }
  }

  it("正向：受检文档中的命令引用全部真实存在", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
  })

  it("★ 反向 1：受检文档里写入不存在的脚本 → 必须失败", () => {
    withInjected("AGENTS.md", "临时：`npm run __definitely_not_a_script__`", () => {
      const result = runGate()
      expect(result.status).toBe(1)
      expect(`${result.stderr}${result.stdout}`).toMatch(/__definitely_not_a_script__/)
    })
  })

  it("★ 反向 2：历史/施工区（docs/specs）里写入不存在的脚本 → **不应**失败", () => {
    // 这条对照同样重要：它证明"跳过历史区"是**真实生效**的，
    // 而不是门禁其实什么都没检查却报绿。
    const specDir = path.join(ROOT, "docs", "specs", "infra", "mcp-write-tools")
    const target = path.join(specDir, "__docs-cmd-probe__.md")
    try {
      fs.writeFileSync(target, "临时：`npm run __also_not_a_script__`\n")
      const result = runGate()
      expect(result.status).toBe(0)
    } finally {
      fs.rmSync(target, { force: true })
    }
  })

  it("★ 反向 3：`pnpm run X` 不应被误判为 `npm run X`", () => {
    // `(?<![pP])` 前瞻的真正用途：本仓大量使用 pnpm，若误判会逼出无意义豁免。
    withInjected("AGENTS.md", "临时：`pnpm run __pnpm_only_script__`", () => {
      const result = runGate()
      expect(result.status).toBe(0)
    })
  })
})
