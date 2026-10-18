/**
 * 声明式路由防护（限流 / 幂等）。
 *
 * 重点是**默认关闭**这条: `withAdminRoute` 服务于所有 admin 路由，
 * 加防护必须是路由作者显式声明的，不能有隐式行为变化。
 */
import { describe, it, expect, beforeEach } from "vitest"
import { checkRouteIdempotency, checkRouteRateLimit, isMutationMethod, toProtectionResponse } from "../route-protection"
import { clearIdempotencyKeys } from "@/modules/shared/backend/lib/protection-idempotent"

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/v1/admin/demo", { method: "POST", headers })
}

describe("声明式路由防护", () => {
  beforeEach(() => clearIdempotencyKeys())

  it("限流未触发时放行", () => {
    const decision = checkRouteRateLimit(req({ "x-forwarded-for": "10.0.0.1" }), { userId: "u1" }, "/admin/demo", {
      maxRequests: 100,
      windowSeconds: 60,
    })
    expect(decision.allowed).toBe(true)
  })

  it("★ 超限返回 429，并带建议重试秒数（用于 Retry-After）", () => {
    const rule = { maxRequests: 1, windowSeconds: 60, dimension: "userId" as const }
    expect(checkRouteRateLimit(req(), { userId: "u2" }, "/admin/limited", rule).allowed).toBe(true)
    const second = checkRouteRateLimit(req(), { userId: "u2" }, "/admin/limited", rule)
    expect(second.allowed).toBe(false)
    expect(second.status).toBe(429)
    expect(second.retryAfterSeconds).toBeGreaterThan(0)
  })

  it("★ 声明了幂等但**没给** Idempotency-Key -> 400（而不是放行）", () => {
    const decision = checkRouteIdempotency(req(), "/admin/demo")
    expect(decision.allowed).toBe(false)
    expect(decision.status).toBe(400)
    expect(decision.reason).toMatch(/Idempotency-Key/)
  })

  it("★ 同一个 Idempotency-Key 第二次 -> 409（重复提交）", () => {
    const headers = { "idempotency-key": "k-1" }
    expect(checkRouteIdempotency(req(headers), "/admin/demo").allowed).toBe(true)
    const second = checkRouteIdempotency(req(headers), "/admin/demo")
    expect(second.allowed).toBe(false)
    expect(second.status).toBe(409)
  })

  it("不同路径 + 相同 key 互不影响（key 按路径隔离）", () => {
    const headers = { "idempotency-key": "k-2" }
    expect(checkRouteIdempotency(req(headers), "/admin/a").allowed).toBe(true)
    expect(checkRouteIdempotency(req(headers), "/admin/b").allowed).toBe(true)
  })

  it("幂等只对写操作有意义（GET 不适用）", () => {
    expect(isMutationMethod("POST")).toBe(true)
    expect(isMutationMethod("PUT")).toBe(true)
    expect(isMutationMethod("DELETE")).toBe(true)
    expect(isMutationMethod("GET")).toBe(false)
  })

  it("拒绝响应遵循本仓统一的 { success:false, error } 契约", async () => {
    const response = toProtectionResponse({ allowed: false, status: 429, reason: "太频繁", retryAfterSeconds: 12 })
    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("12")
    const body = (await response.json()) as { success: boolean; error: string; code: string }
    expect(body.success).toBe(false)
    expect(body.error).toBe("太频繁")
    expect(body.code).toBe("RATE_LIMITED")
  })
})
