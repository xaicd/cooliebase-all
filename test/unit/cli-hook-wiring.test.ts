import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))

/**
 * 各家 CLI 的 hook **接线正确性 + 覆盖完整性**。
 *
 * 为什么需要：hook 脚本本身有测试，但"配置有没有把它接对"没人守 ——
 * 而这正是最容易静默出错的一环（实测踩过：agy 的相对路径假设、
 * cmd 与 Hermes 的字段名不同、Claude 的 `$CLAUDE_PROJECT_DIR` 展开）。
 *
 * 前一版把适配器清单**硬编码在测试里** → 新增一个 CLI 目录不会被要求登记、
 * 少配一家也全绿。现在改为读 `.agents/hooks/adapters.json` 注册表 + **覆盖检查**。
 */
type Adapter = {
  id: string
  name: string
  dir: string | null
  config: string | null
  mechanism: string
  installer?: string
  reason?: string
}

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")) as T
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

const registry = readJson<{ guard: string; adapters: Adapter[]; knownCliDirs: string[] }>(
  ".agents/hooks/adapters.json",
)
const hookAdapters = registry.adapters.filter((a) => a.mechanism === "hook")

describe("各家 CLI hook 接线", () => {
  it("注册表自身的守卫脚本必须存在", () => {
    expect(fs.existsSync(path.join(ROOT, registry.guard)), `守卫脚本不存在: ${registry.guard}`).toBe(true)
  })

  for (const adapter of hookAdapters) {
    it(`${adapter.name} 的 ${adapter.config} 合法且指向真实存在的脚本`, () => {
      expect(adapter.config, `${adapter.id} 声明为 hook 却没有 config`).toBeTruthy()
      const config = readJson<Record<string, unknown>>(adapter.config!)
      const list = commands(config)
      expect(list.length, `${adapter.config} 里没有任何 command`).toBeGreaterThan(0)

      for (const command of list) {
        // 取出命令里的脚本路径（去掉 $VAR 与引号），断言本仓确实有它
        const script = command
          .replace(/"\$(?:CLAUDE|COMMANDCODE)_PROJECT_DIR"\/?/g, "")
          .replace(/^\.\//, "")
          .trim()
        const candidates = [
          path.join(ROOT, script), // 相对仓库根（cmd / Claude）
          path.join(ROOT, ".agents", script), // 相对 hooks.json 所在目录（agy：cwd = .agents/）
        ]
        expect(
          candidates.some((candidate) => fs.existsSync(candidate)),
          `[${adapter.name}] 命令引用的脚本不存在: ${command}`,
        ).toBe(true)
      }
    })
  }

  it("所有 hook 适配器都指向**同一个**守卫脚本（避免规则多处漂移）", () => {
    const used = hookAdapters.flatMap((a) => commands(readJson<Record<string, unknown>>(a.config!)))
    const gateCommands = used
      .map((c) => c.replace(/"\$CLAUDE_PROJECT_DIR"\/?/g, "").replace(/^\.\//, ""))
      .filter((c) => c.includes("spec-gate"))
    expect(gateCommands.length).toBe(hookAdapters.length)
    for (const command of gateCommands) expect(command.split("/").pop()).toBe("spec-gate.sh")
  })

  it("**覆盖检查**：仓库里出现的每个 CLI 目录都必须在注册表登记", () => {
    const registered = new Set(registry.adapters.map((a) => a.dir).filter(Boolean) as string[])
    const present = registry.knownCliDirs.filter((dir) => fs.existsSync(path.join(ROOT, dir)))
    expect(present.length, "一个 CLI 目录都没发现，注册表或探测逻辑已失效").toBeGreaterThan(0)

    const unregistered = present.filter((dir) => !registered.has(dir))
    expect(
      unregistered,
      `以下 CLI 配置目录存在但没有在 .agents/hooks/adapters.json 登记：\n` +
        unregistered.map((d) => `  · ${d}`).join("\n") +
        `\n  修法：① 若该 CLI 支持 hook → 加 config 并接 ${registry.guard}；` +
        `② 若只有 rules/steering → 登记 mechanism 与 reason（不得臆造未取证的 schema）`,
    ).toEqual([])
  })

  it("注册表不得引用不存在的目录/安装脚本；非 hook 适配器必须写明 reason", () => {
    for (const adapter of registry.adapters) {
      if (adapter.dir) {
        expect(fs.existsSync(path.join(ROOT, adapter.dir)), `${adapter.id} 的 dir 不存在: ${adapter.dir}`).toBe(true)
      }
      if (adapter.installer) {
        expect(
          fs.existsSync(path.join(ROOT, adapter.installer)),
          `${adapter.id} 的 installer 不存在: ${adapter.installer}`,
        ).toBe(true)
      }
      if (adapter.mechanism !== "hook") {
        expect(
          adapter.reason,
          `${adapter.id} 不是 hook 适配器，必须写明 reason（不能靠人工判断，要写清依据）`,
        ).toBeTruthy()
      }
    }
  })
})
