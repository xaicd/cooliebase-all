import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))

/**
 * 各家 CLI 的 hook **接线正确性**。
 *
 * 为什么需要：hook 脚本本身有测试，但"配置有没有把它接对"没人守 ——
 * 而这正是最容易静默出错的一环（本轮就踩过：agy 的相对路径假设、
 * cmd 与 Hermes 的字段名不同、Claude 的 `$CLAUDE_PROJECT_DIR` 展开）。
 *
 * 这里只断言**可静态验证**的部分：JSON 合法、引用了本仓真实存在的脚本、
 * 命令里不出现明显的相对路径歧义。
 */
function readJson(rel: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")) as Record<string, unknown>
}

/** 从各家配置里抽出所有 command 字符串 */
function commands(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) commands(item, out)
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "command" && typeof value === "string") out.push(value)
      else commands(value, out)
    }
  }
  return out
}

describe("各家 CLI hook 接线", () => {
  const configs = [
    [".commandcode/settings.json", "cmd"],
    [".agents/hooks.json", "agy"],
    [".claude/settings.json", "Claude Code"],
  ] as const

  for (const [rel, name] of configs) {
    it(`${name} 的 ${rel} 合法且指向真实存在的脚本`, () => {
      const config = readJson(rel)
      const list = commands(config)
      expect(list.length).toBeGreaterThan(0)

      for (const command of list) {
        // 取出命令里的脚本路径（去掉 $VAR 与引号），断言本仓确实有它
        const script = command
          .replace(/"\$(?:CLAUDE|COMMANDCODE)_PROJECT_DIR"\/?/g, "")
          .replace(/^\.\//, "")
          .trim()
        const candidates = [
          path.join(ROOT, script),                 // 相对仓库根（cmd / Claude）
          path.join(ROOT, ".agents", script),      // 相对 hooks.json 所在目录（agy：cwd = .agents/）
        ]
        expect(
          candidates.some((candidate) => fs.existsSync(candidate)),
          `[${name}] 命令引用的脚本不存在: ${command}`,
        ).toBe(true)
      }
    })
  }

  it("三家都指向同一个守卫脚本（避免规则多处漂移）", () => {
    const used = configs
      .flatMap(([rel]) => commands(readJson(rel)))
      .map((command) => command.replace(/"\$CLAUDE_PROJECT_DIR"\/?/g, "").replace(/^\.\//, ""))
      .filter((command) => command.includes("spec-gate"))
    expect(used.length).toBeGreaterThanOrEqual(2)
    for (const command of used) expect(command.split("/").pop()).toBe("spec-gate.sh")
  })
})
