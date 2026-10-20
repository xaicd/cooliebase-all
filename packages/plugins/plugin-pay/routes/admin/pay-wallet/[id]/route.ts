import { NextResponse } from "next/server"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { PayWalletService } from "@/modules/pay/backend/services/pay-wallet.service"
import { payWalletCreateSchema, payWalletPageQuerySchema, payWalletUpdateSchema } from "@/modules/pay/backend/validators/pay-wallet.validator"

type RouteContext = { params: Promise<{ id: string }> }

export const GET = withAdminRoute(async (request, _auth, context: RouteContext) => {
  try {
    const { id } = await context.params
    const data = await PayWalletService.get(id)
    if (!data) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}, { permission: PERMISSIONS.PAY_WALLET_VIEW })

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const data = await PayWalletService.update(id, payWalletUpdateSchema.parse({ ...body, id }))
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await PayWalletService.delete(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}
