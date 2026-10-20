import { NextResponse } from "next/server"
import { BpmOALeaveService } from "@/modules/bpm/backend/services/bpm-oaleave.service"
import { bpmOALeaveCreateSchema, bpmOALeavePageQuerySchema, bpmOALeaveUpdateSchema } from "@/modules/bpm/backend/validators/bpm-oaleave.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = bpmOALeavePageQuerySchema.parse(raw)
    const data = await BpmOALeaveService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await BpmOALeaveService.create(bpmOALeaveCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
