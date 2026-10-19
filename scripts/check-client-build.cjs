/**
 * 客户端构建门禁：验证 C 端（Expo）**还能不能被打包**。
 *
 * 为什么需要：仓内此前**完全没有**客户端构建验证 —— `.github/workflows/ci.yml` 整文件无任何
 * expo 步骤，根 package.json 也无 expo 脚本。于是服务端那套 check/build/smoke/security/load
 * 全绿时，"客户端能不能打包"仍是零证据；改依赖或升 SDK 都只能靠事后人工发现白屏。
 *
 * 本门禁只做可在 CI 跑通的那条链（web 导出）；iOS/Android 原生构建需要 Xcode / Android SDK，
 * 超出本仓可验证范围，刻意不做。
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

const CLIENT_REL = "clients/expo"
const EXPORT_TIMEOUT_MS = 600000
const LOG_TAIL_CHARS = 4000

const NPX = process.platform === "win32" ? "npx.cmd" : "npx"

function clientDir() {
  return path.join(ROOT, ...CLIENT_REL.split("/"))
}

/** 递归数出某个目录下的 .js 文件（产物断言用；不递归就数不到 Metro 的真实产物）。 */
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

function main() {
  const started = Date.now()
  const client = clientDir()

  // ① 裁剪安全：没有客户端 / 依赖没装 → 跳过，而不是失败。
  if (!fs.existsSync(client)) {
    console.log(`[client-build] SKIP: ${CLIENT_REL} 不存在（裁剪过的工程不含客户端），本门禁不适用`)
    process.exit(0)
  }
  // 裁剪过的工程可能**留下空壳目录**（`clients/expo/` 只剩 node_modules，
  // package.json 已被裁掉）—— 只看目录存在会误判"有客户端"，
  // 实测 `--profile base` 产物因此让本门禁去跑 expo export 并失败。
  if (!fs.existsSync(path.join(client, "package.json"))) {
    console.log(`[client-build] SKIP: ${CLIENT_REL}/package.json 不存在（裁剪过的工程不含客户端）`)
    process.exit(0)
  }
  if (!fs.existsSync(path.join(client, "node_modules"))) {
    console.log(`[client-build] SKIP: ${CLIENT_REL}/node_modules 不存在（未安装客户端依赖）`)
    process.exit(0)
  }

  // ② 产物落临时目录 —— 零污染的唯一保证，别图省事写进仓库。
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-client-build-"))
  let result
  try {
    result = spawnSync(
      NPX,
      ["expo", "export", "-p", "web", "--output-dir", outDir],
      { cwd: client, encoding: "utf8", timeout: EXPORT_TIMEOUT_MS, shell: false },
    )

    const log = `${result.stdout || ""}${result.stderr || ""}`.trim()
    const indexPath = path.join(outDir, "index.html")
    const bundleCount = countJsFiles(path.join(outDir, "_expo"))

    // ③ 三个都要满足才叫通过：退出码 0、入口页存在、至少一个 bundle。
    // 只看退出码不够 —— 导出"成功"却没有产物是可能的失败形态。
    if (result.error || result.status !== 0) {
      console.error(`[client-build] FAIL: expo export 退出码 ${result.status}${result.error ? ` (${result.error.message})` : ""}`)
      console.error(`[client-build] 日志尾部:\n${log.slice(-LOG_TAIL_CHARS)}`)
      process.exit(1)
    }
    if (!fs.existsSync(indexPath)) {
      console.error(`[client-build] FAIL: 导出成功但没有 index.html（产物目录: ${outDir}）`)
      console.error(`[client-build] 日志尾部:\n${log.slice(-LOG_TAIL_CHARS)}`)
      process.exit(1)
    }
    if (bundleCount === 0) {
      console.error(`[client-build] FAIL: 导出成功但 _expo 下没有任何 .js 产物（index.html 是空的壳）`)
      console.error(`[client-build] 日志尾部:\n${log.slice(-LOG_TAIL_CHARS)}`)
      process.exit(1)
    }

    console.log(
      `[client-build] PASS: Expo web 导出成功，产物 ${bundleCount} 个 js + index.html，`
      + `耗时 ${((Date.now() - started) / 1000).toFixed(1)}s`,
    )
    process.exit(0)
  } finally {
    // ④ 无论成败都清理 —— 否则临时目录会堆积，且"零污染"就成了口号。
    try {
      fs.rmSync(outDir, { recursive: true, force: true })
    } catch {
      /* 清理失败不该改写门禁结论 */
    }
  }
}

main()
