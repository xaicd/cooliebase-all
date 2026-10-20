import { NextResponse } from "next/server"
import { CrmContactBusinessService } from "@/modules/crm/backend/services/crm-contact-business.service"
import { crmContactBusinessCreateSchema, crmContactBusinessPageQuerySchema, crmContactBusinessUpdateSchema } from "@/modules/crm/backend/validators/crm-contact-business.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmContactBusinessPageQuerySchema.parse(raw)
    const data = await CrmContactBusinessService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmContactBusinessService.create(crmContactBusinessCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
