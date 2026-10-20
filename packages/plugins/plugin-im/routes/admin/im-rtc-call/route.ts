import { NextResponse } from "next/server"
import { ImRtcCallService } from "@/modules/im/backend/services/im-rtc-call.service"
import { imRtcCallCreateSchema, imRtcCallPageQuerySchema, imRtcCallUpdateSchema } from "@/modules/im/backend/validators/im-rtc-call.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imRtcCallPageQuerySchema.parse(raw)
    const data = await ImRtcCallService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImRtcCallService.create(imRtcCallCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
