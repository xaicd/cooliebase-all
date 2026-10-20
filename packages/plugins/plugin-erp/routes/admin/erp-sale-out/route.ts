import { NextResponse } from "next/server"
import { ErpSaleOutService } from "@/modules/erp/backend/services/erp-sale-out.service"
import { erpSaleOutCreateSchema, erpSaleOutPageQuerySchema, erpSaleOutUpdateSchema } from "@/modules/erp/backend/validators/erp-sale-out.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpSaleOutPageQuerySchema.parse(raw)
    const data = await ErpSaleOutService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpSaleOutService.create(erpSaleOutCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
