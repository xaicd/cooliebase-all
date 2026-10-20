import { NextResponse } from "next/server"
import { MesWmReturnVendorDetailService } from "@/modules/mes/backend/services/mes-wm-return-vendor-detail.service"
import { mesWmReturnVendorDetailCreateSchema, mesWmReturnVendorDetailPageQuerySchema, mesWmReturnVendorDetailUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-return-vendor-detail.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmReturnVendorDetailPageQuerySchema.parse(raw)
    const data = await MesWmReturnVendorDetailService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmReturnVendorDetailService.create(mesWmReturnVendorDetailCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
