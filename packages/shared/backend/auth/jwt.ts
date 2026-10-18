import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { AuthenticationError, type AuthEndpoint } from "./context"
import { isAdminSessionRevoked } from "./session-registry"

const DEVELOPMENT_SECRET = "cooliebase-all-dev-secret-key-2026"
const MAX_EXPIRES_IN_SECONDS = 24 * 60 * 60

type JwtHeader = { alg: "HS256"; typ: "JWT" }

export type JwtPayload = {
  sub: string
  username?: string
  permissions: string[]
  roles: string[]
  tenantId?: string
  memberId?: string
  memberLevel?: string
  type: AuthEndpoint
  jti?: string
  iat: number
  exp: number
  iss?: string
  aud?: string
}

export type JwtIssuePayload = Omit<JwtPayload, "iat" | "exp" | "iss" | "aud">

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}

function decodeJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T
  } catch {
    throw new AuthenticationError(`无效的 JWT ${label}`)
  }
}

function getConfig() {
  const isProduction = process.env.NODE_ENV === "production"
  const secret = process.env.JWT_SECRET ?? (isProduction ? "" : DEVELOPMENT_SECRET)
  if (!secret || (isProduction && (secret === DEVELOPMENT_SECRET || Buffer.byteLength(secret) < 32))) {
    throw new Error("生产环境必须配置至少 32 字节且非默认值的 JWT_SECRET")
  }

  const expiresIn = Number(process.env.JWT_EXPIRES_IN ?? MAX_EXPIRES_IN_SECONDS)
  if (!Number.isInteger(expiresIn) || expiresIn < 60 || expiresIn > MAX_EXPIRES_IN_SECONDS) {
    throw new Error("JWT_EXPIRES_IN 必须为 60 到 86400 秒之间的整数")
  }
  return { secret, expiresIn, issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE }
}

function signature(signingInput: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(signingInput).digest()
}


function assertPayload(value: unknown, endpoint?: AuthEndpoint): asserts value is JwtPayload {
  if (!value || typeof value !== "object") throw new AuthenticationError("无效的 JWT Payload")
  const payload = value as Partial<JwtPayload>
  if (typeof payload.sub !== "string" || !payload.sub || typeof payload.iat !== "number" || typeof payload.exp !== "number") {
    throw new AuthenticationError("JWT 缺少必要声明")
  }
  if (!Array.isArray(payload.permissions) || !Array.isArray(payload.roles) || (payload.type !== "admin" && payload.type !== "app")) {
    throw new AuthenticationError("JWT 声明格式无效")
  }
  if (endpoint && payload.type !== endpoint) throw new AuthenticationError("JWT 使用场景不匹配")
}

export function issueJwt(payload: JwtIssuePayload): { token: string; expiresIn: number; jti: string } {
  const { secret, expiresIn, issuer, audience } = getConfig()
  const now = Math.floor(Date.now() / 1000)
  const jti = payload.jti ?? randomUUID()
  const fullPayload: JwtPayload = { ...payload, jti, iat: now, exp: now + expiresIn, ...(issuer ? { iss: issuer } : {}), ...(audience ? { aud: audience } : {}) }
  const header: JwtHeader = { alg: "HS256", typ: "JWT" }
  const signingInput = `${encode(header)}.${encode(fullPayload)}`
  return { token: `${signingInput}.${signature(signingInput, secret).toString("base64url")}`, expiresIn, jti }
}

export function verifyJwt(token: string, endpoint?: AuthEndpoint): JwtPayload {
  const parts = token.split(".")
  if (parts.length !== 3 || parts.some((part) => !part)) throw new AuthenticationError("JWT 格式无效")

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = decodeJson<JwtHeader>(encodedHeader, "Header")
  if (header.alg !== "HS256" || header.typ !== "JWT") throw new AuthenticationError("JWT 算法不被允许")

  const { secret, issuer, audience } = getConfig()
  const actual = Buffer.from(encodedSignature, "base64url")
  const expected = signature(`${encodedHeader}.${encodedPayload}`, secret)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new AuthenticationError("JWT 签名无效")
  }

  const payload = decodeJson<JwtPayload>(encodedPayload, "Payload")
  assertPayload(payload, endpoint)
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now || payload.iat > now + 60) throw new AuthenticationError("JWT 已过期或尚未生效")
  if (isAdminSessionRevoked(payload.jti)) throw new AuthenticationError("登录已失效")
  if (issuer && payload.iss !== issuer) throw new AuthenticationError("JWT issuer 无效")
  if (audience && payload.aud !== audience) throw new AuthenticationError("JWT audience 无效")
  return payload
}

export function validateJwtConfiguration(): void {
  getConfig()
}
