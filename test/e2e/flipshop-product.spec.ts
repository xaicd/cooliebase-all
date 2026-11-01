import { expect, test, type Page, type Route } from "@playwright/test"

/**
 * 翻牌小店 (flipshop) · 商品三页面拟真人 E2E（G3 门禁）。
 *
 * 覆盖验收标准：
 *   ① 列表 → 详情 → 新增 完整旅程走通；
 *   ② 空态 / 404 / 409 有可视反馈（零死穴假按钮）；
 *   ③ 搜索防抖 300ms、分页、刷新、提交中禁用。
 *
 * 为什么用 `page.route` 打桩：本用例验证的是**前端页面与交互**（状态机、Agent-Native 属性、
 * 零假按钮）。写链路需要真实库的语义已由后端集成测试 `test/integration/flipshop-product.integration.test.ts`
 * 在真实 PostgreSQL 上覆盖，二者互补、不重复。因此本用例只需一个已启动的应用进程。
 *
 * 运行：
 *   E2E_BASE_URL=http://127.0.0.1:3300 pnpm exec playwright test test/e2e/flipshop-product.spec.ts
 */

const BASE_URL = process.env.E2E_BASE_URL
const ENABLED = Boolean(BASE_URL)

/** 合法形状的 JWT（仅前端 authGuard 解析 exp 用，签名不校验）。 */
const FAKE_TOKEN = (() => {
  const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url")
  const exp = Math.floor(Date.now() / 1000) + 3600
  return `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "admin", exp })}.signature`
})()

const P1 = {
  id: "prod-1", tenantId: "t1", name: "翻牌盲盒", skuCode: "FLIP-0001", priceCents: 9900, stock: 12,
  status: "on_shelf", coverUrl: null, description: "热销盲盒", createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z", version: 1,
}
const P2 = {
  ...P1, id: "prod-2", name: "翻牌手办", skuCode: "FLIP-0002", priceCents: 19900, stock: 3, status: "off_shelf",
}

type Scenario = {
  mode: "empty" | "ready"
  detail: "ok" | "notfound" | "error"
  create: "ok" | "conflict" | "error"
  totalItems: number
  listRequests: string[]
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
}

function errorEnvelope(code: string, status: number) {
  return { success: false, code, error: "错误", message: "错误", messageKey: "error", retryable: status >= 500, traceId: "e2e" }
}

function synth(index: number) {
  if (index === 0) return P1
  if (index === 1) return P2
  const n = index + 1
  return { ...P1, id: `prod-${n}`, name: `翻牌商品${n}`, skuCode: `FLIP-${String(n).padStart(4, "0")}` }
}

function listItems(scenario: Scenario, query: URLSearchParams) {
  let items = scenario.mode === "empty" ? [] : Array.from({ length: scenario.totalItems }, (_, i) => synth(i))
  const keyword = (query.get("keyword") ?? "").trim().toLowerCase()
  if (keyword) items = items.filter((i) => i.name.toLowerCase().includes(keyword) || i.skuCode.toLowerCase().includes(keyword))
  const status = query.get("status")
  if (status) items = items.filter((i) => i.status === status)
  const page = Number(query.get("page") ?? 1)
  const pageSize = Number(query.get("pageSize") ?? 20)
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length }
}

async function installMocks(page: Page, scenario: Scenario) {
  await page.addInitScript((token) => {
    localStorage.setItem("cooliebase_token", token)
    localStorage.setItem("cooliebase_user", JSON.stringify({ username: "admin", nickname: "管理员" }))
  }, FAKE_TOKEN)

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    // 侧栏菜单：必须返回成功，否则统一请求层的 401 逻辑会把页面踢回 /login
    if (path.includes("/system/menus/sidebar")) return json(route, 200, { success: true, data: [] })

    const isCollection = /\/flipshop\/products\/?$/.test(path)
    if (path.includes("/flipshop/products")) {
      if (method === "GET" && isCollection) {
        scenario.listRequests.push(url.search)
        const { items, total } = listItems(scenario, url.searchParams)
        return json(route, 200, { success: true, data: { items, total, page: Number(url.searchParams.get("page") ?? 1), pageSize: Number(url.searchParams.get("pageSize") ?? 20) } })
      }
      if (method === "POST" && isCollection) {
        if (scenario.create === "conflict") return json(route, 409, errorEnvelope("CONFLICT", 409))
        if (scenario.create === "error") return json(route, 500, errorEnvelope("INTERNAL_ERROR", 500))
        const body = JSON.parse(request.postData() ?? "{}")
        return json(route, 201, { success: true, data: { ...P1, id: "prod-new", name: body.name, skuCode: body.skuCode } })
      }
      if (method === "GET") {
        if (scenario.detail === "notfound") return json(route, 404, errorEnvelope("NOT_FOUND", 404))
        if (scenario.detail === "error") return json(route, 500, errorEnvelope("INTERNAL_ERROR", 500))
        const id = path.split("/").filter(Boolean).pop()
        return json(route, 200, { success: true, data: id === P2.id ? P2 : P1 })
      }
    }

    return json(route, 200, { success: true, data: null })
  })
}

test.describe("翻牌小店 · 商品三页面（G3）", () => {
  test.skip(!ENABLED, "未设置 E2E_BASE_URL —— 需要已启动的应用进程")

  test("① 列表 → 详情 → 新增 完整旅程 + 空态可视反馈", async ({ page }) => {
    const scenario: Scenario = { mode: "empty", detail: "ok", create: "ok", totalItems: 2, listRequests: [] }
    await installMocks(page, scenario)

    await page.goto(`${BASE_URL}/admin/flipshop/products`)
    await expect(page.getByTestId("flipshop-product-title")).toBeVisible()

    // 空态：有可视反馈 + 就绪信号
    await expect(page.getByTestId("flipshop-product-empty")).toBeVisible()
    await expect(page.locator('[data-agent-scope="flipshop-product"][data-agent-page-ready="true"]')).toBeVisible()
    await expect(page.getByTestId("flipshop-product-total")).toHaveText("0")

    // 有数据：刷新后渲染两行
    scenario.mode = "ready"
    await page.getByTestId("flipshop-product-refresh").click()
    await expect(page.getByTestId("flipshop-product-row")).toHaveCount(2)
    await expect(page.getByTestId("flipshop-product-total")).toHaveText("2")
    await expect(page.getByTestId("flipshop-product-table")).toContainText("¥99.00")

    // 行 → 详情
    await page.getByTestId("flipshop-product-view").first().click()
    await expect(page).toHaveURL(/\/admin\/flipshop\/products\/prod-1$/)
    await expect(page.getByTestId("flipshop-product-detail-name")).toHaveText("翻牌盲盒")
    await expect(page.getByTestId("flipshop-product-detail-stock")).toHaveText("12")

    // 详情 → 列表 → 新增
    await page.getByTestId("flipshop-product-detail-back").click()
    await expect(page).toHaveURL(/\/admin\/flipshop\/products$/)
    await page.getByTestId("flipshop-product-create").click()
    await expect(page).toHaveURL(/\/admin\/flipshop\/products\/new$/)

    await page.getByTestId("field-name").fill("翻牌新商品")
    await page.getByTestId("field-skuCode").fill("FLIP-9999")
    await page.getByTestId("field-priceYuan").fill("9.9")
    await page.getByTestId("field-stock").fill("5")
    const [createResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/flipshop/products") && r.request().method() === "POST"),
      page.getByTestId("flipshop-product-form-submit").click(),
    ])
    expect(createResponse.status()).toBe(201)
    await expect(page).toHaveURL(/\/admin\/flipshop\/products$/)
  })

  test("② 详情 404 有可视反馈且可返回（无假按钮）", async ({ page }) => {
    const scenario: Scenario = { mode: "ready", detail: "notfound", create: "ok", totalItems: 2, listRequests: [] }
    await installMocks(page, scenario)

    await page.goto(`${BASE_URL}/admin/flipshop/products/does-not-exist`)
    await expect(page.getByTestId("flipshop-product-detail-notfound")).toBeVisible()
    await expect(page.locator('[data-agent-scope="flipshop-product"][data-agent-state="not-found"]')).toBeVisible()

    await page.getByTestId("flipshop-product-detail-notfound-back").click()
    await expect(page).toHaveURL(/\/admin\/flipshop\/products$/)
  })

  test("③ 新增 SKU 冲突（409）行内提示且停留原页", async ({ page }) => {
    const scenario: Scenario = { mode: "ready", detail: "ok", create: "conflict", totalItems: 2, listRequests: [] }
    await installMocks(page, scenario)

    await page.goto(`${BASE_URL}/admin/flipshop/products/new`)
    await page.getByTestId("field-name").fill("重复 SKU 商品")
    await page.getByTestId("field-skuCode").fill("FLIP-0001")
    await page.getByTestId("field-priceYuan").fill("1.00")
    await page.getByTestId("field-stock").fill("1")
    await page.getByTestId("flipshop-product-form-submit").click()

    await expect(page.getByTestId("flipshop-product-form-error")).toBeVisible()
    await expect(page.getByTestId("flipshop-product-form-error")).toContainText("已存在")
    await expect(page).toHaveURL(/\/admin\/flipshop\/products\/new$/)
    // 提交按钮恢复可用（提交中禁用已解除）
    await expect(page.getByTestId("flipshop-product-form-submit")).toBeEnabled()
  })

  test("④ 搜索防抖 300ms：连续输入只触发一次最终查询", async ({ page }) => {
    const scenario: Scenario = { mode: "ready", detail: "ok", create: "ok", totalItems: 2, listRequests: [] }
    await installMocks(page, scenario)

    await page.goto(`${BASE_URL}/admin/flipshop/products`)
    await expect(page.getByTestId("flipshop-product-row")).toHaveCount(2)

    scenario.listRequests.length = 0
    const keyword = page.getByTestId("search-keyword")
    await keyword.pressSequentially("手办", { delay: 40 }) // 快速连打，应被防抖合并
    await expect(page.getByTestId("flipshop-product-row")).toHaveCount(1)
    await expect(page.getByTestId("flipshop-product-row")).toContainText("翻牌手办")

    const keywordRequests = scenario.listRequests.filter((q) => q.includes("keyword="))
    expect(keywordRequests.length).toBe(1)
    expect(keywordRequests[0]).toContain("keyword=%E6%89%8B%E5%8A%9E")
  })

  test("⑤ 分页参数随翻页下发", async ({ page }) => {
    const scenario: Scenario = { mode: "ready", detail: "ok", create: "ok", totalItems: 25, listRequests: [] }
    await installMocks(page, scenario)

    await page.goto(`${BASE_URL}/admin/flipshop/products`)
    await expect(page.getByTestId("flipshop-product-row")).toHaveCount(20) // 25 条 / 每页 20

    scenario.listRequests.length = 0
    await page.getByRole("button", { name: "下一页" }).click()
    await expect.poll(() => scenario.listRequests.some((q) => q.includes("page=2"))).toBe(true)
    await expect(page.getByTestId("flipshop-product-row")).toHaveCount(5)
  })
})
