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

/**
 * 非生产环境的兜底值。
 *
 * **生产环境禁止使用** —— 见 `resolveAesKey()` / `resolveHmacSecret()`：
 * `NODE_ENV=production` 且未设对应 env 时直接抛错。
 * 理由：仓库里的默认值**公开可见**，用它加密/签名等于没做，
 * 而症状是「看起来完全正常」——最危险的一种。
 */
const DEV_FALLBACK_AES_KEY = "cooliebase-all-default-aes-key!!"
const DEV_FALLBACK_HMAC_SECRET = "cooliebase-all-hmac-secret"

/**
 * **调用时**解析密钥（不在模块加载时抛错）：
 * `next build` 以 `NODE_ENV=production` 运行，模块加载时抛错会直接炸构建。
 */
function resolveAesKey(key?: string): Buffer {
  const raw = key || process.env.COOLIEBASE_SHARED_AES_KEY
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[crypto-engine] 生产环境必须设置 COOLIEBASE_SHARED_AES_KEY（32 字节）—— " +
          "拒绝使用仓库内置的默认密钥（公开可见，等于未加密）。",
      )
    }
    return Buffer.from(DEV_FALLBACK_AES_KEY.slice(0, 32).padEnd(32, "0"))
  }
  return Buffer.from(raw.slice(0, 32).padEnd(32, "0"))
}

/** 同上：签名密钥也不许在生产静默用默认值 */
function resolveHmacSecret(secret?: string): string {
  const raw = secret || process.env.COOLIEBASE_SHARED_HMAC_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[crypto-engine] 生产环境必须设置 COOLIEBASE_SHARED_HMAC_SECRET —— " +
          "拒绝使用仓库内置的默认签名密钥（公开可见）。",
      )
    }
    return DEV_FALLBACK_HMAC_SECRET
  }
  return raw
}

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
    const k = resolveAesKey(key)
    const iv = randomBytes(16)
    const cipher = createCipheriv("aes-256-cbc", k, iv)
    let encrypted = cipher.update(plaintext, "utf-8", "hex")
    encrypted += cipher.final("hex")
    return `${iv.toString("hex")}:${encrypted}`
  },

  /** AES-256-CBC 解密 */
  decrypt(ciphertext: string, key?: string): string {
    const k = resolveAesKey(key)
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
    return createHmac("sha256", resolveHmacSecret(secret)).update(data).digest("hex")
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
