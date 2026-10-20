import { NextResponse } from "next/server"
import { MpAutoReplyService } from "@/modules/mp/backend/services/mp-auto-reply.service"
import { mpAutoReplyCreateSchema, mpAutoReplyPageQuerySchema, mpAutoReplyUpdateSchema } from "@/modules/mp/backend/validators/mp-auto-reply.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = mpAutoReplyPageQuerySchema.parse(raw)
    const data = await MpAutoReplyService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await MpAutoReplyService.create(mpAutoReplyCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
