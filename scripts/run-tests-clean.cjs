#!/usr/bin/env node
/**
 * 干净环境的测试入口：**把会污染测试的进程环境变量删掉**，再跑 vitest。
 *
 * 为什么需要：仓库文档一直推荐
 *   `env -u DATABASE_URL -u DB_DRIVER pnpm exec vitest run`
 * —— 它漏了 **`NODE_ENV`**，而这一个变量就足以让测试红：
 *
 *   · 本机 shell 若是 `NODE_ENV=production`，业务代码会走生产分支 ——
 *     实测 `generated-route-crud` 报「生产环境必须配置 DATABASE_URL」，41 文件里 1 个失败，
 *     而全量 `vitest run` 却是绿的（另一个并行顺序下没触发）；
 *   · 同一类问题此前已在 `verify:real-db` 咬过一次（`member-auth` 报
 *     「生产环境必须配置至少 32 字节且非默认值的 JWT_SECRET」），当时只修了那个脚本。
 *
 * 另外 `env -u` 是 **POSIX-only**，Windows 上用不了 —— 用 Node 包装则跨平台。
 *
 * 用法:  node scripts/run-tests-clean.cjs [vitest 参数...]
 *        例：node scripts/run-tests-clean.cjs test/unit
 */
const { spawnSync } = require("node:child_process")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const REMOVED = ["DATABASE_URL", "DB_DRIVER", "NODE_ENV"]

const env = { ...process.env }
for (const key of REMOVED) delete env[key]

const passthrough = process.argv.slice(2).filter((arg) => arg !== "--")
const args = ["run", ...passthrough]
const bin = path.join(
  ROOT,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vitest.cmd" : "vitest",
)

const result = spawnSync(bin, args, { cwd: ROOT, stdio: "inherit", env })
process.exit(result.status ?? 1)
