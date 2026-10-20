import { NextResponse } from "next/server"
import { MesWmItemReceiptService } from "@/modules/mes/backend/services/mes-wm-item-receipt.service"
import { mesWmItemReceiptCreateSchema, mesWmItemReceiptPageQuerySchema, mesWmItemReceiptUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-item-receipt.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmItemReceiptPageQuerySchema.parse(raw)
    const data = await MesWmItemReceiptService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmItemReceiptService.create(mesWmItemReceiptCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
