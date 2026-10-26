#!/usr/bin/env node
/**
 * 历史别名转发器 (Deprecated Shim -> scripts/speckit.ts)
 * 推荐直接使用: pnpm harness spec build ... 或 pnpm run speckit:build -- ...
 */
const { spawnSync } = require("node:child_process")
const path = require("node:path")

const args = process.argv.slice(2)
const result = spawnSync("pnpm", ["exec", "tsx", path.join(__dirname, "speckit.ts"), "build", ...args], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
})
process.exit(result.status ?? 0)
