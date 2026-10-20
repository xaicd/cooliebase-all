import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const SCRIPT = path.join(ROOT, "scripts/setup-git-hooks.cjs")
const tmp: string[] = []

afterAll(() => {
  for (const dir of tmp) fs.rmSync(dir, { recursive: true, force: true })
})

/**
 * 启用仓库自带 git 钩子。
 *
 * 为什么需要：`core.hooksPath` 存在 **`.git/config`** —— **本机配置、不可提交**。
 * 也就是说 `.githooks/pre-commit` 虽然随仓分发，但**新克隆 / 别人的机器上根本不会生效**；
 * 而这一层恰恰是"跨 CLI 的唯一兜底"（hooks 是每家 CLI 一套，只有 git 是所有 agent 的必经之路）。
 *
 * 脚本必须：幂等 · 不是 git 仓库时静默跳过（degit 场景）· 设置失败也不阻断安装。
 */
function sandbox(withGit: boolean): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "setup-hooks-"))
  tmp.push(dir)
  fs.mkdirSync(path.join(dir, ".githooks"), { recursive: true })
  fs.writeFileSync(path.join(dir, ".githooks", "pre-commit"), "#!/bin/sh\n")
  fs.chmodSync(path.join(dir, ".githooks", "pre-commit"), 0o755)
  if (withGit) {
    spawnSync("git", ["init", "-q"], { cwd: dir })
    spawnSync("git", ["config", "user.email", "t@example.com"], { cwd: dir })
    spawnSync("git", ["config", "user.name", "t"], { cwd: dir })
  }
  return dir
}

function run(dir: string): { status: number; out: string } {
  try {
    const out = execFileSync("node", [SCRIPT], {
      encoding: "utf8",
      cwd: dir,
      env: { ...process.env, SETUP_HOOKS_ROOT: dir },
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, out }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

describe("git 钩子启用脚本", () => {
  it("是 git 仓库时启用 .githooks", () => {
    const dir = sandbox(true)
    const result = run(dir)
    expect(result.status).toBe(0)
    expect(result.out).toMatch(/已启用/)
    const value = spawnSync("git", ["config", "--local", "--get", "core.hooksPath"], {
      cwd: dir,
      encoding: "utf8",
    }).stdout.trim()
    expect(value).toBe(".githooks")
  })

  it("★ 幂等：已设置时不重复改动，报告已是启用状态", () => {
    const dir = sandbox(true)
    run(dir)
    const second = run(dir)
    expect(second.status).toBe(0)
    expect(second.out).toMatch(/已启用/)
  })

  it("★ 不是 git 仓库（degit / tarball 场景）→ 静默跳过，不算失败", () => {
    const dir = sandbox(false)
    const result = run(dir)
    expect(result.status).toBe(0)
    expect(result.out.trim()).toBe("")
  })
})
