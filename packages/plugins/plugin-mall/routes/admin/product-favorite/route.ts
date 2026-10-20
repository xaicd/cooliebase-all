import { NextResponse } from "next/server"
import { ProductFavoriteService } from "@/modules/mall/backend/services/product-favorite.service"
import { productFavoriteCreateSchema, productFavoritePageQuerySchema, productFavoriteUpdateSchema } from "@/modules/mall/backend/validators/product-favorite.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = productFavoritePageQuerySchema.parse(raw)
    const data = await ProductFavoriteService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ProductFavoriteService.create(productFavoriteCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
