import { NextResponse } from "next/server"
import { MesProRouteService } from "@/modules/mes/backend/services/mes-pro-route.service"
import { mesProRouteCreateSchema, mesProRoutePageQuerySchema, mesProRouteUpdateSchema } from "@/modules/mes/backend/validators/mes-pro-route.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesProRoutePageQuerySchema.parse(raw)
    const data = await MesProRouteService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesProRouteService.create(mesProRouteCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
