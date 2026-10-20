import { NextResponse } from "next/server"
import { MesWmReturnSalesLineService } from "@/modules/mes/backend/services/mes-wm-return-sales-line.service"
import { mesWmReturnSalesLineCreateSchema, mesWmReturnSalesLinePageQuerySchema, mesWmReturnSalesLineUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-return-sales-line.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmReturnSalesLinePageQuerySchema.parse(raw)
    const data = await MesWmReturnSalesLineService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmReturnSalesLineService.create(mesWmReturnSalesLineCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
