import { NextResponse } from "next/server"
import { MemberSignInRecordService } from "@/modules/member/backend/services/member-sign-in-record.service"
import { memberSignInRecordCreateSchema, memberSignInRecordPageQuerySchema, memberSignInRecordUpdateSchema } from "@/modules/member/backend/validators/member-sign-in-record.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = memberSignInRecordPageQuerySchema.parse(raw)
    const data = await MemberSignInRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MemberSignInRecordService.create(memberSignInRecordCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
