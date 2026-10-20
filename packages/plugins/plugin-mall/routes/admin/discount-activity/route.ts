import { NextResponse } from "next/server"
import { DiscountActivityService } from "@/modules/mall/backend/services/discount-activity.service"
import { discountActivityCreateSchema, discountActivityPageQuerySchema, discountActivityUpdateSchema } from "@/modules/mall/backend/validators/discount-activity.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = discountActivityPageQuerySchema.parse(raw)
    const data = await DiscountActivityService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await DiscountActivityService.create(discountActivityCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
