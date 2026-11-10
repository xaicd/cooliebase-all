#!/usr/bin/env node
/**
 * scripts/codegen-module.cjs
 *
 * 跨底座统一的业务模块全栈代码生成入口（与 yudao-quad-terminal/scripts/codegen-module.cjs 100% 同名契约）
 */

const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const rawArgs = process.argv.slice(2)

if (rawArgs.includes("--schema")) {
  const idx = rawArgs.indexOf("--schema")
  const schemaFile = rawArgs[idx + 1]
  const res = spawnSync(
    process.execPath,
    [path.join(__dirname, "blueprint-engine.cjs"), "compile-domain", "--file", schemaFile, "--write"],
    { cwd: ROOT, stdio: "inherit" },
  )
  process.exit(res.status ?? 1)
}

const localTsx = path.join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx")
const domainArg = rawArgs.find((a) => !a.startsWith("-")) || "oa"
const res = fs.existsSync(localTsx)
  ? spawnSync(localTsx, ["scripts/create-business-domain.ts", domainArg, "--force"], {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
    })
  : spawnSync("pnpm", ["exec", "tsx", "scripts/create-business-domain.ts", domainArg, "--force"], {
      cwd: ROOT,
      stdio: "inherit",
    })

process.exit(res.status ?? 1)
