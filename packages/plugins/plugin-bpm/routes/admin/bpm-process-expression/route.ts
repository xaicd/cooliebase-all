import { NextResponse } from "next/server"
import { BpmProcessExpressionService } from "@/modules/bpm/backend/services/bpm-process-expression.service"
import { bpmProcessExpressionCreateSchema, bpmProcessExpressionPageQuerySchema, bpmProcessExpressionUpdateSchema } from "@/modules/bpm/backend/validators/bpm-process-expression.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = bpmProcessExpressionPageQuerySchema.parse(raw)
    const data = await BpmProcessExpressionService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await BpmProcessExpressionService.create(bpmProcessExpressionCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
