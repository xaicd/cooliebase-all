// 由 scripts/apply-query-types.ts 补齐可查字段（queryType）；列定义仍来自元数据导出。
// 勿手改 —— 改元数据请改上游导入器或手工覆盖后重跑生成器。
import type { CodegenConfig } from "../packages/domains/infra/backend/services/codegen-templates"

export const AI_TABLES: CodegenConfig[] = [
  {
    "moduleName": "ai",
    "className": "AiApiKey",
    "businessName": "AI API 秘钥",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_api_key",
    "table": {
      "name": "ai_api_key",
      "comment": "AI API 秘钥",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "api_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "密钥",
          "nullableInferred": true
        },
        {
          "name": "platform",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "平台",
          "nullableInferred": true
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "API 地址",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiChatConversation",
    "businessName": "AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_chat_conversation",
    "table": {
      "name": "ai_chat_conversation",
      "comment": "AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "ID 编号，自增",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "对话标题",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "pinned",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "comment": "是否置顶",
          "nullableInferred": true
        },
        {
          "name": "pinned_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "置顶时间",
          "nullableInferred": true
        },
        {
          "name": "role_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "角色编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "模型标志",
          "nullableInferred": true
        },
        {
          "name": "system_message",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "角色设定",
          "nullableInferred": true
        },
        {
          "name": "temperature",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "温度参数",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "max_tokens",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "单条回复的最大 Token 数量",
          "nullableInferred": true
        },
        {
          "name": "max_contexts",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "上下文的最大 Message 数量",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        },
        {
          "name": "system_prompt",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiChatMessage",
    "businessName": "AI Chat 消息",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_chat_message",
    "table": {
      "name": "ai_chat_message",
      "comment": "AI Chat 消息",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号，作为每条聊天记录的唯一标识符",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "conversation_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "对话编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "reply_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "回复消息编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "消息类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "role_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "角色编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型标志",
          "nullableInferred": true
        },
        {
          "name": "model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型编号",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "聊天内容",
          "nullableInferred": true
        },
        {
          "name": "reasoning_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "推理内容",
          "nullableInferred": true
        },
        {
          "name": "use_context",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否携带上下文",
          "nullableInferred": true
        },
        {
          "name": "segment_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "知识库段落编号数组",
          "nullableInferred": true
        },
        {
          "name": "web_search_pages",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "联网搜索的网页内容数组",
          "nullableInferred": true
        },
        {
          "name": "attachment_urls",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "附件 URL 数组",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        },
        {
          "name": "role",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "tokens",
          "type": "int",
          "tsType": "number",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiChatRole",
    "businessName": "AI 聊天角色",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_chat_role",
    "table": {
      "name": "ai_chat_role",
      "comment": "AI 聊天角色",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "角色名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "avatar",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "角色头像",
          "nullableInferred": true
        },
        {
          "name": "category",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "角色分类",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "角色描述",
          "nullableInferred": true
        },
        {
          "name": "system_message",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "角色设定",
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "knowledge_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "引用的知识库编号列表",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tool_ids",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "引用的工具编号列表",
          "nullableInferred": true
        },
        {
          "name": "mcp_client_names",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "引用的 MCP Client 名字列表",
          "nullableInferred": true
        },
        {
          "name": "public_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否公开",
          "nullableInferred": true
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "排序值",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiImage",
    "businessName": "AI 绘画",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_image",
    "table": {
      "name": "ai_image",
      "comment": "AI 绘画",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "prompt",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "提示词",
          "nullableInferred": true
        },
        {
          "name": "platform",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "平台",
          "nullableInferred": true
        },
        {
          "name": "model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型标识",
          "nullableInferred": true
        },
        {
          "name": "width",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "图片宽度",
          "nullableInferred": true
        },
        {
          "name": "height",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "图片高度",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生成状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "finish_time",
          "type": "timestamp",
          "tsType": "string",
          "nullable": true,
          "comment": "完成时间",
          "nullableInferred": true
        },
        {
          "name": "error_message",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "绘画错误信息",
          "nullableInferred": true
        },
        {
          "name": "pic_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "图片地址",
          "nullableInferred": true
        },
        {
          "name": "public_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否公开",
          "nullableInferred": true
        },
        {
          "name": "options",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "绘制参数，不同 platform 的不同参数",
          "nullableInferred": true
        },
        {
          "name": "buttons",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "mj buttons 按钮",
          "nullableInferred": true
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiKnowledge",
    "businessName": "AI 知识库",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_knowledge",
    "table": {
      "name": "ai_knowledge",
      "comment": "AI 知识库",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "知识库名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "知识库描述",
          "nullableInferred": true
        },
        {
          "name": "embedding_model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "向量模型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "embedding_model",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型标识",
          "nullableInferred": true
        },
        {
          "name": "top_k",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "topK",
          "nullableInferred": true
        },
        {
          "name": "similarity_threshold",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "相似度阈值",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiKnowledgeDocument",
    "businessName": "AI 知识库-文档",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_knowledge_document",
    "table": {
      "name": "ai_knowledge_document",
      "comment": "AI 知识库-文档",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "knowledge_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "知识库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "文档名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文件 URL",
          "nullableInferred": true
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "内容",
          "nullableInferred": true
        },
        {
          "name": "content_length",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "文档长度",
          "nullableInferred": true
        },
        {
          "name": "tokens",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "文档 token 数量",
          "nullableInferred": true
        },
        {
          "name": "segment_max_tokens",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "分片最大 Token 数",
          "nullableInferred": true
        },
        {
          "name": "retrieval_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "召回次数",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiKnowledgeSegment",
    "businessName": "AI 知识库-文档分段",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_knowledge_segment",
    "table": {
      "name": "ai_knowledge_segment",
      "comment": "AI 知识库-文档分段",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "knowledge_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "知识库编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "document_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "文档编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "切片内容",
          "nullableInferred": true
        },
        {
          "name": "content_length",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "切片内容长度",
          "nullableInferred": true
        },
        {
          "name": "vector_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "向量库的编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tokens",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "token 数量",
          "nullableInferred": true
        },
        {
          "name": "retrieval_count",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "召回次数",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiMindMap",
    "businessName": "AI 思维导图",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_mind_map",
    "table": {
      "name": "ai_mind_map",
      "comment": "AI 思维导图",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "platform",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "平台",
          "nullableInferred": true
        },
        {
          "name": "model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型",
          "nullableInferred": true
        },
        {
          "name": "prompt",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生成内容提示",
          "nullableInferred": true
        },
        {
          "name": "generated_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生成的内容",
          "nullableInferred": true
        },
        {
          "name": "error_message",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "错误信息",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiModel",
    "businessName": "AI 模型 DO默认模型： 为开启，并且 排序第一",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_model",
    "table": {
      "name": "ai_model",
      "comment": "AI 模型 DO默认模型： 为开启，并且 排序第一",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "key_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "API 秘钥编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "模型名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "model",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型标志",
          "nullableInferred": true
        },
        {
          "name": "platform",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "平台",
          "nullableInferred": true
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "sort",
          "type": "int",
          "tsType": "number",
          "nullable": false,
          "comment": "排序值",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "maxLength": 20,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "temperature",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "温度参数",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "max_tokens",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "单条回复的最大 Token 数量",
          "nullableInferred": true
        },
        {
          "name": "max_contexts",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "上下文的最大 Message 数量",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        },
        {
          "name": "model_key",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "input_ratio",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "output_ratio",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "provider",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "表里已有、元数据此前未登记",
          "nullableInferred": true
        },
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiMusic",
    "businessName": "AI 音乐",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_music",
    "table": {
      "name": "ai_music",
      "comment": "AI 音乐",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "title",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "音乐名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "lyric",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "歌词",
          "nullableInferred": true
        },
        {
          "name": "image_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "图片地址",
          "nullableInferred": true
        },
        {
          "name": "audio_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "音频地址",
          "nullableInferred": true
        },
        {
          "name": "video_url",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "视频地址",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "音乐状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "generate_mode",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "生成模式",
          "nullableInferred": true
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "描述词",
          "nullableInferred": true
        },
        {
          "name": "platform",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "平台",
          "nullableInferred": true
        },
        {
          "name": "model",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型",
          "nullableInferred": true
        },
        {
          "name": "tags",
          "type": "text",
          "tsType": "string",
          "nullable": true,
          "comment": "音乐风格标签",
          "nullableInferred": true
        },
        {
          "name": "duration",
          "type": "decimal",
          "tsType": "number",
          "nullable": true,
          "comment": "音乐时长",
          "precision": 18,
          "scale": 2,
          "nullableInferred": true
        },
        {
          "name": "public_status",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": true,
          "comment": "是否公开",
          "nullableInferred": true
        },
        {
          "name": "task_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "任务编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "error_message",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "错误信息",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiTool",
    "businessName": "AI 工具",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_tool",
    "table": {
      "name": "ai_tool",
      "comment": "AI 工具",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "工具编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "工具名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "description",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工具描述",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiWorkflow",
    "businessName": "AI 工作流",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_workflow",
    "table": {
      "name": "ai_workflow",
      "comment": "AI 工作流",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "name",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "工作流名称",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "code",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作流标识",
          "nullableInferred": true,
          "queryType": "LIKE"
        },
        {
          "name": "graph",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "工作流模型 JSON 数据",
          "nullableInferred": true
        },
        {
          "name": "remark",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "备注",
          "nullableInferred": true
        },
        {
          "name": "status",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "状态",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  },
  {
    "moduleName": "ai",
    "className": "AiWrite",
    "businessName": "AI 写作",
    "parentMenuId": "ai-dir",
    "permissionPrefix": "ai:ai_write",
    "table": {
      "name": "ai_write",
      "comment": "AI 写作",
      "columns": [
        {
          "name": "id",
          "type": "bigint",
          "tsType": "number",
          "nullable": false,
          "comment": "编号",
          "isPk": true,
          "nullableInferred": true
        },
        {
          "name": "user_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "用户编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "type",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "写作类型",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "platform",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "平台",
          "nullableInferred": true
        },
        {
          "name": "model_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型编号",
          "nullableInferred": true,
          "queryType": "="
        },
        {
          "name": "model",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "模型",
          "nullableInferred": true
        },
        {
          "name": "prompt",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生成内容提示",
          "nullableInferred": true
        },
        {
          "name": "generated_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "生成的内容",
          "nullableInferred": true
        },
        {
          "name": "original_content",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "原文",
          "nullableInferred": true
        },
        {
          "name": "length",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "长度提示词",
          "nullableInferred": true
        },
        {
          "name": "format",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "格式提示词",
          "nullableInferred": true
        },
        {
          "name": "tone",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "语气提示词",
          "nullableInferred": true
        },
        {
          "name": "language",
          "type": "int",
          "tsType": "number",
          "nullable": true,
          "comment": "语言提示词",
          "nullableInferred": true
        },
        {
          "name": "error_message",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "错误信息",
          "nullableInferred": true
        },
        {
          "name": "tenant_id",
          "type": "varchar",
          "tsType": "string",
          "nullable": false,
          "comment": "租户ID",
          "nullableInferred": false
        },
        {
          "name": "created_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "创建者",
          "nullableInferred": true
        },
        {
          "name": "created_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "创建时间",
          "nullableInferred": true
        },
        {
          "name": "updated_by",
          "type": "varchar",
          "tsType": "string",
          "nullable": true,
          "comment": "更新者",
          "nullableInferred": true
        },
        {
          "name": "updated_at",
          "type": "timestamp",
          "tsType": "string",
          "nullable": false,
          "comment": "更新时间",
          "nullableInferred": true
        },
        {
          "name": "deleted",
          "type": "boolean",
          "tsType": "boolean",
          "nullable": false,
          "defaultValueTyped": false,
          "comment": "逻辑删除",
          "nullableInferred": false
        }
      ]
    }
  }
]
