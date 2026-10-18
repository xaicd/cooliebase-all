import { randomBytes } from "node:crypto"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { AigwAccessTokenRepository, type AigwAccessTokenRow } from "@/modules/aigw/backend/repositories/aigw-access-token.repository"
import { aigwStore, maskSecret, type AigwAccessTokenRecord } from "./aigw.store"

export type AigwAccessTokenWriteInput = {
  name: string
  remainQuota?: number
  unlimited?: boolean
  models?: string[]
  ipAllowlist?: string[]
  group?: string
  expiresAt?: string
}

export class AigwAccessTokenService {
  static async page(input: { page: number; pageSize: number; keyword?: string }) {
    const rows = await AigwAccessTokenRepository.findAll({ keyword: input.keyword })
    const start = (input.page - 1) * input.pageSize
    domainLog.event("aigw.token.page", { page: input.page, total: rows.length })
    return {
      items: rows.slice(start, start + input.pageSize).map((item) => ({ ...item, key: maskSecret(item.key) })),
      total: rows.length,
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  static async create(input: AigwAccessTokenWriteInput) {
    const all = await AigwAccessTokenRepository.findAll()
    if (all.some((item) => item.name === input.name)) throw new Error("令牌名称已存在")
    const key = `sk-cooliebase-${randomBytes(12).toString("hex")}`
    const record = await AigwAccessTokenRepository.create({
      name: input.name,
      key,
      status: "ACTIVE",
      remainQuota: input.remainQuota ?? 500_000,
      unlimited: input.unlimited ?? false,
      models: input.models ?? [],
      ipAllowlist: input.ipAllowlist ?? [],
      group: input.group ?? "default",
      expiresAt: input.expiresAt,
    })
    aigwStore.tokens.push({
      id: record.id,
      name: record.name,
      key: record.key,
      status: record.status,
      remainQuota: record.remainQuota,
      unlimited: record.unlimited,
      models: record.models,
      ipAllowlist: record.ipAllowlist,
      group: record.group,
      expiresAt: record.expiresAt ?? undefined,
      tenantId: record.tenantId ?? undefined,
      createdAt: record.createdAt,
    })
    domainLog.audit("aigw.token.create", { targetType: "AIGW_TOKEN", targetId: record.id })
    return { id: record.id, key }
  }

  static async update(input: { id: string; status?: "ACTIVE" | "DISABLED"; remainQuota?: number; models?: string[] }) {
    const record = await AigwAccessTokenRepository.findById(input.id)
    if (!record) throw new Error("令牌不存在")
    await AigwAccessTokenRepository.update(input.id, input)
    const storeToken = aigwStore.tokens.find((t) => t.id === input.id)
    if (storeToken) {
      if (input.status) storeToken.status = input.status
      if (input.remainQuota !== undefined) storeToken.remainQuota = input.remainQuota
      if (input.models) storeToken.models = input.models
    }
    domainLog.audit("aigw.token.update", { targetType: "AIGW_TOKEN", targetId: record.id })
    return true
  }

  static async delete(id: string) {
    await AigwAccessTokenRepository.delete(id)
    const idx = aigwStore.tokens.findIndex((t) => t.id === id)
    if (idx !== -1) aigwStore.tokens.splice(idx, 1)
    domainLog.audit("aigw.token.delete", { targetType: "AIGW_TOKEN", targetId: id })
    return true
  }

  static assertUsable(apiKey: string, opts?: { model?: string; clientIp?: string }): AigwAccessTokenRecord {
    const key = (apiKey || "").replace(/^Bearer\s+/i, "").trim()
    const token = aigwStore.tokens.find((item) => item.key === key)
    if (!token) {
      const err = new Error("无效令牌") as any
      err.status = 401
      throw err
    }
    if (token.status !== "ACTIVE") {
      const err = new Error("令牌已被禁用") as any
      err.status = 403
      throw err
    }
    if (token.expiresAt && new Date(token.expiresAt).getTime() < Date.now()) {
      const err = new Error("令牌已过期") as any
      err.status = 403
      throw err
    }
    if (!token.unlimited && token.remainQuota <= 0) {
      const err = new Error("令牌额度已耗尽") as any
      err.status = 402
      throw err
    }
    if (opts?.model && token.models.length > 0 && !token.models.includes(opts.model)) {
      const err = new Error(`令牌无权访问模型: ${opts.model}`) as any
      err.status = 403
      throw err
    }
    return token
  }

  static deductQuota(tokenKey: string, amount: number) {
    const key = tokenKey.replace(/^Bearer\s+/i, "").trim()
    const token = aigwStore.tokens.find((item) => item.key === key)
    if (!token) throw new Error("令牌不存在")
    if (token.unlimited) return { success: true, remainQuota: token.remainQuota }
    if (token.remainQuota < amount) return { success: false, remainQuota: token.remainQuota }
    token.remainQuota -= amount
    domainLog.event("aigw.token.deductQuota", { keyMasked: maskSecret(key), amount })
    return { success: true, remainQuota: token.remainQuota }
  }

  static consume(tokenId: string, tokens: number) {
    const token = aigwStore.tokens.find((item) => item.id === tokenId)
    if (!token) return
    if (!token.unlimited) {
      token.remainQuota = Math.max(0, token.remainQuota - tokens)
    }
    void AigwAccessTokenRepository.deductQuota(token.key, tokens)
  }
}
