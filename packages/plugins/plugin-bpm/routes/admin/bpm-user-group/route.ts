import { NextResponse } from "next/server"
import { BpmUserGroupService } from "@/modules/bpm/backend/services/bpm-user-group.service"
import { bpmUserGroupCreateSchema, bpmUserGroupPageQuerySchema, bpmUserGroupUpdateSchema } from "@/modules/bpm/backend/validators/bpm-user-group.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = bpmUserGroupPageQuerySchema.parse(raw)
    const data = await BpmUserGroupService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await BpmUserGroupService.create(bpmUserGroupCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
