import { createHmac } from "node:crypto"

const DEFAULT_SECRET = process.env.COOLIEBASE_API_SIGN_SECRET || "cooliebase-all-secure-sign-secret-2026"
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000 // 5 分钟有效时间窗口

// 内存 Nonce 缓存（单机/开发模式，生产环境可通过 Redis 集中判重）
const nonceCache = new Map<string, number>()

function cleanExpiredNonces() {
  const now = Date.now()
  for (const [nonce, expireAt] of nonceCache.entries()) {
    if (now > expireAt) nonceCache.delete(nonce)
  }
}

export type SignaturePayload = {
  method: string
  path: string
  timestamp: string | number
  nonce: string
  body?: any
  secret?: string
}

export function computeApiSignature(payload: SignaturePayload): string {
  const secret = payload.secret || DEFAULT_SECRET
  const method = payload.method.toUpperCase()
  const path = payload.path
  const timestamp = String(payload.timestamp)
  const nonce = payload.nonce
  const bodyStr = payload.body ? (typeof payload.body === "string" ? payload.body : JSON.stringify(payload.body)) : ""

  const canonicalString = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyStr}`
  return createHmac("sha256", secret).update(canonicalString).digest("hex")
}

export type VerifySignatureResult =
  | { success: true }
  | { success: false; code: "MISSING_HEADERS" | "EXPIRED" | "REPLAY_ATTACK" | "INVALID_SIGNATURE"; message: string }

export function verifyApiSignature(
  headers: Headers,
  method: string,
  path: string,
  body?: any,
  secret = DEFAULT_SECRET,
): VerifySignatureResult {
  const timestampHeader = headers.get("x-timestamp")
  const nonce = headers.get("x-nonce")
  const signature = headers.get("x-sign")

  if (!timestampHeader || !nonce || !signature) {
    return { success: false, code: "MISSING_HEADERS", message: "缺少防篡改签名请求头 (X-Timestamp, X-Nonce, X-Sign)" }
  }

  const timestamp = Number(timestampHeader)
  const now = Date.now()

  // 1. 防过期与时钟偏差检查
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > MAX_CLOCK_SKEW_MS) {
    return { success: false, code: "EXPIRED", message: "请求时间戳偏差过大或请求已过期" }
  }

  // 2. 防重放检查 (Anti-Replay)
  cleanExpiredNonces()
  if (nonceCache.has(nonce)) {
    return { success: false, code: "REPLAY_ATTACK", message: "检测到重复请求 (重放攻击已拦截)" }
  }
  nonceCache.set(nonce, now + MAX_CLOCK_SKEW_MS)

  // 3. 防篡改签名比对 (Anti-Tampering)
  const expectedSignature = computeApiSignature({
    method,
    path,
    timestamp,
    nonce,
    body,
    secret,
  })

  if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
    return { success: false, code: "INVALID_SIGNATURE", message: "接口数据签名校验失败 (数据可能已被篡改)" }
  }

  return { success: true }
}
