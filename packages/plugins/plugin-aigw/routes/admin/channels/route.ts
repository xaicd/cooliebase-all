import { NextResponse } from "next/server"
import { AigwChannelService } from "@/modules/aigw/backend/services/aigw-channel.service"
import { AIGW_ACTION_SCHEMAS } from "@/modules/aigw/contract/actions"
import { parseActionQuery, parseActionBody } from "@/modules/shared/backend/http/parse-action-input"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"

export const GET = withAdminRoute(async (request) => {
  const query = parseActionQuery(AIGW_ACTION_SCHEMAS["aigw.listChannels"], request)
  const data = await AigwChannelService.page(query as any)
  return NextResponse.json({ success: true, data })
}, { permission: PERMISSIONS.AIGW_CHANNEL_VIEW })


export const POST = withAdminRoute(async (request) => {
  const body = await parseActionBody(AIGW_ACTION_SCHEMAS["aigw.createChannel"], request)
  const data = await AigwChannelService.create(body as any)
  return NextResponse.json({ success: true, data }, { status: 201 })
}, { permission: PERMISSIONS.AIGW_CHANNEL_CREATE })

export const PUT = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) throw new Error("缺少渠道 ID")
  const body = await request.json()
  await AigwChannelService.update(id, body)
  return NextResponse.json({ success: true })
}, { permission: PERMISSIONS.AIGW_CHANNEL_UPDATE })

export const DELETE = withAdminRoute(async (request) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) throw new Error("缺少渠道 ID")
  await AigwChannelService.delete(id)
  return NextResponse.json({ success: true })
}, { permission: PERMISSIONS.AIGW_CHANNEL_DELETE })
