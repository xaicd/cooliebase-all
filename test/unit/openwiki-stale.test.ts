import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GENERATOR = "scripts/sync-openwiki.cjs"
/** 已无对应元数据的词条 —— 生成器此前**只写不删**，这类文件会永远留着。 */
const STALE = path.join(ROOT, "wiki", "domains", "__stale_probe__.md")

function runOpenwiki(flag: string): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GENERATOR, flag], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

/**
 * OpenWiki 生成器的"陈旧词条"处理。
 *
 * 为什么必须有：生成器只写不删 —— 某个域被裁掉后，它的 `wiki/domains/<域>.md` 会永远留着，
 * 继续引用已不存在的 `packages/plugins/plugin-<域>/`。
 * 实测（2026-10-20，`project:create --profile minimal`）：产物自身的 `pnpm run check` exit=1，
 * 报 374 处悬空引用、全部来自被裁域的 wiki 页面。此后端到端才绿。
 */
describe("OpenWiki 生成器: 陈旧词条必须被清掉", () => {
  it("当前仓库为绿（无陈旧词条）", () => {
    const { status, stdout } = runOpenwiki("--check")
    expect(status).toBe(0)
    expect(stdout).toContain("PASS")
  })

  it("反向对照：手工放一个陈旧词条，check 必须报红、--write 必须删掉", () => {
    expect(fs.existsSync(STALE), "探针文件不应预先存在").toBe(false)
    try {
      fs.writeFileSync(STALE, "# stale probe\n\n引用了不存在的 `packages/plugins/plugin-__gone__/`\n", "utf8")

      const checked = runOpenwiki("--check")
      expect(checked.status).toBe(1)
      expect(`${checked.stdout}${checked.stderr}`).toContain("陈旧词条")

      const written = runOpenwiki("--write")
      expect(written.status).toBe(0)
      expect(fs.existsSync(STALE), "--write 应删除陈旧词条").toBe(false)
    } finally {
      fs.rmSync(STALE, { force: true })
    }

    expect(runOpenwiki("--check").status).toBe(0)
  })
})
