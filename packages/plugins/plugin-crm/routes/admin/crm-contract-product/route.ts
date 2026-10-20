import { NextResponse } from "next/server"
import { CrmContractProductService } from "@/modules/crm/backend/services/crm-contract-product.service"
import { crmContractProductCreateSchema, crmContractProductPageQuerySchema, crmContractProductUpdateSchema } from "@/modules/crm/backend/validators/crm-contract-product.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmContractProductPageQuerySchema.parse(raw)
    const data = await CrmContractProductService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmContractProductService.create(crmContractProductCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
