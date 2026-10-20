import { NextResponse } from "next/server"
import { ErpPurchaseReturnService } from "@/modules/erp/backend/services/erp-purchase-return.service"
import { erpPurchaseReturnCreateSchema, erpPurchaseReturnPageQuerySchema, erpPurchaseReturnUpdateSchema } from "@/modules/erp/backend/validators/erp-purchase-return.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpPurchaseReturnPageQuerySchema.parse(raw)
    const data = await ErpPurchaseReturnService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpPurchaseReturnService.create(erpPurchaseReturnCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
