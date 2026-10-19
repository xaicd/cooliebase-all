/**
 * 跨域 Facade 往返: wmsFacade.deductStock -> broker -> rpc-actions catalog
 * -> DOMAIN_SERVICE_LOADERS -> inventory-stock-ops。
 *
 * 这条链路此前**整层不通**（模板调用不存在的 API、生成的绑定从未注册）。
 * 本用例证明走 catalog 这条路是通的 —— 也就是 erp/mes 可以经 Facade 调库存。
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest"
import { runWithTenantContext } from "@/modules/shared/backend/lib/biz-tenant"
import { WmsInventoryRepository } from "../../repositories/wms-inventory.repository"
import { wmsFacade } from "../../../contract/wms.facade"

/** broker 的调用契约: 返回 { success, data?, error? } —— 调用方必须解包，不能当数据直接用。 */
function unwrap<R>(result: { success: boolean; data?: R; error?: string }): R {
  if (!result.success) throw new Error(result.error ?? "跨域调用失败")
  return result.data as R
}

describe("跨域 Facade: 库存操作", () => {
  let inventoryId: string

  beforeAll(async () => {
    const created = await runWithTenantContext({ tenantId: "1" }, async () =>
      // 仓储的入参契约是 **snake_case**（`WRITABLE_COLUMNS` 按物理列名匹配，
      // validator 也是 `warehouse_id`）。之前写成 camelCase 时，`persistable()` 一个字段都匹配不上，
      // 真实库直接因 `warehouse_id` NOT NULL 违约报错；内存模式不校验，所以"通过"了。
      WmsInventoryRepository.create({ warehouse_id: "w1", item_id: "i1", qty: 10, locked_qty: 0 } as never),
    )
    inventoryId = String((created as { id: string }).id)
  })

  beforeEach(async () => {
    await runWithTenantContext({ tenantId: "1" }, async () =>
      WmsInventoryRepository.update(inventoryId, { qty: 10, locked_qty: 0 } as never),
    )
  })

  it("deductStock 经 Facade 扣减成功", async () => {
    const result = await runWithTenantContext({ tenantId: "1" }, async () =>
      unwrap<{ qty: number }>(await wmsFacade.deductStock({ inventoryId, amount: 4 })),
    )
    expect(result.qty).toBe(6)
  })

  it("库存不足时 Facade 调用失败（不静默扣成负数）", async () => {
    const result = await runWithTenantContext({ tenantId: "1" }, async () =>
      wmsFacade.deductStock({ inventoryId, amount: 99 }),
    )
    expect(result.success).toBe(false)
    expect(String(result.error)).toMatch(/库存/)
    // 关键: 数据没被改动
    const row = await runWithTenantContext({ tenantId: "1" }, async () => WmsInventoryRepository.findById(inventoryId))
    expect(Number((row as { qty: unknown }).qty)).toBe(10)
  })

  it("入参非法直接拒绝（数量必须为正）", async () => {
    const result = await runWithTenantContext({ tenantId: "1" }, async () =>
      wmsFacade.deductStock({ inventoryId, amount: -5 }),
    )
    expect(result.success).toBe(false)
    // 注意: 现在 broker 会**先用 catalog 里的 schema 校验**（contracts:sync 生成的 actions
    // 把 wmsStockOpSchema 接上了），所以非法入参在这里就被拦下，错误是 ValidationError。
    expect(String(result.error)).toMatch(/ValidationError|入参非法/)
  })

  it("lockStock 预占走的是 locked_qty，不是 qty", async () => {
    const result = await runWithTenantContext({ tenantId: "1" }, async () =>
      unwrap<{ qty: number; lockedQty: number }>(await wmsFacade.lockStock({ inventoryId, amount: 3 })),
    )
    expect(result.lockedQty).toBe(3)
    expect(result.qty).toBe(10)
  })
})
