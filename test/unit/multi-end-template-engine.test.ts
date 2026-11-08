import path from "node:path"
import fs from "node:fs"
import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"
import {
  evaluateExpression,
  evaluateBooleanExpression,
  extractExpressionDeps,
  interpolateTemplate,
  isSafePath,
} from "@/shared/frontend/lib/expression-engine"
import {
  pageSchemaSchema,
  validateExtraValues,
  FIELD_WIDGET_TYPES,
  type FieldDef,
} from "@/modules/online/backend/validators/page-schema.validators"
import { PageSchemaService } from "@/modules/online/backend/services/page-schema.service"
import { collectClientPackageLayoutErrors } from "@/shared/contract/client-package-layout"
import { getClientChannel } from "@/shared/contract/client-channels"
import {
  BLUEPRINT_DEFAULT_VARS,
  INDUSTRY_PRESETS,
  resolveBlueprintPlaceholders,
  readPortalBlueprint,
  readDomainShowcase,
  readMultiClientBlueprint,
} from "@/shared/contract/blueprint-vars"
import { projectProfileSchema, consumerPortalSchema } from "@/shared/contract/project-profile"
import { DEFAULT_APPEARANCE } from "@/domains/infra/backend/validators/appearance.validators"

const require = createRequire(import.meta.url)
const { parseArgv, resolveHatchPlan, shouldSkipRelPath } = require("../../scripts/lib/hatch-profile.cjs")
const {
  loadManifest,
  extractPlaceholdersFromText,
  renderTemplateText,
  compileBlueprintDomain,
} = require("../../scripts/blueprint-engine.cjs")

describe("multi-end-template-engine (PagePlug & Commercial Low-Code Benchmark)", () => {
  describe("1. Zero-Eval Reactive Expression Sandbox (expression-engine.ts)", () => {
    it("evaluates mustache comparative, logical, arithmetic and ternary expressions", () => {
      const ctx = {
        $form: { memberType: "ENTERPRISE", amount: 2500, tags: ["VIP", "KA"], name: "星云科技" },
        $user: { nickname: "张总监", deptId: 10 },
      }
      expect(
        evaluateBooleanExpression("{{ $form.memberType === 'ENTERPRISE' && $form.amount >= 1000 }}", ctx),
      ).toBe(true)
      expect(
        evaluateBooleanExpression("{{ $form.memberType === 'PERSONAL' || $form.amount < 500 }}", ctx),
      ).toBe(false)
      expect(
        evaluateExpression("{{ $form.amount >= 2000 ? '钻石级客户' : '普通客户' }}", ctx),
      ).toBe("钻石级客户")
      expect(evaluateBooleanExpression("{{ $form.tags.includes('VIP') }}", ctx)).toBe(true)
      expect(evaluateBooleanExpression("{{ $form.name.startsWith('星云') }}", ctx)).toBe(true)
      expect(
        interpolateTemplate("客户：{{ $form.name }}（负责人：{{ $user.nickname }}）", ctx),
      ).toBe("客户：星云科技（负责人：张总监）")
    })

    it("extracts reactive dependency paths for the dependency graph", () => {
      const deps = extractExpressionDeps(
        "{{ $form.memberType === 'ENTERPRISE' && $queries.stats.total > 0 }}",
      )
      expect(deps).toEqual(["$form.memberType", "$queries.stats.total"])
    })

    it("blocks prototype pollution and dangerous global identifiers without throwing", () => {
      const ctx = { $form: { a: 1 } }
      expect(isSafePath("__proto__.polluted")).toBe(false)
      expect(isSafePath("constructor.prototype")).toBe(false)
      expect(evaluateExpression("{{ $form.__proto__ }}", ctx, "BLOCKED")).toBe("BLOCKED")
      expect(evaluateExpression("{{ window.location }}", ctx, "BLOCKED")).toBe("BLOCKED")
      expect(evaluateExpression("{{ process.env }}", ctx, "BLOCKED")).toBe("BLOCKED")
      expect(evaluateExpression("{{ invalid syntax === }}", ctx, "FALLBACK")).toBe("FALLBACK")
    })
  })

  describe("2. PageBlockDSL v2 Schema & Formily-style Reactive Validation", () => {
    it("supports 22 commercial widget types and multi-end blocks (PC + Mobile/Mini-program)", () => {
      expect(FIELD_WIDGET_TYPES.length).toBeGreaterThanOrEqual(20)
      const parsed = pageSchemaSchema.parse({
        entity: "mall_trade_order",
        title: "全渠道订单工作台",
        layoutMode: "kanban",
        fields: [
          { code: "orderType", label: "订单类型", type: "select", options: [{ label: "企业集采", value: "B2B" }] },
          {
            code: "taxNumber",
            label: "纳税人识别号",
            type: "text",
            visibleOn: "{{ $form.orderType === 'B2B' }}",
            requiredOn: "{{ $form.orderType === 'B2B' }}",
          },
          { code: "items", label: "订单明细", type: "sub_table", subFields: [{ code: "sku", label: "SKU", type: "text" }] },
          { code: "score", label: "履约评分", type: "rate" },
        ],
        blocks: [
          {
            id: "top_kpi",
            type: "stat_metrics",
            title: "核心经营指标",
            metrics: [{ code: "gmv", label: "今日GMV", aggregate: "sum", field: "pay_price", tone: "indigo" }],
          },
          { id: "trend_chart", type: "chart", chartKind: "bar", dimensionField: "status", metricField: "pay_price" },
          { id: "mobile_banner", type: "banner", surface: "mobile", items: [{ title: "大促专场" }] },
        ],
      })
      expect(parsed.layoutMode).toBe("kanban")
      expect(parsed.blocks).toHaveLength(3)
      expect(parsed.fields[1].visibleOn).toBe("{{ $form.orderType === 'B2B' }}")
    })

    it("dynamically skips or enforces required validation based on visibleOn and requiredOn", () => {
      const fields: FieldDef[] = [
        { code: "orderType", label: "订单类型", type: "select", required: true, showInList: true, showInForm: true, sort: 1 },
        {
          code: "taxNo",
          label: "税号",
          type: "text",
          required: false,
          visibleOn: "{{ $form.orderType === 'B2B' }}",
          requiredOn: "{{ $form.orderType === 'B2B' }}",
          showInList: true,
          showInForm: true,
          sort: 2,
        },
      ]

      // 当 orderType 为 C2C 时，taxNo 隐藏，不填也应通过校验
      const c2cRes = validateExtraValues(fields, { orderType: "C2C" })
      expect(c2cRes.ok).toBe(true)

      // 当 orderType 为 B2B 时，taxNo 联动显示且触发 requiredOn，未填应被拒绝
      const b2bMissing = validateExtraValues(fields, { orderType: "B2B" })
      expect(b2bMissing.ok).toBe(false)

      // 填上 taxNo 后通过校验
      const b2bValid = validateExtraValues(fields, { orderType: "B2B", taxNo: "91310000XXXX" })
      expect(b2bValid.ok).toBe(true)
      if (b2bValid.ok) {
        expect(b2bValid.value.taxNo).toBe("91310000XXXX")
      }
    })

    it("persists blocks and layoutMode via PageSchemaService.update", async () => {
      const entity = `dsl_v2_${Date.now()}`
      await PageSchemaService.update(entity, {
        title: "多端同源测试页",
        layoutMode: "dashboard",
        fields: [{ code: "amount", label: "金额", type: "currency" }],
        blocks: [{ id: "b1", type: "stat_metrics", title: "指标" }],
      })
      const loaded = await PageSchemaService.get(entity)
      expect(loaded.title).toBe("多端同源测试页")
      expect(loaded.fields[0].type).toBe("currency")
    })
  })

  describe("3. Multi-End Client Modular Layout & ProjectReactor Domain Pruning", () => {
    it("enforces full app/shared/modules/<domain> layout on clients/expo with GA status", () => {
      const expoChannel = getClientChannel("expo")
      expect(expoChannel.status).toBe("ga")
      expect(expoChannel.requiredSourceDirs).toBeUndefined()
      expect(collectClientPackageLayoutErrors(process.cwd())).toEqual([])

      for (const domain of ["member", "mall"]) {
        for (const sub of ["api", "models", "pages", "components"]) {
          const dir = path.join(process.cwd(), "clients", "expo", "src", "modules", domain, sub)
          expect(fs.existsSync(dir), `${dir} should exist`).toBe(true)
        }
      }
    })

    it("prunes excluded client domain modules synchronously in hatch-profile and supports --clients", () => {
      const catalog = {
        layers: {
          platform: { domains: ["system", "infra"] },
          business: { domains: ["online", "ai", "aigw", "member", "mall", "crm"] },
        },
        domains: [
          { name: "system" },
          { name: "infra" },
          { name: "online" },
          { name: "ai" },
          { name: "aigw" },
          { name: "member" },
          { name: "mall" },
          { name: "crm" },
        ],
      }

      const parsed = parseArgv([
        "node",
        "clone",
        "./out",
        "--profile",
        "vertical",
        "--bundle",
        "member",
        "--clients",
        "admin-web,expo",
      ])
      expect(parsed.clients).toEqual(["admin-web", "expo"])

      const plan = resolveHatchPlan(catalog, {
        profile: "vertical",
        bundle: ["member"],
        clients: ["admin-web", "expo"],
      })
      expect(plan.includeClients).toBe(true)
      expect(plan.domains).toContain("member")
      expect(plan.excludedDomains).toContain("mall")

      // 选中的 member 客户端模块保留，未选中的 mall 客户端模块被同步裁剪
      expect(shouldSkipRelPath("clients/expo/src/modules/member/pages/MemberCenterPage.tsx", plan)).toBe(false)
      expect(shouldSkipRelPath("clients/expo/src/modules/mall/pages/MallHomePage.tsx", plan)).toBe(true)

      // 当指定 --clients admin-web (不含 expo) 时，跳过 clients/expo
      const adminOnlyPlan = resolveHatchPlan(catalog, {
        profile: "vertical",
        bundle: ["member"],
        clients: ["admin-web"],
      })
      expect(adminOnlyPlan.includeClients).toBe(false)
      expect(shouldSkipRelPath("clients/expo/package.json", adminOnlyPlan)).toBe(true)
    })
  })

  describe("4. Coolie Workshop & 27B Local Model Blueprint Variable Engine", () => {
    it("declares 8 variable domains in blueprint.template.json and binds all {{VAR}} tokens in .template files", () => {
      const manifest = loadManifest()
      const vars = manifest.variables || {}
      expect(Object.keys(vars).length).toBeGreaterThanOrEqual(60)
      expect(Object.keys(BLUEPRINT_DEFAULT_VARS).length).toBeGreaterThanOrEqual(60)

      for (const tpl of manifest.templateFiles) {
        const absTpl = path.join(process.cwd(), tpl.templatePath)
        expect(fs.existsSync(absTpl)).toBe(true)
        const raw = fs.readFileSync(absTpl, "utf8")
        const tokens = extractPlaceholdersFromText(raw)
        expect(tokens.length).toBeGreaterThan(5)
        for (const token of tokens) {
          expect(vars[token], `Variable {{${token}}} must be declared in blueprint.template.json`).toBeDefined()
        }
      }
    })

    it("resolves raw {{VAR}} template files via dual-mode resolver and passes projectProfileSchema validation", () => {
      const rawTpl = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), "packages/shared/contract/project-profile.template.json"),
          "utf8"
        )
      )
      expect(rawTpl.platformName).toBe("{{PLATFORM_TITLE}}")
      expect(rawTpl.branding.mark).toBe("{{BRAND_MARK}}")

      // 1. 默认回退解析（母版未渲染状态）
      const defaultResolved = resolveBlueprintPlaceholders(rawTpl)
      const parsedDefault = projectProfileSchema.parse(defaultResolved)
      expect(parsedDefault.platformName).toBe("CoolieBase All")
      expect(parsedDefault.branding.mark).toBe("C")

      // 2. 27B 本地模型注入新业务变量字典
      const petClinicVars = {
        PLATFORM_TITLE: "宠爱有家智慧动物医院",
        SHORT_NAME: "宠爱医疗",
        BRAND_MARK: "宠",
        BRAND_PRIMARY_COLOR: "#0d9488",
        INDUSTRY_PRESET: "smart-healthcare",
        PORTAL_TITLE: "宠爱线上预约门户",
        PORTAL_CART_LABEL: "预约单",
        PORTAL_PRIMARY_CTA: "立即预约",
        IOS_BUNDLE_ID: "com.petcare.clinic",
      }
      const customResolved = resolveBlueprintPlaceholders(rawTpl, petClinicVars)
      const parsedCustom = projectProfileSchema.parse(customResolved)
      expect(parsedCustom.platformName).toBe("宠爱有家智慧动物医院")
      expect(parsedCustom.shortName).toBe("宠爱医疗")

      const portal = readPortalBlueprint(parsedCustom)
      expect(portal.title).toBe("宠爱线上预约门户")
      expect(portal.cartLabel).toBe("预约单")
      expect(portal.primaryCta).toBe("立即预约")

      const domains = readDomainShowcase(parsedCustom)
      const mallDomain = domains.find((d) => d.id === "mall")
      expect(mallDomain?.name).toContain("医疗服务商城")

      const mobile = readMultiClientBlueprint(parsedCustom)
      expect(mobile.iosBundleId).toBe("com.petcare.clinic")

      // 3. 外部引擎纯文本 {{VAR}} 替换测试
      const envTpl = fs.readFileSync(path.join(process.cwd(), ".env.template"), "utf8")
      const renderedEnv = renderTemplateText(envTpl, { ...BLUEPRINT_DEFAULT_VARS, ...petClinicVars, ADMIN_PORT: 3320 })
      expect(renderedEnv).toContain("PORT=3320")
      expect(renderedEnv).toContain('NEXT_PUBLIC_APP_TITLE="宠爱有家智慧动物医院"')
    })

    it("compiles a shorthand 27B/junior-dev domain blueprint into full CodegenConfig[] + PageBlockDSL v2 + stateMachine", () => {
      const compiled = compileBlueprintDomain({
        domain: "pet",
        title: "宠物诊疗管理",
        entities: [
          {
            table: "pet_appointment",
            className: "PetAppointment",
            title: "宠物挂号预约单",
            layoutMode: "kanban",
            fields: [
              { name: "pet_name", label: "宠物昵称", widget: "text", required: true, query: "LIKE" },
              { name: "service_type", label: "就诊类型", widget: "radio", options: ["常规体检", "急诊手术"], required: true },
              {
                name: "anesthesia_consent_no",
                label: "麻醉知情书编号",
                widget: "text",
                visibleOn: "{{ $form.service_type === '急诊手术' }}",
                requiredOn: "{{ $form.service_type === '急诊手术' }}",
              },
              { name: "fee_cents", label: "预计诊疗费(分)", widget: "currency", required: true },
            ],
            blocks: [
              { id: "pet_kpi", type: "stat_metrics", title: "今日门诊核心指标", surface: "both" },
            ],
            stateMachine: {
              initial: "PENDING",
              transitions: [
                { name: "confirm", from: ["PENDING"], to: "CONFIRMED" },
                { name: "complete", from: ["CONFIRMED"], to: "COMPLETED" },
              ],
            },
          },
        ],
      })

      expect(compiled.domain).toBe("pet")
      expect(compiled.exportName).toBe("PET_TABLES")
      expect(compiled.codegenTables).toHaveLength(1)

      const colNames = compiled.codegenTables[0].table.columns.map((c: { name: string }) => c.name)
      // 自动补齐主键 id 与 6 大多租户审计列
      expect(colNames).toEqual([
        "id",
        "pet_name",
        "service_type",
        "anesthesia_consent_no",
        "fee_cents",
        "tenant_id",
        "created_by",
        "created_at",
        "updated_by",
        "updated_at",
        "deleted_at",
      ])

      // 编译产出的 PageBlockDSL v2 直接通过 pageSchemaSchema 严格校验
      const parsedPageSchema = pageSchemaSchema.parse(compiled.pageSchemas.pet_appointment)
      expect(parsedPageSchema.layoutMode).toBe("kanban")
      expect(parsedPageSchema.fields[2].visibleOn).toBe("{{ $form.service_type === '急诊手术' }}")
      expect(compiled.stateMachines.pet_appointment.initial).toBe("PENDING")
    })

    it("prevents white-label brand leakage across all 5 industry presets, consumerPortalSchema, and siteAppearance (COO-226 T6)", () => {
      // 1. 5 套行业预设必须各自拥有独立的 catalogItems，不得共用同一套企业 SaaS 商品
      const firstIds = new Set<string>()
      for (const [presetKey, preset] of Object.entries(INDUSTRY_PRESETS)) {
        expect(preset.portal.catalogItems.length).toBeGreaterThanOrEqual(4)
        firstIds.add(preset.portal.catalogItems[0].id)
        for (const item of preset.portal.catalogItems) {
          expect(item.author, `${presetKey} item ${item.id} author must not hardcode CoolieBase`).not.toContain("CoolieBase")
        }
      }
      expect(firstIds.size).toBe(5)

      // 2. consumerPortalSchema 必须保留自定义 categories 与 catalogItems（不得被 Zod strip 剥掉）
      const customPortal = consumerPortalSchema.parse({
        title: "宠爱线上预约门户",
        categories: [{ key: "all", label: "全部诊疗" }],
        catalogItems: [
          {
            id: "pet-01",
            title: "幼宠全项体检套餐",
            author: "宠爱医疗预防中心",
            category: "commerce",
            categoryLabel: "全身体检",
            priceCents: 26800,
            rating: 4.9,
            ratingCount: 520,
            tags: ["血常规", "传染病筛查"],
            intro: "面向幼犬幼猫的全面健康体检。",
            accentColor: "#0d9488",
            trialChapter: {
              title: "体检流程",
              paragraphs: ["1. 基础理学检查", "2. 血液生化检验"],
            },
          },
        ],
      })
      expect(customPortal.categories).toHaveLength(1)
      expect(customPortal.catalogItems).toHaveLength(1)
      expect(customPortal.catalogItems?.[0].title).toBe("幼宠全项体检套餐")

      // 3. readPortalBlueprint 在传入 shortName 时自动替换 catalogItems.author 中的 {{SHORT_NAME}}
      const healthcarePortal = readPortalBlueprint({
        industryPreset: "smart-healthcare",
        shortName: "宠爱医疗",
      })
      expect(healthcarePortal.catalogItems[0].id).toBe("med-01")
      expect(healthcarePortal.catalogItems[0].author).toContain("宠爱医疗")
      expect(healthcarePortal.catalogItems[0].author).not.toContain("CoolieBase")

      // 4. DEFAULT_APPEARANCE.siteName 不得硬编码为 "CoolieBase Next 商城"
      expect(DEFAULT_APPEARANCE.siteName).not.toBe("CoolieBase Next 商城")
    })
  })

  describe("5. Zero-Seed B-End Operational Configuration -> C-End Mall Closed-Loop Engine", () => {
    it("verifies e2e:ops:check anti-seed gate and executes B-end operational configuration -> C-end storefront -> claim coupon -> cart -> settlement -> order -> pay -> B-end ship -> C-end receive -> after-sale refund closed loop", async () => {
      const { runStaticVerification } = require("../../scripts/agent/run-e2e-ops.cjs")
      const opsCheck = runStaticVerification("mall")
      expect(opsCheck.ok, opsCheck.errors.join("; ")).toBe(true)

      const { MallSolutionService } = await import("@/modules/mall/backend/services/mall-solution.service")
      const { ProductCategoryService } = await import("@/modules/mall/backend/services/product-category.service")
      const { ProductSpuService } = await import("@/modules/mall/backend/services/product-spu.service")
      const { ProductSkuService } = await import("@/modules/mall/backend/services/product-sku.service")
      const { CouponTemplateService } = await import("@/modules/mall/backend/services/coupon-template.service")
      const { RewardActivityService } = await import("@/modules/mall/backend/services/reward-activity.service")
      const { SeckillActivityService } = await import("@/modules/mall/backend/services/seckill-activity.service")
      const { SeckillProductService } = await import("@/modules/mall/backend/services/seckill-product.service")
      const { DeliveryExpressService } = await import("@/modules/mall/backend/services/delivery-express.service")

      // 断言反 Seed 铁律：MallSolutionService 上严禁存在 ensureMallSeedData
      expect("ensureMallSeedData" in MallSolutionService).toBe(false)

      const userId = `e2e-buyer-${Date.now()}`
      const now = new Date()
      const nextMonth = new Date(now.getTime() + 30 * 24 * 3600 * 1000)

      // 0. 运营配置前：后台绝不静默塞入任何假种子数据
      const emptyHome = await MallSolutionService.getStorefrontHome({ userId }, userId, "default")
      const beforeSpuCount = emptyHome.products.length

      // 1. 模拟 B 端运营人员在后台页面拟人新建配置：商品分类 -> SPU -> 多规格 SKU -> 优惠券模板 -> 满减活动 -> 秒杀活动 -> 物流公司
      const createdCat = await ProductCategoryService.create(
        {
          parent_id: "0",
          name: "严选智能硬件与效率装备",
          sort: 1,
          status: 0,
        },
        "admin",
        "default",
      )

      const createdSpu = await ProductSpuService.create(
        {
          name: "ProMax 无线主动降噪旗舰耳机",
          keyword: "48dB深度降噪 · 空间音频",
          introduction: "由 B 端后台运营页面拟人配置上架的旗舰商品",
          description: "<p>由 B 端后台运营页面拟人配置上架的旗舰商品</p>",
          category_id: String(createdCat.id),
          sort: 1,
          status: 0,
          spec_type: true,
          price: 399,
          market_price: 599,
          cost_price: 220,
          stock: 100,
          sales_count: 10,
        },
        "admin",
        "default",
      )

      const createdSku = await ProductSkuService.create(
        {
          spu_id: String(createdSpu.id),
          properties: "颜色款式:曜石黑旗舰版",
          property_id: "1",
          property_name: "颜色款式",
          value_id: "1",
          value_name: "曜石黑旗舰版",
          price: 399,
          market_price: 599,
          cost_price: 220,
          bar_code: `SKU-${createdSpu.id}-01`,
          stock: 80,
          weight: 0.5,
        },
        "admin",
        "default",
      )

      const createdTpl = await CouponTemplateService.create(
        {
          name: "拟人运营配置满100减20神券",
          description: "全场满100元立减20元",
          status: 0,
          total_count: 200,
          take_limit_count: 3,
          take_type: 1,
          use_price: 100,
          product_scope: 1,
          validity_type: 1,
          valid_start_time: now.toISOString(),
          valid_end_time: nextMonth.toISOString(),
          discount_type: 1,
          discount_price: 20,
          take_count: 0,
          use_count: 0,
        },
        "admin",
        "default",
      )

      await RewardActivityService.create(
        {
          name: "全场满199立减25元包邮",
          status: 0,
          start_time: now.toISOString(),
          end_time: nextMonth.toISOString(),
          condition_type: 10,
          product_scope: 1,
          limit: 199,
          discount_price: 25,
          free_delivery: true,
          point: 50,
        },
        "admin",
        "default",
      )

      const createdSeckillAct = await SeckillActivityService.create(
        {
          spu_id: String(createdSpu.id),
          name: "限时秒杀 · 旗舰降噪耳机直降",
          status: 0,
          start_time: now.toISOString(),
          end_time: nextMonth.toISOString(),
          sort: 1,
          total_limit_count: 50,
          single_limit_count: 3,
          stock: 30,
          total_stock: 50,
        },
        "admin",
        "default",
      )

      await SeckillProductService.create(
        {
          activity_id: String(createdSeckillAct.id),
          spu_id: String(createdSpu.id),
          sku_id: String(createdSku.id),
          seckill_price: 329,
          stock: 30,
          activity_status: 0,
          activity_start_time: now.toISOString(),
          activity_end_time: nextMonth.toISOString(),
        },
        "admin",
        "default",
      )

      await DeliveryExpressService.create(
        {
          code: "SF",
          name: "顺丰速运",
          sort: 1,
          status: 0,
        },
        "admin",
        "default",
      )

      // 1.5 验证 B 端运营配置实时同步至 C 端商城门户聚合接口
      const home = await MallSolutionService.getStorefrontHome({ userId }, userId, "default")
      expect(home.products.length).toBeGreaterThan(beforeSpuCount)
      const targetProduct = home.products.find((p) => String(p.id) === String(createdSpu.id)) ?? home.products[0]
      const targetSku = targetProduct.skus?.find((s) => String(s.id) === String(createdSku.id)) ?? targetProduct.skus?.[0]
      expect(targetSku).toBeDefined()
      const initialSkuStock = Number(targetSku!.stock ?? 0)
      expect(initialSkuStock).toBe(80)

      // 2. 领取满减优惠券落库
      const targetTpl = home.couponTemplates.find((t) => String(t.id) === String(createdTpl.id)) ?? home.couponTemplates[0]
      const claimedCoupon = await MallSolutionService.takeCoupon(
        { templateId: targetTpl.id, userId },
        userId,
        "default",
      )
      expect(claimedCoupon.status).toBe(1)
      expect(String(claimedCoupon.template_id)).toBe(String(targetTpl.id))

      // 3. 加入购物车落库
      const cartRow = await MallSolutionService.saveCartItem(
        {
          userId,
          spuId: targetProduct.id,
          skuId: targetSku!.id,
          count: 2,
        },
        userId,
        "default",
      )
      expect(cartRow).toHaveProperty("id")

      // 4. 结算算价引擎：自动计算原价、秒杀立减、满减优惠与优惠券抵扣
      const settlement = await MallSolutionService.calculateSettlement(
        {
          userId,
          items: [
            {
              spuId: targetProduct.id,
              skuId: targetSku!.id,
              count: 2,
              cartId: (cartRow as { id: number }).id,
            },
          ],
          couponId: claimedCoupon.id,
          deliveryType: 1,
        },
        userId,
        "default",
      )
      expect(settlement.price.totalPrice).toBeGreaterThan(0)
      expect(settlement.price.couponDiscount).toBeGreaterThan(0)
      expect(settlement.price.payPrice).toBeLessThan(settlement.price.totalPrice)
      expect(settlement.selectedCouponId).toBe(String(claimedCoupon.id))

      // 5. 提交订单：原子扣减 SKU 库存 + 核销优惠券 + 清理已购购物车
      const created = await MallSolutionService.createCheckoutOrder(
        {
          userId,
          items: [
            {
              spuId: targetProduct.id,
              skuId: targetSku!.id,
              count: 2,
              cartId: (cartRow as { id: number }).id,
            },
          ],
          couponId: claimedCoupon.id,
          deliveryType: 1,
          receiverName: "李测试",
          receiverMobile: "13900001111",
          receiverDetailAddress: "北京市海淀区中关村软件园",
        },
        userId,
        "default",
      )
      expect(created.order.status).toBe(0) // UNPAID
      expect(created.items).toHaveLength(1)

      const skuAfterOrder = await ProductSkuService.get(targetSku!.id, userId, "default")
      expect(Number(skuAfterOrder?.stock)).toBe(initialSkuStock - 2)

      // 6. 收银台支付确认 -> 状态流转为 PAID (10)
      const paidOrder = await MallSolutionService.payCheckoutOrder(
        {
          orderId: created.order.id,
          payOrderId: created.payOrderId,
          channelCode: "wx_pub",
          userId,
        },
        userId,
        "default",
      )
      expect(paidOrder.status).toBe(10)
      expect(paidOrder.pay_status).toBe(true)

      // 7. B 端商家发货 -> 状态流转为 SHIPPED (20)
      const shippedOrder = await MallSolutionService.shipTradeOrder(
        {
          orderId: created.order.id,
          logisticsId: 1,
          logisticsNo: "SF1029384756",
        },
        "admin",
        "default",
      )
      expect(shippedOrder.status).toBe(20)
      expect(shippedOrder.logistics_no).toBe("SF1029384756")

      // 8. C 端买家确认收货 -> 状态流转为 COMPLETED (30)
      const receivedOrder = await MallSolutionService.receiveTradeOrder(
        { orderId: created.order.id, userId },
        userId,
        "default",
      )
      expect(receivedOrder.status).toBe(30)

      // 9. C 端发起售后退款申请 + B 端审核通过退款 -> 库存自动回滚
      const afterSale = await MallSolutionService.applyAfterSale(
        {
          orderId: created.order.id,
          userId,
          applyReason: "7天无理由退货",
        },
        userId,
        "default",
      )
      expect(afterSale.status).toBe(10)

      const refundedOrder = await MallSolutionService.approveAfterSaleRefund(
        {
          orderId: created.order.id,
          auditReason: "审核通过并原路退款",
        },
        "admin",
        "default",
      )
      expect(refundedOrder.status).toBe(40)
      expect(refundedOrder.refund_status).toBe(20)

      const skuAfterRefund = await ProductSkuService.get(targetSku!.id, userId, "default")
      expect(Number(skuAfterRefund?.stock)).toBe(initialSkuStock)
    })
  })
})
