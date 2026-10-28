import { expect, test } from "@playwright/test"

/**
 * **写链路 E2E 模板**（红绿对抗双层）。
 *
 * ## 默认 skip —— 这是刻意的
 *
 * 写链路 E2E 需要**真实应用 + 真实数据库**：真实账户、真实落库、真实 4xx。
 * 本机不保证具备（嵌入式 Postgres 还受 macOS `kern.sysv.shmall` 4MB 限制）。
 * **宁可 skip，也不假装跑过** —— 本仓铁律：骨架不算完成，假绿比没有更糟。
 *
 * 打开方式（两把开关都要）：
 * ```bash
 * E2E_BASE_URL=http://127.0.0.1:3200 E2E_WRITE_PATH=1 \
 *   pnpm exec playwright test test/e2e/write-path.sample.spec.ts
 * ```
 *
 * ## 换成你自己的业务时，只要替换三处
 *
 * 1. `goto` 的页面路径；
 * 2. 表单字段与提交按钮的 `data-agent-target`（本仓 UI 强制带 Agent-Native 属性）；
 * 3. `assertDbLedger` 里查哪张表、比哪几个字段。
 */

const BASE_URL = process.env.E2E_BASE_URL
const ENABLED = Boolean(BASE_URL) && process.env.E2E_WRITE_PATH === "1"

test.describe("写链路 E2E 模板（红绿对抗双层）", () => {
  test.skip(!ENABLED, "未设置 E2E_BASE_URL + E2E_WRITE_PATH=1 —— 这类用例需要真实应用与数据库")

  test("① 正向旅程：真实写库 → 直接查数据库断言落库结果", async ({ page, request }) => {
    // 1) 登录（真实账户）—— 换成你自己域的登录入口
    await page.goto(`${BASE_URL}/login`)
    await page.getByTestId("login__username").fill(process.env.E2E_USER || "admin")
    await page.getByTestId("login__password").fill(process.env.E2E_PASS || "")
    await page.getByTestId("login__submit").click()
    await expect(page).toHaveURL(/\/admin/)

    // 2) 执行写操作 —— 换成你的页面与表单
    await page.goto(`${BASE_URL}/admin/<domain>/<resource>`)
    await page.getByTestId("<domain>:<resource>__create").click()
    await page.getByTestId("form__name").fill(`e2e-${Date.now()}`)
    await page.getByTestId("form__submit").click()

    // 3) 断言 HTTP 2xx（用 page 的响应事件，而不是只看 UI）
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/v1/admin/") && r.request().method() === "POST"),
      page.getByTestId("form__submit").click(),
    ])
    expect(resp.status()).toBeLessThan(300)

    // 4) **直接查数据库** —— 这条是「深度」的分界线；
    //    只断言「弹窗消失 / 列表多一行」是 UI 自证，底层可能没写。
    //    换成你的查询（本仓可用 request context 打一个只读接口，或直连数据库）。
    const ledger = await request.get(`${BASE_URL}/api/v1/admin/<domain>/<resource>?keyword=e2e-`)
    expect(ledger.ok()).toBeTruthy()
    const body = await ledger.json()
    expect(JSON.stringify(body)).toContain("e2e-")
  })

  test("② 对抗旅程：非法输入 → 4xx + 中文告警 + 可自愈 + **库没写脏**", async ({ page, request }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByTestId("login__username").fill(process.env.E2E_USER || "admin")
    await page.getByTestId("login__password").fill(process.env.E2E_PASS || "")
    await page.getByTestId("login__submit").click()
    await expect(page).toHaveURL(/\/admin/)

    await page.goto(`${BASE_URL}/admin/<domain>/<resource>`)
    await page.getByTestId("<domain>:<resource>__create").click()

    // 1) 故意提交非法值（越权 / 低于下限 / 缺必填 —— 换成你业务里的对抗输入）
    await page.getByTestId("form__amount").fill("-1")

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/v1/admin/") && r.request().method() === "POST"),
      page.getByTestId("form__submit").click(),
    ])

    // 2) 必须是**业务 4xx**，不是 500（500 说明是崩了，不是拒绝）
    expect(resp.status()).toBeGreaterThanOrEqual(400)
    expect(resp.status()).toBeLessThan(500)

    // 3) 页面**不卡死**：按钮可再次点击
    await expect(page.getByTestId("form__submit")).toBeEnabled()

    // 4) 弹窗内有**中文可读告警**（不是裸 code）
    await expect(page.getByRole("alert")).toContainText(/[\u4e00-\u9fa5]/)

    // 5) 提供**自愈**路径（如「调整为最新有效值」）
    const heal = page.getByTestId("form__self-heal")
    if (await heal.count()) {
      await heal.click()
      await expect(page.getByTestId("form__amount")).not.toHaveValue("-1")
    }

    // 6) **库没写脏** —— 最容易漏、也最重要的一条
    const after = await request.get(`${BASE_URL}/api/v1/admin/<domain>/<resource>?keyword=e2e-neg`)
    expect(JSON.stringify(await after.json())).not.toContain("e2e-neg")
  })
})
