import { NextResponse } from "next/server"
import { PayDemoWithdrawService } from "@/modules/pay/backend/services/pay-demo-withdraw.service"
import { payDemoWithdrawCreateSchema, payDemoWithdrawPageQuerySchema, payDemoWithdrawUpdateSchema } from "@/modules/pay/backend/validators/pay-demo-withdraw.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payDemoWithdrawPageQuerySchema.parse(raw)
    const data = await PayDemoWithdrawService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await PayDemoWithdrawService.create(payDemoWithdrawCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
