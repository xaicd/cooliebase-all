import { NextResponse } from "next/server"
import { PayNotifyLogService } from "@/modules/pay/backend/services/pay-notify-log.service"
import { payNotifyLogCreateSchema, payNotifyLogPageQuerySchema, payNotifyLogUpdateSchema } from "@/modules/pay/backend/validators/pay-notify-log.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payNotifyLogPageQuerySchema.parse(raw)
    const data = await PayNotifyLogService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await PayNotifyLogService.create(payNotifyLogCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
