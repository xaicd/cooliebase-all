import { NextResponse } from "next/server"
import { AiChatMessageService } from "@/modules/ai/backend/services/ai-chat-message.service"
import { aiChatMessageCreateSchema, aiChatMessagePageQuerySchema, aiChatMessageUpdateSchema } from "@/modules/ai/backend/validators/ai-chat-message.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = aiChatMessagePageQuerySchema.parse(raw)
    const data = await AiChatMessageService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AiChatMessageService.create(aiChatMessageCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
