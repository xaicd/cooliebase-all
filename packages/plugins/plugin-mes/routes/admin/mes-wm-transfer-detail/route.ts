import { NextResponse } from "next/server"
import { MesWmTransferDetailService } from "@/modules/mes/backend/services/mes-wm-transfer-detail.service"
import { mesWmTransferDetailCreateSchema, mesWmTransferDetailPageQuerySchema, mesWmTransferDetailUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-transfer-detail.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmTransferDetailPageQuerySchema.parse(raw)
    const data = await MesWmTransferDetailService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmTransferDetailService.create(mesWmTransferDetailCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
