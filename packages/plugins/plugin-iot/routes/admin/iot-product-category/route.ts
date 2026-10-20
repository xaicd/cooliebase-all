import { NextResponse } from "next/server"
import { IotProductCategoryService } from "@/modules/iot/backend/services/iot-product-category.service"
import { iotProductCategoryCreateSchema, iotProductCategoryPageQuerySchema, iotProductCategoryUpdateSchema } from "@/modules/iot/backend/validators/iot-product-category.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = iotProductCategoryPageQuerySchema.parse(raw)
    const data = await IotProductCategoryService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await IotProductCategoryService.create(iotProductCategoryCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
