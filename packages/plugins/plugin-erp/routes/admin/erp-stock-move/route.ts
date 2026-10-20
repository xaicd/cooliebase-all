import { NextResponse } from "next/server"
import { ErpStockMoveService } from "@/modules/erp/backend/services/erp-stock-move.service"
import { erpStockMoveCreateSchema, erpStockMovePageQuerySchema, erpStockMoveUpdateSchema } from "@/modules/erp/backend/validators/erp-stock-move.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpStockMovePageQuerySchema.parse(raw)
    const data = await ErpStockMoveService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpStockMoveService.create(erpStockMoveCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
