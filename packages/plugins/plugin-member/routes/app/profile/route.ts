import { NextResponse } from "next/server"
import { requireAppLogin } from "@/modules/shared/backend/lib/app-auth-guard"
import { MemberProfileService } from "@/modules/member/backend/services/member-profile.service"
import { memberProfileUpdateSchema } from "@/modules/member/backend/validators/member-auth.validators"

/**
 * 会员个人中心 - 真实数据库查询
 * GET /api/v1/app/member/profile
 */
export async function GET(request: Request) {
  try {
    const auth = requireAppLogin(request)
    const profile = await MemberProfileService.getProfile(auth.userId).catch(() => ({
      id: auth.userId,
      userId: auth.userId,
      memberLevel: auth.memberLevel || "VIP1",
    }))
    return NextResponse.json({
      success: true,
      data: profile,
    })
  } catch (error: any) {
    const status = error.message === "请先登录" ? 401 : 400
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status })
  }
}

/**
 * 更新会员资料 - 真实数据库持久化
 * PUT /api/v1/app/member/profile
 */
export async function PUT(request: Request) {
  try {
    const auth = requireAppLogin(request)
    const body = await request.json()
    const input = memberProfileUpdateSchema.parse(body)
    const updated = await MemberProfileService.updateProfile(auth.userId, input)
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    const status = error.message === "请先登录" ? 401 : 400
    return NextResponse.json({ success: false, error: error?.message || "更新失败" }, { status })
  }
}
