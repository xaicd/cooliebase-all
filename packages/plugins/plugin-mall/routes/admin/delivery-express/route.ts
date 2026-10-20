import { NextResponse } from "next/server"
import { DeliveryExpressService } from "@/modules/mall/backend/services/delivery-express.service"
import { deliveryExpressCreateSchema, deliveryExpressPageQuerySchema, deliveryExpressUpdateSchema } from "@/modules/mall/backend/validators/delivery-express.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = deliveryExpressPageQuerySchema.parse(raw)
    const data = await DeliveryExpressService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await DeliveryExpressService.create(deliveryExpressCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
