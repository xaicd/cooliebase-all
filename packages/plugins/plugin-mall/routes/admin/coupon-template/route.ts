import { NextResponse } from "next/server"
import { CouponTemplateService } from "@/modules/mall/backend/services/coupon-template.service"
import { couponTemplateCreateSchema, couponTemplatePageQuerySchema, couponTemplateUpdateSchema } from "@/modules/mall/backend/validators/coupon-template.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = couponTemplatePageQuerySchema.parse(raw)
    const data = await CouponTemplateService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await CouponTemplateService.create(couponTemplateCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
