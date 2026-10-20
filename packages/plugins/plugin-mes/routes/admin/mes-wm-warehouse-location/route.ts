import { NextResponse } from "next/server"
import { MesWmWarehouseLocationService } from "@/modules/mes/backend/services/mes-wm-warehouse-location.service"
import { mesWmWarehouseLocationCreateSchema, mesWmWarehouseLocationPageQuerySchema, mesWmWarehouseLocationUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-warehouse-location.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmWarehouseLocationPageQuerySchema.parse(raw)
    const data = await MesWmWarehouseLocationService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmWarehouseLocationService.create(mesWmWarehouseLocationCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
