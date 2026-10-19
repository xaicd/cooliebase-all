import { describe, it, expect } from "vitest"
import { runWithTenantContext } from "@/modules/shared/backend/lib/biz-tenant"
import { TradeOrderService, TRADE_ORDER_STATUS } from "../trade-order.service"

describe("TradeOrderService - 交易订单4态状态机与幂等守卫", () => {
  it("应支持完整的待支付 -> 已支付 -> 已发货 -> 已完成流转与幂等支付", async () => {
    await runWithTenantContext({ tenantId: "100" }, async () => {
      // 1. 创建待支付订单
      const order = await TradeOrderService.create({
        no: "ORD-20261009-0001",
        user_id: 1001,
        total_price: 9999,
        pay_price: 8999,
        product_count: 1,
      } as any)
      expect(order.id).toBeDefined()
      expect(order.status).toBe(TRADE_ORDER_STATUS.UNPAID)
      expect(order.pay_status).toBe(false)

      // 2. 模拟微信/支付宝支付成功回调
      const paidOrder = await TradeOrderService.notifyPaid(order.id, 88801, "alipay", "user-01")
      expect(paidOrder.status).toBe(TRADE_ORDER_STATUS.PAID)
      expect(paidOrder.pay_status).toBe(true)
      // `pay_order_id` 在真实 schema 里是 **text 列**：PostgreSQL 会把它返回为字符串
      // （`"88801"`），而内存回退会原样回显输入的 number。两者语义等价，
      // 但直接 `toBe(88801)` 只在内存模式成立 —— 用 String 比较才对两种驱动都成立。
      expect(String(paidOrder.pay_order_id)).toBe("88801")
      expect(paidOrder.pay_channel_code).toBe("alipay")

      // 3. 幂等性守卫：重复调用 notifyPaid 不报错且保持原状
      const idempotentPaid = await TradeOrderService.notifyPaid(order.id, 88801, "alipay", "user-01")
      expect(idempotentPaid.status).toBe(TRADE_ORDER_STATUS.PAID)

      // 4. 商家发货
      const shippedOrder = await TradeOrderService.ship(
        order.id,
        { logisticsNo: "SF1234567890", logisticsId: 1 },
        "admin-01"
      )
      expect(shippedOrder.status).toBe(TRADE_ORDER_STATUS.SHIPPED)
      expect(shippedOrder.logistics_no).toBe("SF1234567890")

      // 5. 不变量守卫：已发货订单禁止直接取消
      await expect(TradeOrderService.cancel(order.id, "不想要了", "user-01")).rejects.toThrow(
        "已发货或已完成的订单无法直接取消"
      )

      // 6. 买家确认收货
      const completedOrder = await TradeOrderService.receive(order.id, "user-01")
      expect(completedOrder.status).toBe(TRADE_ORDER_STATUS.COMPLETED)
      expect(completedOrder.finish_time).toBeDefined()
    })
  })

  it("应支持未支付订单正常取消，并禁止支付已取消订单", async () => {
    await runWithTenantContext({ tenantId: "100" }, async () => {
      const order = await TradeOrderService.create({
        no: "ORD-20261009-0002",
        user_id: 1002,
        total_price: 199,
        pay_price: 199,
      } as any)
      expect(order.status).toBe(TRADE_ORDER_STATUS.UNPAID)

      // 1. 取消订单
      const cancelled = await TradeOrderService.cancel(order.id, "重复下单了", "user-02")
      expect(cancelled.status).toBe(TRADE_ORDER_STATUS.CANCELLED)

      // 2. 状态机不变量：已取消订单禁止支付
      await expect(TradeOrderService.notifyPaid(order.id, 88802, "wechat", "user-02")).rejects.toThrow(
        "订单已取消，禁止支付"
      )
    })
  })
})
