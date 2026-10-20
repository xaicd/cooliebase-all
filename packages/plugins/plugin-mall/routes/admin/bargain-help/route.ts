import { NextResponse } from "next/server"
import { BargainHelpService } from "@/modules/mall/backend/services/bargain-help.service"
import { bargainHelpCreateSchema, bargainHelpPageQuerySchema, bargainHelpUpdateSchema } from "@/modules/mall/backend/validators/bargain-help.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = bargainHelpPageQuerySchema.parse(raw)
    const data = await BargainHelpService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await BargainHelpService.create(bargainHelpCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
