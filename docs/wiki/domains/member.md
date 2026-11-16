# 领域百科：member (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-member/`](../../packages/plugins/plugin-member)  
> **演进阶段**：阶段 A | **独立部署默认端口**：3218 | **上游环境变量**：`COOLIEBASE_DOMAIN_MEMBER_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/member`, `/api/v1/app/member`
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
- [member.facade.ts](../../packages/plugins/plugin-member/contract/member.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listUsers`
- `updateUser`
- `listLevels`
- `createLevel`
- `listPoints`
- `adjustPoint`

---

## 三、 Agent 自动化实体与契约清单 (11 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `MemberAddress` | 用户收件地址 | `/admin/member/member-address` | `member:member_address` | [`member-address.agent.json`](../../packages/plugins/plugin-member/agent/member-address.agent.json) |
| `MemberConfig` | 会员配置 | `/admin/member/member-config` | `member:member_config` | [`member-config.agent.json`](../../packages/plugins/plugin-member/agent/member-config.agent.json) |
| `MemberExperienceRecord` | 会员经验记录 | `/admin/member/member-experience-record` | `member:member_experience_record` | [`member-experience-record.agent.json`](../../packages/plugins/plugin-member/agent/member-experience-record.agent.json) |
| `MemberGroup` | 用户分组 | `/admin/member/member-group` | `member:member_group` | [`member-group.agent.json`](../../packages/plugins/plugin-member/agent/member-group.agent.json) |
| `MemberLevel` | 会员等级 DO配置每个等级需要的积分 | `/admin/member/member-level` | `member:member_level` | [`member-level.agent.json`](../../packages/plugins/plugin-member/agent/member-level.agent.json) |
| `MemberLevelRecord` | 会员等级记录 DO用户每次等级发生变更时，记录一条日志 | `/admin/member/member-level-record` | `member:member_level_record` | [`member-level-record.agent.json`](../../packages/plugins/plugin-member/agent/member-level-record.agent.json) |
| `MemberPointRecord` | 用户积分记录 | `/admin/member/member-point-record` | `member:member_point_record` | [`member-point-record.agent.json`](../../packages/plugins/plugin-member/agent/member-point-record.agent.json) |
| `MemberSignInConfig` | 签到规则 | `/admin/member/member-sign-in-config` | `member:member_sign_in_config` | [`member-sign-in-config.agent.json`](../../packages/plugins/plugin-member/agent/member-sign-in-config.agent.json) |
| `MemberSignInRecord` | 签到记录 | `/admin/member/member-sign-in-record` | `member:member_sign_in_record` | [`member-sign-in-record.agent.json`](../../packages/plugins/plugin-member/agent/member-sign-in-record.agent.json) |
| `MemberTag` | 会员标签 | `/admin/member/member-tag` | `member:member_tag` | [`member-tag.agent.json`](../../packages/plugins/plugin-member/agent/member-tag.agent.json) |
| `MemberUser` | 会员用户 DOuk_mobile 索引：基于 字段 | `/admin/member/member-user` | `member:member_user` | [`member-user.agent.json`](../../packages/plugins/plugin-member/agent/member-user.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-member/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-member/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-member/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
