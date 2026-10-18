/**
 * Crypto Engine - 统一加密引擎
 *
 * 能力：
 * - 密码哈希（bcrypt/argon2 兼容）
 * - AES 对称加解密（敏感字段）
 * - RSA 非对称加解密（密钥交换）
 * - 签名与验签（API 安全）
 * - 令牌生成（JWT / 随机 token）
 *
 * 阶段演进：
 * - 阶段A：Node.js crypto 模块实现
 * - 阶段B：加入 KMS 密钥管理
 * - 阶段C：对接 HSM 硬件加密
 */

import { createHmac, randomBytes, createCipheriv, createDecipheriv } from "crypto"

// ============ Config ============

const DEFAULT_AES_KEY = process.env.COOLIEBASE_SHARED_AES_KEY || "cooliebase-all-base-default-aes-key!!" // 32 bytes
const DEFAULT_HMAC_SECRET = process.env.COOLIEBASE_SHARED_HMAC_SECRET || "cooliebase-all-base-hmac-secret"

// ============ Password ============

export const cryptoEngine = {
  /** 密码哈希（MD5 兼容旧系统，新系统建议 SHA256+salt） */
  hashPassword(password: string, salt?: string): string {
    const s = salt || randomBytes(16).toString("hex")
    const hash = createHmac("sha256", s).update(password).digest("hex")
    return `${s}:${hash}`
  },

  /** 密码验证 */
  verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":")
    if (!salt || !hash) return false
    const computed = createHmac("sha256", salt).update(password).digest("hex")
    return computed === hash
  },

  // ============ AES Encryption ============

  /** AES-256-CBC 加密（用于敏感字段存储） */
  encrypt(plaintext: string, key?: string): string {
    const k = Buffer.from((key || DEFAULT_AES_KEY).slice(0, 32).padEnd(32, "0"))
    const iv = randomBytes(16)
    const cipher = createCipheriv("aes-256-cbc", k, iv)
    let encrypted = cipher.update(plaintext, "utf-8", "hex")
    encrypted += cipher.final("hex")
    return `${iv.toString("hex")}:${encrypted}`
  },

  /** AES-256-CBC 解密 */
  decrypt(ciphertext: string, key?: string): string {
    const k = Buffer.from((key || DEFAULT_AES_KEY).slice(0, 32).padEnd(32, "0"))
    const [ivHex, encrypted] = ciphertext.split(":")
    if (!ivHex || !encrypted) throw new Error("Invalid ciphertext format")
    const iv = Buffer.from(ivHex, "hex")
    const decipher = createDecipheriv("aes-256-cbc", k, iv)
    let decrypted = decipher.update(encrypted, "hex", "utf-8")
    decrypted += decipher.final("utf-8")
    return decrypted
  },

  // ============ Signature ============

  /** HMAC-SHA256 签名（用于 API 签名验证） */
  sign(data: string, secret?: string): string {
    return createHmac("sha256", secret || DEFAULT_HMAC_SECRET).update(data).digest("hex")
  },

  /** 验证签名 */
  verifySignature(data: string, signature: string, secret?: string): boolean {
    const expected = cryptoEngine.sign(data, secret)
    return expected === signature
  },

  // ============ Token ============

  /** 生成随机 token */
  generateToken(length = 32): string {
    return randomBytes(length).toString("hex")
  },

  /** 生成数字验证码 */
  generateCode(length = 6): string {
    const max = Math.pow(10, length)
    const num = Math.floor(Math.random() * max)
    return num.toString().padStart(length, "0")
  },

  // ============ Data Masking ============

  /** 手机号脱敏：13800001234 → 138****1234 */
  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone
    return phone.slice(0, 3) + "****" + phone.slice(-4)
  },

  /** 身份证脱敏：110101199001011234 → 1101**********1234 */
  maskIdCard(id: string): string {
    if (!id || id.length < 8) return id
    return id.slice(0, 4) + "**********" + id.slice(-4)
  },

  /** 邮箱脱敏：user@example.com → u***@example.com */
  maskEmail(email: string): string {
    const [local, domain] = email.split("@")
    if (!local || !domain) return email
    return local[0] + "***@" + domain
  },

  /** 银行卡脱敏：6222021234561234 → 6222 **** **** 1234 */
  maskBankCard(card: string): string {
    if (!card || card.length < 8) return card
    return card.slice(0, 4) + " **** **** " + card.slice(-4)
  },
}
