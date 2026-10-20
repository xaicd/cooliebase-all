import { NextResponse } from "next/server"
import { MesQcIpqcService } from "@/modules/mes/backend/services/mes-qc-ipqc.service"
import { mesQcIpqcCreateSchema, mesQcIpqcPageQuerySchema, mesQcIpqcUpdateSchema } from "@/modules/mes/backend/validators/mes-qc-ipqc.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesQcIpqcPageQuerySchema.parse(raw)
    const data = await MesQcIpqcService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesQcIpqcService.create(mesQcIpqcCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
