import { NextResponse } from "next/server"
import { z } from "zod"
import { MallSolutionService } from "@/modules/mall/backend/services/mall-solution.service"

const checkoutItemSchema = z.object({
  spuId: z.union([z.string(), z.number()]),
  skuId: z.union([z.string(), z.number()]).optional(),
  count: z.coerce.number().min(1).default(1),
  cartId: z.union([z.string(), z.number()]).optional(),
})

const storefrontActionSchema = z.object({
  action: z.enum([
    "takeCoupon",
    "saveCart",
    "settlement",
    "checkout",
    "payOrder",
    "receiveOrder",
    "cancelOrder",
    "applyAfterSale",
    "listOrders",
  ]),
  userId: z.string().optional(),
  templateId: z.union([z.string(), z.number()]).optional(),
  spuId: z.union([z.string(), z.number()]).optional(),
  skuId: z.union([z.string(), z.number()]).optional(),
  count: z.coerce.number().optional(),
  selected: z.boolean().optional(),
  items: z.array(checkoutItemSchema).optional(),
  couponId: z.union([z.string(), z.number()]).optional(),
  deliveryType: z.coerce.number().optional(),
  receiverName: z.string().optional(),
  receiverMobile: z.string().optional(),
  receiverDetailAddress: z.string().optional(),
  userRemark: z.string().optional(),
  orderId: z.union([z.string(), z.number()]).optional(),
  payOrderId: z.union([z.string(), z.number()]).optional(),
  channelCode: z.string().optional(),
  reason: z.string().optional(),
  applyReason: z.string().optional(),
  applyDescription: z.string().optional(),
  way: z.coerce.number().optional(),
  status: z.union([z.string(), z.number()]).optional(),
})

/**
 * 商城用户端聚合接口（支持游客浏览、领券、加购、结算算价、下单、收银台支付、确认收货与售后申请）
 * GET / POST /api/v1/app/mall/products
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get("page") || 1)
    const pageSize = Number(searchParams.get("pageSize") || 20)
    const keyword = searchParams.get("keyword") || undefined
    const categoryId = searchParams.get("categoryId") || undefined
    const userId = searchParams.get("userId") || "member-demo-01"

    const storefront = await MallSolutionService.getStorefrontHome(
      { categoryId, keyword, userId },
      userId,
      "default",
    )
    const ordersData = await MallSolutionService.listOrdersWithDetails(
      { user_id: userId, page: 1, pageSize: 30 },
      userId,
      "default",
    )

    return NextResponse.json({
      success: true,
      data: {
        items: storefront.products,
        total: storefront.products.length,
        page,
        pageSize,
        ...storefront,
        orders: ordersData.items,
        orderSummary: ordersData.summary,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json()
    const input = storefrontActionSchema.parse(rawBody)
    const userId = input.userId || "member-demo-01"

    switch (input.action) {
      case "takeCoupon": {
        if (!input.templateId) throw new Error("缺少优惠券模板 ID")
        const data = await MallSolutionService.takeCoupon({ templateId: input.templateId, userId }, userId)
        return NextResponse.json({ success: true, data })
      }
      case "saveCart": {
        if (!input.spuId) throw new Error("缺少商品 SPU ID")
        const data = await MallSolutionService.saveCartItem(
          {
            userId,
            spuId: input.spuId,
            skuId: input.skuId,
            count: input.count ?? 1,
            selected: input.selected ?? true,
          },
          userId,
        )
        return NextResponse.json({ success: true, data })
      }
      case "settlement": {
        const normalizedItems = (input.items ?? []).map((item) => ({
          spuId: item.spuId ?? "1",
          skuId: item.skuId,
          count: item.count ?? 1,
          cartId: item.cartId,
        }))
        const data = await MallSolutionService.calculateSettlement(
          {
            userId,
            items: normalizedItems,
            couponId: input.couponId,
            deliveryType: input.deliveryType,
          },
          userId,
        )
        return NextResponse.json({ success: true, data })
      }
      case "checkout": {
        const normalizedItems = (input.items ?? []).map((item) => ({
          spuId: item.spuId ?? "1",
          skuId: item.skuId,
          count: item.count ?? 1,
          cartId: item.cartId,
        }))
        const data = await MallSolutionService.createCheckoutOrder(
          {
            userId,
            items: normalizedItems,
            couponId: input.couponId,
            deliveryType: input.deliveryType,
            receiverName: input.receiverName,
            receiverMobile: input.receiverMobile,
            receiverDetailAddress: input.receiverDetailAddress,
            userRemark: input.userRemark,
          },
          userId,
        )
        return NextResponse.json({ success: true, data }, { status: 201 })
      }
      case "payOrder": {
        if (!input.orderId) throw new Error("缺少订单 ID")
        const data = await MallSolutionService.payCheckoutOrder(
          {
            orderId: input.orderId,
            payOrderId: input.payOrderId,
            channelCode: input.channelCode,
            userId,
          },
          userId,
        )
        return NextResponse.json({ success: true, data })
      }
      case "receiveOrder": {
        if (!input.orderId) throw new Error("缺少订单 ID")
        const data = await MallSolutionService.receiveTradeOrder({ orderId: input.orderId, userId }, userId)
        return NextResponse.json({ success: true, data })
      }
      case "cancelOrder": {
        if (!input.orderId) throw new Error("缺少订单 ID")
        const data = await MallSolutionService.cancelTradeOrder(
          { orderId: input.orderId, reason: input.reason, userId },
          userId,
        )
        return NextResponse.json({ success: true, data })
      }
      case "applyAfterSale": {
        if (!input.orderId) throw new Error("缺少订单 ID")
        const data = await MallSolutionService.applyAfterSale(
          {
            orderId: input.orderId,
            userId,
            applyReason: input.applyReason,
            applyDescription: input.applyDescription,
            way: input.way,
          },
          userId,
        )
        return NextResponse.json({ success: true, data })
      }
      case "listOrders": {
        const data = await MallSolutionService.listOrdersWithDetails(
          { user_id: userId, status: input.status, page: 1, pageSize: 50 },
          userId,
        )
        return NextResponse.json({ success: true, data })
      }
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "操作失败" }, { status: 400 })
  }
}
