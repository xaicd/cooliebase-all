import { NextResponse } from "next/server"
import { ErpStockOutService } from "@/modules/erp/backend/services/erp-stock-out.service"
import { erpStockOutCreateSchema, erpStockOutPageQuerySchema, erpStockOutUpdateSchema } from "@/modules/erp/backend/validators/erp-stock-out.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpStockOutPageQuerySchema.parse(raw)
    const data = await ErpStockOutService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpStockOutService.create(erpStockOutCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
