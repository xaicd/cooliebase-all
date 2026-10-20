import { NextResponse } from "next/server"
import { ErpSaleOrderItemService } from "@/modules/erp/backend/services/erp-sale-order-item.service"
import { erpSaleOrderItemCreateSchema, erpSaleOrderItemPageQuerySchema, erpSaleOrderItemUpdateSchema } from "@/modules/erp/backend/validators/erp-sale-order-item.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpSaleOrderItemPageQuerySchema.parse(raw)
    const data = await ErpSaleOrderItemService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpSaleOrderItemService.create(erpSaleOrderItemCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
