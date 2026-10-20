import { NextResponse } from "next/server"
import { ErpStockInService } from "@/modules/erp/backend/services/erp-stock-in.service"
import { erpStockInCreateSchema, erpStockInPageQuerySchema, erpStockInUpdateSchema } from "@/modules/erp/backend/validators/erp-stock-in.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpStockInPageQuerySchema.parse(raw)
    const data = await ErpStockInService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpStockInService.create(erpStockInCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
