import { NextResponse } from "next/server"
import { AiChatRoleService } from "@/modules/ai/backend/services/ai-chat-role.service"
import { aiChatRoleCreateSchema, aiChatRolePageQuerySchema, aiChatRoleUpdateSchema } from "@/modules/ai/backend/validators/ai-chat-role.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = aiChatRolePageQuerySchema.parse(raw)
    const data = await AiChatRoleService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AiChatRoleService.create(aiChatRoleCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
