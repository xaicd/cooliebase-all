import { NextResponse } from "next/server"
import { DeliveryExpressTemplateService } from "@/modules/mall/backend/services/delivery-express-template.service"
import { deliveryExpressTemplateCreateSchema, deliveryExpressTemplatePageQuerySchema, deliveryExpressTemplateUpdateSchema } from "@/modules/mall/backend/validators/delivery-express-template.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = deliveryExpressTemplatePageQuerySchema.parse(raw)
    const data = await DeliveryExpressTemplateService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await DeliveryExpressTemplateService.create(deliveryExpressTemplateCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
