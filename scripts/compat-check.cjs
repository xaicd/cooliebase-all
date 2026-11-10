#!/usr/bin/env node
/**
 * scripts/compat-check.cjs
 *
 * 跨底座统一的 compat-manifest.json 下游兼容契约校验入口（与 yudao-quad-terminal/scripts/compat-check.cjs 100% 同名同参数契约）
 */

const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const res = spawnSync(
  process.execPath,
  [path.join(__dirname, "check-compat-manifest.cjs"), ...process.argv.slice(2)],
  { cwd: ROOT, stdio: "inherit" },
)

process.exit(res.status ?? 1)
