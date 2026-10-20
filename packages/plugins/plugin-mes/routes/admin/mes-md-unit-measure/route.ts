import { NextResponse } from "next/server"
import { MesMdUnitMeasureService } from "@/modules/mes/backend/services/mes-md-unit-measure.service"
import { mesMdUnitMeasureCreateSchema, mesMdUnitMeasurePageQuerySchema, mesMdUnitMeasureUpdateSchema } from "@/modules/mes/backend/validators/mes-md-unit-measure.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesMdUnitMeasurePageQuerySchema.parse(raw)
    const data = await MesMdUnitMeasureService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesMdUnitMeasureService.create(mesMdUnitMeasureCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
