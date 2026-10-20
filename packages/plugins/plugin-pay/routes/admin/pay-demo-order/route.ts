import { NextResponse } from "next/server"
import { PayDemoOrderService } from "@/modules/pay/backend/services/pay-demo-order.service"
import { payDemoOrderCreateSchema, payDemoOrderPageQuerySchema, payDemoOrderUpdateSchema } from "@/modules/pay/backend/validators/pay-demo-order.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payDemoOrderPageQuerySchema.parse(raw)
    const data = await PayDemoOrderService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await PayDemoOrderService.create(payDemoOrderCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
