import { describe, it, expect } from "vitest"
import { runWithTenantContext } from "@/modules/shared/backend/lib/biz-tenant"
import { CrmCustomerService } from "../crm-customer.service"

describe("CrmCustomerService - 客户公私海与状态机守卫", () => {
  it("应支持完整的客户流转、锁定、移入公海及从公海认领闭环", async () => {
    await runWithTenantContext({ tenantId: "100" }, async () => {
      // 1. 创建私海客户
      const customer = await CrmCustomerService.create({
        name: "北京某高新技术企业",
        mobile: "13911112222",
        owner_user_id: 101,
      } as any)
      expect(customer.id).toBeDefined()
      expect(customer.lock_status).toBe(false)
      // `owner_user_id` 是 **text 列**：PostgreSQL 返回字符串（`"101"`），
      // 内存回退原样回显传入的 number。用 String 比较才对两种驱动都成立。
      expect(String(customer.owner_user_id)).toBe("101")

      // 2. 客户负责人移交
      const transferred = await CrmCustomerService.transfer(customer.id, 102, "101")
      // `owner_user_id` 是 text 列：真实库返回字符串，内存回退回显 number —— 用 String 比较。
      expect(String(transferred.owner_user_id)).toBe("102")

      // 3. 锁定客户
      const locked = await CrmCustomerService.setLock(customer.id, true, "102")
      expect(locked.lock_status).toBe(true)

      // 4. 不变量守卫：锁定客户禁止移入公海池
      await expect(CrmCustomerService.putToPool(customer.id, "102")).rejects.toThrow(
        "客户已被锁定，禁止移入公海池"
      )

      // 5. 解锁后移入公海池
      await CrmCustomerService.setLock(customer.id, false, "102")
      const pooled = await CrmCustomerService.putToPool(customer.id, "102")
      expect(pooled.owner_user_id).toBeNull()

      // 6. 新员工从公海池认领该客户
      const claimed = await CrmCustomerService.receiveFromPool(customer.id, 103, "103")
      // `owner_user_id` 是 text 列：真实库返回字符串，内存回退回显 number —— 用 String 比较。
      expect(String(claimed.owner_user_id)).toBe("103")

      // 7. 不变量守卫：已有负责人的客户不可重复认领
      await expect(CrmCustomerService.receiveFromPool(customer.id, 104, "104")).rejects.toThrow(
        "该客户已有负责人，非公海池客户"
      )
    })
  })
})
