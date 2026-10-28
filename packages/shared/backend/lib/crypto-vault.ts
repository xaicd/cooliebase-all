import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"

/**
 * 非生产环境的兜底密钥。
 *
 * **生产环境禁止使用它** —— 见 `resolveKey()`：`NODE_ENV=production` 且未设
 * `COOLIEBASE_VAULT_AES_KEY` 时直接抛错。理由：仓库里的默认值对所有人可见，
 * 用它"加密"等于没加密，而症状是**看起来完全正常**（这是最危险的一种）。
 */
const DEV_FALLBACK_KEY_TEXT = "0123456789abcdef0123456789abcdef"

/**
 * 解析密钥。**调用时**才判定，不在模块加载时 ——
 * `next build` 以 `NODE_ENV=production` 运行，模块加载时抛错会直接炸构建。
 */
function resolveKey(key?: Buffer): Buffer {
  if (key) return key
  const raw = process.env.COOLIEBASE_VAULT_AES_KEY
  if (raw) return Buffer.from(raw.slice(0, 32), "utf8")
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[crypto-vault] 生产环境必须设置 COOLIEBASE_VAULT_AES_KEY（32 字节）—— " +
        "拒绝使用仓库内置的默认密钥（公开可见，等于未加密）。",
    )
  }
  return Buffer.from(DEV_FALLBACK_KEY_TEXT.slice(0, 32), "utf8")
}

export const CryptoVault = {
  /**
   * AES-256-GCM 加密
   * 输出格式: iv:authTag:ciphertext (十六进制)
   */
  encrypt(text: string, key?: Buffer): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv(ALGORITHM, resolveKey(key), iv)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    const authTag = cipher.getAuthTag().toString("hex")
    return `${iv.toString("hex")}:${authTag}:${encrypted}`
  },

  /**
   * AES-256-GCM 解密
   */
  decrypt(cipherText: string, key?: Buffer): string {
    const parts = cipherText.split(":")
    if (parts.length !== 3) throw new Error("密文格式非法，无法解密")
    const [ivHex, authTagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex!, "hex")
    const authTag = Buffer.from(authTagHex!, "hex")
    const decipher = createDecipheriv(ALGORITHM, resolveKey(key), iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encryptedHex!, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  },

  /**
   * JSON 结构体加密
   */
  encryptJson(data: any, key?: Buffer): string {
    return this.encrypt(JSON.stringify(data), key)
  },

  /**
   * JSON 结构体解密
   */
  decryptJson<T = any>(cipherText: string, key?: Buffer): T {
    const jsonStr = this.decrypt(cipherText, key)
    return JSON.parse(jsonStr)
  },
}
