import { NextResponse } from "next/server"
import { MesMdItemTypeService } from "@/modules/mes/backend/services/mes-md-item-type.service"
import { mesMdItemTypeCreateSchema, mesMdItemTypePageQuerySchema, mesMdItemTypeUpdateSchema } from "@/modules/mes/backend/validators/mes-md-item-type.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesMdItemTypePageQuerySchema.parse(raw)
    const data = await MesMdItemTypeService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesMdItemTypeService.create(mesMdItemTypeCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
