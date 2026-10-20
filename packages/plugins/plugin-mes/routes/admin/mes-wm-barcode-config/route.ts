import { NextResponse } from "next/server"
import { MesWmBarcodeConfigService } from "@/modules/mes/backend/services/mes-wm-barcode-config.service"
import { mesWmBarcodeConfigCreateSchema, mesWmBarcodeConfigPageQuerySchema, mesWmBarcodeConfigUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-barcode-config.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmBarcodeConfigPageQuerySchema.parse(raw)
    const data = await MesWmBarcodeConfigService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmBarcodeConfigService.create(mesWmBarcodeConfigCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
