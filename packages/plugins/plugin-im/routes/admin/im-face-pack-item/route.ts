import { NextResponse } from "next/server"
import { ImFacePackItemService } from "@/modules/im/backend/services/im-face-pack-item.service"
import { imFacePackItemCreateSchema, imFacePackItemPageQuerySchema, imFacePackItemUpdateSchema } from "@/modules/im/backend/validators/im-face-pack-item.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imFacePackItemPageQuerySchema.parse(raw)
    const data = await ImFacePackItemService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImFacePackItemService.create(imFacePackItemCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
