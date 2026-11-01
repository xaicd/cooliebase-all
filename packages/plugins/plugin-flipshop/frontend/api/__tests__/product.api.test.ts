import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { FLIPSHOP_PRODUCTS_BASE_URL, FlipProductApi } from "../product.api"

const SAMPLE_PRODUCT = {
  id: "prod_1",
  tenantId: "tenant_1",
  name: "翻牌盲盒",
  skuCode: "FLIP-0001",
  priceCents: 9900,
  stock: 12,
  status: "on_shelf" as const,
  coverUrl: null,
  description: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  version: 1,
}

type FetchArgs = [url: string, init?: RequestInit & { body?: string }]

function okResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

describe("FlipProductApi", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async () => okResponse({ success: true, data: SAMPLE_PRODUCT }))
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("page() 走 BFF 挂载点并序列化分页/筛选参数（跳过空值）", async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ success: true, data: { items: [SAMPLE_PRODUCT], total: 1, page: 2, pageSize: 10 } }))

    const res = await FlipProductApi.page({ page: 2, pageSize: 10, keyword: "盲盒", status: undefined })

    expect(res.success).toBe(true)
    expect(res.data?.total).toBe(1)

    const [url, init] = fetchMock.mock.calls[0] as FetchArgs
    expect(url.startsWith(`${FLIPSHOP_PRODUCTS_BASE_URL}?`)).toBe(true)
    expect(url).toContain("page=2")
    expect(url).toContain("pageSize=10")
    expect(url).toContain("keyword=%E7%9B%B2%E7%9B%92")
    expect(url).not.toContain("status=")
    expect(init?.method).toBe("GET")
  })

  it("get() 使用条目路径并编码 id", async () => {
    const res = await FlipProductApi.get("a/b c")

    expect(res.success).toBe(true)
    const [url] = fetchMock.mock.calls[0] as FetchArgs
    expect(url).toBe(`${FLIPSHOP_PRODUCTS_BASE_URL}/a%2Fb%20c`)
  })

  it("create() POST 且携带 Idempotency-Key", async () => {
    const res = await FlipProductApi.create(
      { name: "翻牌盲盒", skuCode: "FLIP-0001", priceCents: 9900, stock: 12, status: "on_shelf" },
      "idem-fixed-key",
    )

    expect(res.success).toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as FetchArgs
    expect(url).toBe(FLIPSHOP_PRODUCTS_BASE_URL)
    expect(init?.method).toBe("POST")
    const headers = (init?.headers ?? {}) as Record<string, string>
    expect(headers["Idempotency-Key"]).toBe("idem-fixed-key")
    expect(JSON.parse(String(init?.body))).toMatchObject({ skuCode: "FLIP-0001", priceCents: 9900 })
  })

  it("create() 无显式幂等键时自动生成", async () => {
    await FlipProductApi.create({ name: "x", skuCode: "X-1", priceCents: 0, stock: 0, status: "off_shelf" })
    const [, init] = fetchMock.mock.calls[0] as FetchArgs
    const headers = (init?.headers ?? {}) as Record<string, string>
    expect(headers["Idempotency-Key"]).toBeTruthy()
  })

  it("409 冲突信封原样透传（供页面判定行内提示）", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, code: "CONFLICT", error: "资源冲突", message: "资源冲突" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const res = await FlipProductApi.create({ name: "x", skuCode: "DUP", priceCents: 1, stock: 1, status: "off_shelf" })

    expect(res.success).toBe(false)
    expect(res.code).toBe("CONFLICT")
  })

  it("网络异常被请求层归一为失败信封（不抛出）", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"))
    const res = await FlipProductApi.page()
    expect(res.success).toBe(false)
    expect(res.error).toContain("boom")
  })
})
