import { NextResponse } from "next/server"
import { AiKnowledgeService } from "@/modules/ai/backend/services/ai-knowledge.service"
import { aiKnowledgeCreateSchema, aiKnowledgePageQuerySchema, aiKnowledgeUpdateSchema } from "@/modules/ai/backend/validators/ai-knowledge.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = aiKnowledgePageQuerySchema.parse(raw)
    const data = await AiKnowledgeService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AiKnowledgeService.create(aiKnowledgeCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
