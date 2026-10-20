import { NextResponse } from "next/server"
import { TradeStatisticsService } from "@/modules/mall/backend/services/trade-statistics.service"
import { tradeStatisticsCreateSchema, tradeStatisticsPageQuerySchema, tradeStatisticsUpdateSchema } from "@/modules/mall/backend/validators/trade-statistics.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = tradeStatisticsPageQuerySchema.parse(raw)
    const data = await TradeStatisticsService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await TradeStatisticsService.create(tradeStatisticsCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
