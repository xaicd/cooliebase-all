# 领域百科：infra (平台地基)

> **唯一源码目录**：[`packages/domains/infra/`](../../packages/domains/infra)  
> **演进阶段**：阶段 A | **独立部署默认端口**：3211 | **上游环境变量**：`COOLIEBASE_DOMAIN_INFRA_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：平台基础设施（不可插拔、永不拆为独立第三方插件）
- **对外 HTTP API 前缀**：`/api/v1/admin/infra`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`8000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`无特殊要求`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [infra.facade.ts](../../packages/domains/infra/contract/infra.facade.ts)
- [infra.platform.facade.ts](../../packages/domains/infra/contract/infra.platform.facade.ts)
- [infra.public.facade.ts](../../packages/domains/infra/contract/infra.public.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `updateConfig`
- `previewCodegen`
- `generateCodegen`
- `previewTemplate`
- `generateTemplate`
- `listQueryDataSources`
- `getQueryConnection`
- `listConfigs`
- `getConfigByKey`
- `createConfig`
- `listJobs`
- `createJob`
- `listFiles`
- `recordFile`
- `pageDataSourceConfigs`
- `getConfig`
- `updateConfigItem`
- `deleteConfig`
- `getJob`
- `updateJob`
- `deleteJob`
- `triggerJob`
- `updateJobStatus`
- `getFile`
- `deleteFile`
- `listPages`
- `getPage`
- `getPageBySlug`
- `pageApiErrorLogs`
- `getApiErrorLog`
- `processApiErrorLog`
- `pageApiAccessLogs`
- `getApiAccessLog`
- `testDataSourceConnection`
- `listCodegenTables`
- `getCodegenTable`
- `updateCodegenTable`
- `deleteCodegenTable`
- `deleteCodegenTables`
- `exportApiAccessLogs`
- `exportApiErrorLogs`
- `runAuditLogRetention`
- `listCodegenCandidates`
- `importCodegenTables`
- `generateCodegenArchive`
- `listCodegenCatalog`

---

## 三、 Agent 自动化实体与契约清单 (1 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `Config` | 系统参数设置 | `/admin/infra/configs` | `infra:config` | [`config.agent.json`](../../packages/domains/infra/agent/config.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/domains/infra/backend/services/`；
   - 仓储数据访问一律放于 `packages/domains/infra/backend/repositories/`；
   - 契约接口一律放于 `packages/domains/infra/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
