import { NextResponse } from "next/server"
import { MemberExperienceRecordService } from "@/modules/member/backend/services/member-experience-record.service"
import { memberExperienceRecordCreateSchema, memberExperienceRecordPageQuerySchema, memberExperienceRecordUpdateSchema } from "@/modules/member/backend/validators/member-experience-record.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = memberExperienceRecordPageQuerySchema.parse(raw)
    const data = await MemberExperienceRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MemberExperienceRecordService.create(memberExperienceRecordCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
