import { NextResponse } from "next/server"
import { MesWmProductIssueLineService } from "@/modules/mes/backend/services/mes-wm-product-issue-line.service"
import { mesWmProductIssueLineCreateSchema, mesWmProductIssueLinePageQuerySchema, mesWmProductIssueLineUpdateSchema } from "@/modules/mes/backend/validators/mes-wm-product-issue-line.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mesWmProductIssueLinePageQuerySchema.parse(raw)
    const data = await MesWmProductIssueLineService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MesWmProductIssueLineService.create(mesWmProductIssueLineCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
