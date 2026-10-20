import { NextResponse } from "next/server"
import { AiMusicService } from "@/modules/ai/backend/services/ai-music.service"
import { aiMusicCreateSchema, aiMusicPageQuerySchema, aiMusicUpdateSchema } from "@/modules/ai/backend/validators/ai-music.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = aiMusicPageQuerySchema.parse(raw)
    const data = await AiMusicService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AiMusicService.create(aiMusicCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
