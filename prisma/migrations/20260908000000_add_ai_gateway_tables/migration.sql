-- Table: ai_channel
CREATE TABLE IF NOT EXISTS "ai_channel" (
  "id" text NOT NULL,
  "name" character varying(100) NOT NULL,
  "provider" character varying(50) NOT NULL,
  "base_url" character varying(500),
  "api_key" character varying(500),
  "models" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "model_map" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "weight" integer NOT NULL DEFAULT 100,
  "priority" integer NOT NULL DEFAULT 1,
  "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
  "auto_disable" boolean NOT NULL DEFAULT true,
  "fail_count" integer NOT NULL DEFAULT 0,
  "protocol" character varying(20) NOT NULL DEFAULT 'openai',
  "tenant_id" text,
  "created_by" character varying(64),
  "updated_by" character varying(64),
  "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_ai_channel_tenant" ON "ai_channel" ("tenant_id");

-- Table: ai_access_token
CREATE TABLE IF NOT EXISTS "ai_access_token" (
  "id" text NOT NULL,
  "name" character varying(100) NOT NULL,
  "key" character varying(100) NOT NULL,
  "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
  "remain_quota" bigint NOT NULL DEFAULT 500000,
  "unlimited" boolean NOT NULL DEFAULT false,
  "models" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "ip_allowlist" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "group" character varying(50) NOT NULL DEFAULT 'default',
  "expires_at" timestamp with time zone,
  "tenant_id" text,
  "created_by" character varying(64),
  "updated_by" character varying(64),
  "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ai_access_token_key" ON "ai_access_token" ("key");
CREATE INDEX IF NOT EXISTS "idx_ai_access_token_tenant" ON "ai_access_token" ("tenant_id");

-- Table: ai_usage
CREATE TABLE IF NOT EXISTS "ai_usage" (
  "id" text NOT NULL,
  "token_id" text,
  "channel_id" text,
  "model" character varying(100) NOT NULL,
  "prompt_tokens" integer NOT NULL DEFAULT 0,
  "completion_tokens" integer NOT NULL DEFAULT 0,
  "total_tokens" integer NOT NULL DEFAULT 0,
  "success" boolean NOT NULL DEFAULT true,
  "latency_ms" integer NOT NULL DEFAULT 0,
  "error" character varying(500),
  "tenant_id" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_ai_usage_tenant" ON "ai_usage" ("tenant_id", "created_at");

-- Table: ai_model
CREATE TABLE IF NOT EXISTS "ai_model" (
  "id" text NOT NULL,
  "name" character varying(100) NOT NULL,
  "model_key" character varying(100) NOT NULL,
  "provider" character varying(50) NOT NULL,
  "input_ratio" double precision NOT NULL DEFAULT 1.0,
  "output_ratio" double precision NOT NULL DEFAULT 2.0,
  "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
  "sort" integer NOT NULL DEFAULT 0,
  "description" character varying(500),
  "tenant_id" text,
  "created_by" character varying(64),
  "updated_by" character varying(64),
  "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ai_model_key" ON "ai_model" ("model_key");
CREATE INDEX IF NOT EXISTS "idx_ai_model_tenant" ON "ai_model" ("tenant_id");

-- Table: ai_chat_conversation
CREATE TABLE IF NOT EXISTS "ai_chat_conversation" (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "title" character varying(200) NOT NULL,
  "model" character varying(100) NOT NULL,
  "system_prompt" text,
  "pinned" boolean NOT NULL DEFAULT false,
  "tenant_id" text,
  "created_by" character varying(64),
  "updated_by" character varying(64),
  "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_ai_chat_conversation_tenant" ON "ai_chat_conversation" ("tenant_id", "user_id");

-- Table: ai_chat_message
CREATE TABLE IF NOT EXISTS "ai_chat_message" (
  "id" text NOT NULL,
  "conversation_id" text NOT NULL,
  "role" character varying(20) NOT NULL,
  "content" text NOT NULL,
  "tokens" integer NOT NULL DEFAULT 0,
  "tenant_id" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_ai_chat_message_conversation" ON "ai_chat_message" ("conversation_id", "created_at");

-- Initial AI Channel seed data in SQL
INSERT INTO "ai_channel" ("id", "name", "provider", "base_url", "api_key", "models", "weight", "priority", "status", "protocol", "tenant_id", "created_by", "updated_by")
VALUES
  ('ch-deepseek-001', 'DeepSeek 官方直连渠道', 'DEEPSEEK', 'https://api.deepseek.com/v1', 'sk-mock-deepseek-key', '["deepseek-chat", "deepseek-reasoner", "deepseek-coder"]'::jsonb, 100, 10, 'ACTIVE', 'openai', '1', 'admin', 'admin'),
  ('ch-qwen-002', '通义千问 (DashScope) 渠道', 'TONGYI', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 'sk-mock-dashscope-key', '["qwen-plus", "qwen-max", "qwen-turbo"]'::jsonb, 80, 5, 'ACTIVE', 'openai', '1', 'admin', 'admin'),
  ('ch-openai-003', 'OpenAI 国际直连渠道', 'OPENAI', 'https://api.openai.com/v1', 'sk-mock-openai-key', '["gpt-4o", "gpt-4o-mini", "o1-preview"]'::jsonb, 60, 5, 'ACTIVE', 'openai', '1', 'admin', 'admin'),
  ('ch-mock-004', '本地模拟探测渠道', 'MOCK', '', '', '["gpt-4o-mini", "qwen-plus", "mock-chat"]'::jsonb, 100, 1, 'ACTIVE', 'openai', '1', 'admin', 'admin')
ON CONFLICT ("id") DO NOTHING;

-- Initial AI Access Tokens in SQL
INSERT INTO "ai_access_token" ("id", "name", "key", "status", "remain_quota", "unlimited", "models", "group", "tenant_id", "created_by", "updated_by")
VALUES
  ('tok-default-001', '全平台默认开发者令牌', 'sk-cooliebase-developer-master', 'ACTIVE', 5000000, false, '[]'::jsonb, 'default', '1', 'admin', 'admin'),
  ('tok-demo-002', '演示租户体验令牌', 'sk-cooliebase-demo-experience', 'ACTIVE', 500000, false, '["gpt-4o-mini", "qwen-plus", "deepseek-chat"]'::jsonb, 'vip', '1', 'admin', 'admin')
ON CONFLICT ("id") DO NOTHING;

-- Initial AI Model Catalog in SQL
INSERT INTO "ai_model" ("id", "name", "model_key", "provider", "input_ratio", "output_ratio", "status", "sort", "description", "tenant_id", "created_by", "updated_by")
VALUES
  ('mod-001', 'DeepSeek-V3 深度思考', 'deepseek-chat', 'DEEPSEEK', 1.0, 2.0, 'ACTIVE', 1, 'DeepSeek 官方旗舰大模型', '1', 'admin', 'admin'),
  ('mod-002', 'DeepSeek-R1 深度推理', 'deepseek-reasoner', 'DEEPSEEK', 2.0, 4.0, 'ACTIVE', 2, 'DeepSeek 官方推理大模型', '1', 'admin', 'admin'),
  ('mod-003', 'Qwen-Plus 阿里通义千问', 'qwen-plus', 'TONGYI', 1.0, 2.0, 'ACTIVE', 3, '阿里云百炼主力大模型', '1', 'admin', 'admin'),
  ('mod-004', 'GPT-4o Mini 极速模型', 'gpt-4o-mini', 'OPENAI', 1.0, 2.0, 'ACTIVE', 4, 'OpenAI 旗舰高性价比轻量模型', '1', 'admin', 'admin')
ON CONFLICT ("id") DO NOTHING;
