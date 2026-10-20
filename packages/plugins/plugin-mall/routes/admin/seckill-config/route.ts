import { NextResponse } from "next/server"
import { SeckillConfigService } from "@/modules/mall/backend/services/seckill-config.service"
import { seckillConfigCreateSchema, seckillConfigPageQuerySchema, seckillConfigUpdateSchema } from "@/modules/mall/backend/validators/seckill-config.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = seckillConfigPageQuerySchema.parse(raw)
    const data = await SeckillConfigService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await SeckillConfigService.create(seckillConfigCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
