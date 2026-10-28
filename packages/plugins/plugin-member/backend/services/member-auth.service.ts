/**
 * Member Auth Service - C 端会员注册/登录/登出（真实落库，非 mock）
 *
 * 复用平台底座：lib/crypto（加盐哈希）、auth/jwt（签发 type:'app' JWT）。
 * 登录失败统一错误（防账号枚举）。
 */

import { MemberUserRepository, type MemberUserRow } from "@/modules/member/backend/repositories/member-user.repository"
import { resolveTenantIdByCode } from "@/modules/shared/backend/auth/tenant-resolver"
import { getCurrentTenantId } from "@/modules/shared/backend/lib/biz-tenant"
import { hashPassword, generateSalt, verifyPassword } from "@/modules/shared/backend/lib/crypto"
import { issueJwt } from "@/modules/shared/backend/auth/jwt"
import { AuthenticationError } from "@/modules/shared/backend/auth/context"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import type { MemberRegisterInput, MemberLoginInput } from "@/modules/member/backend/validators/member-auth.validators"
import { ApiError } from "@/shared/backend/http/api-error"

export type MemberPublic = {
  id: string
  account: string
  email: string | null
  nickname: string
  avatarUrl: string | null
  memberLevel: string
  status: string
  extraFields: Record<string, unknown>
}

function toPublic(row: MemberUserRow): MemberPublic {
  return {
    id: row.id,
    account: row.account,
    email: row.email,
    nickname: row.nickname,
    avatarUrl: row.avatarUrl,
    memberLevel: row.memberLevel,
    status: row.status,
    extraFields: row.extraFields ?? {},
  }
}

/**
 * 注册场景的租户定位：优先显式 tenantCode，其次回落当前上下文。
 * 会员按租户隔离（§4.8），两处都拿不到租户时直接报错，绝不落到隐式默认租户。
 */
async function requireTenantIdForRegister(input: { tenantCode?: string }): Promise<string> {
  if (input.tenantCode) {
    const tenantId = await resolveTenantIdByCode(input.tenantCode)
    if (!tenantId) throw new Error("租户标识不存在")
    return tenantId
  }
  const contextTenantId = getCurrentTenantId()
  if (contextTenantId) return contextTenantId
  throw new Error("缺少租户标识：请提供 tenantCode")
}

/** 登录场景的租户定位：tenantCode 可选；不传时由仓储做跨租户唯一定位并拒绝歧义 */
async function optionalTenantIdForLogin(input: { tenantCode?: string }): Promise<string | undefined> {
  if (!input.tenantCode) return undefined
  const tenantId = await resolveTenantIdByCode(input.tenantCode)
  if (!tenantId) throw new Error("租户标识不存在")
  return tenantId
}

export class MemberAuthService {
  /** 注册：租户内账号去重 + 加盐哈希落库 */
  static async register(input: MemberRegisterInput): Promise<MemberPublic> {
    const tenantId = await requireTenantIdForRegister(input)
    const existing = await MemberUserRepository.findByAccount(input.account, tenantId)
    if (existing) throw new ApiError("CONFLICT", "账号已注册")

    const salt = generateSalt()
    const passwordHash = hashPassword(input.password, salt)
    const created = await MemberUserRepository.insert({
      tenantId,
      account: input.account,
      email: input.email ?? null,
      passwordHash,
      passwordSalt: salt,
      nickname: input.nickname?.trim() || input.account,
    })
    domainLog.event("member.auth.register", { memberId: created.id, account: created.account, tenantId })
    return toPublic(created)
  }

  /** 登录：校验密码 → 签发携带 tenantId 的 app JWT。失败统一错误（防枚举） */
  static async login(input: MemberLoginInput): Promise<{ token: string; expiresIn: number; member: MemberPublic }> {
    const tenantId = await optionalTenantIdForLogin(input)
    const member = await MemberUserRepository.findByAccount(input.account, tenantId)
    const invalid = new AuthenticationError("账号或密码错误")
    if (!member) throw invalid
    if (member.status !== "ACTIVE") throw invalid
    if (!verifyPassword(input.password, member.passwordHash, member.passwordSalt)) throw invalid

    const { token, expiresIn } = issueJwt({
      sub: member.id,
      username: member.account,
      memberId: member.id,
      memberLevel: member.memberLevel,
      // 租户随 JWT 贯穿后续 app 请求：withAppRoute → toTenantContext 依赖它做租户隔离
      tenantId: member.tenantId,
      roles: [],
      permissions: [],
      type: "app",
    })
    domainLog.event("member.auth.login", { memberId: member.id, tenantId: member.tenantId })
    return { token, expiresIn, member: toPublic(member) }
  }

  /** 登出：无状态 JWT，受理即可（预留 session 撤销扩展） */
  static async logout(memberId: string): Promise<{ success: true }> {
    domainLog.event("member.auth.logout", { memberId })
    return { success: true }
  }
}
