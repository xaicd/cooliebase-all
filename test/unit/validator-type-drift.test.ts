import { describe, expect, it } from "vitest"

import { payOrderActionSchemas } from "@/plugins/plugin-pay/contract/pay-order.actions"

/**
 * RSK-011 的**真实消费路径**回归：contract action schema。
 *
 * 本文档的初版把这条用例写成了「向 `ai-api-key` 路由 POST 字符串、期望 201」——
 * 那个前提是**错的**（该路由既要求鉴权、又不调用校验器），跑出来是 401 而非 400，
 * 已在 RSK-011 里订正。查证后确认校验器真正的消费路径是：
 *   `contract/*.actions.ts` 把 Zod schema 映射到 broker 主题（如 `cooliebase.cmd.pay.payOrder.create`），
 *   **跨域调用会走它** —— 这条路径真实可达，且不依赖 HTTP 鉴权。
 *
 * 缺陷本体（曾实测）：`pay-order.validator.ts` 把 `status` 声明为 `z.coerce.number()`，
 * 而 `pay_order.status` 的元数据与物理列都是文本、应用层四层（service/状态机/契约/前端）一致使用
 * `"WAITING" | "SUCCESS" | "CLOSED"`。于是跨域创建支付订单传字符串状态会被 schema 拒绝。
 *
 * 反空转守卫：先断言探针确实是**非数字**字符串 —— 否则 `z.coerce.number()` 也能过，用例即恒真。
 */
describe("RSK-011：支付订单 action schema 必须接受字符串状态", () => {
  it("create 的 status 接受「WAITING」（非数字字符串）", () => {
    const schema = payOrderActionSchemas["cooliebase.cmd.pay.payOrder.create"]
    expect(schema).toBeTruthy()

    const probe = "WAITING"
    expect(Number.isNaN(Number(probe))).toBe(true) // 反空转：探针不可被数字强转通过

    const result = schema.safeParse({ subject: "probe", price: 1, status: probe })
    if (!result.success) {
      throw new Error(
        `action schema 拒绝了字符串状态「${probe}」：${JSON.stringify(result.error.issues?.slice(0, 3))}`,
      )
    }
    expect(result.success).toBe(true)
  })
})
