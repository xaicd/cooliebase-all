import { NextResponse } from "next/server"
import { AiMindMapService } from "@/modules/ai/backend/services/ai-mind-map.service"
import { aiMindMapCreateSchema, aiMindMapPageQuerySchema, aiMindMapUpdateSchema } from "@/modules/ai/backend/validators/ai-mind-map.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = aiMindMapPageQuerySchema.parse(raw)
    const data = await AiMindMapService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AiMindMapService.create(aiMindMapCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
