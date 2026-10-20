import { NextResponse } from "next/server"
import { MesCalTeamService } from "@/modules/mes/backend/services/mes-cal-team.service"
import { mesCalTeamCreateSchema, mesCalTeamPageQuerySchema, mesCalTeamUpdateSchema } from "@/modules/mes/backend/validators/mes-cal-team.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesCalTeamPageQuerySchema.parse(raw)
    const data = await MesCalTeamService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesCalTeamService.create(mesCalTeamCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
