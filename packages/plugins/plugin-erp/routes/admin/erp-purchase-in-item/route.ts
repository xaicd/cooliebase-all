import { NextResponse } from "next/server"
import { ErpPurchaseInItemService } from "@/modules/erp/backend/services/erp-purchase-in-item.service"
import { erpPurchaseInItemCreateSchema, erpPurchaseInItemPageQuerySchema, erpPurchaseInItemUpdateSchema } from "@/modules/erp/backend/validators/erp-purchase-in-item.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpPurchaseInItemPageQuerySchema.parse(raw)
    const data = await ErpPurchaseInItemService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpPurchaseInItemService.create(erpPurchaseInItemCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
