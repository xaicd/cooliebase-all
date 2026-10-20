import { NextResponse } from "next/server"
import { AiWriteService } from "@/modules/ai/backend/services/ai-write.service"
import { aiWriteCreateSchema, aiWritePageQuerySchema, aiWriteUpdateSchema } from "@/modules/ai/backend/validators/ai-write.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = aiWritePageQuerySchema.parse(raw)
    const data = await AiWriteService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AiWriteService.create(aiWriteCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
