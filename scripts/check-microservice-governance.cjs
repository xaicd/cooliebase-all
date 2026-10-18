const fs = require("fs")
const path = require("path")

const { domainPathOf } = require("./lib/domain-catalog.cjs")
const ROOT = path.resolve(__dirname, "..")
const catalogPath = path.join(ROOT, "packages", "shared", "backend", "constants", "microservice-governance.json")
const { resolveRouteSource } = require("./lib/route-source.cjs")
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"))

function fail(message) {
  throw new Error(`[microservice-governance] ${message}`)
}

if (!Array.isArray(catalog.capabilities) || catalog.capabilities.length < 20) {
  fail("governance catalog must declare at least 20 Moleculer/Nest NATS capabilities")
}

// required 从真源读（此前硬编码在这里，与 JSON 两处维护 —— 孵化裁剪时必然漏掉一处）
const required = catalog.required ?? ["broker", "gateway", "action", "event", "queueGroup", "registry", "circuitBreaker", "bulkhead", "fallback", "natsAdapter", "jetStream", "outbox", "cacher", "validator", "moduleLayers", "dualInvoke", "rpcCodec", "rpcFacade", "rpcTransport", "grpcAdapter", "protobufCodec", "contractActions", "rpcActionsCatalog", "domainProto", "goStub", "httpRpc", "splitRuntime", "lowcodeTemplates", "schemaConfluence"]
for (const id of required) {
  const item = catalog.capabilities.find((capability) => capability.id === id)
  if (!item || item.status === "TODO") fail(`${id} must not be TODO`)
}

for (const capability of catalog.capabilities) {
  const target = path.join(ROOT, capability.ref)
  if (!fs.existsSync(target)) fail(`${capability.id} missing ref ${capability.ref}`)
  const source = fs.readFileSync(target, "utf8")
  if (!source.includes(capability.marker)) fail(`${capability.id} marker not found in ${capability.ref}: ${capability.marker}`)
}

const brokerPath = path.join(ROOT, "packages", "shared", "backend", "lib", "service-broker.ts")
const brokerSource = fs.readFileSync(brokerPath, "utf8")
for (const method of ["call", "mcall", "emit", "broadcast", "publishReliable", "cacher", "ping", "waitForServices", "getMetrics", "useMiddleware", "registerRemoteService"]) {
  if (!brokerSource.includes(method)) fail(`broker is missing ${method}`)
}

const domainCatalogPath = path.join(ROOT, "packages", "shared", "backend", "constants", "domain-catalog.json")
const domainCatalog = JSON.parse(fs.readFileSync(domainCatalogPath, "utf8"))
if (!domainCatalog.layers?.foundation?.modules?.includes("shared")) fail("shared must be a foundation module")
if (domainCatalog.layers.foundation.deployable !== false) fail("foundation modules must not be independently deployable")
if (domainCatalog.domains.some((domain) => domain.name === "shared")) fail("shared must not be registered as a domain service")
if (!Array.isArray(domainCatalog.layers.platform?.domains) || domainCatalog.layers.platform.domains.join(",") !== "system,infra") {
  fail("platform domains must be system, infra")
}
const domainNames = domainCatalog.domains.map((domain) => domain.name).sort()
const pluginLayered = (domainCatalog.layers.plugin && domainCatalog.layers.plugin.domains) || []
// 插件层单独成一层: kind=plugin 的域不进 platform/business, 但必须被 plugin 层登记
const layered = [
  ...domainCatalog.layers.platform.domains,
  ...domainCatalog.layers.business.domains,
  ...pluginLayered,
].sort()
if (domainNames.join(",") !== layered.join(",")) fail("every catalog domain must appear in exactly one of platform/business/plugin layers")
for (const name of pluginLayered) {
  const domain = domainCatalog.domains.find((item) => item.name === name)
  if (!domain || domain.kind !== "plugin") fail(`${name} must have kind=plugin`)
}
for (const name of domainCatalog.layers.platform.domains) {
  const domain = domainCatalog.domains.find((item) => item.name === name)
  if (!domain || domain.kind !== "platform") fail(`${name} must have kind=platform`)
}
for (const name of domainCatalog.layers.business.domains) {
  const domain = domainCatalog.domains.find((item) => item.name === name)
  if (!domain || domain.kind !== "business") fail(`${name} must have kind=business`)
}
if (domainCatalog.rpc?.local?.mode !== "sdk" || domainCatalog.rpc?.remote?.mode !== "rpc") fail("rpc dual-mode must be local=sdk remote=rpc")
if (!domainCatalog.rpc.local.facadeRequired || !domainCatalog.rpc.remote.facadeRequired) fail("RPC/SDK facade is required")
if (domainCatalog.rpc.remote.protocol !== "nats-rr" || domainCatalog.rpc.remote.serialization !== "json") {
  fail("default remote RPC must be nats-rr + json")
}
if (domainCatalog.rpc.remote.httpPath !== "/api/internal/rpc") fail("split-process RPC must use /api/internal/rpc")
if (domainCatalog.rpc.stageC.protocol !== "grpc" || domainCatalog.rpc.stageC.serialization !== "protobuf") {
  fail("stage C typed RPC must be grpc + protobuf")
}
for (const protocol of ["dubbo", "thrift"]) {
  if (!domainCatalog.rpc.rejected.includes(protocol)) fail(`must reject ${protocol} as a default RPC protocol`)
}

const rpcProtocolPath = path.join(ROOT, "packages", "shared", "backend", "lib", "rpc-protocol.ts")
const rpcProtocolSource = fs.readFileSync(rpcProtocolPath, "utf8")
if (!rpcProtocolSource.includes("resolveInvokeMode") || !rpcProtocolSource.includes("encodeRpcPayload") || !rpcProtocolSource.includes("encodeProtobufFrame")) {
  fail("rpc-protocol.ts must implement dual invoke, codec and protobuf frames")
}

const grpcPath = path.join(ROOT, "packages", "shared", "backend", "lib", "grpc-fabric.ts")
const grpcSource = fs.readFileSync(grpcPath, "utf8")
if (!grpcSource.includes("grpcUnary") || !grpcSource.includes("/cooliebase.")) fail("grpc-fabric.ts must implement in-house unary paths")

const hasDomain = (name) => domainCatalog.domains.some((item) => item.name === name)

const payFacadePath = path.join(domainPathOf(ROOT, "pay"), "contract", "pay.facade.ts")
if (hasDomain("pay")) {
  if (!fs.readFileSync(payFacadePath, "utf8").includes("createDomainFacade")) fail("pay contract facade is required")

  const protoPath = path.join(domainPathOf(ROOT, "pay"), "contract", "pay.proto")
  if (!fs.existsSync(protoPath) || !fs.readFileSync(protoPath, "utf8").includes("service PayService")) {
    fail("pay.proto must declare PayService; run npm run domain:contracts")
  }

  const goStubPath = path.join(ROOT, "gen", "go", "pay", "v1", "service.go")
  if (!fs.existsSync(goStubPath) || !fs.readFileSync(goStubPath, "utf8").includes("type PayService interface")) {
    fail("gen/go/pay/v1/service.go must declare PayService; run npm run domain:contracts")
  }
}

const rpcActionsPath = path.join(ROOT, "packages", "shared", "backend", "constants", "rpc-actions.json")
const rpcActions = JSON.parse(fs.readFileSync(rpcActionsPath, "utf8"))
for (const domain of domainCatalog.domains) {
  if (!rpcActions.domains?.[domain.name]) fail(`rpc-actions.json must declare ${domain.name}`)
}

const infraActions = rpcActions.domains?.infra?.actions?.map((item) => item.method) ?? []
for (const method of ["previewCodegen", "generateCodegen", "previewTemplate", "generateTemplate"]) {
  if (!infraActions.includes(method)) fail(`rpc-actions.json infra must declare ${method}`)
}

const systemActions = rpcActions.domains?.system?.actions?.map((item) => item.method) ?? []
if (!systemActions.includes("getDictDataByType")) fail("rpc-actions.json system must declare getDictDataByType")
if (!systemActions.includes("getPermissionInfoByUser")) fail("rpc-actions.json system must declare getPermissionInfoByUser")
if (!systemActions.includes("resolveTenantEntitlement")) fail("rpc-actions.json system must declare resolveTenantEntitlement")
for (const method of ["listUsers", "createUser", "listRoles", "createRole", "listMenus", "treeMenus", "createMenu", "listDepts", "treeDepts", "createDept", "listPosts", "createPost", "listDictTypes", "createDictType", "listTenants", "createTenant", "getUser", "updateUser", "deleteUser", "resetUserPassword", "updateUserStatus", "getRole", "updateRole", "deleteRole", "updateRoleStatus", "getMenu", "updateMenu", "deleteMenu", "getDept", "updateDept", "deleteDept", "getPost", "updatePost", "deletePost", "getDictType", "updateDictType", "deleteDictType", "getTenant", "updateTenant", "deleteTenant", "updateTenantStatus", "listDictData", "createDictData", "getDictData", "updateDictData", "deleteDictData", "listTenantPackages", "createTenantPackage", "getTenantPackage", "updateTenantPackage", "deleteTenantPackage", "assignTenantPackage", "getTenantSubscriptions", "getRoleMenus", "assignRoleMenu", "assignUserRole", "pageLoginLogs", "getLoginLog", "exportLoginLogs", "pageOperateLogs", "getOperateLog", "exportOperateLogs", "listOnlineUsers", "forceLogoutOnlineUser", "pageNotices", "createNotice", "listMailAccounts", "createMailAccount", "listSmsChannels", "createSmsChannel", "login", "getPermissionInfoByUser", "getUserProfile", "getSidebarNav", "listMailTemplates", "listSmsTemplates", "listSocialClients"]) {
  if (!systemActions.includes(method)) fail(`rpc-actions.json system must declare ${method}`)
}

const infraCoreActions = rpcActions.domains?.infra?.actions?.map((item) => item.method) ?? []
for (const method of ["listConfigs", "getConfigByKey", "createConfig", "listJobs", "createJob", "listFiles", "recordFile", "pageDataSourceConfigs", "getConfig", "updateConfigItem", "deleteConfig", "getJob", "updateJob", "deleteJob", "triggerJob", "updateJobStatus", "getFile", "deleteFile", "listPages", "getPage", "getPageBySlug", "pageApiErrorLogs", "getApiErrorLog", "processApiErrorLog", "pageApiAccessLogs", "getApiAccessLog", "testDataSourceConnection", "listCodegenTables", "getCodegenTable", "updateCodegenTable", "deleteCodegenTable", "deleteCodegenTables", "exportApiAccessLogs", "exportApiErrorLogs", "runAuditLogRetention", "listCodegenCandidates", "importCodegenTables", "generateCodegenArchive", "listCodegenCatalog"]) {
  if (!infraCoreActions.includes(method)) fail(`rpc-actions.json infra must declare ${method}`)
}

const onlineActions = rpcActions.domains?.online?.actions?.map((item) => item.method) ?? []
if (hasDomain("online")) {
  for (const method of ["pageDefinitions", "resolvePublishedRelease", "resolveCodegenImport", "pageManagedRecords", "getManagedRecord", "createManagedRecord", "updateManagedRecord", "deleteManagedRecord"]) {
    if (!onlineActions.includes(method)) fail(`rpc-actions.json online must declare ${method}`)
  }
}

const payRefundActions = rpcActions.domains?.pay?.actions?.map((item) => item.method) ?? []
if (hasDomain("pay") && !payRefundActions.includes("listRefunds")) fail("rpc-actions.json pay must declare listRefunds")

for (const [domain, spec] of Object.entries(rpcActions.domains ?? {})) {
  if (!hasDomain(domain)) continue
  const validatorsDir = path.join(domainPathOf(ROOT, domain), "backend", "validators")
  if (!fs.existsSync(validatorsDir)) fail(`missing validators for ${domain}`)
  const validatorSource = fs.readdirSync(validatorsDir).filter((name) => name.endsWith(".ts")).map((name) => fs.readFileSync(path.join(validatorsDir, name), "utf8")).join("\n")
  for (const action of spec.actions ?? []) {
    if (action.schema === "ping") continue
    if (!validatorSource.includes(`export const ${action.schema}`)) {
      fail(`rpc-actions.json ${domain}.${action.method} schema ${action.schema} must live in ${domain} backend validators`)
    }
  }
}

const guardsPath = path.join(ROOT, "packages", "shared", "backend", "auth", "guards.ts")
const guardsSource = fs.readFileSync(guardsPath, "utf8")
if (guardsSource.includes("TenantEntitlementService")) fail("shared guards must not import TenantEntitlementService; use systemPlatformFacade")
if (!guardsSource.includes("systemPlatformFacade")) fail("shared guards must call tenant entitlement through systemPlatformFacade")

const codegenTablesPath = path.join(ROOT, "src", "app", "api", "v1", "admin", "infra", "codegen", "tables", "route.ts")
const codegenTables = resolveRouteSource(codegenTablesPath)
if (codegenTables.includes("OnlineDefinitionService") || codegenTables.includes("KyselyOnlineRuntimeRepository") || codegenTables.includes("onlineFacade")) {
  fail("infra codegen tables route must not import online Service/Repository/Facade; use CodegenTableService")
}
if (!codegenTables.includes("CodegenTableService")) fail("infra codegen tables route must call CodegenTableService")

const codegenImportPath = path.join(ROOT, "src", "app", "api", "v1", "admin", "infra", "codegen", "import", "route.ts")
const codegenImport = resolveRouteSource(codegenImportPath)
if (codegenImport.includes("OnlineDefinitionService") || codegenImport.includes("KyselyOnlineRuntimeRepository") || codegenImport.includes("onlineFacade")) {
  fail("infra codegen import route must not import online Service/Repository/Facade; use CodegenTableService")
}
if (!codegenImport.includes("CodegenTableService")) fail("infra codegen import route must call CodegenTableService")

const codegenTableServicePath = path.join(domainPathOf(ROOT, "infra"), "backend", "services", "codegen-table.service.ts")
const codegenTableService = fs.readFileSync(codegenTableServicePath, "utf8")
if (codegenTableService.includes("OnlineDefinitionService") || codegenTableService.includes("KyselyOnlineRuntimeRepository")) {
  fail("CodegenTableService must not import online Service/Repository; use onlineFacade")
}
if (!codegenTableService.includes("onlineFacade")) fail("CodegenTableService must call online through onlineFacade")
// online 现在通过**按需加载**获得（域可被裁剪），故判据放宽为"经由 online 门面调用"，
  // 而不绑定具体的取用写法 —— 原判据在线改为动态加载后会误报。
  if (!codegenTableService.includes("resolveCodegenImport") || !codegenTableService.includes("modules/online/contract/online.facade")) {
    fail("CodegenTableService must call online through the online facade (resolveCodegenImport)")
  }

// 同 report/pay: 域可能被裁剪（base profile 只留 system+infra），读前先确认它在。
if (hasDomain("online")) {
  const onlineAdapterPath = path.join(domainPathOf(ROOT, "online"), "backend", "application", "online-codegen.adapter.ts")
  const onlineAdapter = fs.readFileSync(onlineAdapterPath, "utf8")
  if (onlineAdapter.includes("codegen-engine.service")) fail("online-codegen.adapter must import codegen types from infra contract, not the engine service")
}

// 域可能被裁剪（孵化时的 profile/bundle）—— 检查**存在的域**，不假设存在的域。
// 少了这个守卫，裁剪过的工程 readFileSync 会直接 ENOENT 崩掉，
// 而不是"跳过一项不适用的检查"（实测: minimal 孵化后 microservice:check 就是这么挂的）。
if (hasDomain("report")) {
  const reportSqlPath = path.join(domainPathOf(ROOT, "report"), "backend", "services", "custom-sql-report.service.ts")
  const reportSql = fs.readFileSync(reportSqlPath, "utf8")
  if (reportSql.includes("DataSourceConfigRepository")) fail("report custom-sql must not import infra repository; use infraPlatformFacade")
  if (!reportSql.includes("infraPlatformFacade")) fail("report custom-sql must call data sources through infraPlatformFacade")

  const reportSqlTestPath = path.join(domainPathOf(ROOT, "report"), "backend", "services", "__tests__", "custom-sql-report.service.test.ts")
  const reportSqlTest = fs.readFileSync(reportSqlTestPath, "utf8")
  if (reportSqlTest.includes("DataSourceConfigRepository")) fail("report custom-sql test must spy infraPlatformFacade, not import infra repository")
  if (!reportSqlTest.includes("infraPlatformFacade")) fail("report custom-sql test must assert infraPlatformFacade tenant scope")
}

// pay 已改造成第一方插件: 其路由不再有 Next 转发文件, 直接读插件内的真实路由源码
// 同 report: 域可能被裁剪，检查前先确认它在（否则读不到文件会直接崩）。
if (hasDomain("pay")) {
  const payOrders = routeSourceOf("src/app/api/v1/admin/pay/orders/route.ts")
  if (!payOrders.includes("PAY_ACTION_SCHEMAS") || !payOrders.includes("parseActionQuery")) {
    fail("pay orders route must parse query with PAY_ACTION_SCHEMAS via parseActionQuery")
  }

  const payRefunds = routeSourceOf("src/app/api/v1/admin/pay/refunds/route.ts")
  if (!payRefunds.includes("PAY_ACTION_SCHEMAS") || !payRefunds.includes("parseActionQuery")) {
    fail("pay refunds route must parse query with PAY_ACTION_SCHEMAS via parseActionQuery")
  }
}

for (const [label, relPath, token] of [
  ["mall products route", "src/app/api/v1/admin/mall/products/route.ts", "MALL_ACTION_SCHEMAS"],
  ["mall orders route", "src/app/api/v1/admin/mall/orders/route.ts", "MALL_ACTION_SCHEMAS"],
  ["mall coupon issue route", "src/app/api/v1/admin/mall/coupons/issue/route.ts", "MALL_ACTION_SCHEMAS"],
  ["crm customers route", "src/app/api/v1/admin/crm/customers/route.ts", "CRM_ACTION_SCHEMAS"],
  ["crm clues route", "src/app/api/v1/admin/crm/clues/route.ts", "CRM_ACTION_SCHEMAS"],
  ["crm followups route", "src/app/api/v1/admin/crm/followups/route.ts", "CRM_ACTION_SCHEMAS"],
  ["bpm process-definitions route", "src/app/api/v1/admin/bpm/process-definitions/route.ts", "BPM_ACTION_SCHEMAS"],
  ["bpm tasks route", "src/app/api/v1/admin/bpm/tasks/route.ts", "BPM_ACTION_SCHEMAS"],
  ["member users route", "src/app/api/v1/admin/member/users/route.ts", "MEMBER_ACTION_SCHEMAS"],
  ["member levels route", "src/app/api/v1/admin/member/levels/route.ts", "MEMBER_ACTION_SCHEMAS"],
  ["member points route", "src/app/api/v1/admin/member/points/route.ts", "MEMBER_ACTION_SCHEMAS"],
  ["erp products route", "src/app/api/v1/admin/erp/products/route.ts", "ERP_ACTION_SCHEMAS"],
  ["erp orders route", "src/app/api/v1/admin/erp/orders/route.ts", "ERP_ACTION_SCHEMAS"],
  ["report boards route", "src/app/api/v1/admin/report/boards/route.ts", "REPORT_ACTION_SCHEMAS"],
  ["mp accounts route", "src/app/api/v1/admin/mp/accounts/route.ts", "MP_ACTION_SCHEMAS"],
  ["mp fans route", "src/app/api/v1/admin/mp/fans/route.ts", "MP_ACTION_SCHEMAS"],
  ["wms warehouse route", "src/app/api/v1/admin/wms/wms-warehouse/route.ts", "WMS_ACTION_SCHEMAS"],
  ["mes work-order route", "src/app/api/v1/admin/mes/mes-pro-work-order/route.ts", "MES_ACTION_SCHEMAS"],
  ["aigw channels route", "src/app/api/v1/admin/aigw/channels/route.ts", "AIGW_ACTION_SCHEMAS"],
  ["iot devices route", "src/app/api/v1/admin/iot/devices/route.ts", "IOT_ACTION_SCHEMAS"],

  ["iot alerts route", "src/app/api/v1/admin/iot/alerts/route.ts", "IOT_ACTION_SCHEMAS"],
  ["im conversations route", "src/app/api/v1/admin/im/conversations/route.ts", "IM_ACTION_SCHEMAS"],
]) {
  // 域可能被裁剪（孵化 profile/bundle）—— 从路径里取出域名，不在 catalog 里就跳过。
  // 用"域不在"而不是"文件不存在"作为判据: 后者会把真正的路径写错也一并跳过，掩盖问题。
  const domainOfRoute = relPath.match(/^src\/app\/api\/v1\/[a-z]+\/([a-z0-9_]+)\//)?.[1]
  if (domainOfRoute && !hasDomain(domainOfRoute)) continue
  mustUseActionSchemas(label, relPath, token)
}

/**
 * 读取某个 API 路由的源码。
 *
 * 域被改造成**第一方插件**后，src/app/api/v1/** 下的 Next 转发文件会被删除，
 * 真实路由源码搬到 packages/plugins/plugin-<domain>/routes/<surface>/<rest>/route.ts。
 * 这里按路径形态自动回退，即"域搬到插件目录"不会让这些契约检查静默退化成通过
 * （找不到文件时 resolveRouteSource 返回空串，检查会**假通过**）。
 */
function routeSourceOf(relPath) {
  const nextFile = path.join(ROOT, relPath)
  if (fs.existsSync(nextFile)) return resolveRouteSource(nextFile)
  // src/app/api/v1/<surface>/<domain>/<rest...>/route.ts
  const parts = relPath.split("/")
  const [surface, domain] = [parts[4], parts[5]]
  if (!surface || !domain) return ""
  const rest = parts.slice(6).join("/")
  const pluginFile = path.join(domainPathOf(ROOT, domain), "routes", surface, rest)
  return fs.existsSync(pluginFile) ? fs.readFileSync(pluginFile, "utf8") : ""
}

function mustUseActionSchemas(label, relPath, token) {
  const source = routeSourceOf(relPath)
  if (!source.includes(token) || !source.includes("parseActionQuery") && !source.includes("parseActionBody")) {
    fail(`${label} must parse with ${token} via parseActionQuery/parseActionBody`)
  }
}

mustUseActionSchemas("system users route", "src/app/api/v1/admin/system/users/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system roles route", "src/app/api/v1/admin/system/roles/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system posts route", "src/app/api/v1/admin/system/posts/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system depts route", "src/app/api/v1/admin/system/depts/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system dicts route", "src/app/api/v1/admin/system/dicts/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system tenants route", "src/app/api/v1/admin/system/tenants/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system menus route", "src/app/api/v1/admin/system/menus/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("infra configs route", "src/app/api/v1/admin/infra/configs/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra jobs route", "src/app/api/v1/admin/infra/jobs/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra files route", "src/app/api/v1/admin/infra/files/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra data-source-config route", "src/app/api/v1/admin/infra/data-source-config/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("system users [id] route", "src/app/api/v1/admin/system/users/[id]/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system roles [id] route", "src/app/api/v1/admin/system/roles/[id]/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system menus [id] route", "src/app/api/v1/admin/system/menus/[id]/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system depts [id] route", "src/app/api/v1/admin/system/depts/[id]/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system posts [id] route", "src/app/api/v1/admin/system/posts/[id]/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system dicts [id] route", "src/app/api/v1/admin/system/dicts/[id]/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("system tenants [id] route", "src/app/api/v1/admin/system/tenants/[id]/route.ts", "SYSTEM_ACTION_SCHEMAS")
mustUseActionSchemas("infra configs [id] route", "src/app/api/v1/admin/infra/configs/[id]/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra jobs [id] route", "src/app/api/v1/admin/infra/jobs/[id]/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra files [id] route", "src/app/api/v1/admin/infra/files/[id]/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra pages route", "src/app/api/v1/admin/infra/pages/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra pages [id] route", "src/app/api/v1/admin/infra/pages/[id]/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra pages render route", "src/app/api/v1/admin/infra/pages/render/[slug]/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra api-error-logs route", "src/app/api/v1/admin/infra/api-error-logs/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra api-error-logs [id] route", "src/app/api/v1/admin/infra/api-error-logs/[id]/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra api-access-log route", "src/app/api/v1/admin/infra/api-access-log/route.ts", "INFRA_ACTION_SCHEMAS")
mustUseActionSchemas("infra api-access-log [id] route", "src/app/api/v1/admin/infra/api-access-log/[id]/route.ts", "INFRA_ACTION_SCHEMAS")
for (const [label, relPath, token] of [
  ["system dict-data route", "src/app/api/v1/admin/system/dict-data/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system tenant-packages route", "src/app/api/v1/admin/system/tenant-packages/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system assign-package route", "src/app/api/v1/admin/system/tenants/assign-package/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system role-menus route", "src/app/api/v1/admin/system/permissions/role-menus/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system assign-role-menu route", "src/app/api/v1/admin/system/permissions/assign-role-menu/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system assign-user-role route", "src/app/api/v1/admin/system/permissions/assign-user-role/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system login-logs route", "src/app/api/v1/admin/system/login-logs/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system operate-logs route", "src/app/api/v1/admin/system/operate-logs/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system online-users route", "src/app/api/v1/admin/system/online-users/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system notices route", "src/app/api/v1/admin/system/notices/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system mail accounts route", "src/app/api/v1/admin/system/mail/accounts/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system sms channels route", "src/app/api/v1/admin/system/sms/channels/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["infra codegen route", "src/app/api/v1/admin/infra/codegen/route.ts", "INFRA_ACTION_SCHEMAS"],
  ["infra codegen [id] route", "src/app/api/v1/admin/infra/codegen/[id]/route.ts", "INFRA_ACTION_SCHEMAS"],
  ["infra data-source test route", "src/app/api/v1/admin/infra/data-source-config/test/route.ts", "INFRA_ACTION_SCHEMAS"],
  ["infra audit-log-retention route", "src/app/api/v1/admin/infra/audit-log-retention/route.ts", "INFRA_ACTION_SCHEMAS"],
  ["system auth route", "src/app/api/v1/admin/system/auth/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system captcha route", "src/app/api/v1/admin/system/auth/captcha/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system user-profile route", "src/app/api/v1/admin/system/user-profile/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system sidebar route", "src/app/api/v1/admin/system/menus/sidebar/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system mail-template route", "src/app/api/v1/admin/system/mail-template/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system sms-template route", "src/app/api/v1/admin/system/sms-template/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["system social-client route", "src/app/api/v1/admin/system/social-client/route.ts", "SYSTEM_ACTION_SCHEMAS"],
  ["infra codegen tables route", "src/app/api/v1/admin/infra/codegen/tables/route.ts", "INFRA_ACTION_SCHEMAS"],
  ["infra codegen import route", "src/app/api/v1/admin/infra/codegen/import/route.ts", "INFRA_ACTION_SCHEMAS"],
  ["infra codegen download route", "src/app/api/v1/admin/infra/codegen/[id]/download/route.ts", "INFRA_ACTION_SCHEMAS"],
]) {
  // 域可能被裁剪（孵化 profile/bundle）—— 从路径里取出域名，不在 catalog 里就跳过。
  // 用"域不在"而不是"文件不存在"作为判据: 后者会把真正的路径写错也一并跳过，掩盖问题。
  const domainOfRoute = relPath.match(/^src\/app\/api\/v1\/[a-z]+\/([a-z0-9_]+)\//)?.[1]
  if (domainOfRoute && !hasDomain(domainOfRoute)) continue
  mustUseActionSchemas(label, relPath, token)
}

const codegenRoute = resolveRouteSource(path.join(ROOT, "src/app/api/v1/admin/infra/codegen/route.ts"))
if (codegenRoute.includes("CodegenTableRepository")) fail("infra codegen route must not import CodegenTableRepository; use CodegenTableService")
for (const [label, file] of [
  ["infra codegen preview route", "src/app/api/v1/admin/infra/codegen/preview/route.ts"],
  ["infra codegen import route", "src/app/api/v1/admin/infra/codegen/import/route.ts"],
  ["infra codegen tables route", "src/app/api/v1/admin/infra/codegen/tables/route.ts"],
  ["infra codegen download route", "src/app/api/v1/admin/infra/codegen/[id]/download/route.ts"],
]) {
  const source = resolveRouteSource(path.join(ROOT, file))
  if (source.includes("CodegenTableRepository")) fail(`${label} must not import CodegenTableRepository; use CodegenTableService`)
}
if (!codegenRoute.includes("CodegenTableService")) fail("infra codegen route must call CodegenTableService")

for (const relPath of [
  "src/app/api/v1/admin/infra/pages/route.ts",
  "src/app/api/v1/admin/infra/pages/[id]/route.ts",
  "src/app/api/v1/admin/infra/pages/render/[slug]/route.ts",
]) {
  const source = resolveRouteSource(path.join(ROOT, relPath))
  if (source.includes("InfraPageRepository")) fail(`${relPath} must not import InfraPageRepository; use InfraPageService`)
  if (!source.includes("InfraPageService")) fail(`${relPath} must call InfraPageService`)
}

// 同前: online 可被裁剪（base profile 只留 system+infra），读前先确认它在。
if (hasDomain("online")) {
  const onlineDefinitionPath = path.join(domainPathOf(ROOT, "online"), "backend", "services", "online-definition.service.ts")
  const onlineDefinition = fs.readFileSync(onlineDefinitionPath, "utf8")
  if (onlineDefinition.includes("CodegenEngineService")) fail("online-definition must not import CodegenEngineService; use infraPlatformFacade")
  if (!onlineDefinition.includes("infraPlatformFacade")) fail("online-definition must call infra codegen through infraPlatformFacade")
  if (onlineDefinition.includes("SystemDictService")) fail("online-definition must not import SystemDictService; use systemPublicFacade")
  if (!onlineDefinition.includes("systemPublicFacade")) fail("online-definition must call system dict through systemPublicFacade")
}

const exposure = rpcActions.exposure
if (!exposure?.system || JSON.stringify(exposure.system.public) !== JSON.stringify(["getDictDataByType", "getPermissionInfoByUser"])) {
  fail("system public RPC must be exactly getDictDataByType and getPermissionInfoByUser")
}
if ((exposure.infra?.public ?? []).length !== 0) fail("infra must not expose a public business RPC surface")
if (!fs.existsSync(path.join(ROOT, "packages/domains/system/contract/system.public.facade.ts"))) fail("system public facade must exist")
if (!fs.existsSync(path.join(ROOT, "packages/domains/system/contract/system.platform.facade.ts"))) fail("system platform facade must exist")
if (!fs.existsSync(path.join(ROOT, "packages/domains/infra/contract/infra.platform.facade.ts"))) fail("infra platform facade must exist")

function walkTsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "contract") continue
      walkTsFiles(full, acc)
      continue
    }
    if (name.endsWith(".ts")) acc.push(full)
  }
  return acc
}

const relFromRoot = (file) => path.relative(ROOT, file).replace(/\\/g, "/")
// 业务域 = business ∪ plugin。域迁成插件后会移出 business 层 ——
// 只读 business 会让这条分层规则在迁移后**空转**（一个文件都不检查，而 check 仍然绿）。
const businessDomains = [
  ...domainCatalog.layers.business.domains,
  ...(domainCatalog.layers.plugin?.domains || []),
]
let layeringCheckedFiles = 0
for (const domain of businessDomains) {
  for (const file of walkTsFiles(domainPathOf(ROOT, domain))) {
    layeringCheckedFiles += 1
    const source = fs.readFileSync(file, "utf8")
    const rel = relFromRoot(file)
    if (source.includes("/system/contract/system.facade") || source.includes("/system/contract/system.platform.facade")) {
      fail(`${rel} must import system.public.facade; system/infra are not a public admin RPC`)
    }
    if (source.includes("/infra/contract/infra.facade")) {
      fail(`${rel} must not import the full infra facade; infra has no public business RPC`)
    }
    if (["online", "report"].includes(domain)) continue
    if (source.includes("/infra/contract/infra.platform.facade")) {
      fail(`${rel} must not import infra platform facade; only online/report may`)
    }
  }
}

// 自检: 这条规则曾经因为"扫描根写死 + 业务层为空"而**空转**（一个文件都不查，
// 而 check 仍然是绿的）。加一条下限断言，让它不可能再静默变成空转。
//
// 但要区分两种情况:
//   * 工程**压根没有业务/插件域**（如 base profile 只留 system+infra）—— 无事可查，正常
//   * 工程**有域却一个文件都没扫到** —— 规则空转，必须失败
const scannableDomains = [...(domainCatalog.layers.business?.domains ?? []), ...(domainCatalog.layers.plugin?.domains ?? [])]
if (scannableDomains.length > 0 && layeringCheckedFiles === 0) {
  fail(`跨域分层检查没有扫描到任何文件（本工程有 ${scannableDomains.length} 个业务/插件域）—— 扫描根或域清单可能又写死了`)
}

for (const file of walkTsFiles(path.join(ROOT, "packages", "shared"))) {
  const source = fs.readFileSync(file, "utf8")
  const rel = relFromRoot(file)
  if (rel.includes("/__tests__/")) continue
  if (source.includes("/system/contract/system.facade")) fail(`${rel} must import system.platform.facade, not the full system facade`)
  if (source.includes("/infra/contract/infra.facade")) fail(`${rel} must not import the full infra facade`)
}

const systemMenuRepo = fs.readFileSync(path.join(domainPathOf(ROOT, "system"), "backend", "repositories", "menu.repository.ts"), "utf8")
const systemPermissionRepo = fs.readFileSync(path.join(domainPathOf(ROOT, "system"), "backend", "repositories", "permission.repository.ts"), "utf8")
const tenantMenuScope = fs.readFileSync(path.join(domainPathOf(ROOT, "system"), "backend", "services", "tenant-menu-scope.service.ts"), "utf8")
for (const [name, source] of [["menu.repository", systemMenuRepo], ["permission.repository", systemPermissionRepo], ["tenant-menu-scope", tenantMenuScope]]) {
  if (source.includes("online/backend/menu-catalog")) fail(`${name} must import online menu catalog from contract, not backend`)
}
if (hasDomain("online")) {
  if (!fs.existsSync(path.join(domainPathOf(ROOT, "online"), "contract", "menu-catalog.ts"))) {
    fail("online contract must publish menu-catalog.ts")
  }
  const onlineAdapterTestPath = path.join(domainPathOf(ROOT, "online"), "backend", "application", "online-codegen.adapter.test.ts")
  const onlineAdapterTest = fs.readFileSync(onlineAdapterTestPath, "utf8")
  if (onlineAdapterTest.includes("CodegenEngineService")) fail("online adapter test must not import CodegenEngineService; assert codegen IR only")
}

const codegenEngine = fs.readFileSync(path.join(domainPathOf(ROOT, "infra"), "backend", "services", "codegen-engine.service.ts"), "utf8")
const codegenServiceTemplate = fs.readFileSync(path.join(domainPathOf(ROOT, "infra"), "backend", "services", "codegen-templates", "service.template.ts"), "utf8")
const codegenRepoTemplate = fs.readFileSync(path.join(domainPathOf(ROOT, "infra"), "backend", "services", "codegen-templates", "repository.template.ts"), "utf8")
const codegenRouteTemplate = fs.readFileSync(path.join(domainPathOf(ROOT, "infra"), "backend", "services", "codegen-templates", "route.template.ts"), "utf8")
if (codegenServiceTemplate.includes("KyselyOnlineManagedTableRuntimeRepository") || codegenEngine.includes("KyselyOnlineManagedTableRuntimeRepository")) {
  fail("codegen managed-table template must not import Online repository; use onlineFacade")
}
if (!codegenServiceTemplate.includes("onlineFacade.queryManagedRecords") && !codegenServiceTemplate.includes("onlineFacade.pageManagedRecords")) {
  fail("codegen managed-table template must call onlineFacade for managed records")
}
if (!codegenRouteTemplate.includes("parseActionQuery") || !codegenRouteTemplate.includes("ACTION_SCHEMAS")) {
  fail("codegen routes must parse with generated ACTION_SCHEMAS via parseActionQuery")
}
if (codegenEngine.includes("MOCK_DATA") || codegenRepoTemplate.includes("MOCK_DATA")) {
  fail("table-driven codegen must persist via Repository, not MOCK_DATA")
}
if (!codegenRepoTemplate.includes("export function generateRepository") || !codegenRepoTemplate.includes("hasRealDatabase") || !codegenRepoTemplate.includes("insertDynamicRow")) {
  fail("table-driven codegen must emit a Kysely/memory Repository")
}

const outboxSource = fs.readFileSync(path.join(ROOT, "packages", "shared", "backend", "lib", "transactional-outbox.ts"), "utf8")
if (!outboxSource.includes("getOutboxStoreForDomain")) fail("outbox must expose getOutboxStoreForDomain for per-domain store ownership")

console.log(`[microservice-governance] PASS: ${catalog.capabilities.length} capabilities mapped from Moleculer + NestJS NATS`)
