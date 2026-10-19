# 领域百科：ai (第一方业务插件)

> **唯一源码目录**：[`packages/plugins/plugin-ai/`](../../packages/plugins/plugin-ai)  
> **演进阶段**：阶段 B | **独立部署默认端口**：3223 | **上游环境变量**：`COOLIEBASE_DOMAIN_AI_UPSTREAM`

---

## 一、 领域定位与前缀

- **分层属性**：第一方业务插件（可独立拆分、打包、热插拔）
- **对外 HTTP API 前缀**：`/api/v1/admin/ai`, `/api/v1/open/ai`
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
- [ai.facade.ts](../../packages/plugins/plugin-ai/contract/ai.facade.ts)

### 2. 公开支持的 RPC 方法清单
- `ping`
- `listModels`
- `createModel`
- `listChats`
- `deleteChat`
- `relayChatCompletion`
- `listPublicModels`
- `embed`

---

## 三、 Agent 自动化实体与契约清单 (14 个)

本领域随代码生成器同源产出的机器可读契约，支持 `agent-device` (接口自动化运营) 与 `agent-browser` (Playwright 真实 UI 探针)：

| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |
|---|---|---|---|---|
| `AiApiKey` | AI API 秘钥 | `/admin/ai/ai-api-key` | `ai:ai_api_key` | [`ai-api-key.agent.json`](../../packages/plugins/plugin-ai/agent/ai-api-key.agent.json) |
| `AiChatConversation` | AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它的消息关联在一起 | `/admin/ai/ai-chat-conversation` | `ai:ai_chat_conversation` | [`ai-chat-conversation.agent.json`](../../packages/plugins/plugin-ai/agent/ai-chat-conversation.agent.json) |
| `AiChatMessage` | AI Chat 消息 | `/admin/ai/ai-chat-message` | `ai:ai_chat_message` | [`ai-chat-message.agent.json`](../../packages/plugins/plugin-ai/agent/ai-chat-message.agent.json) |
| `AiChatRole` | AI 聊天角色 | `/admin/ai/ai-chat-role` | `ai:ai_chat_role` | [`ai-chat-role.agent.json`](../../packages/plugins/plugin-ai/agent/ai-chat-role.agent.json) |
| `AiImage` | AI 绘画 | `/admin/ai/ai-image` | `ai:ai_image` | [`ai-image.agent.json`](../../packages/plugins/plugin-ai/agent/ai-image.agent.json) |
| `AiKnowledge` | AI 知识库 | `/admin/ai/ai-knowledge` | `ai:ai_knowledge` | [`ai-knowledge.agent.json`](../../packages/plugins/plugin-ai/agent/ai-knowledge.agent.json) |
| `AiKnowledgeDocument` | AI 知识库-文档 | `/admin/ai/ai-knowledge-document` | `ai:ai_knowledge_document` | [`ai-knowledge-document.agent.json`](../../packages/plugins/plugin-ai/agent/ai-knowledge-document.agent.json) |
| `AiKnowledgeSegment` | AI 知识库-文档分段 | `/admin/ai/ai-knowledge-segment` | `ai:ai_knowledge_segment` | [`ai-knowledge-segment.agent.json`](../../packages/plugins/plugin-ai/agent/ai-knowledge-segment.agent.json) |
| `AiMindMap` | AI 思维导图 | `/admin/ai/ai-mind-map` | `ai:ai_mind_map` | [`ai-mind-map.agent.json`](../../packages/plugins/plugin-ai/agent/ai-mind-map.agent.json) |
| `AiModel` | AI 模型 DO默认模型： 为开启，并且 排序第一 | `/admin/ai/ai-model` | `ai:ai_model` | [`ai-model.agent.json`](../../packages/plugins/plugin-ai/agent/ai-model.agent.json) |
| `AiMusic` | AI 音乐 | `/admin/ai/ai-music` | `ai:ai_music` | [`ai-music.agent.json`](../../packages/plugins/plugin-ai/agent/ai-music.agent.json) |
| `AiTool` | AI 工具 | `/admin/ai/ai-tool` | `ai:ai_tool` | [`ai-tool.agent.json`](../../packages/plugins/plugin-ai/agent/ai-tool.agent.json) |
| `AiWorkflow` | AI 工作流 | `/admin/ai/ai-workflow` | `ai:ai_workflow` | [`ai-workflow.agent.json`](../../packages/plugins/plugin-ai/agent/ai-workflow.agent.json) |
| `AiWrite` | AI 写作 | `/admin/ai/ai-write` | `ai:ai_write` | [`ai-write.agent.json`](../../packages/plugins/plugin-ai/agent/ai-write.agent.json) |


---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 `packages/plugins/plugin-ai/backend/services/`；
   - 仓储数据访问一律放于 `packages/plugins/plugin-ai/backend/repositories/`；
   - 契约接口一律放于 `packages/plugins/plugin-ai/contract/`；
2. **租户隔离**：
   - 表设计若含 `tenant_id`，查询与写入自动由 Kysely `tenantIsolationPlugin` 拦截，无需人肉拼写 `WHERE tenant_id = ?`。
