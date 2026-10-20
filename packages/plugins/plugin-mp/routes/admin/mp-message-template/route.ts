import { NextResponse } from "next/server"
import { MpMessageTemplateService } from "@/modules/mp/backend/services/mp-message-template.service"
import { mpMessageTemplateCreateSchema, mpMessageTemplatePageQuerySchema, mpMessageTemplateUpdateSchema } from "@/modules/mp/backend/validators/mp-message-template.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mpMessageTemplatePageQuerySchema.parse(raw)
    const data = await MpMessageTemplateService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MpMessageTemplateService.create(mpMessageTemplateCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
