import { NextResponse } from "next/server"
import { AfterSaleLogService } from "@/modules/mall/backend/services/after-sale-log.service"
import { afterSaleLogCreateSchema, afterSaleLogPageQuerySchema, afterSaleLogUpdateSchema } from "@/modules/mall/backend/validators/after-sale-log.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = afterSaleLogPageQuerySchema.parse(raw)
    const data = await AfterSaleLogService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await AfterSaleLogService.create(afterSaleLogCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
