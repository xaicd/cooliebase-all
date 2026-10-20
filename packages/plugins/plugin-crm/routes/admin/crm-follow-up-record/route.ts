import { NextResponse } from "next/server"
import { CrmFollowUpRecordService } from "@/modules/crm/backend/services/crm-follow-up-record.service"
import { crmFollowUpRecordCreateSchema, crmFollowUpRecordPageQuerySchema, crmFollowUpRecordUpdateSchema } from "@/modules/crm/backend/validators/crm-follow-up-record.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmFollowUpRecordPageQuerySchema.parse(raw)
    const data = await CrmFollowUpRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmFollowUpRecordService.create(crmFollowUpRecordCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
