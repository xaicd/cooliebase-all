/**
 * 客户端构建门禁：验证 C 端双客户端（Expo 原生/Web + MiniApp 小程序/H5）**还能不能被打包**。
 *
 * 三条不可动摇的性质：
 *   1. **零污染** —— 产物始终落到临时目录，finally 中清理；调用前后工作区不得有变化。
 *   2. **裁剪不失败** —— clients/** 缺席的工程（profile base/minimal 孵化出来的）跳过而非失败；
 *      否则门禁会在那些工程里必定红，等于把基座锁死在"必须带客户端"。
 *   3. **失败不静默** —— 导出失败要 exit 非 0 并打印日志尾部，不得当作通过。
 *
 * Usage:
 *   node scripts/check-client-build.cjs
 */

const fs = require("fs")
const os = require("os")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const EXPORT_TIMEOUT_MS = 600000
const LOG_TAIL_CHARS = 4000
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm"

/** 递归数出某个目录下的 .js 文件（产物断言用）。 */
function countJsFiles(dir) {
  if (!fs.existsSync(dir)) return 0
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) count += countJsFiles(full)
    else if (entry.name.endsWith(".js")) count += 1
  }
  return count
}

function verifyExpoClient() {
  const started = Date.now()
  const rel = "clients/expo"
  const client = path.join(ROOT, "clients", "expo")

  if (!fs.existsSync(client)) {
    console.log(`[client-build] SKIP: ${rel} 不存在（裁剪过的工程不含 Expo 客户端）`)
    return
  }
  if (!fs.existsSync(path.join(client, "package.json"))) {
    console.log(`[client-build] SKIP: ${rel}/package.json 不存在（裁剪过的工程不含 Expo 客户端）`)
    return
  }
  if (!fs.existsSync(path.join(client, "node_modules"))) {
    console.log(`[client-build] SKIP: ${rel}/node_modules 不存在（未安装客户端依赖）`)
    return
  }

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-expo-build-"))
  try {
    const result = spawnSync(
      PNPM,
      ["exec", "expo", "export", "-p", "web", "--output-dir", outDir],
      { cwd: client, encoding: "utf8", timeout: EXPORT_TIMEOUT_MS, shell: process.platform === "win32" },
    )
    const log = `${result.stdout || ""}${result.stderr || ""}`.trim()
    const indexPath = path.join(outDir, "index.html")
    const bundleCount = countJsFiles(path.join(outDir, "_expo"))

    if (result.error || result.status !== 0) {
      console.error(`[client-build] FAIL: expo export 退出码 ${result.status}${result.error ? ` (${result.error.message})` : ""}`)
      console.error(`[client-build] 日志尾部:\n${log.slice(-LOG_TAIL_CHARS)}`)
      process.exit(1)
    }
    if (!fs.existsSync(indexPath) || bundleCount === 0) {
      console.error(`[client-build] FAIL: Expo 导出产物不完整（index.html=${fs.existsSync(indexPath)}, js=${bundleCount}）`)
      console.error(`[client-build] 日志尾部:\n${log.slice(-LOG_TAIL_CHARS)}`)
      process.exit(1)
    }

    console.log(
      `[client-build] PASS: Expo web 导出成功，产物 ${bundleCount} 个 js + index.html，`
      + `耗时 ${((Date.now() - started) / 1000).toFixed(1)}s`,
    )
  } finally {
    try {
      fs.rmSync(outDir, { recursive: true, force: true })
    } catch (_err) {
      /* 清理失败不该改写门禁结论 */
    }
  }
}

function verifyMiniappClient() {
  const started = Date.now()
  const rel = "clients/miniapp"
  const client = path.join(ROOT, "clients", "miniapp")

  if (!fs.existsSync(client)) {
    console.log(`[client-build] SKIP: ${rel} 不存在（裁剪过的工程不含 MiniApp 客户端）`)
    return
  }
  if (!fs.existsSync(path.join(client, "package.json"))) {
    console.log(`[client-build] SKIP: ${rel}/package.json 不存在（裁剪过的工程不含 MiniApp 客户端）`)
    return
  }
  if (!fs.existsSync(path.join(client, "node_modules"))) {
    console.log(`[client-build] SKIP: ${rel}/node_modules 不存在（未安装客户端依赖）`)
    return
  }

  for (const requiredFile of ["manifest.json", "pages.json", "src/App.vue", "src/utils/request.ts"]) {
    if (!fs.existsSync(path.join(client, requiredFile))) {
      console.error(`[client-build] FAIL: ${rel}/${requiredFile} 缺失`)
      process.exit(1)
    }
  }

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-miniapp-build-"))
  try {
    const result = spawnSync(
      PNPM,
      ["exec", "vite", "build", "--outDir", outDir, "--emptyOutDir"],
      { cwd: client, encoding: "utf8", timeout: EXPORT_TIMEOUT_MS, shell: process.platform === "win32" },
    )
    const log = `${result.stdout || ""}${result.stderr || ""}`.trim()
    const indexPath = path.join(outDir, "index.html")
    const bundleCount = countJsFiles(outDir)

    if (result.error || result.status !== 0) {
      console.error(`[client-build] FAIL: miniapp vite build 退出码 ${result.status}${result.error ? ` (${result.error.message})` : ""}`)
      console.error(`[client-build] 日志尾部:\n${log.slice(-LOG_TAIL_CHARS)}`)
      process.exit(1)
    }
    if (!fs.existsSync(indexPath) || bundleCount === 0) {
      console.error(`[client-build] FAIL: MiniApp 构建产物不完整（index.html=${fs.existsSync(indexPath)}, js=${bundleCount}）`)
      console.error(`[client-build] 日志尾部:\n${log.slice(-LOG_TAIL_CHARS)}`)
      process.exit(1)
    }

    console.log(
      `[client-build] PASS: MiniApp H5 构建成功，产物 ${bundleCount} 个 js + index.html，`
      + `耗时 ${((Date.now() - started) / 1000).toFixed(1)}s`,
    )
  } finally {
    try {
      fs.rmSync(outDir, { recursive: true, force: true })
    } catch (_err) {
      /* 清理失败不该改写门禁结论 */
    }
  }
}

function main() {
  verifyExpoClient()
  verifyMiniappClient()
  process.exit(0)
}

main()
