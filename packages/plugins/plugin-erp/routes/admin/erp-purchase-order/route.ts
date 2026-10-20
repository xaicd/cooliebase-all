import { NextResponse } from "next/server"
import { ErpPurchaseOrderService } from "@/modules/erp/backend/services/erp-purchase-order.service"
import { erpPurchaseOrderCreateSchema, erpPurchaseOrderPageQuerySchema, erpPurchaseOrderUpdateSchema } from "@/modules/erp/backend/validators/erp-purchase-order.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpPurchaseOrderPageQuerySchema.parse(raw)
    const data = await ErpPurchaseOrderService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpPurchaseOrderService.create(erpPurchaseOrderCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
