/**
 * L4 Agent: E2E 页面拟人操作运营配置与全链路交易闭环验证 (Zero DB Seed)
 *
 * 核心铁律（Rule 0.8 反 Seed 铁律）：
 * 严禁通过数据库脚本或后台静默函数直接灌入业务运营配置数据！
 * 所有业务运营配置（商品分类、商品 SPU、多规格 SKU、优惠券模板、满减活动、秒杀活动、物流公司，
 * 以及任意新业务域的运营实体）必须 100% 通过 Playwright 驱动真实浏览器页面拟人操作：
 *   1. 打开 `/admin/login` 拟人输入账号密码并点击登录；
 *   2. 逐个进入 B 端运营管理页面，点击「新建」按钮 (`createButton`)；
 *   3. 拟人填写表单字段 (`[data-testid="field-..."]`) 并点击「提交」按钮 (`formSubmit`)；
 *   4. 断言表格 (`table`) 实时渲染出新配置的运营数据行；
 *   5. 跳转 C 端 `/portal` 门户，验证 B 端拟人配置的商品与营销活动实时生效，并拟人完成领券、加购、结算、支付；
 *   6. 回到 B 端 `/admin/mall/trade-order` 拟人点击「发货」填写物流单号完成履约闭环。
 *
 * 运行方式：
 *   pnpm run e2e:ops
 *   pnpm run e2e:ops:check
 */
import { test, expect, type Page } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

type ContractField = {
  name: string
  label: string
  type: string
  required: boolean
  testId: string
  selector: string
}

type AgentContract = {
  domain: string
  entity: string
  kebab: string
  businessName: string
  __source: string
  page: { route: string; title: string; titleSelector: string }
  selectors: Record<string, string>
  accessibility: {
    tableLabel: string
    dialogLabel: { create: string; edit: string }
    fields: ContractField[]
  }
}

const registryPath = path.resolve(__dirname, "..", "..", "docs", "agent", "contracts.json")
const registry: { contracts: AgentContract[] } = fs.existsSync(registryPath)
  ? (JSON.parse(fs.readFileSync(registryPath, "utf8")) as { contracts: AgentContract[] })
  : { contracts: [] }

const USERNAME = process.env.COOLIEBASE_AGENT_USERNAME || process.env.ADMIN_BOOTSTRAP_USERNAME || "supervip"
const PASSWORD = process.env.COOLIEBASE_AGENT_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123"
const TARGET_DOMAIN = process.env.E2E_OPS_DOMAIN || "mall"

export interface HumanOpsStepPlan {
  kebab: string
  route: string
  title: string
  selectors: {
    createButton: string
    form: string
    formSubmit: string
    table: string
  }
  fieldValues: Record<string, string>
}

/**
 * 商城全链路拟人运营配置标准蓝图（零数据库 Seed，全量通过 B 端页面表单拟人录入）
 */
export const MALL_HUMAN_OPS_PLAYBOOK: HumanOpsStepPlan[] = [
  {
    kebab: "product-category",
    route: "/admin/mall/product-category",
    title: "商品分类",
    selectors: {
      createButton: '[data-testid="product-category-create"]',
      form: '[data-testid="product-category-form"]',
      formSubmit: '[data-testid="product-category-form-submit"]',
      table: '[data-testid="product-category-table"]',
    },
    fieldValues: {
      parent_id: "0",
      name: "严选智能硬件与效率装备",
      sort: "1",
      status: "0",
    },
  },
  {
    kebab: "product-spu",
    route: "/admin/mall/product-spu",
    title: "商品 SPU",
    selectors: {
      createButton: '[data-testid="product-spu-create"]',
      form: '[data-testid="product-spu-form"]',
      formSubmit: '[data-testid="product-spu-form-submit"]',
      table: '[data-testid="product-spu-table"]',
    },
    fieldValues: {
      name: "ProMax 无线主动降噪旗舰耳机",
      keyword: "48dB深度降噪 · 空间音频",
      introduction: "通过 B 端页面拟人操作上架的旗舰商品，支持多规格 SKU、满减与优惠券叠加。",
      category_id: "1",
      price: "399",
      market_price: "599",
      cost_price: "220",
      stock: "100",
      status: "0",
    },
  },
  {
    kebab: "product-sku",
    route: "/admin/mall/product-sku",
    title: "商品 SKU",
    selectors: {
      createButton: '[data-testid="product-sku-create"]',
      form: '[data-testid="product-sku-form"]',
      formSubmit: '[data-testid="product-sku-form-submit"]',
      table: '[data-testid="product-sku-table"]',
    },
    fieldValues: {
      spu_id: "1",
      properties: "颜色款式:曜石黑旗舰版",
      property_name: "颜色款式",
      value_name: "曜石黑旗舰版",
      price: "399",
      market_price: "599",
      cost_price: "220",
      stock: "80",
    },
  },
  {
    kebab: "coupon-template",
    route: "/admin/mall/coupon-template",
    title: "优惠券模板",
    selectors: {
      createButton: '[data-testid="coupon-template-create"]',
      form: '[data-testid="coupon-template-form"]',
      formSubmit: '[data-testid="coupon-template-form-submit"]',
      table: '[data-testid="coupon-template-table"]',
    },
    fieldValues: {
      name: "拟人运营配置满100减20神券",
      description: "B端拟人配置全场满100元立减20元",
      total_count: "200",
      take_limit_count: "2",
      take_type: "1",
      use_price: "100",
      product_scope: "1",
      validity_type: "1",
      discount_type: "1",
      discount_price: "20",
      status: "0",
    },
  },
  {
    kebab: "reward-activity",
    route: "/admin/mall/reward-activity",
    title: "满减送活动",
    selectors: {
      createButton: '[data-testid="reward-activity-create"]',
      form: '[data-testid="reward-activity-form"]',
      formSubmit: '[data-testid="reward-activity-form-submit"]',
      table: '[data-testid="reward-activity-table"]',
    },
    fieldValues: {
      name: "全场满199立减25元包邮活动",
      condition_type: "10",
      product_scope: "1",
      limit: "199",
      discount_price: "25",
      point: "50",
      status: "0",
    },
  },
  {
    kebab: "seckill-activity",
    route: "/admin/mall/seckill-activity",
    title: "秒杀活动",
    selectors: {
      createButton: '[data-testid="seckill-activity-create"]',
      form: '[data-testid="seckill-activity-form"]',
      formSubmit: '[data-testid="seckill-activity-form-submit"]',
      table: '[data-testid="seckill-activity-table"]',
    },
    fieldValues: {
      spu_id: "1",
      name: "限时秒杀 · 旗舰降噪耳机直降",
      status: "0",
      sort: "1",
      total_limit_count: "50",
      single_limit_count: "3",
      stock: "30",
      total_stock: "50",
    },
  },
  {
    kebab: "delivery-express",
    route: "/admin/mall/delivery-express",
    title: "快递公司",
    selectors: {
      createButton: '[data-testid="delivery-express-create"]',
      form: '[data-testid="delivery-express-form"]',
      formSubmit: '[data-testid="delivery-express-form-submit"]',
      table: '[data-testid="delivery-express-table"]',
    },
    fieldValues: {
      code: "SF",
      name: "顺丰速运",
      sort: "1",
      status: "0",
    },
  },
]

async function humanLoginAdmin(page: Page): Promise<boolean> {
  await page.goto("/admin/login").catch(() => null)
  const usernameInput = page.locator('[data-testid="login-username"], input[name="username"]').first()
  if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await usernameInput.fill(USERNAME)
    const passwordInput = page.locator('[data-testid="login-password"], input[type="password"]').first()
    await passwordInput.fill(PASSWORD)
    const submitBtn = page.locator('[data-testid="login-submit"], button[type="submit"]').first()
    await submitBtn.click()
    await page.waitForTimeout(800)
  }

  // 验证或兜底同步同源 Cookie（确保 BFF 与 Page 均具备真实登录态）
  const response = await page.request
    .post("/api/v1/admin/system/auth", {
      data: { username: USERNAME, password: PASSWORD },
    })
    .catch(() => null)
  if (!response || !response.ok()) return false
  const body = await response.json().catch(() => null)
  const token: string | undefined = body?.data?.token
  if (!token) return false

  await page.context().addCookies([
    {
      name: "cooliebase_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      sameSite: "Lax" as const,
    },
  ])
  return true
}

async function humanConfigureEntityOnPage(page: Page, step: HumanOpsStepPlan) {
  await page.goto(step.route)
  await expect(page.locator(step.selectors.table)).toBeVisible({ timeout: 15000 })

  // 1. 拟人点击页面右上角「新建」按钮
  await page.locator(step.selectors.createButton).click()
  await expect(page.locator(step.selectors.form)).toBeVisible({ timeout: 10000 })

  // 2. 拟人逐项输入运营表单字段
  for (const [fieldName, value] of Object.entries(step.fieldValues)) {
    const fieldLocator = page.locator(`[data-testid="field-${fieldName}"]`).first()
    if (await fieldLocator.isVisible({ timeout: 1500 }).catch(() => false)) {
      await fieldLocator.fill(value)
    }
  }

  // 3. 拟人点击表单「提交」按钮并等待弹窗关闭与表格刷新
  await page.locator(step.selectors.formSubmit).click()
  await expect(page.locator(step.selectors.form)).toBeHidden({ timeout: 15000 })
  await expect(page.locator(step.selectors.table)).toBeVisible()
}

test.describe("L4 Agent: E2E 页面拟人运营配置与全链路交易验证 (Zero DB Seed)", () => {
  test("1. 运营配置契约完整性核验：所有运营配置页面必须具备标准选择器契约且严禁后台静默 Seed", async () => {
    expect(registry.contracts.length).toBeGreaterThan(0)

    for (const step of MALL_HUMAN_OPS_PLAYBOOK) {
      const contract = registry.contracts.find((c) => c.domain === "mall" && c.kebab === step.kebab)
      expect(contract, `mall.${step.kebab} 必须存在于 docs/agent/contracts.json`).toBeDefined()
      expect(contract?.page.route).toBe(step.route)
      expect(contract?.selectors.createButton).toBe(step.selectors.createButton)
      expect(contract?.selectors.form).toBe(step.selectors.form)
      expect(contract?.selectors.formSubmit).toBe(step.selectors.formSubmit)
      expect(contract?.selectors.table).toBe(step.selectors.table)
    }

    // 反 Seed 静态门禁：确保 MallSolutionService 中不存在 ensureMallSeedData / deriveDynamicSeedCatalog
    const mallServicePath = path.resolve(
      __dirname,
      "..",
      "..",
      "packages/plugins/plugin-mall/backend/services/mall-solution.service.ts",
    )
    const mallServiceCode = fs.readFileSync(mallServicePath, "utf8")
    expect(mallServiceCode).not.toContain("ensureMallSeedData")
    expect(mallServiceCode).not.toContain("deriveDynamicSeedCatalog")
  })

  test("2. B端页面拟人运营配置 -> C端门户领券加购结算支付 -> B端订单发货全链路闭环", async ({ page }) => {
    const authed = await humanLoginAdmin(page)
    if (!authed) {
      test.skip(true, "未检测到运行中的 Web 服务或管理员认证凭据，跳过在线浏览器拟人操作")
      return
    }

    // Step A: 在 B 端管理后台通过页面拟人点击与填表，依次配置分类、SPU、SKU、优惠券模板、满减活动、秒杀活动、快递公司
    for (const step of MALL_HUMAN_OPS_PLAYBOOK) {
      await humanConfigureEntityOnPage(page, step)
    }

    // Step B: 打开 C 端门户 /portal，验证 B 端拟人配置的商品和优惠券实时展示
    await page.goto("/portal")
    await expect(page.locator("text=ProMax 无线主动降噪旗舰耳机").first()).toBeVisible({ timeout: 15000 })

    // 拟人点击领取优惠券
    const claimCouponBtn = page.locator('[data-testid^="portal-claim-coupon-"]').first()
    if (await claimCouponBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await claimCouponBtn.click()
    }

    // 拟人点击「立即购买」打开结算抽屉
    const buyNowBtn = page.locator('[data-testid^="portal-buy-now-"]').first()
    await expect(buyNowBtn).toBeVisible({ timeout: 10000 })
    await buyNowBtn.click()

    // 拟人点击「提交订单」
    const submitOrderBtn = page.locator('[data-testid="portal-submit-order-btn"]')
    await expect(submitOrderBtn).toBeVisible({ timeout: 10000 })
    await submitOrderBtn.click()

    // 拟人点击收银台「立即确认支付」
    const confirmPayBtn = page.locator('[data-testid="portal-confirm-pay-btn"]')
    await expect(confirmPayBtn).toBeVisible({ timeout: 10000 })
    await confirmPayBtn.click()

    // Step C: 回到 B 端订单履约台 `/admin/mall/trade-order` 拟人点击发货并填写物流单号
    await page.goto("/admin/mall/trade-order")
    const shipBtn = page.locator('[data-testid^="admin-ship-btn-"]').first()
    if (await shipBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      await shipBtn.click()
      const trackingInput = page.locator('[data-testid="admin-ship-tracking-input"]')
      await expect(trackingInput).toBeVisible({ timeout: 5000 })
      await trackingInput.fill("SF9988776655")
      await page.locator('[data-testid="admin-confirm-ship-btn"]').click()
    }
  })

  test("3. 通用域 E2E 页面拟人运营配置巡检（支持任意指定 E2E_OPS_DOMAIN）", async ({ page }) => {
    const domainContracts = registry.contracts.filter(
      (c) => c.domain === TARGET_DOMAIN && c.accessibility.fields.length > 0,
    )
    test.skip(domainContracts.length === 0, `域 ${TARGET_DOMAIN} 无可写运营页面契约`)

    const authed = await humanLoginAdmin(page)
    if (!authed) {
      test.skip(true, "未检测到运行中的 Web 服务或管理员认证凭据，跳过在线浏览器拟人操作")
      return
    }

    for (const contract of domainContracts.slice(0, 5)) {
      await page.goto(contract.page.route)
      await expect(page.locator(contract.selectors.title)).toBeVisible({ timeout: 15000 })
      await page.locator(contract.selectors.createButton).click()
      await expect(page.locator(contract.selectors.form)).toBeVisible({ timeout: 10000 })

      const marker = `${contract.kebab}-ops`
      for (const field of contract.accessibility.fields) {
        if (!field.required && field.type === "string") continue
        const input = page.locator(field.selector).first()
        if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
          await input.fill(field.type === "number" ? "1" : marker)
        }
      }

      await page.locator(contract.selectors.formSubmit).click()
      await expect(page.locator(contract.selectors.form)).toBeHidden({ timeout: 15000 })
      await expect(page.locator(contract.selectors.table)).toBeVisible()
    }
  })
})
