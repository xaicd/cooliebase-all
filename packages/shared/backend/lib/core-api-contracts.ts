import { apiRegistry } from "./api-registry"

let registered = false

/**
 * Bootstrap contracts that are globally discoverable. Domain modules should add
 * their versioned contract/manifest entries here or through generated manifests.
 */
export function registerCoreApiContracts(): void {
  if (registered) return
  registered = true

  apiRegistry.register({
    path: "/api/v1/admin/system/auth",
    method: "POST",
    domain: "system",
    endpoint: "admin",
    version: "v1",
    summary: "管理员账号密码登录",
    requestSchema: {
      type: "object",
      required: ["username", "password"],
      properties: {
        username: { type: "string" },
        password: { type: "string", format: "password", writeOnly: true },
        tenantCode: { type: "string", description: "Tenant accounts only; platform administrators leave it empty." },
      },
    },
    responseSchema: { type: "object", description: "JWT token, expiry, and administrator profile." },
  })

  apiRegistry.register({
    path: "/api/v1/open/meta/error-catalog",
    method: "GET",
    domain: "platform",
    endpoint: "open",
    version: "v1",
    summary: "获取全局错误码目录",
    responseSchema: { type: "object", description: "Stable error codes, HTTP statuses, message keys, and retry policies." },
  })

  apiRegistry.register({
    path: "/api/v1/open/openapi",
    method: "GET",
    domain: "platform",
    endpoint: "open",
    version: "v1",
    summary: "获取 OpenAPI 契约文档",
    responseSchema: { type: "object", description: "OpenAPI 3.0 document with x-error-catalog extension." },
  })

  apiRegistry.register({
    path: "/api/v1/open/meta/project-profile",
    method: "GET",
    domain: "platform",
    endpoint: "open",
    version: "v1",
    summary: "获取多端公开品牌与平台名称",
    responseSchema: { type: "object", description: "Public project identity without accounts or tenant secrets." },
  })

  apiRegistry.register({
    path: "/api/v1/open/meta/client-channels",
    method: "GET",
    domain: "platform",
    endpoint: "open",
    version: "v1",
    summary: "获取 PC/H5/uni-app/Flutter/桌面客户端渠道标准",
    responseSchema: { type: "object", description: "Client channel catalog, API surfaces, and shared client rules." },
  })
}


/** Audit-log contracts stay explicit so API/MCP clients know their read, retry, and authorization semantics. */
export function registerOnlineApiContracts(): void {
  const entries = [
    ["/api/v1/admin/online/definitions", "GET", "分页查询租户 Online Definition", "infra:online-definition:query"],
    ["/api/v1/admin/online/definitions", "POST", "创建 Online Definition 与初始 Draft Revision", "infra:online-definition:create"],
    ["/api/v1/admin/online/definitions/{code}", "GET", "获取 Online Definition、Draft 与 Release", "infra:online-definition:query"],
    ["/api/v1/admin/online/definitions/{code}", "PUT", "使用乐观锁更新 Online Definition", "infra:online-definition:update"],
    ["/api/v1/admin/online/definitions/{code}", "DELETE", "软删除未发布且未被关联的 Online Definition", "infra:online-definition:delete"],
    ["/api/v1/admin/online/definitions/{code}/archive", "POST", "归档 Online Definition", "infra:online-definition:update"],
    ["/api/v1/admin/online/definitions/{code}/normalize-system-fields", "POST", "补齐并固化 Online Definition 的 CoolieBase 系统字段", "infra:online-definition:update"],
    ["/api/v1/admin/online/definitions/{code}/draft", "PUT", "使用乐观锁更新 Draft Revision", "infra:online-definition:update"],
    ["/api/v1/admin/online/definitions/{code}/validate", "POST", "校验 Draft Revision", "infra:online-definition:update"],
    ["/api/v1/admin/online/definitions/{code}/publish", "POST", "发布不可变 Online Release", "infra:online-definition:publish"],
    ["/api/v1/admin/online/definitions/{code}/rollback", "POST", "回滚 Online 发布指针", "infra:online-definition:publish"],
    ["/api/v1/admin/online/definitions/codegen/download", "POST", "批量生成已发布 Online Release 的审阅 ZIP", "infra:online-definition:generate"],
    ["/api/v1/admin/online/definitions/{code}/codegen/preview", "POST", "预览已发布 Online Release 的 CRUD 代码", "infra:online-definition:generate"],
    ["/api/v1/admin/online/definitions/{code}/codegen/download", "GET", "下载已发布 Online Release 的 CRUD ZIP", "infra:online-definition:generate"],
    ["/api/v1/admin/online/definitions/{code}/schema-plans", "GET", "查询仅语义化的 Schema Plan", "infra:online-definition:query"],
    ["/api/v1/admin/online/definitions/{code}/schema-plans", "POST", "创建不执行 DDL 的 Schema Plan", "infra:online-definition:migrate"],
    ["/api/v1/admin/online/definitions/{code}/schema-plans/{planId}", "GET", "获取仅语义化的 Schema Plan", "infra:online-definition:query"],
    ["/api/v1/admin/online/definitions/{code}/schema-plans/{planId}/approve", "POST", "审批安全 Schema Plan，不执行 DDL", "infra:online-definition:migrate"],
    ["/api/v1/admin/online/definitions/{code}/schema-plans/{planId}/apply", "POST", "显式应用已审批的托管物理表 Schema Plan", "infra:online-definition:migrate"],
    ["/api/v1/admin/online/definitions/{code}/test-sessions", "POST", "从 Published Release 启动沙箱功能测试（单表/树表/主子表 AUTO）", "infra:online-definition:test"],
    ["/api/v1/admin/online/definitions/{code}/test-sessions/{sessionId}", "GET", "获取本人 Online Test Session", "infra:online-definition:test"],
    ["/api/v1/admin/online/definitions/{code}/test-sessions/{sessionId}/records", "GET", "分页查询 Release 绑定的测试记录", "infra:online-definition:test"],
    ["/api/v1/admin/online/definitions/{code}/test-sessions/{sessionId}/records", "POST", "创建经 Release 字段校验的测试记录", "infra:online-definition:test"],
    ["/api/v1/admin/online/definitions/{code}/test-sessions/{sessionId}/records/{recordId}", "PUT", "更新经 Release 字段校验的测试记录", "infra:online-definition:test"],
    ["/api/v1/admin/online/definitions/{code}/test-sessions/{sessionId}/records/{recordId}", "DELETE", "软删除测试记录", "infra:online-definition:test"],
  ] as const
  for (const [path, method, summary, permission] of entries) apiRegistry.register({
    path, method: method as "GET" | "POST" | "PUT" | "DELETE", domain: "online", endpoint: "admin", version: "v1", summary, permission,
    responseSchema: { type: "object", description: "Tenant-scoped Online metadata response. Definition writes use optimistic locking; Release snapshots are immutable." },
  })
}

export function registerAuditLogApiContracts(): void {
  const entries = [
    ["/api/v1/admin/infra/api-access-log", "GET", "查询 API 访问日志", "infra:api-access-log:query"],
    ["/api/v1/admin/infra/api-access-log/{id}", "GET", "获取 API 访问日志详情", "infra:api-access-log:query"],
    ["/api/v1/admin/infra/api-access-log/export", "GET", "导出 API 访问日志 CSV", "infra:api-access-log:export"],
    ["/api/v1/admin/infra/api-error-logs", "GET", "查询 API 错误日志", "infra:api-error-log:query"],
    ["/api/v1/admin/infra/api-error-logs/{id}", "GET", "获取 API 错误日志详情", "infra:api-error-log:query"],
    ["/api/v1/admin/infra/api-error-logs/{id}", "PATCH", "标记 API 错误日志已处理", "infra:api-error-log:update-status"],
    ["/api/v1/admin/infra/api-error-logs/export", "GET", "导出 API 错误日志 CSV", "infra:api-error-log:export"],
    ["/api/v1/admin/infra/audit-log-retention", "POST", "预览或执行审计日志保留清理", "infra:audit-log:retention"],
    ["/api/v1/admin/system/login-logs", "GET", "查询登录日志", "system:login-log:query"],
    ["/api/v1/admin/system/login-logs/export", "GET", "导出登录日志 CSV", "system:login-log:export"],
    ["/api/v1/admin/system/operate-logs", "GET", "查询操作日志", "system:operate-log:query"],
    ["/api/v1/admin/system/operate-logs/export", "GET", "导出操作日志 CSV", "system:operate-log:export"],
  ] as const
  for (const [path, method, summary, permission] of entries) apiRegistry.register({
    path, method: method as "GET" | "POST" | "PATCH", domain: path.includes("/system/") ? "system" : "infra", endpoint: "admin", version: "v1", summary, permission,
    responseSchema: { type: "object", description: "Standard successful response; all failures follow the global ErrorResponse contract with code, messageKey, retryable, and traceId." },
  })
}
