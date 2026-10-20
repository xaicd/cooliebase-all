import { NextResponse } from "next/server"
import { ImFaceUserItemService } from "@/modules/im/backend/services/im-face-user-item.service"
import { imFaceUserItemCreateSchema, imFaceUserItemPageQuerySchema, imFaceUserItemUpdateSchema } from "@/modules/im/backend/validators/im-face-user-item.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imFaceUserItemPageQuerySchema.parse(raw)
    const data = await ImFaceUserItemService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImFaceUserItemService.create(imFaceUserItemCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
