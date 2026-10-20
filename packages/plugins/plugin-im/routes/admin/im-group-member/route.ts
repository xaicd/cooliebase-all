import { NextResponse } from "next/server"
import { ImGroupMemberService } from "@/modules/im/backend/services/im-group-member.service"
import { imGroupMemberCreateSchema, imGroupMemberPageQuerySchema, imGroupMemberUpdateSchema } from "@/modules/im/backend/validators/im-group-member.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imGroupMemberPageQuerySchema.parse(raw)
    const data = await ImGroupMemberService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImGroupMemberService.create(imGroupMemberCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
