#!/usr/bin/env node
/**
 * scripts/speckit.cjs
 *
 * 跨底座统一的 Spec-Kit SDD 工程规格管理入口（与 yudao-quad-terminal/scripts/speckit.cjs 100% 同名同参数契约）
 * 用法：node scripts/speckit.cjs <new|build|check|tasks|archive> [options]
 */

const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const localTsx = path.join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx")
const args = ["scripts/speckit.ts", ...process.argv.slice(2)]

const res = fs.existsSync(localTsx)
  ? spawnSync(localTsx, args, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" })
  : spawnSync("pnpm", ["exec", "tsx", ...args], { cwd: ROOT, stdio: "inherit" })

process.exit(res.status ?? 1)
