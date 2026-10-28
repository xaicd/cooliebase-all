#!/usr/bin/env node
/**
 * `crypto:key:guard:check` —— **生产环境禁止使用内置默认密钥**。
 *
 * ## 为什么需要它
 *
 * `crypto-engine` / `crypto-vault` 原先把 env 兜底成硬编码常量：
 *
 * ```
 * COOLIEBASE_SHARED_AES_KEY  || "cooliebase-all-default-aes-key!!"
 * COOLIEBASE_VAULT_AES_KEY   || "0123456789abcdef0123456789abcdef"
 * COOLIEBASE_SHARED_HMAC_SECRET || "cooliebase-all-hmac-secret"
 * ```
 *
 * 而这三个变量**在全仓别处都没出现**（`.env` / 文档 / 部署脚本都没有）。
 * 后果：生产漏配时加密**照常成功**，用的是一把仓库里公开可见的钥匙 ——
 * 数据看起来"加密了"，实际谁都能解。**症状是完全正常**，这是最危险的一种。
 *
 * ## 为什么是行为级检查，不是 grep 源码
 *
 * 扫 `|| "…"` 这种写法太脆：换个写法就漏，而且分不清"有守卫"和"没守卫"。
 * 这里直接**起子进程**验证四种状态的真实行为：
 *
 * | 状态 | 期望 |
 * |---|---|
 * | production + 无密钥 | **抛错**，且错误信息点名环境变量 |
 * | production + 有密钥 | 正常加解密 |
 * | production + 只 import 不调用 | **不抛错**（否则 `next build` 会炸） |
 * | 非 production + 无密钥 | 正常（不破坏测试与本地开发） |
 */
const path = require("node:path")
const { execFileSync } = require("node:child_process")
const { pathToFileURL } = require("node:url")

const ROOT = path.resolve(__dirname, "..")
// **内联 TS 里的 import 必须写 file:// URL**：Windows 上裸路径 `C:\...`
// 会让 ESM 加载器报 ERR_UNSUPPORTED_ESM_URL_SCHEME（同一天第 4 次同一类）。
// **Windows 上是 `tsx.cmd`**：`node_modules/.bin/tsx`（无扩展名）在 Windows 下
// `execFileSync` 起不来，6 项检查会**全部**报 ✗。仓里 `run-root-tsx.cjs` 早就这么写了，
// 这里跟它保持同一约定。
const TSX = path.join(ROOT, "node_modules/.bin", process.platform === "win32" ? "tsx.cmd" : "tsx")
const ENGINE = `import { cryptoEngine } from ${JSON.stringify(pathToFileURL(path.join(ROOT, "packages/shared/backend/lib/crypto-engine")).href)}`
const VAULT = `import { CryptoVault } from ${JSON.stringify(pathToFileURL(path.join(ROOT, "packages/shared/backend/lib/crypto-vault")).href)}`

const CASES = [
  {
    name: "production + 无 AES 密钥 → encrypt 必须抛错并点名 COOLIEBASE_SHARED_AES_KEY",
    code: `${ENGINE}\ntry { cryptoEngine.encrypt("x"); console.log("NO_THROW") } catch (e) { console.log("THREW:" + e.message) }`,
    env: { NODE_ENV: "production" },
    expect: (out) => !out.includes("NO_THROW") && out.includes("COOLIEBASE_SHARED_AES_KEY"),
    hint: "生产环境缺密钥时静默用了内置默认值",
  },
  {
    name: "production + 无 VAULT 密钥 → CryptoVault.encrypt 必须抛错并点名 COOLIEBASE_VAULT_AES_KEY",
    code: `${VAULT}\ntry { CryptoVault.encrypt("x"); console.log("NO_THROW") } catch (e) { console.log("THREW:" + e.message) }`,
    env: { NODE_ENV: "production" },
    expect: (out) => !out.includes("NO_THROW") && out.includes("COOLIEBASE_VAULT_AES_KEY"),
    hint: "生产环境缺密钥时静默用了内置默认值",
  },
  {
    name: "production + 无 HMAC 密钥 → sign 必须抛错并点名 COOLIEBASE_SHARED_HMAC_SECRET",
    code: `${ENGINE}\ntry { cryptoEngine.sign("x"); console.log("NO_THROW") } catch (e) { console.log("THREW:" + e.message) }`,
    env: { NODE_ENV: "production" },
    expect: (out) => !out.includes("NO_THROW") && out.includes("COOLIEBASE_SHARED_HMAC_SECRET"),
    hint: "生产环境缺签名密钥时静默用了内置默认值",
  },
  {
    name: "production + 有密钥 → 正常加解密",
    code: `${ENGINE}\nconst k = "k".repeat(32)\nconsole.log("RT:" + cryptoEngine.decrypt(cryptoEngine.encrypt("s", k), k))`,
    env: { NODE_ENV: "production", COOLIEBASE_SHARED_AES_KEY: "k".repeat(32) },
    expect: (out) => out.includes("RT:s"),
    hint: "设了密钥反而不通 —— 守卫误伤",
  },
  {
    name: "production + 只 import 不调用 → 不得抛错（否则 next build 会炸）",
    code: `${ENGINE}\n${VAULT}\nconsole.log("IMPORT_OK")`,
    env: { NODE_ENV: "production" },
    expect: (out) => out.includes("IMPORT_OK"),
    hint: "守卫放到了模块加载时 —— 会炸掉 next build",
  },
  {
    name: "非 production + 无密钥 → 正常（不破坏测试与本地开发）",
    code: `${ENGINE}\nconsole.log("DEV_OK")`,
    env: {},
    expect: (out) => out.includes("DEV_OK"),
    hint: "守卫误伤本地/测试环境",
  },
]

function runCase(c) {
  const env = {}
  for (const [k, v] of Object.entries(process.env)) {
    // 显式清掉可能被父进程带入的密钥，保证用例从干净状态开始
    if (k.startsWith("COOLIEBASE_") || k === "NODE_ENV") continue
    env[k] = v
  }
  Object.assign(env, c.env)
  try {
    // **Windows 上必须走 shell**：`node_modules/.bin/tsx` 在 Windows 是 `tsx.cmd`，
    // `execFileSync` 不带 shell 起不来 —— 6 项检查会**全部**报 ✗（实测就是这个长相）。
    // **`.cmd` 之外还要 `shell: true`**：Node 在 Windows 上不能直接 exec 一个 `.cmd` 文件，
    // 必须交给 shell 解析 —— 只把名字改成 `tsx.cmd` 仍然起不来（实测 6 项还是全 ✗）。
    // 与 `scripts/run-root-tsx.cjs` 完全一致：`.cmd` + `shell: true`。
    return execFileSync(TSX, ["-e", c.code], {
      // **只在 Windows 开 shell**：POSIX 上 `.bin/tsx` 能直接 exec，开了 shell 反而
      // 会让 `-e` 里的引号被 shell 解释掉（本机实测 4 项挂）。
      cwd: ROOT, env, encoding: "utf8", shell: process.platform === "win32",
    })
  } catch (e) {
    return `${e.stdout || ""}${e.stderr || ""}`
  }
}

let failed = 0
for (const c of CASES) {
  const out = runCase(c)
  if (c.expect(out)) {
    console.log(`  ✓ ${c.name}`)
  } else {
    failed += 1
    console.error(`  ✗ ${c.name}`)
    console.error(`     ${c.hint}`)
    console.error(`     实际输出: ${out.trim().split("\n").slice(-3).join(" | ").slice(0, 240)}`)
  }
}

if (failed) {
  console.error("")
  console.error(`[crypto-key-guard] ✗ ${failed} 项不符合预期 —— 生产环境可能正在使用公开默认密钥。`)
  console.error("  修：packages/shared/backend/lib/crypto-{engine,vault}.ts 的 resolveAesKey/resolveHmacSecret")
  process.exit(1)
}
console.log("[crypto-key-guard] ✓ 生产环境缺密钥会失败、构建与本地不受影响")
