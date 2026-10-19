import { NextResponse } from "next/server"
import { AiApiKeyService } from "@/modules/ai/backend/services/ai-api-key.service"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"

type RouteContext = { params: Promise<{ id: string }> }

export const GET = withAdminRoute(async (_request, _auth, context: RouteContext) => {
  const { id } = await context.params
  const data = await AiApiKeyService.get(id)
  if (!data) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 })
  return NextResponse.json({ success: true, data })
}, { permission: PERMISSIONS.AI_API_KEY_VIEW })

export const PUT = withAdminRoute(async (request, _auth, context: RouteContext) => {
  const { id } = await context.params
  const body = await request.json()
  const data = await AiApiKeyService.update(id, body)
  return NextResponse.json({ success: true, data })
}, { permission: PERMISSIONS.AI_API_KEY_UPDATE })

export const DELETE = withAdminRoute(async (_request, _auth, context: RouteContext) => {
  const { id } = await context.params
  const data = await AiApiKeyService.delete(id)
  return NextResponse.json({ success: true, data })
}, { permission: PERMISSIONS.AI_API_KEY_DELETE })
