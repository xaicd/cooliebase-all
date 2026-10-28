import path from "node:path"
import { execFileSync } from "node:child_process"

import { describe, expect, it } from "vitest"

/**
 * 加密密钥守卫（`crypto-default-key-guard` 规格的红灯 + 常驻回归）。
 *
 * ## 守的是什么
 *
 * `crypto-engine` / `crypto-vault` 原来把 env 值**兜底成硬编码常量**：
 *
 * ```
 * COOLIEBASE_SHARED_AES_KEY || "cooliebase-all-default-aes-key!!"
 * COOLIEBASE_VAULT_AES_KEY  || "0123456789abcdef0123456789abcdef"
 * ```
 *
 * 而这两个变量**在全仓别处都没出现**（`.env` / 文档 / 部署脚本都没有）。后果：
 * 生产漏配密钥时加密**照常成功**，用的是一把仓库里可见的公开钥匙 ——
 * 数据看起来"加密了"，实际谁都能解。
 *
 * ## 为什么必须起子进程
 *
 * `NODE_ENV` 与密钥都在**模块加载时**读取，同一进程内改了不生效。所以每条用例都用
 * `tsx -e` 起一个干净子进程。
 *
 * ## 为什么「只 import 不调用」也要测
 *
 * `next build` 以 `NODE_ENV=production` 运行。若守卫放在**模块加载时**，构建会直接炸。
 * 所以守卫必须在**调用时**（encrypt/decrypt），并用这条用例把设计锁住。
 */

const REPO = path.resolve(__dirname, "../..")
const TSX = path.join(REPO, "node_modules/.bin/tsx")

const ENGINE = `import { cryptoEngine } from "${REPO}/packages/shared/backend/lib/crypto-engine"`
const VAULT = `import { CryptoVault } from "${REPO}/packages/shared/backend/lib/crypto-vault"`

/** 起子进程跑一段 TS；返回退出码与输出 */
function runTs(code: string, env: Record<string, string | undefined>): { code: number; out: string } {
  const merged: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...process.env, ...env })) {
    if (v !== undefined) merged[k] = v
  }
  // 关键：显式删除，避免父进程环境把密钥带进来
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete merged[k]

  try {
    return { code: 0, out: execFileSync(TSX, ["-e", code], { cwd: REPO, env: merged, encoding: "utf8" }) }
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` }
  }
}

describe("加密密钥守卫：生产环境不得静默使用默认密钥", () => {
  it("★ 红灯：NODE_ENV=production 且未设 COOLIEBASE_SHARED_AES_KEY → encrypt 必须抛错并点名变量", () => {
    const r = runTs(`${ENGINE}\ntry { cryptoEngine.encrypt("secret"); console.log("ENCRYPT_OK") } catch (e: any) { console.log("THREW:" + e.message) }`, {
      NODE_ENV: "production",
      COOLIEBASE_SHARED_AES_KEY: undefined,
    })
    expect(r.out).not.toContain("ENCRYPT_OK")
    expect(r.out).toContain("THREW:")
    expect(r.out).toContain("COOLIEBASE_SHARED_AES_KEY")
  }, 120_000)

  it("★ 红灯：crypto-vault 同理（COOLIEBASE_VAULT_AES_KEY）", () => {
    const r = runTs(
      `${VAULT}\ntry { CryptoVault.encrypt("secret"); console.log("ENCRYPT_OK") } catch (e: any) { console.log("THREW:" + e.message) }`,
      { NODE_ENV: "production", COOLIEBASE_VAULT_AES_KEY: undefined },
    )
    expect(r.out).not.toContain("ENCRYPT_OK")
    expect(r.out).toContain("COOLIEBASE_VAULT_AES_KEY")
  }, 120_000)

  it("生产环境已设密钥 → 正常加解密（不能一刀切禁掉）", () => {
    const r = runTs(
      `${ENGINE}\nconst k = "k".repeat(32)\nconst c = cryptoEngine.encrypt("secret", k)\nconsole.log("ROUNDTRIP:" + cryptoEngine.decrypt(c, k))`,
      { NODE_ENV: "production", COOLIEBASE_SHARED_AES_KEY: "k".repeat(32) },
    )
    expect(r.code).toBe(0)
    expect(r.out).toContain("ROUNDTRIP:secret")
  }, 120_000)

  it("非生产（未设 NODE_ENV）未设密钥 → 仍可用（不破坏测试与本地开发）", () => {
    const r = runTs(`${ENGINE}\nconsole.log("OK:" + (cryptoEngine.encrypt("x").length > 0))`, {
      NODE_ENV: undefined,
      COOLIEBASE_SHARED_AES_KEY: undefined,
    })
    expect(r.code).toBe(0)
    expect(r.out).toContain("OK:true")
  }, 120_000)

  it("★ 构建安全：production 下**只 import 不调用**，不得抛错（否则 next build 会炸）", () => {
    const r = runTs(`${ENGINE}\n${VAULT}\nconsole.log("IMPORT_ONLY_OK")`, {
      NODE_ENV: "production",
      COOLIEBASE_SHARED_AES_KEY: undefined,
      COOLIEBASE_VAULT_AES_KEY: undefined,
    })
    expect(r.code).toBe(0)
    expect(r.out).toContain("IMPORT_ONLY_OK")
  }, 120_000)
})
