import { NextResponse } from "next/server"
import { ErpPurchaseInService } from "@/modules/erp/backend/services/erp-purchase-in.service"
import { erpPurchaseInCreateSchema, erpPurchaseInPageQuerySchema, erpPurchaseInUpdateSchema } from "@/modules/erp/backend/validators/erp-purchase-in.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpPurchaseInPageQuerySchema.parse(raw)
    const data = await ErpPurchaseInService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpPurchaseInService.create(erpPurchaseInCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
