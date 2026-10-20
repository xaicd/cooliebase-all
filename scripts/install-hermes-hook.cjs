#!/usr/bin/env node
/**
 * 给 Hermes 装上「写受保护路径前必须走过规格流程」的 hook。
 *
 * 为什么需要单独一个脚本：Hermes 的 hooks **只能配置在用户级** `~/.hermes/config.yaml`
 * （源码 `agent/shell_hooks.py` 的 `_parse_hooks_block` 只读 config，没有项目级入口）。
 * 那是**你机器上的全局配置，会影响所有项目** —— 所以本脚本**默认只 dry-run**，
 * 要显式加 `--write` 才落盘，且落盘前**自动备份**、落盘后打印回滚方法。
 *
 * 安全前提（脚本会检查）：
 *   1. `~/.hermes/config.yaml` 存在；
 *   2. 文件里**没有**顶层 `hooks:` —— 否则追加会产生重复键。有的话脚本拒绝，并提示手工合并。
 *   3. 本仓的守卫脚本存在且可执行。
 *
 * 用法:
 *   node scripts/install-hermes-hook.cjs            # dry-run：只打印将要追加的内容
 *   node scripts/install-hermes-hook.cjs --write    # 备份后追加
 *
 * 装完还需要**一次性放行**（Hermes 的 allowlist）：
 *   hermes --accept-hooks   或   HERMES_ACCEPT_HOOKS=1 hermes …   或 config 里 hooks_auto_accept: true
 * 验证：
 *   hermes hooks list
 *   hermes hooks test pre_tool_call --for-tool write_file
 */
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const configPath = path.join(os.homedir(), ".hermes", "config.yaml")
const write = process.argv.includes("--write")
const gate = path.join(ROOT, ".agents", "hooks", "spec-gate.sh")

function fail(message) {
  console.error(`[install-hermes-hook] ✗ ${message}`)
  process.exit(1)
}

if (!fs.existsSync(configPath)) fail(`找不到 Hermes 配置: ${configPath}`)
if (!fs.existsSync(gate)) fail(`找不到守卫脚本: ${gate}（先在本仓根目录执行）`)

try {
  fs.accessSync(gate, fs.constants.X_OK)
} catch {
  fail(`守卫脚本不可执行，先 chmod +x ${path.relative(ROOT, gate)}`)
}

const current = fs.readFileSync(configPath, "utf8")

if (/^hooks:\s*$/m.test(current) || /^hooks:\s+\S/m.test(current)) {
  fail(
    `你的 Hermes 配置里**已经有**顶层 hooks: 段（${configPath}）。\n` +
      "  为避免产生重复键把配置弄坏，本脚本不会自动合并。请手工把下面这段并进去：\n\n" +
      block(),
  )
}

function block() {
  const stamp = new Date().toISOString().slice(0, 10)
  return [
    `# >>> cooliebase-all spec-gate（${stamp} 由 scripts/install-hermes-hook.cjs 追加）`,
    "hooks:",
    "  pre_tool_call:",
    `    - command: "${gate}"`,
    '      matcher: "write_file|edit_file|write_to_file|replace_file_content|multi_replace_file_content"',
    "      timeout: 10",
    "      fail_closed: true",
    `# <<< cooliebase-all spec-gate（删除这两行标记之间的内容即可回滚）`,
    "",
  ].join("\n")
}

console.log("[install-hermes-hook] 目标配置:", configPath)
console.log("[install-hermes-hook] 将追加:\n")
console.log(block())

if (!write) {
  console.log("[install-hermes-hook] —— dry-run 结束。加 --write 才会真正写入（会先备份）。")
  process.exit(0)
}

const backup = `${configPath}.bak-cooliebase-${new Date().toISOString().replace(/[:.]/g, "-")}`
fs.copyFileSync(configPath, backup)
fs.appendFileSync(configPath, `\n${block()}`)

console.log(`[install-hermes-hook] ✓ 已写入（备份: ${backup}）`)
console.log("")
console.log("还需**一次性放行**（Hermes allowlist），任选其一：")
console.log("  hermes --accept-hooks        # 下次启动时批准")
console.log("  HERMES_ACCEPT_HOOKS=1 hermes # 本次会话批准")
console.log("  或在 config 里设 hooks_auto_accept: true")
console.log("")
console.log("验证：")
console.log("  hermes hooks list")
console.log("  hermes hooks test pre_tool_call --for-tool write_file")
console.log("")
console.log(`回滚：删除 config 里 "cooliebase-all spec-gate" 的两行标记之间的内容，或恢复备份：${backup}`)
