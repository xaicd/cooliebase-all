import { NextResponse } from "next/server"
import { MesQcIqcLineService } from "@/modules/mes/backend/services/mes-qc-iqc-line.service"
import { mesQcIqcLineCreateSchema, mesQcIqcLinePageQuerySchema, mesQcIqcLineUpdateSchema } from "@/modules/mes/backend/validators/mes-qc-iqc-line.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesQcIqcLinePageQuerySchema.parse(raw)
    const data = await MesQcIqcLineService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesQcIqcLineService.create(mesQcIqcLineCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
