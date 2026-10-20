import { NextResponse } from "next/server"
import { MesCalTeamShiftService } from "@/modules/mes/backend/services/mes-cal-team-shift.service"
import { mesCalTeamShiftCreateSchema, mesCalTeamShiftPageQuerySchema, mesCalTeamShiftUpdateSchema } from "@/modules/mes/backend/validators/mes-cal-team-shift.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesCalTeamShiftPageQuerySchema.parse(raw)
    const data = await MesCalTeamShiftService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesCalTeamShiftService.create(mesCalTeamShiftCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
