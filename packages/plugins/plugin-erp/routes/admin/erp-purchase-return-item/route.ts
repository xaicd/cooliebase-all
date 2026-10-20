import { NextResponse } from "next/server"
import { ErpPurchaseReturnItemService } from "@/modules/erp/backend/services/erp-purchase-return-item.service"
import { erpPurchaseReturnItemCreateSchema, erpPurchaseReturnItemPageQuerySchema, erpPurchaseReturnItemUpdateSchema } from "@/modules/erp/backend/validators/erp-purchase-return-item.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpPurchaseReturnItemPageQuerySchema.parse(raw)
    const data = await ErpPurchaseReturnItemService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpPurchaseReturnItemService.create(erpPurchaseReturnItemCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
