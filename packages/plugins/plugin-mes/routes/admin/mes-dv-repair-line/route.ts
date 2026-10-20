import { NextResponse } from "next/server"
import { MesDvRepairLineService } from "@/modules/mes/backend/services/mes-dv-repair-line.service"
import { mesDvRepairLineCreateSchema, mesDvRepairLinePageQuerySchema, mesDvRepairLineUpdateSchema } from "@/modules/mes/backend/validators/mes-dv-repair-line.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesDvRepairLinePageQuerySchema.parse(raw)
    const data = await MesDvRepairLineService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesDvRepairLineService.create(mesDvRepairLineCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
