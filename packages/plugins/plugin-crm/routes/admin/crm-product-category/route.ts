import { NextResponse } from "next/server"
import { CrmProductCategoryService } from "@/modules/crm/backend/services/crm-product-category.service"
import { crmProductCategoryCreateSchema, crmProductCategoryPageQuerySchema, crmProductCategoryUpdateSchema } from "@/modules/crm/backend/validators/crm-product-category.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmProductCategoryPageQuerySchema.parse(raw)
    const data = await CrmProductCategoryService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmProductCategoryService.create(crmProductCategoryCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
