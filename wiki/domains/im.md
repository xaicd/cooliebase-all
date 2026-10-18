# 领域百科：im (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-im/`](../../packages/plugins/plugin-im)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3225 | **上游环境变量**：`COOLIEBASE_DOMAIN_IM_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/im`
- **默认鉴权策略**：
  - 受众（Audience）：`admin`
  - 多租户策略：`required`
- **服务治理与韧性（Resilience）**：
  - 超时时间：`5000 ms`
  - 最大重试次数：`1`
  - 幂等要求：`强要求（需带 Idempotency-Key）`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
- [im.facade.ts](../../packages/plugins/plugin-im/contract/im.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listConversations`
- `auditMessage`

---

## 三、 Agent 自动化实体与契约清单 (17 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `ImChannel` | IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消息- 是业务码（API / 字典外露），id 是数字主键给前端会话 targetId 用 | `/admin/im/im-channel` | `im:im_channel` | [`im-channel.agent.json`](../../packages/plugins/plugin-im/agent/im-channel.agent.json) |
| `ImChannelMaterial` | IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N 关联多条 - 富文本仅在素材详情接口按需返回，推送 payload 不带，避免压爆 WebSocket 通道 | `/admin/im/im-channel-material` | `im:im_channel_material` | [`im-channel-material.agent.json`](../../packages/plugins/plugin-im/agent/im-channel-material.agent.json) |
| `ImChannelMessage` | IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于按频道检索- 存推送时 payload 的 JSON 快照（title / coverUrl / summa | `/admin/im/im-channel-message` | `im:im_channel_message` | [`im-channel-message.agent.json`](../../packages/plugins/plugin-im/agent/im-channel-message.agent.json) |
| `ImConversationRead` | IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 / 频道统一落这张表，是读位置的唯一权威。 | `/admin/im/im-conversation-read` | `im:im_conversation_read` | [`im-conversation-read.agent.json`](../../packages/plugins/plugin-im/agent/im-conversation-read.agent.json) |
| `ImFacePack` | IM 表情包 DO（运营配置的系统表情包元数据） | `/admin/im/im-face-pack` | `im:im_face_pack` | [`im-face-pack.agent.json`](../../packages/plugins/plugin-im/agent/im-face-pack.agent.json) |
| `ImFacePackItem` | IM 表情包项 DO（系统表情包内的单张表情图） | `/admin/im/im-face-pack-item` | `im:im_face_pack_item` | [`im-face-pack-item.agent.json`](../../packages/plugins/plugin-im/agent/im-face-pack-item.agent.json) |
| `ImFaceUserItem` | IM 用户私有表情 DO（个人表情包，对照微信「我的表情」） | `/admin/im/im-face-user-item` | `im:im_face_user_item` | [`im-face-user-item.agent.json`](../../packages/plugins/plugin-im/agent/im-face-user-item.agent.json) |
| `ImFriend` | IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（userId=A, friendUserId=B 和 userId=B, friendUserId=A）- 状态管理 | `/admin/im/im-friend` | `im:im_friend` | [`im-friend.agent.json`](../../packages/plugins/plugin-im/agent/im-friend.agent.json) |
| `ImFriendRequest` | IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接口落库（handleResult=UNHANDLED）- 接收方调 agree / refuse 处理（更新 ha | `/admin/im/im-friend-request` | `im:im_friend_request` | [`im-friend-request.agent.json`](../../packages/plugins/plugin-im/agent/im-friend-request.agent.json) |
| `ImGroup` | IM 群信息 | `/admin/im/im-group` | `im:im_group` | [`im-group.agent.json`](../../packages/plugins/plugin-im/agent/im-group.agent.json) |
| `ImGroupMember` | IM 群成员 | `/admin/im/im-group-member` | `im:im_group_member` | [`im-group-member.agent.json`](../../packages/plugins/plugin-im/agent/im-group-member.agent.json) |
| `ImGroupMessage` | IM 群聊消息 | `/admin/im/im-group-message` | `im:im_group_message` | [`im-group-message.agent.json`](../../packages/plugins/plugin-im/agent/im-group-message.agent.json) |
| `ImGroupRequest` | IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply 接口落库（inviterUserId=null，handleResult=UNHANDLED）， | `/admin/im/im-group-request` | `im:im_group_request` | [`im-group-request.agent.json`](../../packages/plugins/plugin-im/agent/im-group-request.agent.json) |
| `ImPrivateMessage` | IM 私聊消息 | `/admin/im/im-private-message` | `im:im_private_message` | [`im-private-message.agent.json`](../../packages/plugins/plugin-im/agent/im-private-message.agent.json) |
| `ImRtcCall` | IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED → RUNNING → ENDED；和明细表 通过 关联 | `/admin/im/im-rtc-call` | `im:im_rtc_call` | [`im-rtc-call.agent.json`](../../packages/plugins/plugin-im/agent/im-rtc-call.agent.json) |
| `ImRtcParticipant` | IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主表 终态闭合：通话 ENDED 时所有明细 status 必属 LEFT / REJECTED / NO | `/admin/im/im-rtc-participant` | `im:im_rtc_participant` | [`im-rtc-participant.agent.json`](../../packages/plugins/plugin-im/agent/im-rtc-participant.agent.json) |
| `ImSensitiveWord` | IM 敏感词 | `/admin/im/im-sensitive-word` | `im:im_sensitive_word` | [`im-sensitive-word.agent.json`](../../packages/plugins/plugin-im/agent/im-sensitive-word.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-im/backend/services/`；
   - 仓储数据访问放于 `packages/plugins/plugin-im/backend/repositories/`；
   - 契约接口放于 `packages/plugins/plugin-im/contract/`。
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
