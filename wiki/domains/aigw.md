# 领域百科：aigw (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-aigw/`](../../packages/plugins/plugin-aigw)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3226 | **上游环境变量**：`COOLIEBASE_DOMAIN_AIGW_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/aigw`, `/api/v1/open/aigw`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`15000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [aigw.facade.ts](../../packages/plugins/plugin-aigw/contract/aigw.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listChannels`
- `createChannel`
- `listTokens`
- `createToken`
- `listModels`
- `relayChat`
- `listPublicModels`
- `embed`

---

## 三、 Agent 自动化实体与契约清单 (0 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

*暂无独立生成的 Agent 契约（地基服务或纯跨域 RPC 面）*

---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-aigw/backend/services/`；
   - 仓储数据访问放于 `packages/plugins/plugin-aigw/backend/repositories/`；
   - 契约接口放于 `packages/plugins/plugin-aigw/contract/`。
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
