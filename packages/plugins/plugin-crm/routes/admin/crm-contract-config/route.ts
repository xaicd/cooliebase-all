import { NextResponse } from "next/server"
import { CrmContractConfigService } from "@/modules/crm/backend/services/crm-contract-config.service"
import { crmContractConfigCreateSchema, crmContractConfigPageQuerySchema, crmContractConfigUpdateSchema } from "@/modules/crm/backend/validators/crm-contract-config.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmContractConfigPageQuerySchema.parse(raw)
    const data = await CrmContractConfigService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmContractConfigService.create(crmContractConfigCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
