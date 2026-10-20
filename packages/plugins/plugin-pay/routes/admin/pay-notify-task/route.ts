import { NextResponse } from "next/server"
import { PayNotifyTaskService } from "@/modules/pay/backend/services/pay-notify-task.service"
import { payNotifyTaskCreateSchema, payNotifyTaskPageQuerySchema, payNotifyTaskUpdateSchema } from "@/modules/pay/backend/validators/pay-notify-task.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payNotifyTaskPageQuerySchema.parse(raw)
    const data = await PayNotifyTaskService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await PayNotifyTaskService.create(payNotifyTaskCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
