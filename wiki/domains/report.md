# 领域百科：report (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-report/`](../../packages/plugins/plugin-report)  
> **演进阶段**：阶段 A | **独立部署默认端口**：3215 | **上游环境变量**：`COOLIEBASE_DOMAIN_REPORT_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/report`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`15000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`无特殊要求`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [report.facade.ts](../../packages/plugins/plugin-report/contract/report.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listBoards`
- `exportBoard`

---

## 三、 Agent 自动化实体与契约清单 (1 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `GoViewProject` | GoView 项目表每个大屏图标，对应一个项目 | `/admin/report/go-view-project` | `report:go_view_project` | [`go-view-project.agent.json`](../../packages/plugins/plugin-report/agent/go-view-project.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-report/backend/services/`；
   - 仓储数据访问放于 `packages/plugins/plugin-report/backend/repositories/`；
   - 契约接口放于 `packages/plugins/plugin-report/contract/`。
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
