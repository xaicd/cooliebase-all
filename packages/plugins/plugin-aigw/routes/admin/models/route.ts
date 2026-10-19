import { NextResponse } from "next/server"
import { AigwModelService } from "@/modules/aigw/backend/services/aigw-model.service"
import { aigwPageQuerySchema, aigwModelWriteSchema } from "@/modules/aigw/backend/validators"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"

export const GET = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const query = aigwPageQuerySchema.parse({
    page: searchParams.get("page") ?? 1,
    pageSize: searchParams.get("pageSize") ?? 20,
    keyword: searchParams.get("keyword") ?? undefined,
  })
  const data = await AigwModelService.page(query as any)
  return NextResponse.json({ success: true, data })
}, { permission: PERMISSIONS.AIGW_MODEL_VIEW })

export const POST = withAdminRoute(async (request) => {
  const body = aigwModelWriteSchema.parse(await request.json())
  const data = await AigwModelService.create(body as any)
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { permission: PERMISSIONS.AIGW_MODEL_CREATE })

export const PUT = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) throw new Error("缺少模型 ID")
  const body = await request.json()
  await AigwModelService.update(id, body)
  return NextResponse.json({ success: true })
}, { permission: PERMISSIONS.AIGW_MODEL_UPDATE })

export const DELETE = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) throw new Error("缺少模型 ID")
  await AigwModelService.delete(id)
  return NextResponse.json({ success: true })
}, { permission: PERMISSIONS.AIGW_MODEL_DELETE })
