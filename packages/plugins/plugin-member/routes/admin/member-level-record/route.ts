import { NextResponse } from "next/server"
import { MemberLevelRecordService } from "@/modules/member/backend/services/member-level-record.service"
import { memberLevelRecordCreateSchema, memberLevelRecordPageQuerySchema, memberLevelRecordUpdateSchema } from "@/modules/member/backend/validators/member-level-record.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = memberLevelRecordPageQuerySchema.parse(raw)
    const data = await MemberLevelRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MemberLevelRecordService.create(memberLevelRecordCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
