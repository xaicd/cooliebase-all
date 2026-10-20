import { NextResponse } from "next/server"
import { MesWmWarehouseAreaService } from "@/modules/mes/backend/services/mes-wm-warehouse-area.service"
import { mesWmWarehouseAreaCreateSchema, mesWmWarehouseAreaPageQuerySchema, mesWmWarehouseAreaUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-warehouse-area.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmWarehouseAreaPageQuerySchema.parse(raw)
    const data = await MesWmWarehouseAreaService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmWarehouseAreaService.create(mesWmWarehouseAreaCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
