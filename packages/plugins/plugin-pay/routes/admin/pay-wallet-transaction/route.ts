import { NextResponse } from "next/server"
import { PayWalletTransactionService } from "@/modules/pay/backend/services/pay-wallet-transaction.service"
import { payWalletTransactionCreateSchema, payWalletTransactionPageQuerySchema, payWalletTransactionUpdateSchema } from "@/modules/pay/backend/validators/pay-wallet-transaction.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payWalletTransactionPageQuerySchema.parse(raw)
    const data = await PayWalletTransactionService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await PayWalletTransactionService.create(payWalletTransactionCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
