#!/usr/bin/env pnpm exec tsx
/**
 * 历史别名转发器 (Deprecated Shim -> scripts/speckit.ts)
 * 推荐直接使用: pnpm harness spec new ... 或 pnpm run speckit:new -- ...
 */
import { spawnSync } from "node:child_process"
import path from "node:path"

const args = process.argv.slice(2)
const result = spawnSync("pnpm", ["exec", "tsx", path.join(__dirname, "speckit.ts"), "new", ...args], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
})
process.exit(result.status ?? 0)
