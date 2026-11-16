import { describe, expect, it } from "vitest"

import { applyActionSchema, getActionSchema } from "@/modules/shared/backend/lib/broker-validator"
import { ensureContractActions, resetContractActions } from "@/modules/shared/backend/lib/contract-actions"
import {
  DISPATCH_REQUIRED_CAPABILITY,
  getModuleByDomain,
  listModules,
  moduleCanDispatch,
  resolveModuleDispatch,
} from "../module-registry"

describe("module-registry", () => {
  it("注册表由生成物驱动，覆盖全部可打包域", () => {
    const modules = listModules()
    // domain-catalog 共 20 域，其中 online 为 handwritten，故不在模块注册表内
    expect(modules.length).toBe(19)
    expect(modules.every((manifest) => typeof manifest.domain === "string")).toBe(true)
    expect(modules.map((manifest) => manifest.domain)).toContain("pay")
  })

  it("manifest 的声明面来自真实契约，不是空壳", () => {
    const pay = getModuleByDomain("pay")
    expect(pay).toBeDefined()
    expect(pay!.facadeMethods).toContain("listOrders")
    expect(pay!.actions).toContain("pay.listOrders")
    expect(pay!.permissions).toContain("pay:order:query")
    // capability 由声明推导
    expect(pay!.capabilities).toContain("facade.invoke")
  })

  it("未登记的域返回 undefined", () => {
    expect(getModuleByDomain("not-a-domain")).toBeUndefined()
  })

  it("解析 <domain>/<method> 成功", () => {
    const resolved = resolveModuleDispatch(["pay", "listOrders"])
    expect(resolved.ok).toBe(true)
    if (resolved.ok) {
      expect(resolved.target.manifest.domain).toBe("pay")
      expect(resolved.target.method).toBe("listOrders")
    }
  })

  it("空路径与段数不符按 400 拒绝", () => {
    expect(resolveModuleDispatch([])).toMatchObject({ ok: false, status: 400 })
    expect(resolveModuleDispatch(["pay"])).toMatchObject({ ok: false, status: 400 })
    expect(resolveModuleDispatch(["pay", "listOrders", "extra"])).toMatchObject({ ok: false, status: 400 })
  })

  it("未登记域按 404 拒绝", () => {
    expect(resolveModuleDispatch(["not-a-domain", "ping"])).toMatchObject({ ok: false, status: 404 })
  })

  it("未声明的方法按 404 拒绝 —— 不落到动态兜底，避免绕过声明面", () => {
    const resolved = resolveModuleDispatch(["pay", "definitelyNotDeclared"])
    expect(resolved).toMatchObject({ ok: false, status: 404 })
    if (!resolved.ok) expect(resolved.error).toContain("未声明")
  })

  it("能力强制生效：声明是请求，判定在网关", () => {
    // 现状：全部已登记域都推导出 facade.invoke（因为它们都有 facade）——
    // 这条同时防住"以后新增域忘了声明能力却被放开派发"
    for (const manifest of listModules()) {
      expect(moduleCanDispatch(manifest), `${manifest.domain} 应声明 ${DISPATCH_REQUIRED_CAPABILITY}`).toBe(true)
    }

    // 反例：能力声明被抹掉后必须被拒（纯函数使其可测；走注册表无法构造该反例）
    expect(moduleCanDispatch({ capabilities: [] })).toBe(false)
    expect(moduleCanDispatch({ capabilities: ["api.routes.register", "cmd.dispatch"] })).toBe(false)
    expect(moduleCanDispatch({ capabilities: [DISPATCH_REQUIRED_CAPABILITY] })).toBe(true)
  })

  it("网关派发链第一环可用：manifest 声明的 action 能被注册并按声明校验", async () => {
    resetContractActions()
    // 网关 POST 的第一步，正是按 manifest.domain 注册该域 action schema
    await ensureContractActions("pay")

    // manifest 里声明过的 action 必须真的能取到 schema —— 否则 applyActionSchema
    // 会静默放行(params ?? {})，声明面就失去校验意义
    const pay = getModuleByDomain("pay")!
    expect(pay.actions.length).toBeGreaterThan(0)
    for (const action of pay.actions) {
      expect(getActionSchema(action), `${action} 应有已注册的 schema`).toBeDefined()
    }

    // 校验生效：合法入参通过、非法入参抛 ValidationError
    expect(() => applyActionSchema("pay.listOrders", { page: 1, pageSize: 10 })).not.toThrow()
    expect(() => applyActionSchema("pay.listOrders", { page: "not-a-number" })).toThrow(/ValidationError/)
  })
})
