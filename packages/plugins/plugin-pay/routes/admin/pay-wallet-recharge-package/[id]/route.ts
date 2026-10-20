import { NextResponse } from "next/server"
import { withAdminRoute } from "@/modules/shared/backend/http/admin-route"
import { PERMISSIONS } from "@/modules/shared/backend/constants/permissions"
import { PayWalletRechargePackageService } from "@/modules/pay/backend/services/pay-wallet-recharge-package.service"
import { payWalletRechargePackageCreateSchema, payWalletRechargePackagePageQuerySchema, payWalletRechargePackageUpdateSchema } from "@/modules/pay/backend/validators/pay-wallet-recharge-package.validator"

type RouteContext = { params: Promise<{ id: string }> }

export const GET = withAdminRoute(async (_request, _auth, context: RouteContext) => {
  try {
    const { id } = await context.params
    const data = await PayWalletRechargePackageService.get(id)
    if (!data) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (error: any) { return NextResponse.json({ success: false, error: error?.message }, { status: 400 }) }
}, { permission: PERMISSIONS.PAY_WALLET_RECHARGE_PACKAGE_VIEW })

export const PUT = withAdminRoute(async (request, _auth, context: RouteContext) => {
  try {
    const { id } = await context.params
    const data = await PayWalletRechargePackageService.update(id, payWalletRechargePackageUpdateSchema.parse({ ...(await request.json()), id }))
    return NextResponse.json({ success: true, data })
  } catch (error: any) { return NextResponse.json({ success: false, error: error?.message }, { status: 400 }) }
}, { permission: PERMISSIONS.PAY_WALLET_RECHARGE_PACKAGE_UPDATE })

export const DELETE = withAdminRoute(async (_request, _auth, context: RouteContext) => {
  try {
    const { id } = await context.params
    const data = await PayWalletRechargePackageService.delete(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) { return NextResponse.json({ success: false, error: error?.message }, { status: 400 }) }
}, { permission: PERMISSIONS.PAY_WALLET_RECHARGE_PACKAGE_DELETE })
