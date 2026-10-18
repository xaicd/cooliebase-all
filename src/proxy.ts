import { NextRequest, NextResponse, type ProxyConfig } from "next/server"
import { AuthenticationError, AuthorizationError } from "@/shared/backend/auth/context"
import { requireAdminAuth } from "@/shared/backend/auth/guards"
import { getAdminRoutePolicy } from "@/shared/backend/lib/admin-route-policy"
import { matchRemoteDomainUpstream } from "@/shared/backend/lib/domain-pack"

const STATIC_UPSTREAMS: Record<string, string | undefined> = {
  RUOYI_DOMAIN_SYSTEM_UPSTREAM: process.env.RUOYI_DOMAIN_SYSTEM_UPSTREAM,
  RUOYI_DOMAIN_INFRA_UPSTREAM: process.env.RUOYI_DOMAIN_INFRA_UPSTREAM,
  RUOYI_DOMAIN_ONLINE_UPSTREAM: process.env.RUOYI_DOMAIN_ONLINE_UPSTREAM,
  RUOYI_DOMAIN_BPM_UPSTREAM: process.env.RUOYI_DOMAIN_BPM_UPSTREAM,
  RUOYI_DOMAIN_PAY_UPSTREAM: process.env.RUOYI_DOMAIN_PAY_UPSTREAM,
  RUOYI_DOMAIN_REPORT_UPSTREAM: process.env.RUOYI_DOMAIN_REPORT_UPSTREAM,
  RUOYI_DOMAIN_MP_UPSTREAM: process.env.RUOYI_DOMAIN_MP_UPSTREAM,
  RUOYI_DOMAIN_MALL_UPSTREAM: process.env.RUOYI_DOMAIN_MALL_UPSTREAM,
  RUOYI_DOMAIN_MEMBER_UPSTREAM: process.env.RUOYI_DOMAIN_MEMBER_UPSTREAM,
  RUOYI_DOMAIN_CRM_UPSTREAM: process.env.RUOYI_DOMAIN_CRM_UPSTREAM,
  RUOYI_DOMAIN_ERP_UPSTREAM: process.env.RUOYI_DOMAIN_ERP_UPSTREAM,
  RUOYI_DOMAIN_WMS_UPSTREAM: process.env.RUOYI_DOMAIN_WMS_UPSTREAM,
  RUOYI_DOMAIN_MES_UPSTREAM: process.env.RUOYI_DOMAIN_MES_UPSTREAM,
  RUOYI_DOMAIN_AI_UPSTREAM: process.env.RUOYI_DOMAIN_AI_UPSTREAM,
  RUOYI_DOMAIN_IOT_UPSTREAM: process.env.RUOYI_DOMAIN_IOT_UPSTREAM,
  RUOYI_DOMAIN_IM_UPSTREAM: process.env.RUOYI_DOMAIN_IM_UPSTREAM,
  RUOYI_PACK_DOMAIN: process.env.RUOYI_PACK_DOMAIN,
}

const HOP_BY_HOP = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade", "host", "content-length"])

function headersFrom(source: Headers): Headers {
  const headers = new Headers()
  source.forEach((value, key) => { if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value) })
  return headers
}

async function forwardDomainUpstream(request: NextRequest, match: { domain: string; baseUrl: string }) {
  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, match.baseUrl)
  const headers = headersFrom(request.headers)
  headers.set("x-cooliebase-upstream-domain", match.domain)
  headers.set("x-forwarded-host", request.headers.get("host") ?? "")
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""))
  const init: RequestInit = { method: request.method, headers, redirect: "manual" }
  if (!["GET", "HEAD"].includes(request.method)) init.body = await request.arrayBuffer()
  try {
    const upstream = await fetch(target, init)
    const responseHeaders = headersFrom(upstream.headers)
    responseHeaders.set("x-cooliebase-upstream-domain", match.domain)
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders })
  } catch {
    return NextResponse.json({ success: false, error: `domain upstream unavailable: ${match.domain}` }, { status: 502, headers: { "x-cooliebase-upstream-domain": match.domain } })
  }
}

/**
 * Next.js 16 perimeter: domain BFF forwarding plus admin API authentication.
 * Resource permissions remain inside each Route Handler.
 */
export async function proxy(request: NextRequest) {
  const match = matchRemoteDomainUpstream(request.nextUrl.pathname, STATIC_UPSTREAMS)
  if (match) return forwardDomainUpstream(request, match)
  if (!request.nextUrl.pathname.startsWith("/api/v1/admin/")) return NextResponse.next()
  if (getAdminRoutePolicy(request.nextUrl.pathname, request.method) === "public") return NextResponse.next()
  try {
    await requireAdminAuth(request)
    return NextResponse.next()
  } catch (error) {
    const status = error instanceof AuthenticationError || error instanceof AuthorizationError ? error.status : 500
    return NextResponse.json(
      { success: false, error: status === 401 ? "未登录或登录已过期" : status === 403 ? "没有权限执行此操作" : "管理员认证服务不可用" },
      { status },
    )
  }
}

export const config: ProxyConfig = {
  matcher: ["/api/v1/:path*"],
}
