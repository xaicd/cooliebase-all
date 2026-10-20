import { NextResponse } from "next/server"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { PayChannelService } from "@/modules/pay/backend/services/pay-channel.service"
import { payChannelCreateSchema, payChannelPageQuerySchema, payChannelUpdateSchema } from "@/modules/pay/backend/validators/pay-channel.validator"

export const GET = withAdminRoute(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payChannelPageQuerySchema.parse(raw)
    const data = await PayChannelService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "鏌ヨ澶辫触" }, { status: 400 })
  }
}, { permission: PERMISSIONS.PAY_CHANNEL_VIEW })

export const POST = withAdminRoute(async (request, auth) => {
  try {
    const body = await request.json()
    const data = await PayChannelService.create(payChannelCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "鍒涘缓澶辫触" }, { status: 400 })
  }
}, { permission: PERMISSIONS.PAY_CHANNEL_CREATE })
