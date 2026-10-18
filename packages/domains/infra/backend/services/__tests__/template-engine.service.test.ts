import { afterEach, describe, expect, it, vi } from "vitest"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"
import { InfraTemplateEngineService } from "../template-engine.service"

const { settingStore } = vi.hoisted(() => ({
  settingStore: new Map<string, { key: string; value: { items: unknown[] } }>(),
}))

vi.mock("@/modules/shared/backend/prisma", () => ({
  cooliebasePrisma: {
    setting: {
      findUnique: async ({ where }: { where: { key: string } }) => settingStore.get(where.key) ?? null,
      findMany: async () => [...settingStore.values()],
      upsert: async ({ where, create, update }: { where: { key: string }; create: { key: string; value: { items: unknown[] } }; update: { value: { items: unknown[] } } }) => {
        const next = { key: where.key, value: update?.value ?? create.value }
        settingStore.set(where.key, next)
        return next
      },
      deleteMany: async ({ where }: { where: { key: string } }) => {
        const existed = settingStore.delete(where.key)
        return { count: existed ? 1 : 0 }
      },
    },
  },
}))

describe("InfraTemplateEngineService", () => {
  afterEach(async () => {
    await cooliebasePrisma.setting.deleteMany({ where: { key: "infra.template-engine.templates" } })
  })

  it("persists template records and renders previews", async () => {
    const saved = await InfraTemplateEngineService.save("op-1", {
      code: "crud-system-user",
      name: "系统用户 CRUD 模板",
      category: "CRUD",
      templateType: "BACKEND",
      engine: "mustache",
      content: "{{entityName}}::{{tableName}}::{{moduleName}}",
      status: "ACTIVE",
      description: "系统用户代码模板",
      options: { routePrefix: "/admin/system/users" },
    })

    const listed = await InfraTemplateEngineService.list({ page: 1, pageSize: 20, keyword: "系统用户" })
    const preview = await InfraTemplateEngineService.preview({
      templateCode: "crud-system-user",
      variables: {
        entityName: "SysUser",
        tableName: "sys_user",
        moduleName: "system",
      },
    })

    expect(saved.code).toBe("crud-system-user")
    expect(listed.items[0]?.code).toBe("crud-system-user")
    expect(preview.renderedContent).toBe("SysUser::sys_user::system")
  })

  it("默认暴露 Next/React 模板预置包并带有文件路径元数据", async () => {
    const listed = await InfraTemplateEngineService.list({ page: 1, pageSize: 20 })

    expect(listed.items.some((item) => item.code === "next-react-admin-page")).toBe(true)
    expect(listed.items.find((item) => item.code === "next-react-admin-page")?.options).toMatchObject({
      stack: "next-react",
      layer: "page",
      filePath: "src/app/(admin-pages)/admin/{{modulePath}}/page.tsx",
    })
  })

  it("可按模板编码读取最新模板定义", async () => {
    await InfraTemplateEngineService.save("op-1", {
      code: "crud-system-menu",
      name: "系统菜单 CRUD 模板",
      category: "CRUD",
      templateType: "FRONTEND",
      engine: "handlebars",
      content: "menu",
      status: "ACTIVE",
    })

    const template = await InfraTemplateEngineService.getByCode("crud-system-menu")
    expect(template?.name).toBe("系统菜单 CRUD 模板")
  })

  it("可以导出 Next/React 多文件模板包", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-route",
        "next-react-admin-service",
        "next-react-admin-validator",
        "next-react-admin-page",
        "next-react-admin-client",
        "next-react-admin-types",
      ],
      variables: {
        modulePath: "infra/codegen",
        serviceName: "InfraCodegenService",
        serviceFile: "codegen.service.ts",
        validatorName: "infraCodegenQuerySchema",
        validatorFile: "infra.validator.ts",
        entityName: "CodegenTemplate",
        permissionView: "INFRA_CODEGEN_VIEW",
        permissionUpdate: "INFRA_CODEGEN_UPDATE",
      },
    })

    expect(scaffold.files).toHaveLength(6)
    expect(scaffold.files.some((file) => file.path.includes("src/app/api/v1/admin/infra/codegen/route.ts"))).toBe(true)
    expect(scaffold.files.some((file) => file.content.includes("InfraCodegenService"))).toBe(true)
  })

  it("导出的 Next/React 模板内容可直接用于落地生成", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-route",
        "next-react-admin-service",
        "next-react-admin-validator",
        "next-react-admin-page",
        "next-react-admin-client",
        "next-react-admin-types",
      ],
      variables: {
        modulePath: "infra/codegen",
        serviceName: "InfraCodegenService",
        serviceFile: "codegen.service.ts",
        validatorName: "infraCodegenQuerySchema",
        validatorFile: "infra.validator.ts",
        entityName: "CodegenTemplate",
        permissionView: "INFRA_CODEGEN_VIEW",
        permissionUpdate: "INFRA_CODEGEN_UPDATE",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["src/app/api/v1/admin/infra/codegen/route.ts"]).toContain(
      'from "@/modules/infra/backend/services/codegen.service.ts"',
    )
    expect(byPath["src/app/api/v1/admin/infra/codegen/route.ts"]).toContain("InfraCodegenService")
    expect(byPath["src/app/api/v1/admin/infra/codegen/route.ts"]).toContain("parseActionQuery")
    expect(byPath["packages/domains/infra/backend/services/codegen.service.ts"]).toContain(
      "InfraCodegenService",
    )
    expect(byPath["packages/domains/infra/backend/services/codegen.service.ts"]).toContain(
      "createDomainFacade",
    )
    expect(byPath["packages/domains/infra/backend/validators/infra.validator.ts"]).toContain(
      "infraCodegenQuerySchema",
    )
    expect(byPath["src/app/(admin-pages)/admin/infra/codegen/page.tsx"]).toContain(
      "CodegenTemplate 管理",
    )
    expect(byPath["packages/domains/infra/frontend/api/CodegenTemplate.api.ts"]).toContain("request.get")
    expect(byPath["packages/domains/infra/backend/types/CodegenTemplate.types.ts"]).toContain("CodegenTemplateItem")
  })

  it("新增 TREE/WORKFLOW 与商户端/C端模板族可正常导出", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-tree-route",
        "next-react-admin-tree-page",
        "next-react-admin-tree-service",
        "next-react-admin-tree-validator",
        "next-react-admin-tree-client",
        "next-react-admin-tree-types",
        "next-react-admin-workflow-service",
        "next-react-admin-workflow-validator",
        "next-react-admin-workflow-page",
        "next-react-admin-workflow-route",
        "next-react-admin-workflow-client",
        "next-react-admin-workflow-types",
        "next-react-merchant-page",
        "next-react-merchant-client",
        "next-react-c-end-page",
        "next-react-c-end-client",
      ],
      variables: {
        modulePath: "infra/template-center",
        serviceName: "TemplateCenterService",
        serviceFile: "template-center.service.ts",
        entityName: "TemplateCenter",
        permissionView: "INFRA_TEMPLATE_VIEW",
        permissionUpdate: "INFRA_TEMPLATE_UPDATE",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["src/app/api/v1/admin/infra/template-center/tree/route.ts"]).toContain("export const PATCH")
    expect(byPath["src/app/(admin-pages)/admin/infra/template-center/tree/page.tsx"]).toContain("树管理")
    expect(byPath["packages/domains/infra/backend/services/tree.service.ts"]).toContain(
      "moveNode",
    )
    expect(byPath["packages/domains/infra/backend/validators/tree.validator.ts"]).toContain(
      "TreeInputSchema",
    )
    expect(byPath["packages/domains/infra/frontend/api/template-center-tree.api.ts"]).toContain("/tree")
    expect(byPath["packages/domains/infra/backend/types/template-center-tree.types.ts"]).toContain("TreeNode")

    expect(byPath["packages/domains/infra/backend/services/workflow.service.ts"]).toContain("audit")
    expect(byPath["packages/domains/infra/backend/validators/workflow.validator.ts"]).toContain(
      "createTemplateCenterWorkflowSchema",
    )
    expect(byPath["src/app/(admin-pages)/admin/infra/template-center/workflow/page.tsx"]).toContain("流程审批")
    expect(byPath["src/app/api/v1/admin/infra/template-center/workflow/route.ts"]).toContain("export const PATCH")
    expect(byPath["packages/domains/infra/frontend/api/template-center-workflow.api.ts"]).toContain("/workflow")
    expect(byPath["packages/domains/infra/backend/types/template-center-workflow.types.ts"]).toContain("WorkflowItem")

    expect(byPath["src/app/(admin)/merchant/infra/template-center/page.tsx"]).toContain("商户工作台")
    expect(byPath["packages/domains/infra/frontend/api/TemplateCenter-merchant.api.ts"]).toContain("/api/v1/merchant/")
    expect(byPath["src/app/(public)/infra/template-center/page.tsx"]).toContain("PageContainer")
    expect(byPath["packages/domains/infra/frontend/api/TemplateCenter-app.api.ts"]).toContain("/api/v1/app/")
  })

  it("新增 DOMAIN P0 模板族可正常导出", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-domain-page",
        "next-react-admin-domain-client",
        "next-react-admin-domain-types-index",
        "next-react-admin-route-index",
      ],
      variables: {
        modulePath: "system/user",
        entityName: "SystemUser",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["src/app/(admin-pages)/admin/system/user/domain/page.tsx"]).toContain(
      "SystemUser 域导航",
    )
    expect(byPath["packages/domains/system/frontend/api/SystemUser-domain.api.ts"]).toContain(
      'DOMAIN_BASE + "/domain/summary"',
    )
    expect(byPath["packages/domains/system/backend/types/SystemUser-domain.types.ts"]).toContain("SystemUserDomainStats")
    expect(byPath["src/app/api/v1/admin/system/user/index.ts"]).toContain(
      "SystemUserAdminRouteMap",
    )
  })

  it("新增 P1 表单/抽屉/筛选条/列配置模板可正常导出", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-form-component",
        "next-react-admin-detail-drawer",
        "next-react-admin-filter-bar",
        "next-react-admin-table-columns",
      ],
      variables: {
        modulePath: "system/user",
        entityName: "SystemUser",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["packages/domains/system/frontend/components/SystemUser-form.tsx"]).toContain(
      "useForm",
    )
    expect(byPath["packages/domains/system/frontend/components/SystemUser-form.tsx"]).toContain(
      "SystemUserForm",
    )
    expect(byPath["src/frontend/components/admin/system/user/SystemUser-detail-drawer.tsx"]).toContain(
      "SheetContent",
    )
    expect(byPath["src/frontend/components/admin/system/user/SystemUser-detail-drawer.tsx"]).toContain(
      "SystemUserDetailDrawer",
    )
    expect(byPath["src/frontend/components/admin/system/user/SystemUser-filter-bar.tsx"]).toContain(
      "SystemUserFilterBar",
    )
    expect(byPath["src/frontend/components/admin/system/user/SystemUser-filter-bar.tsx"]).toContain(
      "onSearch",
    )
    expect(byPath["src/frontend/components/admin/system/user/SystemUser-table-columns.tsx"]).toContain(
      "buildSystemUserColumns",
    )
    expect(byPath["src/frontend/components/admin/system/user/SystemUser-table-columns.tsx"]).toContain(
      "ColumnDef",
    )
  })

  it("新增 P2 store/hook/permission/locale 模板可正常导出", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-store-slice",
        "next-react-admin-hook",
        "next-react-admin-permission-const",
        "next-react-admin-locale",
      ],
      variables: {
        modulePath: "system/user",
        entityName: "SystemUser",
        permissionView: "SYSTEM_USER_VIEW",
        permissionUpdate: "SYSTEM_USER_UPDATE",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["src/frontend/stores/system/user-store.ts"]).toContain("zustand")
    expect(byPath["src/frontend/stores/system/user-store.ts"]).toContain("useSystemUserUiStore")

    expect(byPath["src/frontend/hooks/use-system/user.ts"]).toContain("useSystemUserList")
    expect(byPath["src/frontend/hooks/use-system/user.ts"]).toContain("@tanstack/react-query")

    expect(byPath["src/shared/constants/system/user-permissions.ts"]).toContain(
      "SYSTEM_USER_VIEW",
    )
    expect(byPath["src/shared/constants/system/user-permissions.ts"]).toContain(
      "SystemUserPermissions",
    )

    expect(byPath["src/shared/locales/system/user.zh-CN.ts"]).toContain("SystemUserLocaleZhCN")
    expect(byPath["src/shared/locales/system/user.zh-CN.ts"]).toContain("保存成功")
  })

  it("新增 P3 系统页与路由/组件基座模板可正常导出", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-login-page",
        "next-react-admin-home-page",
        "next-react-admin-profile-page",
        "next-react-admin-error-page",
        "next-react-admin-iframe-page",
        "next-react-admin-redirect-page",
        "next-react-admin-router-access",
        "next-react-admin-toolbar-component",
      ],
      variables: {
        modulePath: "system/user",
        entityName: "SystemUser",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["src/app/(admin-pages)/admin/login/page.tsx"]).toContain("管理后台登录")
    expect(byPath["src/app/(admin-pages)/admin/home/page.tsx"]).toContain("运营总览")
    expect(byPath["src/app/(admin-pages)/admin/profile/page.tsx"]).toContain("个人中心")
    expect(byPath["src/app/(admin-pages)/admin/error/page.tsx"]).toContain("页面加载失败")
    expect(byPath["src/app/(admin-pages)/admin/iframe/page.tsx"]).toContain("admin-iframe")
    expect(byPath["src/app/(admin-pages)/admin/redirect/page.tsx"]).toContain("router.replace")

    expect(byPath["src/frontend/config/admin-route-access.ts"]).toContain("ADMIN_STATIC_ROUTES")
    expect(byPath["src/frontend/config/admin-route-access.ts"]).toContain("buildAdminModuleRoute")

    expect(byPath["src/frontend/components/admin/system/user/SystemUser-toolbar.tsx"]).toContain(
      "SystemUserToolbar",
    )
    expect(byPath["src/frontend/components/admin/system/user/SystemUser-toolbar.tsx"]).toContain(
      "新建SystemUser",
    )
  })

  it("新增 P4 report/wms/mes/im 与 layout/plugins/config/styles 模板可正常导出", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-report-page",
        "next-react-admin-wms-page",
        "next-react-admin-mes-page",
        "next-react-admin-im-page",
        "next-react-admin-layout-shell",
        "next-react-admin-plugin-registry",
        "next-react-admin-app-config",
        "next-react-admin-theme-styles",
      ],
      variables: {
        modulePath: "system/user",
        entityName: "SystemUser",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["src/app/(admin-pages)/admin/report/page.tsx"]).toContain("经营报表中心")
    expect(byPath["src/app/(admin-pages)/admin/wms/page.tsx"]).toContain("仓配中心")
    expect(byPath["src/app/(admin-pages)/admin/mes/page.tsx"]).toContain("生产执行中心")
    expect(byPath["src/app/(admin-pages)/admin/im/page.tsx"]).toContain("消息协同中心")

    expect(byPath["src/frontend/components/layout/admin-layout-shell.tsx"]).toContain(
      "AdminLayoutShell",
    )
    expect(byPath["src/frontend/plugins/admin-plugins.ts"]).toContain("ADMIN_PLUGINS")
    expect(byPath["src/frontend/config/admin-app-config.ts"]).toContain("adminAppConfig")
    expect(byPath["src/frontend/styles/admin-theme.css"]).toContain("--admin-primary")
  })

  it("新增 P5 utils/assets 与 domain-level api/views 扩展模板可正常导出", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-utils-format",
        "next-react-admin-assets-manifest",
        "next-react-admin-domain-list-page",
        "next-react-admin-domain-detail-page",
        "next-react-admin-domain-api-index",
        "next-react-admin-domain-view-index",
      ],
      variables: {
        modulePath: "system/user",
        entityName: "SystemUser",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["packages/domains/system/frontend/utils/user-format.ts"]).toContain("formatSystemUserStatus")
    expect(byPath["packages/domains/system/frontend/assets/user-assets.ts"]).toContain("SystemUserAssets")

    expect(byPath["src/app/(admin-pages)/admin/system/user/domain/list/page.tsx"]).toContain(
      "SystemUser 域模块列表",
    )
    expect(byPath["src/app/(admin-pages)/admin/system/user/domain/detail/page.tsx"]).toContain(
      "SystemUser 域详情",
    )

    expect(byPath["src/app/api/v1/admin/system/user/domain/index.ts"]).toContain(
      "SystemUserDomainApiMap",
    )
    expect(byPath["packages/domains/system/frontend/config/user-domain-view.ts"]).toContain(
      "SystemUserDomainViewMap",
    )
  })

  it("新增 Service 设计模式模板可正常导出", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: [
        "next-react-admin-service-facade",
        "next-react-admin-service-strategy",
        "next-react-admin-service-guard",
        "next-react-admin-service-test",
      ],
      variables: {
        modulePath: "system/user",
        entityName: "SystemUser",
        serviceName: "SystemUserService",
        permissionUpdate: "SYSTEM_USER_UPDATE",
      },
    })

    const byPath = Object.fromEntries(scaffold.files.map((file) => [file.path, file.content]))

    expect(byPath["packages/domains/system/backend/services/SystemUser.facade.ts"]).toContain(
      "class SystemUserServiceFacade",
    )
    expect(byPath["packages/domains/system/backend/services/SystemUser.facade.ts"]).toContain(
      "SYSTEM_USER_UPDATE",
    )
    expect(byPath["packages/domains/system/backend/services/SystemUser.facade.ts"]).toContain(
      "createDomainFacade",
    )

    expect(byPath["packages/domains/system/backend/services/strategies/SystemUser.strategy.ts"]).toContain(
      "SystemUserStrategyResolver",
    )
    expect(byPath["packages/domains/system/backend/services/strategies/SystemUser.strategy.ts"]).toContain(
      "FAST_PATH",
    )

    expect(byPath["packages/domains/system/backend/services/guards/SystemUser-state.guard.ts"]).toContain(
      "SystemUserStateGuard",
    )
    expect(byPath["packages/domains/system/backend/services/guards/SystemUser-state.guard.ts"]).toContain(
      "assertTransition",
    )

    expect(byPath["packages/domains/system/backend/services/__tests__/SystemUser.facade.test.ts"]).toContain(
      "SystemUserServiceFacade",
    )
    expect(byPath["packages/domains/system/backend/services/__tests__/SystemUser.facade.test.ts"]).toContain(
      "权限不足时拒绝执行",
    )
  })

  it("Service 设计模式组合包可一键展开为 Facade/Strategy/Guard/Test/Rpc", async () => {
    const scaffold = await InfraTemplateEngineService.generate({
      stack: "next-react",
      includeDisabled: false,
      templateCodes: ["next-react-admin-service-pattern-pack"],
      variables: {
        modulePath: "system/user",
        entityName: "SystemUser",
        serviceName: "SystemUserService",
        permissionUpdate: "SYSTEM_USER_UPDATE",
      },
    })

    const paths = scaffold.files.map((file) => file.path)
    expect(paths).toHaveLength(5)
    expect(paths).toContain("packages/domains/system/backend/services/SystemUser.facade.ts")
    expect(paths).toContain("packages/domains/system/backend/services/strategies/SystemUser.strategy.ts")
    expect(paths).toContain("packages/domains/system/backend/services/guards/SystemUser-state.guard.ts")
    expect(paths).toContain("packages/domains/system/backend/services/__tests__/SystemUser.facade.test.ts")
    expect(paths).toContain("packages/domains/system/backend/services/SystemUser.rpc.ts")
  })
})