import { NextResponse } from "next/server"
import { ErpStockOutItemService } from "@/modules/erp/backend/services/erp-stock-out-item.service"
import { erpStockOutItemCreateSchema, erpStockOutItemPageQuerySchema, erpStockOutItemUpdateSchema } from "@/modules/erp/backend/validators/erp-stock-out-item.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpStockOutItemPageQuerySchema.parse(raw)
    const data = await ErpStockOutItemService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpStockOutItemService.create(erpStockOutItemCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
