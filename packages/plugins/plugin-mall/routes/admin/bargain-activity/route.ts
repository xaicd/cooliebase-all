import { NextResponse } from "next/server"
import { BargainActivityService } from "@/modules/mall/backend/services/bargain-activity.service"
import { bargainActivityCreateSchema, bargainActivityPageQuerySchema, bargainActivityUpdateSchema } from "@/modules/mall/backend/validators/bargain-activity.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = bargainActivityPageQuerySchema.parse(raw)
    const data = await BargainActivityService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await BargainActivityService.create(bargainActivityCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
