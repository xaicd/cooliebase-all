import { NextResponse } from "next/server"
import { ProductBrowseHistoryService } from "@/modules/mall/backend/services/product-browse-history.service"
import { productBrowseHistoryCreateSchema, productBrowseHistoryPageQuerySchema, productBrowseHistoryUpdateSchema } from "@/modules/mall/backend/validators/product-browse-history.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = productBrowseHistoryPageQuerySchema.parse(raw)
    const data = await ProductBrowseHistoryService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ProductBrowseHistoryService.create(productBrowseHistoryCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
