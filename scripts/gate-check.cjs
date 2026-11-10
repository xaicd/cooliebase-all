#!/usr/bin/env node
/**
 * scripts/gate-check.cjs
 *
 * 跨底座统一的工程质量门禁入口（与 yudao-quad-terminal/scripts/gate-check.cjs 100% 同名同参数契约）
 * 用法：node scripts/gate-check.cjs [--tier fast|full]
 */

const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const steps = [
  "scripts/check-engineering-standards.cjs",
  "scripts/check-harness-bundle.cjs",
  "scripts/check-compat-manifest.cjs",
]

for (const step of steps) {
  const res = spawnSync(process.execPath, [path.join(ROOT, step)], {
    cwd: ROOT,
    stdio: "inherit",
  })
  if (res.status !== 0) {
    process.exit(res.status ?? 1)
  }
}
