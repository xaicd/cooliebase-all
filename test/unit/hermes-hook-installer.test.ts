import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const SCRIPT = "scripts/install-hermes-hook.cjs"

/**
 * Hermes hook 安装脚本。
 *
 * 它改的是**用户级全局配置** `~/.hermes/config.yaml`（Hermes 没有项目级 hooks 入口，
 * 源码 `_parse_hooks_block` 只读 config）—— 所以安全性比功能更重要，三条必须成立：
 *   1. **默认 dry-run**：不加 `--write` 绝不落盘；
 *   2. **已有 `hooks:` 段时拒绝**：追加会造成 YAML 重复键，宁可让人工合并；
 *   3. **写入前备份**。
 * 任何一条失效，都可能悄悄改坏用户其他项目的配置。
 */
function sandbox(configText: string): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "hermes-inst-"))
  fs.mkdirSync(path.join(home, ".hermes"), { recursive: true })
  fs.writeFileSync(path.join(home, ".hermes", "config.yaml"), configText)
  return home
}

function run(home: string, args: string[] = []): { status: number; out: string } {
  try {
    const out = execFileSync("node", [SCRIPT, ...args], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, HOME: home },
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, out }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

const homes: string[] = []
afterAll(() => {
  for (const home of homes) fs.rmSync(home, { recursive: true, force: true })
})

describe("Hermes hook 安装脚本", () => {
  it("默认 dry-run：打印将追加的内容，但**不落盘**", () => {
    const home = sandbox("model: x\n")
    homes.push(home)
    const before = fs.readFileSync(path.join(home, ".hermes/config.yaml"), "utf8")
    const result = run(home)
    expect(result.status).toBe(0)
    expect(result.out).toMatch(/dry-run/)
    expect(result.out).toMatch(/pre_tool_call/)
    expect(fs.readFileSync(path.join(home, ".hermes/config.yaml"), "utf8")).toBe(before)
  })

  it("★ 已有顶层 hooks: 段时**拒绝**（追加会产生重复键，宁可让人工合并）", () => {
    const home = sandbox("hooks:\n  post_tool_call: []\n")
    homes.push(home)
    const result = run(home, ["--write"])
    expect(result.status).toBe(1)
    expect(result.out).toMatch(/已经有/)
    const text = fs.readFileSync(path.join(home, ".hermes/config.yaml"), "utf8")
    expect(text.match(/^hooks:/gm)?.length).toBe(1) // 没有被写第二份
  })

  it("--write：先备份再追加，且内容包含守卫脚本的绝对路径", () => {
    const home = sandbox("model: x\n")
    homes.push(home)
    const result = run(home, ["--write"])
    expect(result.status).toBe(0)
    expect(result.out).toMatch(/已写入/)
    const dir = path.join(home, ".hermes")
    const backups = fs.readdirSync(dir).filter((name) => name.includes("bak-cooliebase"))
    expect(backups.length).toBe(1)
    const text = fs.readFileSync(path.join(dir, "config.yaml"), "utf8")
    expect(text).toMatch(/spec-gate\.sh/)
    expect(text).toMatch(/fail_closed: true/)
  })
})
