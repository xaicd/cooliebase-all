import {
  checkRouteIdempotency,
  checkRouteRateLimit,
  isMutationMethod,
  toProtectionResponse,
  type RouteRateLimitRule,
} from "./route-protection"
import type { PermissionCode } from "../constants/permissions"
import type { AuthContext } from "../auth/context"
import { requireAdminAuth, requirePlatformAdmin } from "../auth/guards"
import { toTenantContext } from "../auth/tenant"
import { runWithTenantContext } from "../lib/biz-tenant"
import { handleApiError } from "./api-error"
import { recordApiAccess, resolveApiAccessOutcome } from "../lib/observability"
import { persistApiAccessLog, persistOperateAuditLog } from "../lib/api-log-persistence"
import { traceContext } from "../lib/trace-context"

export type AdminRouteOptions = {
  permission?: PermissionCode
  platformOnly?: boolean
  /**
   * 声明式限流 —— 挂在路由上，不写在业务里。
   * **默认关闭**: 本包装器服务于所有 admin 路由，不能引入隐式行为变化。
   */
  rateLimit?: RouteRateLimitRule
  /**
   * 声明式幂等 —— 仅对写操作生效，依赖 `Idempotency-Key` 头。默认关闭。
   */
  idempotent?: boolean
}

type AdminRouteHandler<TArgs extends unknown[]> = (
  request: Request,
  auth: AuthContext,
  ...args: TArgs
) => Response | Promise<Response>

const AUDIT_EXCLUDED_PATHS = ["/login-logs", "/operate-logs", "/api-access-log", "/api-error-logs"]

function isAuditedMutation(method: string, path: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method) && !AUDIT_EXCLUDED_PATHS.some((segment) => path.includes(segment))
}

function describeOperation(method: string, path: string) {
  const segments = path.split("/").filter(Boolean).slice(3)
  const module = (segments[0] ?? "admin").slice(0, 50)
  const resource = segments.slice(1).join("/") || module
  const type = method === "POST" ? "CREATE" : method === "DELETE" ? "DELETE" : "UPDATE"
  return { module, name: `${type} ${resource}`.slice(0, 100), type: type as "CREATE" | "UPDATE" | "DELETE" }
}

/**
 * Resource-level admin boundary. Proxy protects the perimeter; this wrapper
 * enforces the route permission and keeps tenant context alive for all async work.
 */
export function withAdminRoute<TArgs extends unknown[]>(
  handler: AdminRouteHandler<TArgs>,
  options: AdminRouteOptions = {},
): (request: Request, ...args: TArgs) => Promise<Response> {
  return async (request, ...args) => {
    const path = new URL(request.url).pathname
    const trace = traceContext.fromHeaders(request.headers, "admin-api", `${request.method} ${path}`)
    return traceContext.runWithTrace(trace, async () => {
      const startedAt = Date.now()
      let userId: string | undefined
      let tenantId: string | undefined
      let response: Response
      try {
        const auth = options.platformOnly
          ? await requirePlatformAdmin(request, options.permission)
          : await requireAdminAuth(request, options.permission)
        userId = auth.userId
        tenantId = auth.tenantId
        // ---- 声明式防护（默认关闭；由路由显式声明）----
        // 顺序: 限流 -> 幂等 -> 业务。放在鉴权之后、业务之前 ——
        // 既避免未鉴权请求打满计数器，也保证被拒的请求不产生副作用。
        const rateDecision = options.rateLimit
          ? checkRouteRateLimit(request, { userId: auth.userId }, path, options.rateLimit)
          : { allowed: true as const }
        if (!rateDecision.allowed) {
          response = toProtectionResponse(rateDecision)
        } else {
          const idempotencyDecision =
            options.idempotent && isMutationMethod(request.method)
              ? checkRouteIdempotency(request, path)
              : { allowed: true as const }
          response = idempotencyDecision.allowed
            ? await runWithTenantContext(toTenantContext(auth), () => handler(request, auth, ...args))
            : toProtectionResponse(idempotencyDecision)
        }
      } catch (error) {
        response = handleApiError(error, { request, operation: trace.operationName })
      }
      const errorCode = response.headers.get("X-Error-Code") ?? undefined
      const accessLog = {
        method: request.method, path, status: response.status, durationMs: Date.now() - startedAt, userId, tenantId,
        outcome: resolveApiAccessOutcome(response.status, errorCode), errorCode,
      }
      recordApiAccess(accessLog)
      const userIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      void persistApiAccessLog({ ...accessLog, traceId: trace.traceId, userIp, userAgent: request.headers.get("user-agent") ?? undefined, operation: trace.operationName })
      if (isAuditedMutation(request.method, path)) {
        const operation = describeOperation(request.method, path)
        void persistOperateAuditLog({ ...operation, method: request.method, path, status: response.status, durationMs: accessLog.durationMs, userId, tenantId, userIp })
      }
      response.headers.set("X-Trace-Id", trace.traceId)
      return response
    })
  }
}
