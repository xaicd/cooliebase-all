import { NextResponse } from "next/server"
import { AiApiKeyService } from "@/modules/ai/backend/services/ai-api-key.service"
import { aiApiKeyCreateSchema, aiApiKeyPageQuerySchema, aiApiKeyUpdateSchema } from "@/modules/ai/backend/validators/ai-api-key.validator"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"

export const GET = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const raw: Record<string, unknown> = {}
  searchParams.forEach((value, key) => { raw[key] = value })
  const input = aiApiKeyPageQuerySchema.parse(raw)
  const data = await AiApiKeyService.page(input)
  return NextResponse.json({ success: true, data })
}, { permission: PERMISSIONS.AI_API_KEY_VIEW })

export const POST = withAdminRoute(async (request) => {
  const body = await request.json()
  const data = await AiApiKeyService.create(aiApiKeyCreateSchema.parse(body))
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { permission: PERMISSIONS.AI_API_KEY_CREATE })
