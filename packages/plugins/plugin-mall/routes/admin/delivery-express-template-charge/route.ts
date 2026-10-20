import { NextResponse } from "next/server"
import { DeliveryExpressTemplateChargeService } from "@/modules/mall/backend/services/delivery-express-template-charge.service"
import { deliveryExpressTemplateChargeCreateSchema, deliveryExpressTemplateChargePageQuerySchema, deliveryExpressTemplateChargeUpdateSchema } from "@/modules/mall/backend/validators/delivery-express-template-charge.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = deliveryExpressTemplateChargePageQuerySchema.parse(raw)
    const data = await DeliveryExpressTemplateChargeService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await DeliveryExpressTemplateChargeService.create(deliveryExpressTemplateChargeCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
