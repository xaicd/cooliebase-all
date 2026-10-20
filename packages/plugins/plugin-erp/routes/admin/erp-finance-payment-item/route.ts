import { NextResponse } from "next/server"
import { ErpFinancePaymentItemService } from "@/modules/erp/backend/services/erp-finance-payment-item.service"
import { erpFinancePaymentItemCreateSchema, erpFinancePaymentItemPageQuerySchema, erpFinancePaymentItemUpdateSchema } from "@/modules/erp/backend/validators/erp-finance-payment-item.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = erpFinancePaymentItemPageQuerySchema.parse(raw)
    const data = await ErpFinancePaymentItemService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ErpFinancePaymentItemService.create(erpFinancePaymentItemCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
