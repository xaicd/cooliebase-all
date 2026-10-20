import { NextResponse } from "next/server"
import { AigwAccessTokenService } from "@/modules/aigw/backend/services/aigw-access-token.service"
import { aigwPageQuerySchema, aigwTokenWriteSchema } from "@/modules/aigw/backend/validators"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"

export const GET = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const query = aigwPageQuerySchema.parse({
    page: searchParams.get("page") ?? 1,
    pageSize: searchParams.get("pageSize") ?? 20,
    keyword: searchParams.get("keyword") ?? undefined,
  })
  const data = await AigwAccessTokenService.page(query as any)
  return NextResponse.json({ success: true, data })
}, { permission: PERMISSIONS.AIGW_TOKEN_VIEW })

export const POST = withAdminRoute(async (request) => {
  const body = aigwTokenWriteSchema.parse(await request.json())
  const data = await AigwAccessTokenService.create(body as any)
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { permission: PERMISSIONS.AIGW_TOKEN_CREATE })

export const PUT = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) throw new Error("缺少令牌 ID")
  const body = await request.json()
  // PUT 与本文件 POST 用**同一个写 schema** —— POST 已校验、PUT 却裸传是漏接（§4.1）。
  await AigwAccessTokenService.update(id, aigwTokenWriteSchema.parse(body))
  return NextResponse.json({ success: true })
}, { permission: PERMISSIONS.AIGW_TOKEN_UPDATE })

export const DELETE = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) throw new Error("缺少令牌 ID")
  await AigwAccessTokenService.delete(id)
  return NextResponse.json({ success: true })
}, { permission: PERMISSIONS.AIGW_TOKEN_DELETE })
