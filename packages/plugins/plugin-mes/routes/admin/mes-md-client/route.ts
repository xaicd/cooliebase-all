import { NextResponse } from "next/server"
import { MesMdClientService } from "@/modules/mes/backend/services/mes-md-client.service"
import { mesMdClientCreateSchema, mesMdClientPageQuerySchema, mesMdClientUpdateSchema } from "@/modules/mes/backend/validators/mes-md-client.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesMdClientPageQuerySchema.parse(raw)
    const data = await MesMdClientService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesMdClientService.create(mesMdClientCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
