import { NextResponse } from "next/server"
import { CrmBusinessProductService } from "@/modules/crm/backend/services/crm-business-product.service"
import { crmBusinessProductCreateSchema, crmBusinessProductPageQuerySchema, crmBusinessProductUpdateSchema } from "@/modules/crm/backend/validators/crm-business-product.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmBusinessProductPageQuerySchema.parse(raw)
    const data = await CrmBusinessProductService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmBusinessProductService.create(crmBusinessProductCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
