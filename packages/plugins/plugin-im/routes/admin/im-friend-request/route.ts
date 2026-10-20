import { NextResponse } from "next/server"
import { ImFriendRequestService } from "@/modules/im/backend/services/im-friend-request.service"
import { imFriendRequestCreateSchema, imFriendRequestPageQuerySchema, imFriendRequestUpdateSchema } from "@/modules/im/backend/validators/im-friend-request.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = imFriendRequestPageQuerySchema.parse(raw)
    const data = await ImFriendRequestService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await ImFriendRequestService.create(imFriendRequestCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
