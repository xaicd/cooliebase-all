import { NextResponse } from "next/server"
import { BrokerageRecordService } from "@/modules/mall/backend/services/brokerage-record.service"
import { brokerageRecordCreateSchema, brokerageRecordPageQuerySchema, brokerageRecordUpdateSchema } from "@/modules/mall/backend/validators/brokerage-record.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = brokerageRecordPageQuerySchema.parse(raw)
    const data = await BrokerageRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await BrokerageRecordService.create(brokerageRecordCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
