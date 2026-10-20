import { NextResponse } from "next/server"
import { ErpFinanceReceiptService } from "@/modules/erp/backend/services/erp-finance-receipt.service"
import { erpFinanceReceiptCreateSchema, erpFinanceReceiptPageQuerySchema, erpFinanceReceiptUpdateSchema } from "@/modules/erp/backend/validators/erp-finance-receipt.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpFinanceReceiptPageQuerySchema.parse(raw)
    const data = await ErpFinanceReceiptService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpFinanceReceiptService.create(erpFinanceReceiptCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
