import { NextResponse } from "next/server"
import { DiyPageService } from "@/modules/mall/backend/services/diy-page.service"
import { diyPageCreateSchema, diyPagePageQuerySchema, diyPageUpdateSchema } from "@/modules/mall/backend/validators/diy-page.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = diyPagePageQuerySchema.parse(raw)
    const data = await DiyPageService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await DiyPageService.create(diyPageCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
