import { NextResponse } from "next/server"
import { ImChannelMessageService } from "@/modules/im/backend/services/im-channel-message.service"
import { imChannelMessageCreateSchema, imChannelMessagePageQuerySchema, imChannelMessageUpdateSchema } from "@/modules/im/backend/validators/im-channel-message.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imChannelMessagePageQuerySchema.parse(raw)
    const data = await ImChannelMessageService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImChannelMessageService.create(imChannelMessageCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
