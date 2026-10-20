import { NextResponse } from "next/server"
import { CombinationRecordService } from "@/modules/mall/backend/services/combination-record.service"
import { combinationRecordCreateSchema, combinationRecordPageQuerySchema, combinationRecordUpdateSchema } from "@/modules/mall/backend/validators/combination-record.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = combinationRecordPageQuerySchema.parse(raw)
    const data = await CombinationRecordService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CombinationRecordService.create(combinationRecordCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
