import { NextResponse } from "next/server"
import { ImGroupRequestService } from "@/modules/im/backend/services/im-group-request.service"
import { imGroupRequestCreateSchema, imGroupRequestPageQuerySchema, imGroupRequestUpdateSchema } from "@/modules/im/backend/validators/im-group-request.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imGroupRequestPageQuerySchema.parse(raw)
    const data = await ImGroupRequestService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImGroupRequestService.create(imGroupRequestCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
