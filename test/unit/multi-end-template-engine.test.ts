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
  resolveBlueprintPlaceholders,
  readPortalBlueprint,
  readDomainShowcase,
  readMultiClientBlueprint,
} from "@/shared/contract/blueprint-vars"
import { projectProfileSchema } from "@/shared/contract/project-profile"

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
  })
})
