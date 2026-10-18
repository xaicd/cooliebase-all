# 审计日志运维

审计日志分为登录日志、操作日志、API 访问日志和 API 错误日志。所有读取、导出、错误处置及保留策略均保留 Trace ID，客户端和自动化程序必须以错误响应的 `code`、`retryable`、`traceId` 判断结果，不能解析中文提示。

## 权限

平台管理员已在初始化时拥有全部日志菜单和按钮权限。普通角色按最小授权分配：

- `system:login-log:query`、`system:login-log:export`
- `system:operate-log:query`、`system:operate-log:export`
- `infra:api-access-log:query`、`infra:api-access-log:export`
- `infra:api-error-log:query`、`infra:api-error-log:update-status`、`infra:api-error-log:export`

`infra:audit-log:retention` 仅供平台管理员使用，且接口还强制要求 `platform-admin` 角色。

## 保留策略

通过 `COOLIEBASE_INFRA_AUDIT_LOG_RETENTION_DAYS` 配置保留天数，默认 180，允许范围 30–3650。保留策略只删除截止日期之前的四类审计记录，不删除业务数据。

接口：`POST /api/v1/admin/infra/audit-log-retention`。

1. 调度器先使用平台管理员的 Bearer Token 调用 `{ "dryRun": true }`。
2. 记录返回的每表候选数、`cutoffAt`、HTTP 状态与 `X-Trace-Id`。
3. 经变更审批后，单独调用 `{ "dryRun": false }` 执行清理。
4. 调度失败时按错误协议的 `retryable` 决定是否重试；非可重试错误转人工处理。

不应在 Next.js 进程内创建定时器：多副本部署会导致重复执行。请使用 Kubernetes CronJob、云计划任务或系统计划任务调用该接口，并从密钥管理系统注入短期 Token；不得把 Token 写入代码、仓库或日志。

## 错误处置

错误日志处理接口为 `PATCH /api/v1/admin/infra/api-error-logs/{id}`，可传 `{ "processNote": "..." }`。处理成功后会记录处理人、处理时间和处理说明。应先通过 Trace ID 关联 API 访问日志和服务端结构化日志，再关闭异常。
