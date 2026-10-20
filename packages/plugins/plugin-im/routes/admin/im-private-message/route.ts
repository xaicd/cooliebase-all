import { NextResponse } from "next/server"
import { ImPrivateMessageService } from "@/modules/im/backend/services/im-private-message.service"
import { imPrivateMessageCreateSchema, imPrivateMessagePageQuerySchema, imPrivateMessageUpdateSchema } from "@/modules/im/backend/validators/im-private-message.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imPrivateMessagePageQuerySchema.parse(raw)
    const data = await ImPrivateMessageService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImPrivateMessageService.create(imPrivateMessageCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
