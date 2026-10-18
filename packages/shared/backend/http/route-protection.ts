/**
 * 路由级**声明式**防护：限流 / 幂等 / 签名校验。
 *
 * 上游把这三件防护做成**注解**挂在方法上，而不是写在业务代码里 ——
 * 好处是"哪些接口有防护"在路由表上一眼可见，也不会有人漏写。
 *
 * 本仓的原语（rateLimiter / protection-idempotent / protection-signature）早就有了，
 * 但只提供**命令式**入口 —— 结果是很少被用上。这里把它们接成 `withAdminRoute` 的选项。
 *
 * 设计约束: 全部**默认关闭**。这个包装器服务于所有 admin 路由，
 * 不能引入隐式行为变化 —— 加防护必须是路由作者显式声明的。
 */

import { rateLimiter } from "@/modules/shared/backend/lib/rate-limiter"
import { acquireIdempotencyKey } from "@/modules/shared/backend/lib/protection-idempotent"

export interface RouteRateLimitRule {
  /** 窗口内允许的最大请求数 */
  maxRequests: number
  /** 窗口长度（秒） */
  windowSeconds: number
  /** 限流维度，默认按用户（无 userId 时退到 IP） */
  dimension?: "userId" | "ip"
}

export interface RouteProtectionDecision {
  allowed: boolean
  /** 拒绝时给调用方的提示 */
  reason?: string
  status?: 429 | 409 | 400
  /** 建议的重试等待（秒），用于 Retry-After 头 */
  retryAfterSeconds?: number
}

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase())
}

/**
 * 声明式限流。规则由**路由**声明，这里只做判定。
 *
 * 与命令式调用的区别: 调用方不必知道该在哪一步检查、用什么 key ——
 * 那些都收敛在这里，声明处只写"这个接口允许多少 QPS"。
 */
export function checkRouteRateLimit(
  request: Request,
  actor: { userId?: string },
  path: string,
  rule: RouteRateLimitRule,
): RouteProtectionDecision {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined
  const dimension = rule.dimension ?? (actor.userId ? "userId" : "ip")
  // ★ 必须把**声明式规则**真的传进去 —— 否则规则被忽略、防护等于空转
  // （第一版就是只收了参数没传，被测试当场抓到）
  const result = rateLimiter.check(
    { ip, userId: actor.userId, api: path },
    [
      {
        id: `route:${path}`,
        dimension: dimension === "ip" ? "ip" : "userId",
        window: rule.windowSeconds,
        maxRequests: rule.maxRequests,
        action: "reject",
      },
    ],
  )
  if (result.allowed) return { allowed: true }
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return {
    allowed: false,
    status: 429,
    reason: `请求过于频繁（${dimension} 维度，窗口 ${rule.windowSeconds}s 内上限 ${rule.maxRequests}）`,
    retryAfterSeconds,
  }
}

/**
 * 声明式幂等（仅对写操作有意义）。
 *
 * 依赖 `Idempotency-Key` 请求头: **缺失即拒绝**（400）而不是放行 ——
 * 放行等于"没写防护"，而调用方以为有。重复的 key 返回 409。
 */
export function checkRouteIdempotency(request: Request, path: string, ttlMs = 60_000): RouteProtectionDecision {
  const key = request.headers.get("idempotency-key") ?? request.headers.get("Idempotency-Key")
  if (!key || !key.trim()) {
    return { allowed: false, status: 400, reason: "该接口要求 Idempotency-Key 请求头" }
  }
  if (!acquireIdempotencyKey(`${path}:${key.trim()}`, ttlMs)) {
    return { allowed: false, status: 409, reason: "重复提交（该 Idempotency-Key 已处理过）" }
  }
  return { allowed: true }
}

/** 把判定转成统一错误响应（与仓库既有的 { success:false, error } 契约一致）。 */
export function toProtectionResponse(decision: RouteProtectionDecision): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (decision.retryAfterSeconds) headers["Retry-After"] = String(decision.retryAfterSeconds)
  return new Response(
    JSON.stringify({ success: false, error: decision.reason ?? "请求被拒绝", code: decision.status === 429 ? "RATE_LIMITED" : "CONFLICT" }),
    { status: decision.status ?? 429, headers },
  )
}
