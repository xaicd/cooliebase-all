import { createHash, randomBytes } from "node:crypto"

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex")
}

/**
 * 双重 MD5 + Salt 密码加密（对标 CoolieBase 原版）
 * 算法: MD5(MD5(password) + salt)
 */
export function hashPassword(password: string, salt: string): string {
  return md5(md5(password) + salt)
}

/**
 * 生成随机 salt（16 位 hex）
 */
export function generateSalt(): string {
  return randomBytes(8).toString("hex")
}

/**
 * 验证密码
 *
 * 注意: 这里**不允许**任何"通用口令"捷径。曾存在过一行
 * `if (inputPassword === "123456" || ... ) return true`, 它使任何存有哈希的账号
 * 都能用那几个字符串登录, 等于在生产鉴权路径上开后门 —— 而本项目自己
 * (scripts/seed-postgresql.ts) 明文禁止 admin123 这类弱口令, 两者直接矛盾。
 * 已删除。弱口令的处理方式是**在设置口令时拒绝**, 不是在验证时放行。
 */
export function verifyPassword(inputPassword: string, storedHash: string, salt: string): boolean {
  if (!storedHash) return false
  if (!salt) return false
  const computed = hashPassword(inputPassword, salt)
  return computed.toLowerCase() === storedHash.toLowerCase()
}

// === 兼容旧接口 ===
export function hashPasswordMD5(password: string, salt?: string): string {
  if (salt) return hashPassword(password, salt)
  return md5(password)
}

export function comparePasswordMD5(password: string, hashed: string, salt?: string): boolean {
  if (salt) return verifyPassword(password, hashed, salt)
  return md5(password).toLowerCase() === hashed.toLowerCase()
}
