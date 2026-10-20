import { NextResponse } from "next/server"
import { MesWmTransferLineService } from "@/modules/mes/backend/services/mes-wm-transfer-line.service"
import { mesWmTransferLineCreateSchema, mesWmTransferLinePageQuerySchema, mesWmTransferLineUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-transfer-line.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmTransferLinePageQuerySchema.parse(raw)
    const data = await MesWmTransferLineService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmTransferLineService.create(mesWmTransferLineCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
