import { NextResponse } from "next/server"
import { MesQcIndicatorService } from "@/modules/mes/backend/services/mes-qc-indicator.service"
import { mesQcIndicatorCreateSchema, mesQcIndicatorPageQuerySchema, mesQcIndicatorUpdateSchema } from "@/modules/mes/backend/validators/mes-qc-indicator.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesQcIndicatorPageQuerySchema.parse(raw)
    const data = await MesQcIndicatorService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesQcIndicatorService.create(mesQcIndicatorCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
