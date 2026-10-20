import { NextResponse } from "next/server"
import { MesProRouteProductService } from "@/modules/mes/backend/services/mes-pro-route-product.service"
import { mesProRouteProductCreateSchema, mesProRouteProductPageQuerySchema, mesProRouteProductUpdateSchema } from "@/modules/mes/backend/validators/mes-pro-route-product.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesProRouteProductPageQuerySchema.parse(raw)
    const data = await MesProRouteProductService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesProRouteProductService.create(mesProRouteProductCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
