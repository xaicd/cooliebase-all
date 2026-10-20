import { NextResponse } from "next/server"
import { ErpProductCategoryService } from "@/modules/erp/backend/services/erp-product-category.service"
import { erpProductCategoryCreateSchema, erpProductCategoryPageQuerySchema, erpProductCategoryUpdateSchema } from "@/modules/erp/backend/validators/erp-product-category.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpProductCategoryPageQuerySchema.parse(raw)
    const data = await ErpProductCategoryService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpProductCategoryService.create(erpProductCategoryCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
