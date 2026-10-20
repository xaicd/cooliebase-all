import { NextResponse } from "next/server"
import { MesDvSubjectService } from "@/modules/mes/backend/services/mes-dv-subject.service"
import { mesDvSubjectCreateSchema, mesDvSubjectPageQuerySchema, mesDvSubjectUpdateSchema } from "@/modules/mes/backend/validators/mes-dv-subject.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesDvSubjectPageQuerySchema.parse(raw)
    const data = await MesDvSubjectService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesDvSubjectService.create(mesDvSubjectCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
