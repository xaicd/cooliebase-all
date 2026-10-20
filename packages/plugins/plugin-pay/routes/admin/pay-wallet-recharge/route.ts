import { NextResponse } from "next/server"
import { PayWalletRechargeService } from "@/modules/pay/backend/services/pay-wallet-recharge.service"
import { payWalletRechargeCreateSchema, payWalletRechargePageQuerySchema, payWalletRechargeUpdateSchema } from "@/modules/pay/backend/validators/pay-wallet-recharge.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = payWalletRechargePageQuerySchema.parse(raw)
    const data = await PayWalletRechargeService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await PayWalletRechargeService.create(payWalletRechargeCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
