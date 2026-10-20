import { NextResponse } from "next/server"
import { CrmPerformanceConfigService } from "@/modules/crm/backend/services/crm-performance-config.service"
import { crmPerformanceConfigCreateSchema, crmPerformanceConfigPageQuerySchema, crmPerformanceConfigUpdateSchema } from "@/modules/crm/backend/validators/crm-performance-config.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = crmPerformanceConfigPageQuerySchema.parse(raw)
    const data = await CrmPerformanceConfigService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CrmPerformanceConfigService.create(crmPerformanceConfigCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
