import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAppLogin } from "@/modules/shared/backend/lib/app-auth-guard"
import { getAuthErrorStatus } from "@/modules/shared/backend/auth/guards"
import { PayOrderService } from "@/modules/pay/backend/services/pay-order.service"

const cashierRequestSchema = z.object({
  merchantOrderId: z.string().min(1).default("MALL-ORDER"),
  subject: z.string().default("商城订单支付"),
  amount: z.coerce.number().min(1).default(100),
  channelCode: z.string().default("wx_pub"),
  autoConfirm: z.boolean().optional(),
})

/**
 * 收银台 - 创建并提交真实数据库支付单
 * POST /api/v1/app/pay/cashier
 */
export async function POST(request: Request) {
  try {
    const auth = requireAppLogin(request)
    const rawBody = await request.json()
    const input = cashierRequestSchema.parse(rawBody)

    const created = await PayOrderService.create(
      {
        app_id: "mall-app",
        channel_code: input.channelCode,
        merchant_order_id: input.merchantOrderId,
        subject: input.subject,
        body: input.subject,
        price: input.amount,
        status: "WAITING",
        user_ip: "127.0.0.1",
      },
      auth.userId,
      auth.tenantId || "default",
    )

    if (input.autoConfirm) {
      await PayOrderService.notifyPaid(
        String(created.id),
        { id: `ext-${created.id}`, orderId: String(created.id), status: "WAITING" },
        auth.userId,
        auth.tenantId || "default",
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        payOrderId: String(created.id),
        merchantOrderId: input.merchantOrderId,
        channelCode: input.channelCode,
        amount: input.amount,
        status: input.autoConfirm ? "SUCCESS" : "WAITING",
        expireAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    })
  } catch (error: any) {
    const status = getAuthErrorStatus(error)
    return NextResponse.json({ success: false, error: error?.message || "创建支付单失败" }, { status })
  }
}
