import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(__dirname, "../..")

/**
 * 「没有测试文件是没人跑的」
 *
 * 为什么需要它：实测发现 480 个测试文件里**只有 54 个**被具名入口
 * （`test:unit` / `test:integration` / `test:contract` / `test:matrix`）
 * 选中 —— 其余 426 个只靠全量 `pnpm run test` 兜底。
 * AGENTS §8.1 声称「L1–L4 各有入口」，但域/插件测试其实不在任何一层。
 *
 * 修入口只解决当前这批；这个测试保证**将来新增的测试**不会再落进盲区。
 */

/** 从 `vitest run <paths>` / `playwright test <paths>` 里取出路径参数 */
function pathArgs(command: string): string[] {
  const SHELL_OPS = new Set(["&&", "||", ";"])
  // 复合命令（`A && B`）逐段解析：每段自成一个入口，避免把 `&&` 当成路径参数
  const segments: string[] = []
  let current: string[] = []
  for (const token of command.split(/\s+/).filter(Boolean)) {
    if (SHELL_OPS.has(token)) {
      if (current.length) segments.push(current.join(" "))
      current = []
      continue
    }
    current.push(token)
  }
  if (current.length) segments.push(current.join(" "))

  const out: string[] = []
  for (const seg of segments) {
    if (!seg.startsWith("vitest run") && !seg.startsWith("playwright test")) continue
    out.push(...seg.split(/\s+/).slice(2).filter((a) => a && !a.startsWith("-")))
  }
  return out
}

function namedEntries(): Record<string, string[]> {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
    scripts: Record<string, string>
  }
  const out: Record<string, string[]> = {}
  for (const [name, cmd] of Object.entries(pkg.scripts)) {
    if (!name.startsWith("test:")) continue
    const args = pathArgs(cmd)
    if (args.length) out[name] = args
  }
  return out
}

/** 是否被某条具名入口选中（按目录前缀包含判断 —— vitest 的位置参数就是前缀匹配） */
function isCovered(file: string, entries: Record<string, string[]>): boolean {
  return Object.values(entries).some((paths) =>
    paths.some((p) => file === p || file.startsWith(`${p.replace(/\/+$/, "")}/`)),
  )
}

function trackedTestFiles(): string[] {
  return execFileSync("git", ["ls-files", "*.test.ts", "*.test.tsx"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((f) => !f.includes("node_modules") && !f.startsWith(".claude/worktrees/"))
}

describe("测试入口覆盖：没有测试文件是没人跑的", () => {
  it("每个已跟踪的 *.test.ts 至少被一个具名 test:* 入口选中", () => {
    const entries = namedEntries()
    const files = trackedTestFiles()
    expect(files.length).toBeGreaterThan(0)

    const uncovered = files.filter((f) => !isCovered(f, entries))
    expect(
      uncovered,
      `以下测试文件不被任何具名入口（${Object.keys(entries).join(" / ")}）选中，\n` +
        `只靠全量 pnpm run test 兜底 —— 请把它们纳入某个入口，或补一个入口：\n` +
        uncovered.map((f) => `  · ${f}`).join("\n"),
    ).toEqual([])
  })

  it("反向对照：匹配器不是恒真 —— 入口之外的路径必须判为未覆盖", () => {
    const entries = namedEntries()
    // 真实存在的入口路径应当判为覆盖
    expect(isCovered("test/unit/doc-claims-gate.test.ts", entries)).toBe(true)
    // 构造一个明确在入口之外的路径 —— 若匹配器恒真，这条会失败
    expect(isCovered("somewhere/else/not-in-any-entry.test.ts", entries)).toBe(false)
    expect(isCovered("docs/specs/infra/mcp-write-tools/brief.test.ts", entries)).toBe(false)
  })

  it("入口自身不能是空壳（路径参数非空且目录真实存在）", () => {
    const entries = namedEntries()
    expect(Object.keys(entries).length).toBeGreaterThanOrEqual(4)
    for (const [name, paths] of Object.entries(entries)) {
      expect(paths.length, `${name} 没有路径参数`).toBeGreaterThan(0)
      for (const p of paths) {
        expect(fs.existsSync(path.join(ROOT, p)), `${name} 的路径参数不存在: ${p}`).toBe(true)
      }
    }
  })
})
