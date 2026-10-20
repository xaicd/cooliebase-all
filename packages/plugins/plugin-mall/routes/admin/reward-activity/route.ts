import { NextResponse } from "next/server"
import { RewardActivityService } from "@/modules/mall/backend/services/reward-activity.service"
import { rewardActivityCreateSchema, rewardActivityPageQuerySchema, rewardActivityUpdateSchema } from "@/modules/mall/backend/validators/reward-activity.validator"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, unknown> = {}
    searchParams.forEach((value, key) => { raw[key] = value })
    const input = rewardActivityPageQuerySchema.parse(raw)
    const data = await RewardActivityService.page(input)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await RewardActivityService.create(rewardActivityCreateSchema.parse(body))
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "创建失败" }, { status: 400 })
  }
}
