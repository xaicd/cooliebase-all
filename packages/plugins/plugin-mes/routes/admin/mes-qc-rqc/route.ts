import { NextResponse } from "next/server"
import { MesQcRqcService } from "@/modules/mes/backend/services/mes-qc-rqc.service"
import { mesQcRqcCreateSchema, mesQcRqcPageQuerySchema, mesQcRqcUpdateSchema } from "@/modules/mes/backend/validators/mes-qc-rqc.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesQcRqcPageQuerySchema.parse(raw)
    const data = await MesQcRqcService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesQcRqcService.create(mesQcRqcCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
