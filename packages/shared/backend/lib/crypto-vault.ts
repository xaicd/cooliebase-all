import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const DEFAULT_KEY = Buffer.from(
  (process.env.COOLIEBASE_VAULT_AES_KEY || "0123456789abcdef0123456789abcdef").slice(0, 32),
  "utf8",
)

export const CryptoVault = {
  /**
   * AES-256-GCM 加密
   * 输出格式: iv:authTag:ciphertext (十六进制)
   */
  encrypt(text: string, key = DEFAULT_KEY): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    const authTag = cipher.getAuthTag().toString("hex")
    return `${iv.toString("hex")}:${authTag}:${encrypted}`
  },

  /**
   * AES-256-GCM 解密
   */
  decrypt(cipherText: string, key = DEFAULT_KEY): string {
    const parts = cipherText.split(":")
    if (parts.length !== 3) throw new Error("密文格式非法，无法解密")
    const [ivHex, authTagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex!, "hex")
    const authTag = Buffer.from(authTagHex!, "hex")
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encryptedHex!, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
  },

  /**
   * JSON 结构体加密
   */
  encryptJson(data: any, key = DEFAULT_KEY): string {
    return this.encrypt(JSON.stringify(data), key)
  },

  /**
   * JSON 结构体解密
   */
  decryptJson<T = any>(cipherText: string, key = DEFAULT_KEY): T {
    const jsonStr = this.decrypt(cipherText, key)
    return JSON.parse(jsonStr)
  },
}
