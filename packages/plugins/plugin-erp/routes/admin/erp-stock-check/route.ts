import { NextResponse } from "next/server"
import { ErpStockCheckService } from "@/modules/erp/backend/services/erp-stock-check.service"
import { erpStockCheckCreateSchema, erpStockCheckPageQuerySchema, erpStockCheckUpdateSchema } from "@/modules/erp/backend/validators/erp-stock-check.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpStockCheckPageQuerySchema.parse(raw)
    const data = await ErpStockCheckService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpStockCheckService.create(erpStockCheckCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
