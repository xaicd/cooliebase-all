import { NextResponse } from "next/server"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { PayTransferService } from "@/modules/pay/backend/services/pay-transfer.service"
import { payTransferCreateSchema, payTransferPageQuerySchema, payTransferUpdateSchema } from "@/modules/pay/backend/validators/pay-transfer.validator"

export const GET = withAdminRoute(async (request, auth) => {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payTransferPageQuerySchema.parse(raw)
    const data = await PayTransferService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "鏌ヨ澶辫触" }, { status: 400 })
  }
}, { permission: PERMISSIONS.PAY_TRANSFER_VIEW })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await PayTransferService.create(payTransferCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "鍒涘缓澶辫触" }, { status: 400 })
  }
}
