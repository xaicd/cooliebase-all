# 领域百科：system (平台地基)

> **唯一源码目录**：[`packages/domains/system/`](../../packages/domains/system)  
> **演进阶段**：阶段 A | **独立部署默认端口**：3210 | **上游环境变量**：`COOLIEBASE_DOMAIN_SYSTEM_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：平台基础设施（不可插拔、永不拆为独立第三方插件）
- **对外 HTTP API 前缀**：`/api/v1/admin/system`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`5000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`无特殊要求`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [system.facade.ts](../../packages/domains/system/contract/system.facade.ts)
- [system.platform.facade.ts](../../packages/domains/system/contract/system.platform.facade.ts)
- [system.public.facade.ts](../../packages/domains/system/contract/system.public.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `getDictDataByType`
- `resolveTenantEntitlement`
- `resolveTenantIdByCode`
- `listUsers`
- `createUser`
- `listRoles`
- `createRole`
- `listMenus`
- `treeMenus`
- `createMenu`
- `listDepts`
- `treeDepts`
- `createDept`
- `listPosts`
- `createPost`
- `listDictTypes`
- `createDictType`
- `listTenants`
- `createTenant`
- `getUser`
- `updateUser`
- `deleteUser`
- `resetUserPassword`
- `updateUserStatus`
- `getRole`
- `updateRole`
- `deleteRole`
- `updateRoleStatus`
- `getMenu`
- `updateMenu`
- `deleteMenu`
- `getDept`
- `updateDept`
- `deleteDept`
- `getPost`
- `updatePost`
- `deletePost`
- `getDictType`
- `updateDictType`
- `deleteDictType`
- `getTenant`
- `updateTenant`
- `deleteTenant`
- `updateTenantStatus`
- `listDictData`
- `createDictData`
- `getDictData`
- `updateDictData`
- `deleteDictData`
- `listTenantPackages`
- `createTenantPackage`
- `getTenantPackage`
- `updateTenantPackage`
- `deleteTenantPackage`
- `assignTenantPackage`
- `getTenantSubscriptions`
- `getRoleMenus`
- `assignRoleMenu`
- `assignUserRole`
- `pageLoginLogs`
- `getLoginLog`
- `exportLoginLogs`
- `pageOperateLogs`
- `getOperateLog`
- `exportOperateLogs`
- `listOnlineUsers`
- `forceLogoutOnlineUser`
- `pageNotices`
- `createNotice`
- `getNotice`
- `updateNotice`
- `deleteNotice`
- `listOauth2Clients`
- `listOauth2Tokens`
- `listSocialUsers`
- `createSocialUser`
- `listMailAccounts`
- `createMailAccount`
- `listMailLogs`
- `listSmsChannels`
- `createSmsChannel`
- `listSmsLogs`
- `pageNotifyMessages`
- `createNotifyMessage`
- `pageNotifyTemplates`
- `createNotifyTemplate`
- `pageIpAreas`
- `pageAreas`
- `createArea`
- `getArea`
- `updateArea`
- `deleteArea`
- `login`
- `getPermissionInfoByUser`
- `refreshAccessToken`
- `logout`
- `generateCaptcha`
- `verifyCaptcha`
- `getUserProfile`
- `updateUserProfile`
- `getSidebarNav`
- `openOauth2Token`
- `getOauth2UserInfo`
- `listMailTemplates`
- `createMailTemplate`
- `getMailTemplate`
- `updateMailTemplate`
- `deleteMailTemplate`
- `listSmsTemplates`
- `createSmsTemplate`
- `getSmsTemplate`
- `updateSmsTemplate`
- `deleteSmsTemplate`
- `listSocialClients`
- `createSocialClient`
- `getSocialClient`
- `updateSocialClient`
- `deleteSocialClient`

---

## 三、 Agent 自动化实体与契约清单 (1 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `User` | 用户管理 | `/admin/system/users` | `system:user` | [`user.agent.json`](../../packages/domains/system/agent/user.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/domains/system/backend/services/`；
   - 仓储数据访问放于 `packages/domains/system/backend/repositories/`；
   - 契约接口放于 `packages/domains/system/contract/`。
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
