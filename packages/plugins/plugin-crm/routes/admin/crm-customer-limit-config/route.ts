import { NextResponse } from "next/server"
import { CrmCustomerLimitConfigService } from "@/modules/crm/backend/services/crm-customer-limit-config.service"
import { crmCustomerLimitConfigCreateSchema, crmCustomerLimitConfigPageQuerySchema, crmCustomerLimitConfigUpdateSchema } from "@/modules/crm/backend/validators/crm-customer-limit-config.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmCustomerLimitConfigPageQuerySchema.parse(raw)
    const data = await CrmCustomerLimitConfigService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmCustomerLimitConfigService.create(crmCustomerLimitConfigCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
