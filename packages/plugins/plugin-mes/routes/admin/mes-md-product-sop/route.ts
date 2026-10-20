import { NextResponse } from "next/server"
import { MesMdProductSopService } from "@/modules/mes/backend/services/mes-md-product-sop.service"
import { mesMdProductSopCreateSchema, mesMdProductSopPageQuerySchema, mesMdProductSopUpdateSchema } from "@/modules/mes/backend/validators/mes-md-product-sop.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesMdProductSopPageQuerySchema.parse(raw)
    const data = await MesMdProductSopService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesMdProductSopService.create(mesMdProductSopCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
