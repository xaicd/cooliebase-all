import { NextResponse } from "next/server"
import { ProductPropertyValueService } from "@/modules/mall/backend/services/product-property-value.service"
import { productPropertyValueCreateSchema, productPropertyValuePageQuerySchema, productPropertyValueUpdateSchema } from "@/modules/mall/backend/validators/product-property-value.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = productPropertyValuePageQuerySchema.parse(raw)
    const data = await ProductPropertyValueService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ProductPropertyValueService.create(productPropertyValueCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
