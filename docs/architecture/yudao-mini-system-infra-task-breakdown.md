# yudao-mini system/infra 工程任务拆解

更新时间：2026-08-02

## 0. 当前执行状态（2026-08-02）

1. S0-1 Web 层缺口：已完成（swagger/encrypt/xss 已落地并有测试）。
2. S0-2 Protection 缺口：已完成（idempotent/lock/signature 已接入关键写接口并有测试）。
3. S0-3 Platform 缺口：已完成（mybatis/redis/mq/websocket/monitor/excel/biz-tenant/biz-data-permission/biz-ip 均有最小实现与测试）。
4. 证据：starter 覆盖报告 13/13 DONE。

当前执行入口切换为 SYS/INF 任务包，不再新增 S0 范围能力。

## 1. 目标

把 yudao-boot-mini 的 system 和 infra 核心能力，拆成可并行开发的 all-next 任务包。

## 2. 输入依据

1. mini 核心扫描报告：apps/cooliebase/cooliebase-all-base/docs/architecture/artifacts/yudao-boot-mini-core-scan-2026-08-02.md
2. starter 覆盖报告：apps/cooliebase/cooliebase-all-base/docs/architecture/artifacts/all-next-starter-coverage-2026-08-02.md
3. 全域迁移作战板：apps/cooliebase/cooliebase-all-base/docs/architecture/cooliebase-full-migration-board.md

## 3. starter 缺口优先级（先修基础）

### S0-1 Web 层缺口

1. 目标：补 swagger、encrypt、xss 对应的 all-next 配置与中间件。
2. 目标文件：
- apps/cooliebase/cooliebase-all-base/src/backend/lib/web/
- apps/cooliebase/cooliebase-all-base/src/app/api/
3. 验收：
- 有配置开关
- 有中间件/拦截器
- 有测试覆盖开关生效与关闭路径

### S0-2 Protection 缺口

1. 目标：补 idempotent、lock、signature 三件套最小实现。
2. 目标文件：
- apps/cooliebase/cooliebase-all-base/src/backend/lib/protection/
- apps/cooliebase/cooliebase-all-base/src/backend/validators/
3. 验收：
- 幂等键重复请求可拦截
- 关键写接口支持签名验签
- 锁机制可保护并发写

### S0-3 Platform 缺口

1. 目标：补 mq、websocket、monitor、excel、tenant、data-permission、ip。
2. 目标文件：
- apps/cooliebase/cooliebase-all-base/src/backend/lib/platform/
- apps/cooliebase/cooliebase-all-base/src/backend/services/
3. 验收：
- 每项至少 1 个端到端示例接口
- 每项有事件日志
- 每项有最小测试

## 4. system 任务包

### SYS-1 Auth + Captcha + OAuth2

1. 内容：登录认证、验证码、OAuth2 client/open/token/user。
2. API 目标：
- /api/admin/system/auth/*
- /api/admin/system/oauth2/*
3. 验收：
- 权限校验与审计日志完整
- 登录失败/成功日志可查询

执行进度（2026-08-02）：

1. 已完成：`/api/admin/system/auth/login` 与 `/api/admin/system/auth/get-permission-info`（认证主链最小闭环）。
2. 已完成：`/api/admin/system/oauth2/clients` 与 `/api/admin/system/oauth2/tokens`（OAuth2 列表最小闭环）。
3. 已完成：后台页面、权限码与 system 域日志测试接入。
4. 已完成：`/api/admin/system/auth/captcha`（生成 + 校验）与 `/api/admin/system/oauth2/open/token`、`/api/admin/system/oauth2/user/info`（open/user 授权细节最小闭环）。
5. 已完成：`/admin/system/oauth2-clients`、`/admin/system/oauth2-tokens` 页面入口迁移到 `packages/domains/system/frontend/pages/*`，`src/app` 仅保留 re-export 兼容门面。
6. 已完成：`SystemAuthService`、`SystemCaptchaService`、`SystemOauth2Service` 迁移到 `packages/domains/system/backend/services/*`，`src/backend/services/system-*.service.ts` 仅保留兼容门面导出。
7. 下一步：接真实 token/session 持久层并补失败日志查询链路。

### SYS-2 用户组织权限主链

1. 内容：user、dept、post、role、menu、permission。
2. API 目标：
- /api/admin/system/users
- /api/admin/system/depts
- /api/admin/system/posts
- /api/admin/system/roles
- /api/admin/system/menus
- /api/admin/system/permissions/*
3. 验收：
- user-role、role-menu 分配可用
- 数据范围校验可配置
- 菜单树输出结构稳定

执行进度（2026-08-02）：

1. 已完成：`/api/admin/system/users`、`/api/admin/system/depts`、`/api/admin/system/posts`、`/api/admin/system/roles`、`/api/admin/system/menus`（列表最小闭环）。
2. 已完成：`/api/admin/system/permissions/assign-user-role` 与 `/api/admin/system/permissions/assign-role-menu`（分配动作最小闭环）。
3. 已完成：后台页面、权限码、菜单与 system 域日志测试接入。
4. 已完成：`/admin/system/users`、`/admin/system/roles`、`/admin/system/menus`、`/admin/system/depts`、`/admin/system/posts`、`/admin/system/online-users`、`/admin/system/login-logs`、`/admin/system/operate-logs` 页面入口迁移到 `packages/domains/system/frontend/pages/*`，`src/app` 仅保留 re-export 兼容门面。
5. 已完成：`SystemUserService`、`SystemRoleService`、`SystemMenuService`、`SystemDeptService`、`SystemPostService`、`SystemPermissionService`、`SystemOnlineUserService`、`SystemLoginLogService`、`SystemOperateLogService` 迁移到 `packages/domains/system/backend/services/*`，`src/backend/services/system-*.service.ts` 仅保留兼容门面导出。
6. 下一步：补 dept/post 与数据范围策略，接入真实关系表持久层。

### SYS-3 租户与租户套餐

1. 内容：tenant、tenant-package。
2. API 目标：
- /api/admin/system/tenants
- /api/admin/system/tenant-packages
3. 验收：
- 套餐变更可收敛权限边界
- 租户边界在查询和写入均生效

执行进度（2026-08-02）：

1. 已完成：`/api/admin/system/tenants` 与 `/api/admin/system/tenant-packages`（列表最小闭环）。
2. 已完成：后台页面、权限码、菜单挂载与日志事件接入。
3. 已完成：`/api/admin/system/tenants/update-status` 与 `/api/admin/system/tenants/assign-package`（写接口最小闭环）。
4. 已完成：`/admin/system/tenants`、`/admin/system/tenant-packages` 页面入口迁移到 `packages/domains/system/frontend/pages/*`，`src/app` 仅保留 re-export 兼容门面。
5. 已完成：`SystemTenantService` 与 `SystemTenantPackageService` 迁移到 `packages/domains/system/backend/services/*`，`src/backend/services/system-*.service.ts` 仅保留兼容门面导出。
6. 下一步：接入真实租户隔离持久层（含跨租户写保护与套餐权限约束）。

### SYS-4 字典/通知/日志

1. 内容：dict、notice、notify、login-log、operate-log。
2. API 目标：
- /api/admin/system/dict/*
- /api/admin/system/notices
- /api/admin/system/notify/*
- /api/admin/system/login-logs
- /api/admin/system/operate-logs
3. 验收：
- 字典可被业务接口复用
- 所有关键写操作 event + audit 双写

执行进度（2026-08-02）：

1. 已完成：`/api/admin/system/dicts`、`/api/admin/system/notices`、`/api/admin/system/notify/templates`、`/api/admin/system/notify/messages`（最小闭环）。
2. 已完成：dict/notice 写操作审计（`system.dict.create`、`system.notice.create`）与 event 覆盖。
3. 已完成：后台页面、权限码、菜单挂载与专项测试接入。
4. 已完成：notify 模板/消息写接口（`POST /api/admin/system/notify/templates`、`POST /api/admin/system/notify/messages`）与审计接入。
5. 已完成：登录日志与操作日志筛选 + 导出能力（`/api/admin/system/login-logs/export`、`/api/admin/system/operate-logs/export`）。
6. 已完成：SYS-4 服务与页面入口迁移到 `packages/domains/system`，`src/backend` 与 `src/app` 保留兼容门面（modules-first 增量整改）。
7. 下一步：补 dict type/data 分层与 notice 发布状态流转，作为 system 模块化重构的一部分接真实持久层。

### SYS-5 扩展能力

1. 内容：sms、mail、social、ip/area。
2. API 目标：
- /api/admin/system/sms/*
- /api/admin/system/mail/*
- /api/admin/system/social/*
- /api/admin/system/ip/*
3. 验收：
- 渠道配置与日志链路贯通
- 脱敏输出符合日志规范

执行进度（2026-08-02）：

1. 已完成：`/api/admin/system/sms/channels`、`/api/admin/system/sms/logs`（含渠道创建）。
2. 已完成：`/api/admin/system/mail/accounts`、`/api/admin/system/mail/logs`（含账号创建）。
3. 已完成：`/api/admin/system/social/users`（含社交用户创建）与 `/api/admin/system/ip/areas`。
4. 已完成：SYS-5 代码优先落位 `packages/domains/system`，`src/backend` 仅保留兼容门面，按 modules-first 增量整改。
5. 下一步：补 sms/mail/social 的模板配置与回执明细，接真实持久层与脱敏策略。

## 5. infra 任务包

### INF-1 参数中心 + 任务中心

1. 内容：config、job、job-log。
2. API 目标：
- /api/admin/infra/configs
- /api/admin/infra/job-center
- /api/admin/infra/job-logs
3. 验收：
- 配置修改可持久化
- 任务触发、暂停、恢复可追踪

执行进度（2026-08-02）：

1. 已完成：`/api/admin/infra/configs`。
2. 已完成：`/api/admin/infra/job-center`。
3. 已完成：`/api/admin/infra/job-logs`（含页面与权限码）。
4. 下一步：补 job-log 的筛选维度与导出能力，再接入真实任务执行明细。

### INF-2 文件中心

1. 内容：file、file-config。
2. API 目标：
- /api/admin/infra/files
- /api/admin/infra/file-configs
3. 验收：
- 至少支持本地 + 一种对象存储
- 文件元数据可追踪

执行进度（2026-08-02）：

1. 已完成：`/api/admin/infra/files`（文件列表最小闭环）。
2. 已完成：`/api/admin/infra/file-configs`（存储配置列表最小闭环）。
3. 已完成：后台页面、权限码、菜单与 infra 域日志测试接入。
4. 下一步：补文件上传/删除操作与配置写接口，并接入真实存储驱动适配。

### INF-3 API 日志 + Redis 监控

1. 内容：api-access-log、api-error-log、redis。
2. API 目标：
- /api/admin/infra/api-logs
- /api/admin/infra/api-error-logs
- /api/admin/infra/redis/*
3. 验收：
- API 日志包含耗时与状态码
- Redis 指标可查询

### INF-4 数据源配置 + 代码生成

1. 内容：db datasource config、codegen。
2. API 目标：
- /api/admin/infra/db/*
- /api/admin/infra/codegen/*
3. 验收：
- 代码生成至少支持表结构读取与 CRUD 模板输出

执行进度（2026-08-02）：

1. 已完成：`/api/admin/infra/db-configs`（数据源配置列表最小闭环）。
2. 已完成：`/api/admin/infra/codegen`（代码生成列表最小闭环）。
3. 已完成：后台页面、权限码、菜单与 infra 域日志测试接入。
4. 已完成：INF-1 ~ INF-4 代码优先落位 `packages/domains/infra`，`src/backend` 与 `src/app` 仅保留兼容门面，按 modules-first 增量整改。
5. 下一步：补代码生成预览/下载与数据源新增编辑能力，并接真实持久层。

## 6. 统一验收模板

每个任务包必须满足：

1. API：路由与参数校验齐全
2. Service：业务逻辑内聚
3. Permission：权限码接入
4. Log：event + audit
5. Test：关键路径自动化
6. Docs：更新迁移板与扫描报告

## 7. 推荐执行顺序（已切换）

1. SYS-2 → SYS-1 → SYS-3 → SYS-4 → SYS-5
2. INF-1 → INF-3 → INF-2 → INF-4
3. 每完成一个包即刷新 deep/mini/migration-board/governance 产物

## 8. 执行后命令

以下命令统一在 `apps/cooliebase/cooliebase-all-base` 目录执行。

1. npm run cooliebase:starter:scan
2. npm run cooliebase:mini:scan
3. npm run cooliebase:deep:scan
4. npm run cooliebase:migration:board
5. npm run cooliebase:governance:check:strict
