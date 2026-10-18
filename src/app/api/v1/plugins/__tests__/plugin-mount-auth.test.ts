import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * 回归: 挂载点必须按 manifest 声明鉴权，且鉴权失败要返回 **401/403**，不能是 500。
 *
 * 曾经的 bug: 守卫被写在 `try` 之外（`try` 只包住了业务派发），于是守卫抛出的
 * AuthenticationError(401) 直接逃逸，被 Next 兜成 500 —— 客户端看到的是"服务器错误"，
 * 而不是"未登录"。这条测试断言 operator/company 无 token 得到 401、public 放行。
 */

const manifest = {
  id: "cooliebase.pay",
  version: "v1",
  capabilities: ["api.routes.register"],
  apiRoutes: [
    { routeKey: "admin:orders:get", method: "GET", path: "/orders", auth: "operator" },
    { routeKey: "app:cashier:post", method: "POST", path: "/cashier", auth: "company" },
    { routeKey: "open:notify:post", method: "POST", path: "/notify", auth: "public" },
  ],
}

vi.mock("@/modules/shared/backend/plugins/plugin.repository", () => ({
  PluginRepository: {
    findByKey: vi.fn(async () => ({ pluginKey: "cooliebase.pay", manifestJson: manifest, status: "ready" })),
  },
}))

const invokeRoute = vi.fn(async () => ({ status: 200, body: { ok: true } }))
vi.mock("@/modules/shared/backend/plugins/runtime-manager", () => ({
  pluginRuntimeManager: {
    invokeRoute: (...args: unknown[]) => invokeRoute(...(args as [])),
  },
}))

const { GET, POST } = await import("@/app/api/v1/plugins/[pluginKey]/api/[...path]/route")

const B = "http://localhost:3200/api/v1/plugins/cooliebase.pay/api"

describe("插件挂载点: 按声明鉴权", () => {
  beforeEach(() => vi.clearAllMocks())

  it("operator 声明: 无 token -> 401（不是 500）", async () => {
    const response = await GET(new Request(`${B}/orders`))
    expect(response.status).toBe(401)
    expect(invokeRoute).not.toHaveBeenCalled() // 鉴权失败不派发到业务
  })

  it("company 声明: 无 token -> 401", async () => {
    const response = await POST(new Request(`${B}/cashier`, { method: "POST", body: "{}" }))
    expect(response.status).toBe(401)
    expect(invokeRoute).not.toHaveBeenCalled()
  })

  it("public 声明: 无 token -> 放行并派发", async () => {
    const response = await POST(new Request(`${B}/notify`, { method: "POST", body: "{}" }))
    expect(response.status).toBe(200)
    expect(invokeRoute).toHaveBeenCalledOnce()
  })

  it("未声明的路由 -> 404，且不派发", async () => {
    const response = await GET(new Request(`${B}/definitely-not-declared`))
    expect(response.status).toBe(404)
    expect(invokeRoute).not.toHaveBeenCalled()
  })
})
