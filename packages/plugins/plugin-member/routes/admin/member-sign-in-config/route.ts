import { NextResponse } from "next/server"
import { MemberSignInConfigService } from "@/modules/member/backend/services/member-sign-in-config.service"
import { memberSignInConfigCreateSchema, memberSignInConfigPageQuerySchema, memberSignInConfigUpdateSchema } from "@/modules/member/backend/validators/member-sign-in-config.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = memberSignInConfigPageQuerySchema.parse(raw)
    const data = await MemberSignInConfigService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MemberSignInConfigService.create(memberSignInConfigCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
