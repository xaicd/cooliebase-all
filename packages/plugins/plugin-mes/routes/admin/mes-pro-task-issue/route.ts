import { NextResponse } from "next/server"
import { MesProTaskIssueService } from "@/modules/mes/backend/services/mes-pro-task-issue.service"
import { mesProTaskIssueCreateSchema, mesProTaskIssuePageQuerySchema, mesProTaskIssueUpdateSchema } from "@/modules/mes/backend/validators/mes-pro-task-issue.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesProTaskIssuePageQuerySchema.parse(raw)
    const data = await MesProTaskIssueService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesProTaskIssueService.create(mesProTaskIssueCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
