import { NextResponse } from "next/server"
import { AiKnowledgeSegmentService } from "@/modules/ai/backend/services/ai-knowledge-segment.service"
import { aiKnowledgeSegmentCreateSchema, aiKnowledgeSegmentPageQuerySchema, aiKnowledgeSegmentUpdateSchema } from "@/modules/ai/backend/validators/ai-knowledge-segment.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = aiKnowledgeSegmentPageQuerySchema.parse(raw)
    const data = await AiKnowledgeSegmentService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AiKnowledgeSegmentService.create(aiKnowledgeSegmentCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
