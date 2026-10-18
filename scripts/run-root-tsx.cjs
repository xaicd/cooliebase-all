const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const args = process.argv.slice(2)
if (args.length === 0) {
  console.log("Usage: node scripts/run-root-tsx.cjs <script-path> [args...]")
  process.exit(0)
}

const scriptRelPath = args[0]
const scriptArgs = args.slice(1)
const rootDir = process.cwd()

let targetScript = path.join(rootDir, scriptRelPath)

if (!fs.existsSync(targetScript)) {
  // Check parent monorepo if exists
  const parentRoot = path.resolve(rootDir, "../..")
  const parentScript = path.join(parentRoot, scriptRelPath)
  if (fs.existsSync(parentScript)) {
    targetScript = parentScript
  }
}

if (!fs.existsSync(targetScript)) {
  // 缺失的治理/扫描脚本**必须报错**，不能静默成功。
  //
  // 这些命令原本属于父级 monorepo（见上面的 parentRoot 查找），独立仓里没有它们。
  // 此前这里 print("[SKIP] ...") + exit 0 —— 后果是 `npm run check` 里的
  // `cooliebase:matrix:check` / `cooliebase:governance:check` 两道门禁**常年空转却报绿**，
  // 而 `write-harness-trace` 还把"通过"记进证据链。这正是"能力是否习得无从判断"的直接原因。
  //
  // 若某个命令在当前仓确实不适用，应当从 package.json / check 链里**移除**，
  // 而不是让它在运行时报一句 SKIP 就算过。
  console.error(`[MISSING] 脚本不存在: ${scriptRelPath}`)
  console.error("  这些治理/扫描脚本原本属于父级 monorepo，本仓没有。")
  console.error("  要么补齐脚本，要么把对应命令从 package.json / check 链里移除。")
  process.exit(1)
}

const tsxBin = path.join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx")
const cmd = fs.existsSync(tsxBin) ? tsxBin : "npx"
const cmdArgs = fs.existsSync(tsxBin) ? [targetScript, ...scriptArgs] : ["tsx", targetScript, ...scriptArgs]

const res = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: true })
process.exit(res.status ?? 0)
