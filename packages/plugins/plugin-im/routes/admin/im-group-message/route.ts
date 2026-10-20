import { NextResponse } from "next/server"
import { ImGroupMessageService } from "@/modules/im/backend/services/im-group-message.service"
import { imGroupMessageCreateSchema, imGroupMessagePageQuerySchema, imGroupMessageUpdateSchema } from "@/modules/im/backend/validators/im-group-message.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imGroupMessagePageQuerySchema.parse(raw)
    const data = await ImGroupMessageService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImGroupMessageService.create(imGroupMessageCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
