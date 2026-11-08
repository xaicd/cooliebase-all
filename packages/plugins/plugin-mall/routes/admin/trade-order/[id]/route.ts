import { NextResponse } from "next/server"
import { z } from "zod"
import { TradeOrderService } from "@/modules/mall/backend/services/trade-order.service"
import { MallSolutionService } from "@/modules/mall/backend/services/mall-solution.service"
import { tradeOrderUpdateSchema } from "@/modules/mall/backend/validators/trade-order.validator"

type RouteContext = { params: Promise<{ id: string }> }

const tradeOrderActionSchema = z.object({
  action: z.enum(["ship", "pay", "receive", "cancel", "approveRefund", "remark"]).optional(),
  logisticsId: z.union([z.string(), z.number()]).optional(),
  logisticsNo: z.string().optional(),
  channelCode: z.string().optional(),
  reason: z.string().optional(),
  auditReason: z.string().optional(),
  remark: z.string().optional(),
})

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await TradeOrderService.get(id)
    if (!data) return NextResponse.json({ success: false, error: "不存在" }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const parsedAction = tradeOrderActionSchema.safeParse(body)
    if (parsedAction.success && parsedAction.data.action) {
      const act = parsedAction.data
      if (act.action === "ship") {
        if (!act.logisticsNo) throw new Error("请输入物流单号")
        const data = await MallSolutionService.shipTradeOrder({
          orderId: id,
          logisticsId: act.logisticsId,
          logisticsNo: act.logisticsNo,
        })
        return NextResponse.json({ success: true, data })
      }
      if (act.action === "pay") {
        const data = await MallSolutionService.payCheckoutOrder({
          orderId: id,
          channelCode: act.channelCode || "admin_confirm",
        })
        return NextResponse.json({ success: true, data })
      }
      if (act.action === "receive") {
        const data = await MallSolutionService.receiveTradeOrder({ orderId: id })
        return NextResponse.json({ success: true, data })
      }
      if (act.action === "cancel") {
        const data = await MallSolutionService.cancelTradeOrder({ orderId: id, reason: act.reason })
        return NextResponse.json({ success: true, data })
      }
      if (act.action === "approveRefund") {
        const data = await MallSolutionService.approveAfterSaleRefund({
          orderId: id,
          auditReason: act.auditReason,
        })
        return NextResponse.json({ success: true, data })
      }
      if (act.action === "remark") {
        const data = await TradeOrderService.update(id, { id: String(id), remark: act.remark ?? "" })
        return NextResponse.json({ success: true, data })
      }
    }

    const data = await TradeOrderService.update(id, tradeOrderUpdateSchema.parse({ ...body, id }))
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const data = await TradeOrderService.delete(id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 })
  }
}
