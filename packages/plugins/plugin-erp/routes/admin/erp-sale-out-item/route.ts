import { NextResponse } from "next/server"
import { ErpSaleOutItemService } from "@/modules/erp/backend/services/erp-sale-out-item.service"
import { erpSaleOutItemCreateSchema, erpSaleOutItemPageQuerySchema, erpSaleOutItemUpdateSchema } from "@/modules/erp/backend/validators/erp-sale-out-item.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpSaleOutItemPageQuerySchema.parse(raw)
    const data = await ErpSaleOutItemService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpSaleOutItemService.create(erpSaleOutItemCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
