import { NextResponse } from "next/server"
import { CrmBusinessStatusService } from "@/modules/crm/backend/services/crm-business-status.service"
import { crmBusinessStatusCreateSchema, crmBusinessStatusPageQuerySchema, crmBusinessStatusUpdateSchema } from "@/modules/crm/backend/validators/crm-business-status.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmBusinessStatusPageQuerySchema.parse(raw)
    const data = await CrmBusinessStatusService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmBusinessStatusService.create(crmBusinessStatusCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
