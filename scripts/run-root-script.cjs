const { spawnSync } = require("node:child_process")
const args = process.argv.slice(2)
if (args.length === 0) process.exit(0)
// 本仓包管理器是 pnpm（AGENTS §2.1）。文件名旧称 `run-root-npm` 已改为 `run-root-script`。
const runner = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
const res = spawnSync(runner, ["run", ...args], { stdio: "inherit", shell: true })
process.exit(res.status ?? 0)
