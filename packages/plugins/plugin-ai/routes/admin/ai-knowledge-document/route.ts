import { NextResponse } from "next/server"
import { AiKnowledgeDocumentService } from "@/modules/ai/backend/services/ai-knowledge-document.service"
import { aiKnowledgeDocumentCreateSchema, aiKnowledgeDocumentPageQuerySchema, aiKnowledgeDocumentUpdateSchema } from "@/modules/ai/backend/validators/ai-knowledge-document.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = aiKnowledgeDocumentPageQuerySchema.parse(raw)
    const data = await AiKnowledgeDocumentService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AiKnowledgeDocumentService.create(aiKnowledgeDocumentCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
