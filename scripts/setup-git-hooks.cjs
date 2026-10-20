#!/usr/bin/env node
/**
 * 启用仓库自带的 git 钩子（`core.hooksPath = .githooks`）。
 *
 * 为什么需要单独一步：`core.hooksPath` 存在 **`.git/config`**，那是**本机配置、不可提交**。
 * 也就是说：`.githooks/pre-commit` 虽然随仓分发，但**新克隆 / 别人的机器上根本不会生效** ——
 * 而这一层恰恰是"跨 CLI 的唯一兜底"（hooks 是每家 CLI 一套，只有 git 是所有 agent 的必经之路）。
 *
 * 不装 = 守卫只在我这台机器上存在 = 又一个"看起来有、实际没有"。
 *
 * 行为（幂等、非破坏）：
 *   · 不是 git 仓库 → 跳过（例如被 degit 下载、无 .git 的场景）
 *   · 已正确设置 → 什么都不做
 *   · 未设置 → 设为 `.githooks` 并打印一行
 *
 * 已接入 `postinstall`，`pnpm install` 后自动生效；也可单跑 `pnpm run setup:hooks`。
 */
const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

// ROOT 可被环境变量覆盖：测试用临时 git 仓库。
const ROOT = process.env.SETUP_HOOKS_ROOT || path.resolve(__dirname, "..")
const EXPECTED = ".githooks"

function git(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" })
}

if (!fs.existsSync(path.join(ROOT, ".git"))) {
  // degit / tarball 场景没有 .git —— 没有钩子可装，静默跳过（不是失败）
  process.exit(0)
}
if (!fs.existsSync(path.join(ROOT, EXPECTED, "pre-commit"))) {
  console.error(`[setup-hooks] ⚠ 找不到 ${EXPECTED}/pre-commit —— 跳过`)
  process.exit(0)
}

const current = git(["config", "--local", "--get", "core.hooksPath"])
const value = current.status === 0 ? current.stdout.trim() : ""

if (value === EXPECTED) {
  console.log(`[setup-hooks] ✓ git hooks 已启用（core.hooksPath = ${EXPECTED}）`)
  process.exit(0)
}

const set = git(["config", "--local", "core.hooksPath", EXPECTED])
if (set.status !== 0) {
  console.error(`[setup-hooks] ⚠ 设置 core.hooksPath 失败：${(set.stderr || "").trim()}`)
  process.exit(0) // 不阻断安装：钩子是增强，不是安装前置
}
console.log(`[setup-hooks] ✓ 已启用仓库自带 git 钩子（${value ? `${value} → ` : ""}core.hooksPath = ${EXPECTED}）`)
console.log("              它会在每次提交时执行：规格门禁 + WBS 时效性检查")
