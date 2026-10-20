import { NextResponse } from "next/server"
import { MesQcOqcLineService } from "@/modules/mes/backend/services/mes-qc-oqc-line.service"
import { mesQcOqcLineCreateSchema, mesQcOqcLinePageQuerySchema, mesQcOqcLineUpdateSchema } from "@/modules/mes/backend/validators/mes-qc-oqc-line.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesQcOqcLinePageQuerySchema.parse(raw)
    const data = await MesQcOqcLineService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesQcOqcLineService.create(mesQcOqcLineCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
