import { NextResponse } from "next/server"
import { MesQcRqcLineService } from "@/modules/mes/backend/services/mes-qc-rqc-line.service"
import { mesQcRqcLineCreateSchema, mesQcRqcLinePageQuerySchema, mesQcRqcLineUpdateSchema } from "@/modules/mes/backend/validators/mes-qc-rqc-line.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesQcRqcLinePageQuerySchema.parse(raw)
    const data = await MesQcRqcLineService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesQcRqcLineService.create(mesQcRqcLineCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
