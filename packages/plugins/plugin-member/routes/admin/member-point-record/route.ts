import { NextResponse } from "next/server"
import { MemberPointRecordService } from "@/modules/member/backend/services/member-point-record.service"
import { memberPointRecordCreateSchema, memberPointRecordPageQuerySchema, memberPointRecordUpdateSchema } from "@/modules/member/backend/validators/member-point-record.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = memberPointRecordPageQuerySchema.parse(raw)
    const data = await MemberPointRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MemberPointRecordService.create(memberPointRecordCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
