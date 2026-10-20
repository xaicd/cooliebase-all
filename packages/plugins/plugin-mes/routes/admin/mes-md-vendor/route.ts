import { NextResponse } from "next/server"
import { MesMdVendorService } from "@/modules/mes/backend/services/mes-md-vendor.service"
import { mesMdVendorCreateSchema, mesMdVendorPageQuerySchema, mesMdVendorUpdateSchema } from "@/modules/mes/backend/validators/mes-md-vendor.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesMdVendorPageQuerySchema.parse(raw)
    const data = await MesMdVendorService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesMdVendorService.create(mesMdVendorCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
