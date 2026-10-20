import { NextResponse } from "next/server"
import { MesDvMaintenRecordLineService } from "@/modules/mes/backend/services/mes-dv-mainten-record-line.service"
import { mesDvMaintenRecordLineCreateSchema, mesDvMaintenRecordLinePageQuerySchema, mesDvMaintenRecordLineUpdateSchema } from "@/modules/mes/backend/validators/mes-dv-mainten-record-line.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesDvMaintenRecordLinePageQuerySchema.parse(raw)
    const data = await MesDvMaintenRecordLineService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesDvMaintenRecordLineService.create(mesDvMaintenRecordLineCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
