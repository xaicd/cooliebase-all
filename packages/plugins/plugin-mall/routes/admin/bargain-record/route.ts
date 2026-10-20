import { NextResponse } from "next/server"
import { BargainRecordService } from "@/modules/mall/backend/services/bargain-record.service"
import { bargainRecordCreateSchema, bargainRecordPageQuerySchema, bargainRecordUpdateSchema } from "@/modules/mall/backend/validators/bargain-record.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = bargainRecordPageQuerySchema.parse(raw)
    const data = await BargainRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await BargainRecordService.create(bargainRecordCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
