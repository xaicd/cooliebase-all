import { NextResponse } from "next/server"
import { BrokerageUserService } from "@/modules/mall/backend/services/brokerage-user.service"
import { brokerageUserCreateSchema, brokerageUserPageQuerySchema, brokerageUserUpdateSchema } from "@/modules/mall/backend/validators/brokerage-user.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = brokerageUserPageQuerySchema.parse(raw)
    const data = await BrokerageUserService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await BrokerageUserService.create(brokerageUserCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
