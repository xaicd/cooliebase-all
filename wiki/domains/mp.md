# 领域百科：mp (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-mp/`](../../packages/plugins/plugin-mp)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3216 | **上游环境变量**：`COOLIEBASE_DOMAIN_MP_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/mp`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`8000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [mp.facade.ts](../../packages/plugins/plugin-mp/contract/mp.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listAccounts`
- `listFans`
- `sendMessage`

---

## 三、 Agent 自动化实体与契约清单 (8 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `MpAccount` | 公众号账号 | `/admin/mp/mp-account` | `mp:mp_account` | [`mp-account.agent.json`](../../packages/plugins/plugin-mp/agent/mp-account.agent.json) |
| `MpAutoReply` | 公众号消息自动回复 | `/admin/mp/mp-auto-reply` | `mp:mp_auto_reply` | [`mp-auto-reply.agent.json`](../../packages/plugins/plugin-mp/agent/mp-auto-reply.agent.json) |
| `MpMaterial` | 公众号素材 DO1. a href=https://developers.wei | `/admin/mp/mp-material` | `mp:mp_material` | [`mp-material.agent.json`](../../packages/plugins/plugin-mp/agent/mp-material.agent.json) |
| `MpMenu` | 公众号菜单 | `/admin/mp/mp-menu` | `mp:mp_menu` | [`mp-menu.agent.json`](../../packages/plugins/plugin-mp/agent/mp-menu.agent.json) |
| `MpMessage` | 公众号消息 | `/admin/mp/mp-message` | `mp:mp_message` | [`mp-message.agent.json`](../../packages/plugins/plugin-mp/agent/mp-message.agent.json) |
| `MpMessageTemplate` | 公众号模版消息 | `/admin/mp/mp-message-template` | `mp:mp_message_template` | [`mp-message-template.agent.json`](../../packages/plugins/plugin-mp/agent/mp-message-template.agent.json) |
| `MpTag` | 公众号标签 | `/admin/mp/mp-tag` | `mp:mp_tag` | [`mp-tag.agent.json`](../../packages/plugins/plugin-mp/agent/mp-tag.agent.json) |
| `MpUser` | 微信公众号粉丝 | `/admin/mp/mp-user` | `mp:mp_user` | [`mp-user.agent.json`](../../packages/plugins/plugin-mp/agent/mp-user.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-mp/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-mp/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-mp/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
