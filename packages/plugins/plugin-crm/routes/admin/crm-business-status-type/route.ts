import { NextResponse } from "next/server"
import { CrmBusinessStatusTypeService } from "@/modules/crm/backend/services/crm-business-status-type.service"
import { crmBusinessStatusTypeCreateSchema, crmBusinessStatusTypePageQuerySchema, crmBusinessStatusTypeUpdateSchema } from "@/modules/crm/backend/validators/crm-business-status-type.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmBusinessStatusTypePageQuerySchema.parse(raw)
    const data = await CrmBusinessStatusTypeService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmBusinessStatusTypeService.create(crmBusinessStatusTypeCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
