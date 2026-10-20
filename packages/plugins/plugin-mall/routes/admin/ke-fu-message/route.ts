import { NextResponse } from "next/server"
import { KeFuMessageService } from "@/modules/mall/backend/services/ke-fu-message.service"
import { keFuMessageCreateSchema, keFuMessagePageQuerySchema, keFuMessageUpdateSchema } from "@/modules/mall/backend/validators/ke-fu-message.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = keFuMessagePageQuerySchema.parse(raw)
    const data = await KeFuMessageService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await KeFuMessageService.create(keFuMessageCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
