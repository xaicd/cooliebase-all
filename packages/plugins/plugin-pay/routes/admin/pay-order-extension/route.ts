import { NextResponse } from "next/server"
import { PayOrderExtensionService } from "@/modules/pay/backend/services/pay-order-extension.service"
import { payOrderExtensionCreateSchema, payOrderExtensionPageQuerySchema, payOrderExtensionUpdateSchema } from "@/modules/pay/backend/validators/pay-order-extension.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payOrderExtensionPageQuerySchema.parse(raw)
    const data = await PayOrderExtensionService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await PayOrderExtensionService.create(payOrderExtensionCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
