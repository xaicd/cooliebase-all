import { NextResponse } from "next/server"
import { DeliveryExpressTemplateFreeService } from "@/modules/mall/backend/services/delivery-express-template-free.service"
import { deliveryExpressTemplateFreeCreateSchema, deliveryExpressTemplateFreePageQuerySchema, deliveryExpressTemplateFreeUpdateSchema } from "@/modules/mall/backend/validators/delivery-express-template-free.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = deliveryExpressTemplateFreePageQuerySchema.parse(raw)
    const data = await DeliveryExpressTemplateFreeService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await DeliveryExpressTemplateFreeService.create(deliveryExpressTemplateFreeCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
