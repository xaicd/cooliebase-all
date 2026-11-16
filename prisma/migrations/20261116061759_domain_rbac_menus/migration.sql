-- 20261116061759_domain_rbac_menus
-- 由 scripts/generate-domain-rbac-migration.cjs 生成，**勿手改**（改元数据后重跑该脚本）
-- 聚合 352 份 contract/*.rbac.sql: 菜单 + 按钮权限 + 角色关联 + 租户套餐
-- 全部语句幂等（ON CONFLICT DO NOTHING），可重复执行。

-- 1. 父菜单（各域目录节点）—— rbac.sql 会挂到这些节点下，缺了菜单树就断
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at) VALUES
  ('ai-dir', NULL, '人工智能', '/admin/ai', NULL, 'ep:menu', 10, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('bpm-dir', NULL, '工作流', '/admin/bpm', NULL, 'ep:menu', 20, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('crm-dir', NULL, '客户关系', '/admin/crm', NULL, 'ep:menu', 30, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('erp-dir', NULL, 'ERP', '/admin/erp', NULL, 'ep:menu', 40, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('fms-dir', NULL, '财务管理', '/admin/fms', NULL, 'ep:menu', 50, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('hrm-dir', NULL, '人力资源', '/admin/hrm', NULL, 'ep:menu', 60, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('im-dir', NULL, '即时通讯', '/admin/im', NULL, 'ep:menu', 70, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('iot-dir', NULL, '物联网', '/admin/iot', NULL, 'ep:menu', 80, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('mall-dir', NULL, '商城', '/admin/mall', NULL, 'ep:menu', 90, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('member-dir', NULL, '会员', '/admin/member', NULL, 'ep:menu', 100, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('mes-dir', NULL, '生产制造', '/admin/mes', NULL, 'ep:menu', 110, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('mp-dir', NULL, '微信公众号', '/admin/mp', NULL, 'ep:menu', 120, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('oa-dir', NULL, '协同办公', '/admin/oa', NULL, 'ep:menu', 130, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('pay-dir', NULL, '支付', '/admin/pay', NULL, 'ep:menu', 140, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('pms-dir', NULL, '项目管理', '/admin/pms', NULL, 'ep:menu', 150, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('report-dir', NULL, '报表', '/admin/report', NULL, 'ep:menu', 160, 'DIR', 'ACTIVE', NULL, NOW(), NOW()),
  ('wms-dir', NULL, '仓储', '/admin/wms', NULL, 'ep:menu', 170, 'DIR', 'ACTIVE', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. 全局提权：管理员角色可见所有新菜单（3. 里的逐条关联之外，兜一层）
-- 注意: 迁移跑在**种子之前**，全新库上角色 1 还不存在 —— 所以加存在性守卫，
-- 否则外键直接失败。真正的授权关联由种子侧补（见 docs/agent 说明）。
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-all-' || m.id, '1', m.id FROM system_menu m
WHERE (m.id LIKE 'menu-%' OR m.id LIKE '%-dir') AND EXISTS (SELECT 1 FROM system_role r WHERE r.id = '1')
ON CONFLICT DO NOTHING;

-- 3. 各域明细（同步自 contract/*.rbac.sql）

-- >>> packages/plugins/plugin-ai/contract/ai-api-key.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI API 秘钥 (AiApiKey)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-api-key',
  'ai-dir',
  'AI API 秘钥管理',
  '/admin/ai/ai-api-key',
  'ai/ai-api-key/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_api_key:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-api-key-query',  'menu-ai-api-key', '查询AI API 秘钥', 'BUTTON', 'ACTIVE', 'ai:ai_api_key:query',  1, NOW(), NOW()),
('menu-ai-api-key-create', 'menu-ai-api-key', '新增AI API 秘钥', 'BUTTON', 'ACTIVE', 'ai:ai_api_key:create', 2, NOW(), NOW()),
('menu-ai-api-key-update', 'menu-ai-api-key', '修改AI API 秘钥', 'BUTTON', 'ACTIVE', 'ai:ai_api_key:update', 3, NOW(), NOW()),
('menu-ai-api-key-delete', 'menu-ai-api-key', '删除AI API 秘钥', 'BUTTON', 'ACTIVE', 'ai:ai_api_key:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-api-key'),
('1', 'menu-ai-api-key-query'),
('1', 'menu-ai-api-key-create'),
('1', 'menu-ai-api-key-update'),
('1', 'menu-ai-api-key-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-api-key'),
('1', 'menu-ai-api-key-query'),
('1', 'menu-ai-api-key-create'),
('1', 'menu-ai-api-key-update'),
('1', 'menu-ai-api-key-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-chat-conversation.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它 (AiChatConversation)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-chat-conversation',
  'ai-dir',
  'AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它管理',
  '/admin/ai/ai-chat-conversation',
  'ai/ai-chat-conversation/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_chat_conversation:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-chat-conversation-query',  'menu-ai-chat-conversation', '查询AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它', 'BUTTON', 'ACTIVE', 'ai:ai_chat_conversation:query',  1, NOW(), NOW()),
('menu-ai-chat-conversation-create', 'menu-ai-chat-conversation', '新增AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它', 'BUTTON', 'ACTIVE', 'ai:ai_chat_conversation:create', 2, NOW(), NOW()),
('menu-ai-chat-conversation-update', 'menu-ai-chat-conversation', '修改AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它', 'BUTTON', 'ACTIVE', 'ai:ai_chat_conversation:update', 3, NOW(), NOW()),
('menu-ai-chat-conversation-delete', 'menu-ai-chat-conversation', '删除AI Chat 对话 DO用户每次发起 Chat 聊天时，会创建一个 对象，将它', 'BUTTON', 'ACTIVE', 'ai:ai_chat_conversation:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-chat-conversation'),
('1', 'menu-ai-chat-conversation-query'),
('1', 'menu-ai-chat-conversation-create'),
('1', 'menu-ai-chat-conversation-update'),
('1', 'menu-ai-chat-conversation-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-chat-conversation'),
('1', 'menu-ai-chat-conversation-query'),
('1', 'menu-ai-chat-conversation-create'),
('1', 'menu-ai-chat-conversation-update'),
('1', 'menu-ai-chat-conversation-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-chat-message.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI Chat 消息 (AiChatMessage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-chat-message',
  'ai-dir',
  'AI Chat 消息管理',
  '/admin/ai/ai-chat-message',
  'ai/ai-chat-message/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_chat_message:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-chat-message-query',  'menu-ai-chat-message', '查询AI Chat 消息', 'BUTTON', 'ACTIVE', 'ai:ai_chat_message:query',  1, NOW(), NOW()),
('menu-ai-chat-message-create', 'menu-ai-chat-message', '新增AI Chat 消息', 'BUTTON', 'ACTIVE', 'ai:ai_chat_message:create', 2, NOW(), NOW()),
('menu-ai-chat-message-update', 'menu-ai-chat-message', '修改AI Chat 消息', 'BUTTON', 'ACTIVE', 'ai:ai_chat_message:update', 3, NOW(), NOW()),
('menu-ai-chat-message-delete', 'menu-ai-chat-message', '删除AI Chat 消息', 'BUTTON', 'ACTIVE', 'ai:ai_chat_message:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-chat-message'),
('1', 'menu-ai-chat-message-query'),
('1', 'menu-ai-chat-message-create'),
('1', 'menu-ai-chat-message-update'),
('1', 'menu-ai-chat-message-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-chat-message'),
('1', 'menu-ai-chat-message-query'),
('1', 'menu-ai-chat-message-create'),
('1', 'menu-ai-chat-message-update'),
('1', 'menu-ai-chat-message-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-chat-role.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 聊天角色 (AiChatRole)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-chat-role',
  'ai-dir',
  'AI 聊天角色管理',
  '/admin/ai/ai-chat-role',
  'ai/ai-chat-role/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_chat_role:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-chat-role-query',  'menu-ai-chat-role', '查询AI 聊天角色', 'BUTTON', 'ACTIVE', 'ai:ai_chat_role:query',  1, NOW(), NOW()),
('menu-ai-chat-role-create', 'menu-ai-chat-role', '新增AI 聊天角色', 'BUTTON', 'ACTIVE', 'ai:ai_chat_role:create', 2, NOW(), NOW()),
('menu-ai-chat-role-update', 'menu-ai-chat-role', '修改AI 聊天角色', 'BUTTON', 'ACTIVE', 'ai:ai_chat_role:update', 3, NOW(), NOW()),
('menu-ai-chat-role-delete', 'menu-ai-chat-role', '删除AI 聊天角色', 'BUTTON', 'ACTIVE', 'ai:ai_chat_role:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-chat-role'),
('1', 'menu-ai-chat-role-query'),
('1', 'menu-ai-chat-role-create'),
('1', 'menu-ai-chat-role-update'),
('1', 'menu-ai-chat-role-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-chat-role'),
('1', 'menu-ai-chat-role-query'),
('1', 'menu-ai-chat-role-create'),
('1', 'menu-ai-chat-role-update'),
('1', 'menu-ai-chat-role-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-image.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 绘画 (AiImage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-image',
  'ai-dir',
  'AI 绘画管理',
  '/admin/ai/ai-image',
  'ai/ai-image/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_image:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-image-query',  'menu-ai-image', '查询AI 绘画', 'BUTTON', 'ACTIVE', 'ai:ai_image:query',  1, NOW(), NOW()),
('menu-ai-image-create', 'menu-ai-image', '新增AI 绘画', 'BUTTON', 'ACTIVE', 'ai:ai_image:create', 2, NOW(), NOW()),
('menu-ai-image-update', 'menu-ai-image', '修改AI 绘画', 'BUTTON', 'ACTIVE', 'ai:ai_image:update', 3, NOW(), NOW()),
('menu-ai-image-delete', 'menu-ai-image', '删除AI 绘画', 'BUTTON', 'ACTIVE', 'ai:ai_image:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-image'),
('1', 'menu-ai-image-query'),
('1', 'menu-ai-image-create'),
('1', 'menu-ai-image-update'),
('1', 'menu-ai-image-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-image'),
('1', 'menu-ai-image-query'),
('1', 'menu-ai-image-create'),
('1', 'menu-ai-image-update'),
('1', 'menu-ai-image-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-knowledge-document.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 知识库-文档 (AiKnowledgeDocument)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-knowledge-document',
  'ai-dir',
  'AI 知识库-文档管理',
  '/admin/ai/ai-knowledge-document',
  'ai/ai-knowledge-document/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_knowledge_document:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-knowledge-document-query',  'menu-ai-knowledge-document', '查询AI 知识库-文档', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge_document:query',  1, NOW(), NOW()),
('menu-ai-knowledge-document-create', 'menu-ai-knowledge-document', '新增AI 知识库-文档', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge_document:create', 2, NOW(), NOW()),
('menu-ai-knowledge-document-update', 'menu-ai-knowledge-document', '修改AI 知识库-文档', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge_document:update', 3, NOW(), NOW()),
('menu-ai-knowledge-document-delete', 'menu-ai-knowledge-document', '删除AI 知识库-文档', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge_document:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-knowledge-document'),
('1', 'menu-ai-knowledge-document-query'),
('1', 'menu-ai-knowledge-document-create'),
('1', 'menu-ai-knowledge-document-update'),
('1', 'menu-ai-knowledge-document-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-knowledge-document'),
('1', 'menu-ai-knowledge-document-query'),
('1', 'menu-ai-knowledge-document-create'),
('1', 'menu-ai-knowledge-document-update'),
('1', 'menu-ai-knowledge-document-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-knowledge-segment.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 知识库-文档分段 (AiKnowledgeSegment)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-knowledge-segment',
  'ai-dir',
  'AI 知识库-文档分段管理',
  '/admin/ai/ai-knowledge-segment',
  'ai/ai-knowledge-segment/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_knowledge_segment:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-knowledge-segment-query',  'menu-ai-knowledge-segment', '查询AI 知识库-文档分段', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge_segment:query',  1, NOW(), NOW()),
('menu-ai-knowledge-segment-create', 'menu-ai-knowledge-segment', '新增AI 知识库-文档分段', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge_segment:create', 2, NOW(), NOW()),
('menu-ai-knowledge-segment-update', 'menu-ai-knowledge-segment', '修改AI 知识库-文档分段', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge_segment:update', 3, NOW(), NOW()),
('menu-ai-knowledge-segment-delete', 'menu-ai-knowledge-segment', '删除AI 知识库-文档分段', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge_segment:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-knowledge-segment'),
('1', 'menu-ai-knowledge-segment-query'),
('1', 'menu-ai-knowledge-segment-create'),
('1', 'menu-ai-knowledge-segment-update'),
('1', 'menu-ai-knowledge-segment-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-knowledge-segment'),
('1', 'menu-ai-knowledge-segment-query'),
('1', 'menu-ai-knowledge-segment-create'),
('1', 'menu-ai-knowledge-segment-update'),
('1', 'menu-ai-knowledge-segment-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-knowledge.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 知识库 (AiKnowledge)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-knowledge',
  'ai-dir',
  'AI 知识库管理',
  '/admin/ai/ai-knowledge',
  'ai/ai-knowledge/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_knowledge:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-knowledge-query',  'menu-ai-knowledge', '查询AI 知识库', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge:query',  1, NOW(), NOW()),
('menu-ai-knowledge-create', 'menu-ai-knowledge', '新增AI 知识库', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge:create', 2, NOW(), NOW()),
('menu-ai-knowledge-update', 'menu-ai-knowledge', '修改AI 知识库', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge:update', 3, NOW(), NOW()),
('menu-ai-knowledge-delete', 'menu-ai-knowledge', '删除AI 知识库', 'BUTTON', 'ACTIVE', 'ai:ai_knowledge:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-knowledge'),
('1', 'menu-ai-knowledge-query'),
('1', 'menu-ai-knowledge-create'),
('1', 'menu-ai-knowledge-update'),
('1', 'menu-ai-knowledge-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-knowledge'),
('1', 'menu-ai-knowledge-query'),
('1', 'menu-ai-knowledge-create'),
('1', 'menu-ai-knowledge-update'),
('1', 'menu-ai-knowledge-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-mind-map.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 思维导图 (AiMindMap)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-mind-map',
  'ai-dir',
  'AI 思维导图管理',
  '/admin/ai/ai-mind-map',
  'ai/ai-mind-map/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_mind_map:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-mind-map-query',  'menu-ai-mind-map', '查询AI 思维导图', 'BUTTON', 'ACTIVE', 'ai:ai_mind_map:query',  1, NOW(), NOW()),
('menu-ai-mind-map-create', 'menu-ai-mind-map', '新增AI 思维导图', 'BUTTON', 'ACTIVE', 'ai:ai_mind_map:create', 2, NOW(), NOW()),
('menu-ai-mind-map-update', 'menu-ai-mind-map', '修改AI 思维导图', 'BUTTON', 'ACTIVE', 'ai:ai_mind_map:update', 3, NOW(), NOW()),
('menu-ai-mind-map-delete', 'menu-ai-mind-map', '删除AI 思维导图', 'BUTTON', 'ACTIVE', 'ai:ai_mind_map:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-mind-map'),
('1', 'menu-ai-mind-map-query'),
('1', 'menu-ai-mind-map-create'),
('1', 'menu-ai-mind-map-update'),
('1', 'menu-ai-mind-map-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-mind-map'),
('1', 'menu-ai-mind-map-query'),
('1', 'menu-ai-mind-map-create'),
('1', 'menu-ai-mind-map-update'),
('1', 'menu-ai-mind-map-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-model.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 模型 DO默认模型： 为开启，并且 排序第一 (AiModel)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-model',
  'ai-dir',
  'AI 模型 DO默认模型： 为开启，并且 排序第一管理',
  '/admin/ai/ai-model',
  'ai/ai-model/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_model:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-model-query',  'menu-ai-model', '查询AI 模型 DO默认模型： 为开启，并且 排序第一', 'BUTTON', 'ACTIVE', 'ai:ai_model:query',  1, NOW(), NOW()),
('menu-ai-model-create', 'menu-ai-model', '新增AI 模型 DO默认模型： 为开启，并且 排序第一', 'BUTTON', 'ACTIVE', 'ai:ai_model:create', 2, NOW(), NOW()),
('menu-ai-model-update', 'menu-ai-model', '修改AI 模型 DO默认模型： 为开启，并且 排序第一', 'BUTTON', 'ACTIVE', 'ai:ai_model:update', 3, NOW(), NOW()),
('menu-ai-model-delete', 'menu-ai-model', '删除AI 模型 DO默认模型： 为开启，并且 排序第一', 'BUTTON', 'ACTIVE', 'ai:ai_model:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-model'),
('1', 'menu-ai-model-query'),
('1', 'menu-ai-model-create'),
('1', 'menu-ai-model-update'),
('1', 'menu-ai-model-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-model'),
('1', 'menu-ai-model-query'),
('1', 'menu-ai-model-create'),
('1', 'menu-ai-model-update'),
('1', 'menu-ai-model-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-music.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 音乐 (AiMusic)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-music',
  'ai-dir',
  'AI 音乐管理',
  '/admin/ai/ai-music',
  'ai/ai-music/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_music:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-music-query',  'menu-ai-music', '查询AI 音乐', 'BUTTON', 'ACTIVE', 'ai:ai_music:query',  1, NOW(), NOW()),
('menu-ai-music-create', 'menu-ai-music', '新增AI 音乐', 'BUTTON', 'ACTIVE', 'ai:ai_music:create', 2, NOW(), NOW()),
('menu-ai-music-update', 'menu-ai-music', '修改AI 音乐', 'BUTTON', 'ACTIVE', 'ai:ai_music:update', 3, NOW(), NOW()),
('menu-ai-music-delete', 'menu-ai-music', '删除AI 音乐', 'BUTTON', 'ACTIVE', 'ai:ai_music:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-music'),
('1', 'menu-ai-music-query'),
('1', 'menu-ai-music-create'),
('1', 'menu-ai-music-update'),
('1', 'menu-ai-music-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-music'),
('1', 'menu-ai-music-query'),
('1', 'menu-ai-music-create'),
('1', 'menu-ai-music-update'),
('1', 'menu-ai-music-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-tool.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 工具 (AiTool)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-tool',
  'ai-dir',
  'AI 工具管理',
  '/admin/ai/ai-tool',
  'ai/ai-tool/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_tool:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-tool-query',  'menu-ai-tool', '查询AI 工具', 'BUTTON', 'ACTIVE', 'ai:ai_tool:query',  1, NOW(), NOW()),
('menu-ai-tool-create', 'menu-ai-tool', '新增AI 工具', 'BUTTON', 'ACTIVE', 'ai:ai_tool:create', 2, NOW(), NOW()),
('menu-ai-tool-update', 'menu-ai-tool', '修改AI 工具', 'BUTTON', 'ACTIVE', 'ai:ai_tool:update', 3, NOW(), NOW()),
('menu-ai-tool-delete', 'menu-ai-tool', '删除AI 工具', 'BUTTON', 'ACTIVE', 'ai:ai_tool:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-tool'),
('1', 'menu-ai-tool-query'),
('1', 'menu-ai-tool-create'),
('1', 'menu-ai-tool-update'),
('1', 'menu-ai-tool-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-tool'),
('1', 'menu-ai-tool-query'),
('1', 'menu-ai-tool-create'),
('1', 'menu-ai-tool-update'),
('1', 'menu-ai-tool-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-workflow.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 工作流 (AiWorkflow)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-workflow',
  'ai-dir',
  'AI 工作流管理',
  '/admin/ai/ai-workflow',
  'ai/ai-workflow/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_workflow:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-workflow-query',  'menu-ai-workflow', '查询AI 工作流', 'BUTTON', 'ACTIVE', 'ai:ai_workflow:query',  1, NOW(), NOW()),
('menu-ai-workflow-create', 'menu-ai-workflow', '新增AI 工作流', 'BUTTON', 'ACTIVE', 'ai:ai_workflow:create', 2, NOW(), NOW()),
('menu-ai-workflow-update', 'menu-ai-workflow', '修改AI 工作流', 'BUTTON', 'ACTIVE', 'ai:ai_workflow:update', 3, NOW(), NOW()),
('menu-ai-workflow-delete', 'menu-ai-workflow', '删除AI 工作流', 'BUTTON', 'ACTIVE', 'ai:ai_workflow:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-workflow'),
('1', 'menu-ai-workflow-query'),
('1', 'menu-ai-workflow-create'),
('1', 'menu-ai-workflow-update'),
('1', 'menu-ai-workflow-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-workflow'),
('1', 'menu-ai-workflow-query'),
('1', 'menu-ai-workflow-create'),
('1', 'menu-ai-workflow-update'),
('1', 'menu-ai-workflow-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-ai/contract/ai-write.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for AI 写作 (AiWrite)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ai-write',
  'ai-dir',
  'AI 写作管理',
  '/admin/ai/ai-write',
  'ai/ai-write/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'ai:ai_write:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ai-write-query',  'menu-ai-write', '查询AI 写作', 'BUTTON', 'ACTIVE', 'ai:ai_write:query',  1, NOW(), NOW()),
('menu-ai-write-create', 'menu-ai-write', '新增AI 写作', 'BUTTON', 'ACTIVE', 'ai:ai_write:create', 2, NOW(), NOW()),
('menu-ai-write-update', 'menu-ai-write', '修改AI 写作', 'BUTTON', 'ACTIVE', 'ai:ai_write:update', 3, NOW(), NOW()),
('menu-ai-write-delete', 'menu-ai-write', '删除AI 写作', 'BUTTON', 'ACTIVE', 'ai:ai_write:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ai-write'),
('1', 'menu-ai-write-query'),
('1', 'menu-ai-write-create'),
('1', 'menu-ai-write-update'),
('1', 'menu-ai-write-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ai-write'),
('1', 'menu-ai-write-query'),
('1', 'menu-ai-write-create'),
('1', 'menu-ai-write-update'),
('1', 'menu-ai-write-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-bpm/contract/bpm-category.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for BPM 流程分类 (BpmCategory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bpm-category',
  'bpm-dir',
  'BPM 流程分类管理',
  '/admin/bpm/bpm-category',
  'bpm/bpm-category/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'bpm:bpm_category:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bpm-category-query',  'menu-bpm-category', '查询BPM 流程分类', 'BUTTON', 'ACTIVE', 'bpm:bpm_category:query',  1, NOW(), NOW()),
('menu-bpm-category-create', 'menu-bpm-category', '新增BPM 流程分类', 'BUTTON', 'ACTIVE', 'bpm:bpm_category:create', 2, NOW(), NOW()),
('menu-bpm-category-update', 'menu-bpm-category', '修改BPM 流程分类', 'BUTTON', 'ACTIVE', 'bpm:bpm_category:update', 3, NOW(), NOW()),
('menu-bpm-category-delete', 'menu-bpm-category', '删除BPM 流程分类', 'BUTTON', 'ACTIVE', 'bpm:bpm_category:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bpm-category'),
('1', 'menu-bpm-category-query'),
('1', 'menu-bpm-category-create'),
('1', 'menu-bpm-category-update'),
('1', 'menu-bpm-category-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bpm-category'),
('1', 'menu-bpm-category-query'),
('1', 'menu-bpm-category-create'),
('1', 'menu-bpm-category-update'),
('1', 'menu-bpm-category-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-bpm/contract/bpm-form.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景 (BpmForm)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bpm-form',
  'bpm-dir',
  'BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景管理',
  '/admin/bpm/bpm-form',
  'bpm/bpm-form/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'bpm:bpm_form:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bpm-form-query',  'menu-bpm-form', '查询BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景', 'BUTTON', 'ACTIVE', 'bpm:bpm_form:query',  1, NOW(), NOW()),
('menu-bpm-form-create', 'menu-bpm-form', '新增BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景', 'BUTTON', 'ACTIVE', 'bpm:bpm_form:create', 2, NOW(), NOW()),
('menu-bpm-form-update', 'menu-bpm-form', '修改BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景', 'BUTTON', 'ACTIVE', 'bpm:bpm_form:update', 3, NOW(), NOW()),
('menu-bpm-form-delete', 'menu-bpm-form', '删除BPM 工作流的表单定义用于工作流的申请表单，需要动态配置的场景', 'BUTTON', 'ACTIVE', 'bpm:bpm_form:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bpm-form'),
('1', 'menu-bpm-form-query'),
('1', 'menu-bpm-form-create'),
('1', 'menu-bpm-form-update'),
('1', 'menu-bpm-form-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bpm-form'),
('1', 'menu-bpm-form-query'),
('1', 'menu-bpm-form-create'),
('1', 'menu-bpm-form-update'),
('1', 'menu-bpm-form-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-bpm/contract/bpm-oaleave.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是  (BpmOALeave)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bpm-oaleave',
  'bpm-dir',
  'OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是 管理',
  '/admin/bpm/bpm-oaleave',
  'bpm/bpm-oaleave/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'bpm:bpm_oaleave:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bpm-oaleave-query',  'menu-bpm-oaleave', '查询OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是 ', 'BUTTON', 'ACTIVE', 'bpm:bpm_oaleave:query',  1, NOW(), NOW()),
('menu-bpm-oaleave-create', 'menu-bpm-oaleave', '新增OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是 ', 'BUTTON', 'ACTIVE', 'bpm:bpm_oaleave:create', 2, NOW(), NOW()),
('menu-bpm-oaleave-update', 'menu-bpm-oaleave', '修改OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是 ', 'BUTTON', 'ACTIVE', 'bpm:bpm_oaleave:update', 3, NOW(), NOW()),
('menu-bpm-oaleave-delete', 'menu-bpm-oaleave', '删除OA 请假申请 DO 请假天数，目前先简单做。一般是分成请假上午和下午，可以是 ', 'BUTTON', 'ACTIVE', 'bpm:bpm_oaleave:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bpm-oaleave'),
('1', 'menu-bpm-oaleave-query'),
('1', 'menu-bpm-oaleave-create'),
('1', 'menu-bpm-oaleave-update'),
('1', 'menu-bpm-oaleave-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bpm-oaleave'),
('1', 'menu-bpm-oaleave-query'),
('1', 'menu-bpm-oaleave-create'),
('1', 'menu-bpm-oaleave-update'),
('1', 'menu-bpm-oaleave-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-bpm/contract/bpm-process-definition-info.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表 (BpmProcessDefinitionInfo)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bpm-process-definition-info',
  'bpm-dir',
  'BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表管理',
  '/admin/bpm/bpm-process-definition-info',
  'bpm/bpm-process-definition-info/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'bpm:bpm_process_definition_info:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bpm-process-definition-info-query',  'menu-bpm-process-definition-info', '查询BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_definition_info:query',  1, NOW(), NOW()),
('menu-bpm-process-definition-info-create', 'menu-bpm-process-definition-info', '新增BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_definition_info:create', 2, NOW(), NOW()),
('menu-bpm-process-definition-info-update', 'menu-bpm-process-definition-info', '修改BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_definition_info:update', 3, NOW(), NOW()),
('menu-bpm-process-definition-info-delete', 'menu-bpm-process-definition-info', '删除BPM 流程定义的拓信息主要解决 Flowable 不支持拓展字段，所以新建该表', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_definition_info:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bpm-process-definition-info'),
('1', 'menu-bpm-process-definition-info-query'),
('1', 'menu-bpm-process-definition-info-create'),
('1', 'menu-bpm-process-definition-info-update'),
('1', 'menu-bpm-process-definition-info-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bpm-process-definition-info'),
('1', 'menu-bpm-process-definition-info-query'),
('1', 'menu-bpm-process-definition-info-create'),
('1', 'menu-bpm-process-definition-info-update'),
('1', 'menu-bpm-process-definition-info-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-bpm/contract/bpm-process-expression.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for BPM 流程表达式 (BpmProcessExpression)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bpm-process-expression',
  'bpm-dir',
  'BPM 流程表达式管理',
  '/admin/bpm/bpm-process-expression',
  'bpm/bpm-process-expression/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'bpm:bpm_process_expression:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bpm-process-expression-query',  'menu-bpm-process-expression', '查询BPM 流程表达式', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_expression:query',  1, NOW(), NOW()),
('menu-bpm-process-expression-create', 'menu-bpm-process-expression', '新增BPM 流程表达式', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_expression:create', 2, NOW(), NOW()),
('menu-bpm-process-expression-update', 'menu-bpm-process-expression', '修改BPM 流程表达式', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_expression:update', 3, NOW(), NOW()),
('menu-bpm-process-expression-delete', 'menu-bpm-process-expression', '删除BPM 流程表达式', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_expression:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bpm-process-expression'),
('1', 'menu-bpm-process-expression-query'),
('1', 'menu-bpm-process-expression-create'),
('1', 'menu-bpm-process-expression-update'),
('1', 'menu-bpm-process-expression-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bpm-process-expression'),
('1', 'menu-bpm-process-expression-query'),
('1', 'menu-bpm-process-expression-create'),
('1', 'menu-bpm-process-expression-update'),
('1', 'menu-bpm-process-expression-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-bpm/contract/bpm-process-instance-copy.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 流程抄送 (BpmProcessInstanceCopy)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bpm-process-instance-copy',
  'bpm-dir',
  '流程抄送管理',
  '/admin/bpm/bpm-process-instance-copy',
  'bpm/bpm-process-instance-copy/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'bpm:bpm_process_instance_copy:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bpm-process-instance-copy-query',  'menu-bpm-process-instance-copy', '查询流程抄送', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_instance_copy:query',  1, NOW(), NOW()),
('menu-bpm-process-instance-copy-create', 'menu-bpm-process-instance-copy', '新增流程抄送', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_instance_copy:create', 2, NOW(), NOW()),
('menu-bpm-process-instance-copy-update', 'menu-bpm-process-instance-copy', '修改流程抄送', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_instance_copy:update', 3, NOW(), NOW()),
('menu-bpm-process-instance-copy-delete', 'menu-bpm-process-instance-copy', '删除流程抄送', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_instance_copy:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bpm-process-instance-copy'),
('1', 'menu-bpm-process-instance-copy-query'),
('1', 'menu-bpm-process-instance-copy-create'),
('1', 'menu-bpm-process-instance-copy-update'),
('1', 'menu-bpm-process-instance-copy-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bpm-process-instance-copy'),
('1', 'menu-bpm-process-instance-copy-query'),
('1', 'menu-bpm-process-instance-copy-create'),
('1', 'menu-bpm-process-instance-copy-update'),
('1', 'menu-bpm-process-instance-copy-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-bpm/contract/bpm-process-listener.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计 (BpmProcessListener)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bpm-process-listener',
  'bpm-dir',
  'BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计管理',
  '/admin/bpm/bpm-process-listener',
  'bpm/bpm-process-listener/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'bpm:bpm_process_listener:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bpm-process-listener-query',  'menu-bpm-process-listener', '查询BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_listener:query',  1, NOW(), NOW()),
('menu-bpm-process-listener-create', 'menu-bpm-process-listener', '新增BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_listener:create', 2, NOW(), NOW()),
('menu-bpm-process-listener-update', 'menu-bpm-process-listener', '修改BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_listener:update', 3, NOW(), NOW()),
('menu-bpm-process-listener-delete', 'menu-bpm-process-listener', '删除BPM 流程监听器 DO目的：本质上它是流程监听器的模版，用于 BPMN 在设计', 'BUTTON', 'ACTIVE', 'bpm:bpm_process_listener:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bpm-process-listener'),
('1', 'menu-bpm-process-listener-query'),
('1', 'menu-bpm-process-listener-create'),
('1', 'menu-bpm-process-listener-update'),
('1', 'menu-bpm-process-listener-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bpm-process-listener'),
('1', 'menu-bpm-process-listener-query'),
('1', 'menu-bpm-process-listener-create'),
('1', 'menu-bpm-process-listener-update'),
('1', 'menu-bpm-process-listener-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-bpm/contract/bpm-user-group.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for BPM 用户组 (BpmUserGroup)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bpm-user-group',
  'bpm-dir',
  'BPM 用户组管理',
  '/admin/bpm/bpm-user-group',
  'bpm/bpm-user-group/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'bpm:bpm_user_group:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bpm-user-group-query',  'menu-bpm-user-group', '查询BPM 用户组', 'BUTTON', 'ACTIVE', 'bpm:bpm_user_group:query',  1, NOW(), NOW()),
('menu-bpm-user-group-create', 'menu-bpm-user-group', '新增BPM 用户组', 'BUTTON', 'ACTIVE', 'bpm:bpm_user_group:create', 2, NOW(), NOW()),
('menu-bpm-user-group-update', 'menu-bpm-user-group', '修改BPM 用户组', 'BUTTON', 'ACTIVE', 'bpm:bpm_user_group:update', 3, NOW(), NOW()),
('menu-bpm-user-group-delete', 'menu-bpm-user-group', '删除BPM 用户组', 'BUTTON', 'ACTIVE', 'bpm:bpm_user_group:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bpm-user-group'),
('1', 'menu-bpm-user-group-query'),
('1', 'menu-bpm-user-group-create'),
('1', 'menu-bpm-user-group-update'),
('1', 'menu-bpm-user-group-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bpm-user-group'),
('1', 'menu-bpm-user-group-query'),
('1', 'menu-bpm-user-group-create'),
('1', 'menu-bpm-user-group-update'),
('1', 'menu-bpm-user-group-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-business-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines (CrmBusinessProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-business-product',
  'crm-dir',
  'CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines管理',
  '/admin/crm/crm-business-product',
  'crm/crm-business-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_business_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-business-product-query',  'menu-crm-business-product', '查询CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines', 'BUTTON', 'ACTIVE', 'crm:crm_business_product:query',  1, NOW(), NOW()),
('menu-crm-business-product-create', 'menu-crm-business-product', '新增CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines', 'BUTTON', 'ACTIVE', 'crm:crm_business_product:create', 2, NOW(), NOW()),
('menu-crm-business-product-update', 'menu-crm-business-product', '修改CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines', 'BUTTON', 'ACTIVE', 'crm:crm_business_product:update', 3, NOW(), NOW()),
('menu-crm-business-product-delete', 'menu-crm-business-product', '删除CRM 商机产品关联表 DOCrmBusinessDO : CrmBusines', 'BUTTON', 'ACTIVE', 'crm:crm_business_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-business-product'),
('1', 'menu-crm-business-product-query'),
('1', 'menu-crm-business-product-create'),
('1', 'menu-crm-business-product-update'),
('1', 'menu-crm-business-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-business-product'),
('1', 'menu-crm-business-product-query'),
('1', 'menu-crm-business-product-create'),
('1', 'menu-crm-business-product-update'),
('1', 'menu-crm-business-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-business-status-type.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 商机状态组 DO注意，它是个配置表 (CrmBusinessStatusType)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-business-status-type',
  'crm-dir',
  'CRM 商机状态组 DO注意，它是个配置表管理',
  '/admin/crm/crm-business-status-type',
  'crm/crm-business-status-type/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_business_status_type:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-business-status-type-query',  'menu-crm-business-status-type', '查询CRM 商机状态组 DO注意，它是个配置表', 'BUTTON', 'ACTIVE', 'crm:crm_business_status_type:query',  1, NOW(), NOW()),
('menu-crm-business-status-type-create', 'menu-crm-business-status-type', '新增CRM 商机状态组 DO注意，它是个配置表', 'BUTTON', 'ACTIVE', 'crm:crm_business_status_type:create', 2, NOW(), NOW()),
('menu-crm-business-status-type-update', 'menu-crm-business-status-type', '修改CRM 商机状态组 DO注意，它是个配置表', 'BUTTON', 'ACTIVE', 'crm:crm_business_status_type:update', 3, NOW(), NOW()),
('menu-crm-business-status-type-delete', 'menu-crm-business-status-type', '删除CRM 商机状态组 DO注意，它是个配置表', 'BUTTON', 'ACTIVE', 'crm:crm_business_status_type:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-business-status-type'),
('1', 'menu-crm-business-status-type-query'),
('1', 'menu-crm-business-status-type-create'),
('1', 'menu-crm-business-status-type-update'),
('1', 'menu-crm-business-status-type-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-business-status-type'),
('1', 'menu-crm-business-status-type-query'),
('1', 'menu-crm-business-status-type-create'),
('1', 'menu-crm-business-status-type-update'),
('1', 'menu-crm-business-status-type-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-business-status.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 商机状态 DO注意，它是个配置表 (CrmBusinessStatus)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-business-status',
  'crm-dir',
  'CRM 商机状态 DO注意，它是个配置表管理',
  '/admin/crm/crm-business-status',
  'crm/crm-business-status/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_business_status:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-business-status-query',  'menu-crm-business-status', '查询CRM 商机状态 DO注意，它是个配置表', 'BUTTON', 'ACTIVE', 'crm:crm_business_status:query',  1, NOW(), NOW()),
('menu-crm-business-status-create', 'menu-crm-business-status', '新增CRM 商机状态 DO注意，它是个配置表', 'BUTTON', 'ACTIVE', 'crm:crm_business_status:create', 2, NOW(), NOW()),
('menu-crm-business-status-update', 'menu-crm-business-status', '修改CRM 商机状态 DO注意，它是个配置表', 'BUTTON', 'ACTIVE', 'crm:crm_business_status:update', 3, NOW(), NOW()),
('menu-crm-business-status-delete', 'menu-crm-business-status', '删除CRM 商机状态 DO注意，它是个配置表', 'BUTTON', 'ACTIVE', 'crm:crm_business_status:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-business-status'),
('1', 'menu-crm-business-status-query'),
('1', 'menu-crm-business-status-create'),
('1', 'menu-crm-business-status-update'),
('1', 'menu-crm-business-status-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-business-status'),
('1', 'menu-crm-business-status-query'),
('1', 'menu-crm-business-status-create'),
('1', 'menu-crm-business-status-update'),
('1', 'menu-crm-business-status-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-business.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 商机 (CrmBusiness)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-business',
  'crm-dir',
  'CRM 商机管理',
  '/admin/crm/crm-business',
  'crm/crm-business/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_business:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-business-query',  'menu-crm-business', '查询CRM 商机', 'BUTTON', 'ACTIVE', 'crm:crm_business:query',  1, NOW(), NOW()),
('menu-crm-business-create', 'menu-crm-business', '新增CRM 商机', 'BUTTON', 'ACTIVE', 'crm:crm_business:create', 2, NOW(), NOW()),
('menu-crm-business-update', 'menu-crm-business', '修改CRM 商机', 'BUTTON', 'ACTIVE', 'crm:crm_business:update', 3, NOW(), NOW()),
('menu-crm-business-delete', 'menu-crm-business', '删除CRM 商机', 'BUTTON', 'ACTIVE', 'crm:crm_business:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-business'),
('1', 'menu-crm-business-query'),
('1', 'menu-crm-business-create'),
('1', 'menu-crm-business-update'),
('1', 'menu-crm-business-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-business'),
('1', 'menu-crm-business-query'),
('1', 'menu-crm-business-create'),
('1', 'menu-crm-business-update'),
('1', 'menu-crm-business-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-clue.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 线索 (CrmClue)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-clue',
  'crm-dir',
  'CRM 线索管理',
  '/admin/crm/crm-clue',
  'crm/crm-clue/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_clue:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-clue-query',  'menu-crm-clue', '查询CRM 线索', 'BUTTON', 'ACTIVE', 'crm:crm_clue:query',  1, NOW(), NOW()),
('menu-crm-clue-create', 'menu-crm-clue', '新增CRM 线索', 'BUTTON', 'ACTIVE', 'crm:crm_clue:create', 2, NOW(), NOW()),
('menu-crm-clue-update', 'menu-crm-clue', '修改CRM 线索', 'BUTTON', 'ACTIVE', 'crm:crm_clue:update', 3, NOW(), NOW()),
('menu-crm-clue-delete', 'menu-crm-clue', '删除CRM 线索', 'BUTTON', 'ACTIVE', 'crm:crm_clue:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-clue'),
('1', 'menu-crm-clue-query'),
('1', 'menu-crm-clue-create'),
('1', 'menu-crm-clue-update'),
('1', 'menu-crm-clue-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-clue'),
('1', 'menu-crm-clue-query'),
('1', 'menu-crm-clue-create'),
('1', 'menu-crm-clue-update'),
('1', 'menu-crm-clue-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-contact-business.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 联系人与商机的关联 (CrmContactBusiness)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-contact-business',
  'crm-dir',
  'CRM 联系人与商机的关联管理',
  '/admin/crm/crm-contact-business',
  'crm/crm-contact-business/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_contact_business:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-contact-business-query',  'menu-crm-contact-business', '查询CRM 联系人与商机的关联', 'BUTTON', 'ACTIVE', 'crm:crm_contact_business:query',  1, NOW(), NOW()),
('menu-crm-contact-business-create', 'menu-crm-contact-business', '新增CRM 联系人与商机的关联', 'BUTTON', 'ACTIVE', 'crm:crm_contact_business:create', 2, NOW(), NOW()),
('menu-crm-contact-business-update', 'menu-crm-contact-business', '修改CRM 联系人与商机的关联', 'BUTTON', 'ACTIVE', 'crm:crm_contact_business:update', 3, NOW(), NOW()),
('menu-crm-contact-business-delete', 'menu-crm-contact-business', '删除CRM 联系人与商机的关联', 'BUTTON', 'ACTIVE', 'crm:crm_contact_business:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-contact-business'),
('1', 'menu-crm-contact-business-query'),
('1', 'menu-crm-contact-business-create'),
('1', 'menu-crm-contact-business-update'),
('1', 'menu-crm-contact-business-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-contact-business'),
('1', 'menu-crm-contact-business-query'),
('1', 'menu-crm-contact-business-create'),
('1', 'menu-crm-contact-business-update'),
('1', 'menu-crm-contact-business-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-contact.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 联系人 (CrmContact)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-contact',
  'crm-dir',
  'CRM 联系人管理',
  '/admin/crm/crm-contact',
  'crm/crm-contact/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_contact:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-contact-query',  'menu-crm-contact', '查询CRM 联系人', 'BUTTON', 'ACTIVE', 'crm:crm_contact:query',  1, NOW(), NOW()),
('menu-crm-contact-create', 'menu-crm-contact', '新增CRM 联系人', 'BUTTON', 'ACTIVE', 'crm:crm_contact:create', 2, NOW(), NOW()),
('menu-crm-contact-update', 'menu-crm-contact', '修改CRM 联系人', 'BUTTON', 'ACTIVE', 'crm:crm_contact:update', 3, NOW(), NOW()),
('menu-crm-contact-delete', 'menu-crm-contact', '删除CRM 联系人', 'BUTTON', 'ACTIVE', 'crm:crm_contact:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-contact'),
('1', 'menu-crm-contact-query'),
('1', 'menu-crm-contact-create'),
('1', 'menu-crm-contact-update'),
('1', 'menu-crm-contact-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-contact'),
('1', 'menu-crm-contact-query'),
('1', 'menu-crm-contact-create'),
('1', 'menu-crm-contact-update'),
('1', 'menu-crm-contact-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-contract-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 编号 (CrmContractConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-contract-config',
  'crm-dir',
  '编号管理',
  '/admin/crm/crm-contract-config',
  'crm/crm-contract-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_contract_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-contract-config-query',  'menu-crm-contract-config', '查询编号', 'BUTTON', 'ACTIVE', 'crm:crm_contract_config:query',  1, NOW(), NOW()),
('menu-crm-contract-config-create', 'menu-crm-contract-config', '新增编号', 'BUTTON', 'ACTIVE', 'crm:crm_contract_config:create', 2, NOW(), NOW()),
('menu-crm-contract-config-update', 'menu-crm-contract-config', '修改编号', 'BUTTON', 'ACTIVE', 'crm:crm_contract_config:update', 3, NOW(), NOW()),
('menu-crm-contract-config-delete', 'menu-crm-contract-config', '删除编号', 'BUTTON', 'ACTIVE', 'crm:crm_contract_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-contract-config'),
('1', 'menu-crm-contract-config-query'),
('1', 'menu-crm-contract-config-create'),
('1', 'menu-crm-contract-config-update'),
('1', 'menu-crm-contract-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-contract-config'),
('1', 'menu-crm-contract-config-query'),
('1', 'menu-crm-contract-config-create'),
('1', 'menu-crm-contract-config-update'),
('1', 'menu-crm-contract-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-contract-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 合同产品关联表 (CrmContractProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-contract-product',
  'crm-dir',
  'CRM 合同产品关联表管理',
  '/admin/crm/crm-contract-product',
  'crm/crm-contract-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_contract_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-contract-product-query',  'menu-crm-contract-product', '查询CRM 合同产品关联表', 'BUTTON', 'ACTIVE', 'crm:crm_contract_product:query',  1, NOW(), NOW()),
('menu-crm-contract-product-create', 'menu-crm-contract-product', '新增CRM 合同产品关联表', 'BUTTON', 'ACTIVE', 'crm:crm_contract_product:create', 2, NOW(), NOW()),
('menu-crm-contract-product-update', 'menu-crm-contract-product', '修改CRM 合同产品关联表', 'BUTTON', 'ACTIVE', 'crm:crm_contract_product:update', 3, NOW(), NOW()),
('menu-crm-contract-product-delete', 'menu-crm-contract-product', '删除CRM 合同产品关联表', 'BUTTON', 'ACTIVE', 'crm:crm_contract_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-contract-product'),
('1', 'menu-crm-contract-product-query'),
('1', 'menu-crm-contract-product-create'),
('1', 'menu-crm-contract-product-update'),
('1', 'menu-crm-contract-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-contract-product'),
('1', 'menu-crm-contract-product-query'),
('1', 'menu-crm-contract-product-create'),
('1', 'menu-crm-contract-product-update'),
('1', 'menu-crm-contract-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-contract.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 合同 (CrmContract)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-contract',
  'crm-dir',
  'CRM 合同管理',
  '/admin/crm/crm-contract',
  'crm/crm-contract/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_contract:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-contract-query',  'menu-crm-contract', '查询CRM 合同', 'BUTTON', 'ACTIVE', 'crm:crm_contract:query',  1, NOW(), NOW()),
('menu-crm-contract-create', 'menu-crm-contract', '新增CRM 合同', 'BUTTON', 'ACTIVE', 'crm:crm_contract:create', 2, NOW(), NOW()),
('menu-crm-contract-update', 'menu-crm-contract', '修改CRM 合同', 'BUTTON', 'ACTIVE', 'crm:crm_contract:update', 3, NOW(), NOW()),
('menu-crm-contract-delete', 'menu-crm-contract', '删除CRM 合同', 'BUTTON', 'ACTIVE', 'crm:crm_contract:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-contract'),
('1', 'menu-crm-contract-query'),
('1', 'menu-crm-contract-create'),
('1', 'menu-crm-contract-update'),
('1', 'menu-crm-contract-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-contract'),
('1', 'menu-crm-contract-query'),
('1', 'menu-crm-contract-create'),
('1', 'menu-crm-contract-update'),
('1', 'menu-crm-contract-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-customer-limit-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 客户限制配置 (CrmCustomerLimitConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-customer-limit-config',
  'crm-dir',
  '客户限制配置管理',
  '/admin/crm/crm-customer-limit-config',
  'crm/crm-customer-limit-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_customer_limit_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-customer-limit-config-query',  'menu-crm-customer-limit-config', '查询客户限制配置', 'BUTTON', 'ACTIVE', 'crm:crm_customer_limit_config:query',  1, NOW(), NOW()),
('menu-crm-customer-limit-config-create', 'menu-crm-customer-limit-config', '新增客户限制配置', 'BUTTON', 'ACTIVE', 'crm:crm_customer_limit_config:create', 2, NOW(), NOW()),
('menu-crm-customer-limit-config-update', 'menu-crm-customer-limit-config', '修改客户限制配置', 'BUTTON', 'ACTIVE', 'crm:crm_customer_limit_config:update', 3, NOW(), NOW()),
('menu-crm-customer-limit-config-delete', 'menu-crm-customer-limit-config', '删除客户限制配置', 'BUTTON', 'ACTIVE', 'crm:crm_customer_limit_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-customer-limit-config'),
('1', 'menu-crm-customer-limit-config-query'),
('1', 'menu-crm-customer-limit-config-create'),
('1', 'menu-crm-customer-limit-config-update'),
('1', 'menu-crm-customer-limit-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-customer-limit-config'),
('1', 'menu-crm-customer-limit-config-query'),
('1', 'menu-crm-customer-limit-config-create'),
('1', 'menu-crm-customer-limit-config-update'),
('1', 'menu-crm-customer-limit-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-customer-pool-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 客户公海配置 (CrmCustomerPoolConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-customer-pool-config',
  'crm-dir',
  '客户公海配置管理',
  '/admin/crm/crm-customer-pool-config',
  'crm/crm-customer-pool-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_customer_pool_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-customer-pool-config-query',  'menu-crm-customer-pool-config', '查询客户公海配置', 'BUTTON', 'ACTIVE', 'crm:crm_customer_pool_config:query',  1, NOW(), NOW()),
('menu-crm-customer-pool-config-create', 'menu-crm-customer-pool-config', '新增客户公海配置', 'BUTTON', 'ACTIVE', 'crm:crm_customer_pool_config:create', 2, NOW(), NOW()),
('menu-crm-customer-pool-config-update', 'menu-crm-customer-pool-config', '修改客户公海配置', 'BUTTON', 'ACTIVE', 'crm:crm_customer_pool_config:update', 3, NOW(), NOW()),
('menu-crm-customer-pool-config-delete', 'menu-crm-customer-pool-config', '删除客户公海配置', 'BUTTON', 'ACTIVE', 'crm:crm_customer_pool_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-customer-pool-config'),
('1', 'menu-crm-customer-pool-config-query'),
('1', 'menu-crm-customer-pool-config-create'),
('1', 'menu-crm-customer-pool-config-update'),
('1', 'menu-crm-customer-pool-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-customer-pool-config'),
('1', 'menu-crm-customer-pool-config-query'),
('1', 'menu-crm-customer-pool-config-create'),
('1', 'menu-crm-customer-pool-config-update'),
('1', 'menu-crm-customer-pool-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-customer.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 客户 (CrmCustomer)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-customer',
  'crm-dir',
  'CRM 客户管理',
  '/admin/crm/crm-customer',
  'crm/crm-customer/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_customer:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-customer-query',  'menu-crm-customer', '查询CRM 客户', 'BUTTON', 'ACTIVE', 'crm:crm_customer:query',  1, NOW(), NOW()),
('menu-crm-customer-create', 'menu-crm-customer', '新增CRM 客户', 'BUTTON', 'ACTIVE', 'crm:crm_customer:create', 2, NOW(), NOW()),
('menu-crm-customer-update', 'menu-crm-customer', '修改CRM 客户', 'BUTTON', 'ACTIVE', 'crm:crm_customer:update', 3, NOW(), NOW()),
('menu-crm-customer-delete', 'menu-crm-customer', '删除CRM 客户', 'BUTTON', 'ACTIVE', 'crm:crm_customer:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-customer'),
('1', 'menu-crm-customer-query'),
('1', 'menu-crm-customer-create'),
('1', 'menu-crm-customer-update'),
('1', 'menu-crm-customer-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-customer'),
('1', 'menu-crm-customer-query'),
('1', 'menu-crm-customer-create'),
('1', 'menu-crm-customer-update'),
('1', 'menu-crm-customer-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-follow-up-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 跟进记录 DO用于记录客户、联系人的每一次跟进 (CrmFollowUpRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-follow-up-record',
  'crm-dir',
  '跟进记录 DO用于记录客户、联系人的每一次跟进管理',
  '/admin/crm/crm-follow-up-record',
  'crm/crm-follow-up-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_follow_up_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-follow-up-record-query',  'menu-crm-follow-up-record', '查询跟进记录 DO用于记录客户、联系人的每一次跟进', 'BUTTON', 'ACTIVE', 'crm:crm_follow_up_record:query',  1, NOW(), NOW()),
('menu-crm-follow-up-record-create', 'menu-crm-follow-up-record', '新增跟进记录 DO用于记录客户、联系人的每一次跟进', 'BUTTON', 'ACTIVE', 'crm:crm_follow_up_record:create', 2, NOW(), NOW()),
('menu-crm-follow-up-record-update', 'menu-crm-follow-up-record', '修改跟进记录 DO用于记录客户、联系人的每一次跟进', 'BUTTON', 'ACTIVE', 'crm:crm_follow_up_record:update', 3, NOW(), NOW()),
('menu-crm-follow-up-record-delete', 'menu-crm-follow-up-record', '删除跟进记录 DO用于记录客户、联系人的每一次跟进', 'BUTTON', 'ACTIVE', 'crm:crm_follow_up_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-follow-up-record'),
('1', 'menu-crm-follow-up-record-query'),
('1', 'menu-crm-follow-up-record-create'),
('1', 'menu-crm-follow-up-record-update'),
('1', 'menu-crm-follow-up-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-follow-up-record'),
('1', 'menu-crm-follow-up-record-query'),
('1', 'menu-crm-follow-up-record-create'),
('1', 'menu-crm-follow-up-record-update'),
('1', 'menu-crm-follow-up-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-owner-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 负责人变更记录 (CrmOwnerRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-owner-record',
  'crm-dir',
  'CRM 负责人变更记录管理',
  '/admin/crm/crm-owner-record',
  'crm/crm-owner-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_owner_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-owner-record-query',  'menu-crm-owner-record', '查询CRM 负责人变更记录', 'BUTTON', 'ACTIVE', 'crm:crm_owner_record:query',  1, NOW(), NOW()),
('menu-crm-owner-record-create', 'menu-crm-owner-record', '新增CRM 负责人变更记录', 'BUTTON', 'ACTIVE', 'crm:crm_owner_record:create', 2, NOW(), NOW()),
('menu-crm-owner-record-update', 'menu-crm-owner-record', '修改CRM 负责人变更记录', 'BUTTON', 'ACTIVE', 'crm:crm_owner_record:update', 3, NOW(), NOW()),
('menu-crm-owner-record-delete', 'menu-crm-owner-record', '删除CRM 负责人变更记录', 'BUTTON', 'ACTIVE', 'crm:crm_owner_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-owner-record'),
('1', 'menu-crm-owner-record-query'),
('1', 'menu-crm-owner-record-create'),
('1', 'menu-crm-owner-record-update'),
('1', 'menu-crm-owner-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-owner-record'),
('1', 'menu-crm-owner-record-query'),
('1', 'menu-crm-owner-record-create'),
('1', 'menu-crm-owner-record-update'),
('1', 'menu-crm-owner-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-performance-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 业绩目标 (CrmPerformanceConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-performance-config',
  'crm-dir',
  'CRM 业绩目标管理',
  '/admin/crm/crm-performance-config',
  'crm/crm-performance-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_performance_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-performance-config-query',  'menu-crm-performance-config', '查询CRM 业绩目标', 'BUTTON', 'ACTIVE', 'crm:crm_performance_config:query',  1, NOW(), NOW()),
('menu-crm-performance-config-create', 'menu-crm-performance-config', '新增CRM 业绩目标', 'BUTTON', 'ACTIVE', 'crm:crm_performance_config:create', 2, NOW(), NOW()),
('menu-crm-performance-config-update', 'menu-crm-performance-config', '修改CRM 业绩目标', 'BUTTON', 'ACTIVE', 'crm:crm_performance_config:update', 3, NOW(), NOW()),
('menu-crm-performance-config-delete', 'menu-crm-performance-config', '删除CRM 业绩目标', 'BUTTON', 'ACTIVE', 'crm:crm_performance_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-performance-config'),
('1', 'menu-crm-performance-config-query'),
('1', 'menu-crm-performance-config-create'),
('1', 'menu-crm-performance-config-update'),
('1', 'menu-crm-performance-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-performance-config'),
('1', 'menu-crm-performance-config-query'),
('1', 'menu-crm-performance-config-create'),
('1', 'menu-crm-performance-config-update'),
('1', 'menu-crm-performance-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-permission.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 数据权限 (CrmPermission)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-permission',
  'crm-dir',
  'CRM 数据权限管理',
  '/admin/crm/crm-permission',
  'crm/crm-permission/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_permission:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-permission-query',  'menu-crm-permission', '查询CRM 数据权限', 'BUTTON', 'ACTIVE', 'crm:crm_permission:query',  1, NOW(), NOW()),
('menu-crm-permission-create', 'menu-crm-permission', '新增CRM 数据权限', 'BUTTON', 'ACTIVE', 'crm:crm_permission:create', 2, NOW(), NOW()),
('menu-crm-permission-update', 'menu-crm-permission', '修改CRM 数据权限', 'BUTTON', 'ACTIVE', 'crm:crm_permission:update', 3, NOW(), NOW()),
('menu-crm-permission-delete', 'menu-crm-permission', '删除CRM 数据权限', 'BUTTON', 'ACTIVE', 'crm:crm_permission:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-permission'),
('1', 'menu-crm-permission-query'),
('1', 'menu-crm-permission-create'),
('1', 'menu-crm-permission-update'),
('1', 'menu-crm-permission-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-permission'),
('1', 'menu-crm-permission-query'),
('1', 'menu-crm-permission-create'),
('1', 'menu-crm-permission-update'),
('1', 'menu-crm-permission-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-product-category.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 产品分类 (CrmProductCategory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-product-category',
  'crm-dir',
  '产品分类管理',
  '/admin/crm/crm-product-category',
  'crm/crm-product-category/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_product_category:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-product-category-query',  'menu-crm-product-category', '查询产品分类', 'BUTTON', 'ACTIVE', 'crm:crm_product_category:query',  1, NOW(), NOW()),
('menu-crm-product-category-create', 'menu-crm-product-category', '新增产品分类', 'BUTTON', 'ACTIVE', 'crm:crm_product_category:create', 2, NOW(), NOW()),
('menu-crm-product-category-update', 'menu-crm-product-category', '修改产品分类', 'BUTTON', 'ACTIVE', 'crm:crm_product_category:update', 3, NOW(), NOW()),
('menu-crm-product-category-delete', 'menu-crm-product-category', '删除产品分类', 'BUTTON', 'ACTIVE', 'crm:crm_product_category:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-product-category'),
('1', 'menu-crm-product-category-query'),
('1', 'menu-crm-product-category-create'),
('1', 'menu-crm-product-category-update'),
('1', 'menu-crm-product-category-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-product-category'),
('1', 'menu-crm-product-category-query'),
('1', 'menu-crm-product-category-create'),
('1', 'menu-crm-product-category-update'),
('1', 'menu-crm-product-category-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 产品 (CrmProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-product',
  'crm-dir',
  'CRM 产品管理',
  '/admin/crm/crm-product',
  'crm/crm-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-product-query',  'menu-crm-product', '查询CRM 产品', 'BUTTON', 'ACTIVE', 'crm:crm_product:query',  1, NOW(), NOW()),
('menu-crm-product-create', 'menu-crm-product', '新增CRM 产品', 'BUTTON', 'ACTIVE', 'crm:crm_product:create', 2, NOW(), NOW()),
('menu-crm-product-update', 'menu-crm-product', '修改CRM 产品', 'BUTTON', 'ACTIVE', 'crm:crm_product:update', 3, NOW(), NOW()),
('menu-crm-product-delete', 'menu-crm-product', '删除CRM 产品', 'BUTTON', 'ACTIVE', 'crm:crm_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-product'),
('1', 'menu-crm-product-query'),
('1', 'menu-crm-product-create'),
('1', 'menu-crm-product-update'),
('1', 'menu-crm-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-product'),
('1', 'menu-crm-product-query'),
('1', 'menu-crm-product-create'),
('1', 'menu-crm-product-update'),
('1', 'menu-crm-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-receivable-plan.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for CRM 回款计划 (CrmReceivablePlan)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-receivable-plan',
  'crm-dir',
  'CRM 回款计划管理',
  '/admin/crm/crm-receivable-plan',
  'crm/crm-receivable-plan/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_receivable_plan:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-receivable-plan-query',  'menu-crm-receivable-plan', '查询CRM 回款计划', 'BUTTON', 'ACTIVE', 'crm:crm_receivable_plan:query',  1, NOW(), NOW()),
('menu-crm-receivable-plan-create', 'menu-crm-receivable-plan', '新增CRM 回款计划', 'BUTTON', 'ACTIVE', 'crm:crm_receivable_plan:create', 2, NOW(), NOW()),
('menu-crm-receivable-plan-update', 'menu-crm-receivable-plan', '修改CRM 回款计划', 'BUTTON', 'ACTIVE', 'crm:crm_receivable_plan:update', 3, NOW(), NOW()),
('menu-crm-receivable-plan-delete', 'menu-crm-receivable-plan', '删除CRM 回款计划', 'BUTTON', 'ACTIVE', 'crm:crm_receivable_plan:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-receivable-plan'),
('1', 'menu-crm-receivable-plan-query'),
('1', 'menu-crm-receivable-plan-create'),
('1', 'menu-crm-receivable-plan-update'),
('1', 'menu-crm-receivable-plan-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-receivable-plan'),
('1', 'menu-crm-receivable-plan-query'),
('1', 'menu-crm-receivable-plan-create'),
('1', 'menu-crm-receivable-plan-update'),
('1', 'menu-crm-receivable-plan-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-crm/contract/crm-receivable.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 回款 (CrmReceivable)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-crm-receivable',
  'crm-dir',
  '回款管理',
  '/admin/crm/crm-receivable',
  'crm/crm-receivable/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'crm:crm_receivable:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-crm-receivable-query',  'menu-crm-receivable', '查询回款', 'BUTTON', 'ACTIVE', 'crm:crm_receivable:query',  1, NOW(), NOW()),
('menu-crm-receivable-create', 'menu-crm-receivable', '新增回款', 'BUTTON', 'ACTIVE', 'crm:crm_receivable:create', 2, NOW(), NOW()),
('menu-crm-receivable-update', 'menu-crm-receivable', '修改回款', 'BUTTON', 'ACTIVE', 'crm:crm_receivable:update', 3, NOW(), NOW()),
('menu-crm-receivable-delete', 'menu-crm-receivable', '删除回款', 'BUTTON', 'ACTIVE', 'crm:crm_receivable:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-crm-receivable'),
('1', 'menu-crm-receivable-query'),
('1', 'menu-crm-receivable-create'),
('1', 'menu-crm-receivable-update'),
('1', 'menu-crm-receivable-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-crm-receivable'),
('1', 'menu-crm-receivable-query'),
('1', 'menu-crm-receivable-create'),
('1', 'menu-crm-receivable-update'),
('1', 'menu-crm-receivable-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-account.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 结算账户 (ErpAccount)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-account',
  'erp-dir',
  'ERP 结算账户管理',
  '/admin/erp/erp-account',
  'erp/erp-account/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_account:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-account-query',  'menu-erp-account', '查询ERP 结算账户', 'BUTTON', 'ACTIVE', 'erp:erp_account:query',  1, NOW(), NOW()),
('menu-erp-account-create', 'menu-erp-account', '新增ERP 结算账户', 'BUTTON', 'ACTIVE', 'erp:erp_account:create', 2, NOW(), NOW()),
('menu-erp-account-update', 'menu-erp-account', '修改ERP 结算账户', 'BUTTON', 'ACTIVE', 'erp:erp_account:update', 3, NOW(), NOW()),
('menu-erp-account-delete', 'menu-erp-account', '删除ERP 结算账户', 'BUTTON', 'ACTIVE', 'erp:erp_account:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-account'),
('1', 'menu-erp-account-query'),
('1', 'menu-erp-account-create'),
('1', 'menu-erp-account-update'),
('1', 'menu-erp-account-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-account'),
('1', 'menu-erp-account-query'),
('1', 'menu-erp-account-create'),
('1', 'menu-erp-account-update'),
('1', 'menu-erp-account-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-customer.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 客户 (ErpCustomer)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-customer',
  'erp-dir',
  'ERP 客户管理',
  '/admin/erp/erp-customer',
  'erp/erp-customer/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_customer:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-customer-query',  'menu-erp-customer', '查询ERP 客户', 'BUTTON', 'ACTIVE', 'erp:erp_customer:query',  1, NOW(), NOW()),
('menu-erp-customer-create', 'menu-erp-customer', '新增ERP 客户', 'BUTTON', 'ACTIVE', 'erp:erp_customer:create', 2, NOW(), NOW()),
('menu-erp-customer-update', 'menu-erp-customer', '修改ERP 客户', 'BUTTON', 'ACTIVE', 'erp:erp_customer:update', 3, NOW(), NOW()),
('menu-erp-customer-delete', 'menu-erp-customer', '删除ERP 客户', 'BUTTON', 'ACTIVE', 'erp:erp_customer:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-customer'),
('1', 'menu-erp-customer-query'),
('1', 'menu-erp-customer-create'),
('1', 'menu-erp-customer-update'),
('1', 'menu-erp-customer-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-customer'),
('1', 'menu-erp-customer-query'),
('1', 'menu-erp-customer-create'),
('1', 'menu-erp-customer-update'),
('1', 'menu-erp-customer-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-finance-payment-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 付款项 (ErpFinancePaymentItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-finance-payment-item',
  'erp-dir',
  'ERP 付款项管理',
  '/admin/erp/erp-finance-payment-item',
  'erp/erp-finance-payment-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_finance_payment_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-finance-payment-item-query',  'menu-erp-finance-payment-item', '查询ERP 付款项', 'BUTTON', 'ACTIVE', 'erp:erp_finance_payment_item:query',  1, NOW(), NOW()),
('menu-erp-finance-payment-item-create', 'menu-erp-finance-payment-item', '新增ERP 付款项', 'BUTTON', 'ACTIVE', 'erp:erp_finance_payment_item:create', 2, NOW(), NOW()),
('menu-erp-finance-payment-item-update', 'menu-erp-finance-payment-item', '修改ERP 付款项', 'BUTTON', 'ACTIVE', 'erp:erp_finance_payment_item:update', 3, NOW(), NOW()),
('menu-erp-finance-payment-item-delete', 'menu-erp-finance-payment-item', '删除ERP 付款项', 'BUTTON', 'ACTIVE', 'erp:erp_finance_payment_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-finance-payment-item'),
('1', 'menu-erp-finance-payment-item-query'),
('1', 'menu-erp-finance-payment-item-create'),
('1', 'menu-erp-finance-payment-item-update'),
('1', 'menu-erp-finance-payment-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-finance-payment-item'),
('1', 'menu-erp-finance-payment-item-query'),
('1', 'menu-erp-finance-payment-item-create'),
('1', 'menu-erp-finance-payment-item-update'),
('1', 'menu-erp-finance-payment-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-finance-payment.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 付款单 (ErpFinancePayment)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-finance-payment',
  'erp-dir',
  'ERP 付款单管理',
  '/admin/erp/erp-finance-payment',
  'erp/erp-finance-payment/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_finance_payment:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-finance-payment-query',  'menu-erp-finance-payment', '查询ERP 付款单', 'BUTTON', 'ACTIVE', 'erp:erp_finance_payment:query',  1, NOW(), NOW()),
('menu-erp-finance-payment-create', 'menu-erp-finance-payment', '新增ERP 付款单', 'BUTTON', 'ACTIVE', 'erp:erp_finance_payment:create', 2, NOW(), NOW()),
('menu-erp-finance-payment-update', 'menu-erp-finance-payment', '修改ERP 付款单', 'BUTTON', 'ACTIVE', 'erp:erp_finance_payment:update', 3, NOW(), NOW()),
('menu-erp-finance-payment-delete', 'menu-erp-finance-payment', '删除ERP 付款单', 'BUTTON', 'ACTIVE', 'erp:erp_finance_payment:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-finance-payment'),
('1', 'menu-erp-finance-payment-query'),
('1', 'menu-erp-finance-payment-create'),
('1', 'menu-erp-finance-payment-update'),
('1', 'menu-erp-finance-payment-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-finance-payment'),
('1', 'menu-erp-finance-payment-query'),
('1', 'menu-erp-finance-payment-create'),
('1', 'menu-erp-finance-payment-update'),
('1', 'menu-erp-finance-payment-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-finance-receipt-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 收款项 (ErpFinanceReceiptItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-finance-receipt-item',
  'erp-dir',
  'ERP 收款项管理',
  '/admin/erp/erp-finance-receipt-item',
  'erp/erp-finance-receipt-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_finance_receipt_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-finance-receipt-item-query',  'menu-erp-finance-receipt-item', '查询ERP 收款项', 'BUTTON', 'ACTIVE', 'erp:erp_finance_receipt_item:query',  1, NOW(), NOW()),
('menu-erp-finance-receipt-item-create', 'menu-erp-finance-receipt-item', '新增ERP 收款项', 'BUTTON', 'ACTIVE', 'erp:erp_finance_receipt_item:create', 2, NOW(), NOW()),
('menu-erp-finance-receipt-item-update', 'menu-erp-finance-receipt-item', '修改ERP 收款项', 'BUTTON', 'ACTIVE', 'erp:erp_finance_receipt_item:update', 3, NOW(), NOW()),
('menu-erp-finance-receipt-item-delete', 'menu-erp-finance-receipt-item', '删除ERP 收款项', 'BUTTON', 'ACTIVE', 'erp:erp_finance_receipt_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-finance-receipt-item'),
('1', 'menu-erp-finance-receipt-item-query'),
('1', 'menu-erp-finance-receipt-item-create'),
('1', 'menu-erp-finance-receipt-item-update'),
('1', 'menu-erp-finance-receipt-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-finance-receipt-item'),
('1', 'menu-erp-finance-receipt-item-query'),
('1', 'menu-erp-finance-receipt-item-create'),
('1', 'menu-erp-finance-receipt-item-update'),
('1', 'menu-erp-finance-receipt-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-finance-receipt.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 收款单 (ErpFinanceReceipt)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-finance-receipt',
  'erp-dir',
  'ERP 收款单管理',
  '/admin/erp/erp-finance-receipt',
  'erp/erp-finance-receipt/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_finance_receipt:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-finance-receipt-query',  'menu-erp-finance-receipt', '查询ERP 收款单', 'BUTTON', 'ACTIVE', 'erp:erp_finance_receipt:query',  1, NOW(), NOW()),
('menu-erp-finance-receipt-create', 'menu-erp-finance-receipt', '新增ERP 收款单', 'BUTTON', 'ACTIVE', 'erp:erp_finance_receipt:create', 2, NOW(), NOW()),
('menu-erp-finance-receipt-update', 'menu-erp-finance-receipt', '修改ERP 收款单', 'BUTTON', 'ACTIVE', 'erp:erp_finance_receipt:update', 3, NOW(), NOW()),
('menu-erp-finance-receipt-delete', 'menu-erp-finance-receipt', '删除ERP 收款单', 'BUTTON', 'ACTIVE', 'erp:erp_finance_receipt:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-finance-receipt'),
('1', 'menu-erp-finance-receipt-query'),
('1', 'menu-erp-finance-receipt-create'),
('1', 'menu-erp-finance-receipt-update'),
('1', 'menu-erp-finance-receipt-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-finance-receipt'),
('1', 'menu-erp-finance-receipt-query'),
('1', 'menu-erp-finance-receipt-create'),
('1', 'menu-erp-finance-receipt-update'),
('1', 'menu-erp-finance-receipt-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-product-category.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 产品分类 (ErpProductCategory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-product-category',
  'erp-dir',
  'ERP 产品分类管理',
  '/admin/erp/erp-product-category',
  'erp/erp-product-category/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_product_category:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-product-category-query',  'menu-erp-product-category', '查询ERP 产品分类', 'BUTTON', 'ACTIVE', 'erp:erp_product_category:query',  1, NOW(), NOW()),
('menu-erp-product-category-create', 'menu-erp-product-category', '新增ERP 产品分类', 'BUTTON', 'ACTIVE', 'erp:erp_product_category:create', 2, NOW(), NOW()),
('menu-erp-product-category-update', 'menu-erp-product-category', '修改ERP 产品分类', 'BUTTON', 'ACTIVE', 'erp:erp_product_category:update', 3, NOW(), NOW()),
('menu-erp-product-category-delete', 'menu-erp-product-category', '删除ERP 产品分类', 'BUTTON', 'ACTIVE', 'erp:erp_product_category:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-product-category'),
('1', 'menu-erp-product-category-query'),
('1', 'menu-erp-product-category-create'),
('1', 'menu-erp-product-category-update'),
('1', 'menu-erp-product-category-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-product-category'),
('1', 'menu-erp-product-category-query'),
('1', 'menu-erp-product-category-create'),
('1', 'menu-erp-product-category-update'),
('1', 'menu-erp-product-category-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-product-unit.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 产品单位 (ErpProductUnit)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-product-unit',
  'erp-dir',
  'ERP 产品单位管理',
  '/admin/erp/erp-product-unit',
  'erp/erp-product-unit/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_product_unit:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-product-unit-query',  'menu-erp-product-unit', '查询ERP 产品单位', 'BUTTON', 'ACTIVE', 'erp:erp_product_unit:query',  1, NOW(), NOW()),
('menu-erp-product-unit-create', 'menu-erp-product-unit', '新增ERP 产品单位', 'BUTTON', 'ACTIVE', 'erp:erp_product_unit:create', 2, NOW(), NOW()),
('menu-erp-product-unit-update', 'menu-erp-product-unit', '修改ERP 产品单位', 'BUTTON', 'ACTIVE', 'erp:erp_product_unit:update', 3, NOW(), NOW()),
('menu-erp-product-unit-delete', 'menu-erp-product-unit', '删除ERP 产品单位', 'BUTTON', 'ACTIVE', 'erp:erp_product_unit:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-product-unit'),
('1', 'menu-erp-product-unit-query'),
('1', 'menu-erp-product-unit-create'),
('1', 'menu-erp-product-unit-update'),
('1', 'menu-erp-product-unit-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-product-unit'),
('1', 'menu-erp-product-unit-query'),
('1', 'menu-erp-product-unit-create'),
('1', 'menu-erp-product-unit-update'),
('1', 'menu-erp-product-unit-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 产品 (ErpProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-product',
  'erp-dir',
  'ERP 产品管理',
  '/admin/erp/erp-product',
  'erp/erp-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-product-query',  'menu-erp-product', '查询ERP 产品', 'BUTTON', 'ACTIVE', 'erp:erp_product:query',  1, NOW(), NOW()),
('menu-erp-product-create', 'menu-erp-product', '新增ERP 产品', 'BUTTON', 'ACTIVE', 'erp:erp_product:create', 2, NOW(), NOW()),
('menu-erp-product-update', 'menu-erp-product', '修改ERP 产品', 'BUTTON', 'ACTIVE', 'erp:erp_product:update', 3, NOW(), NOW()),
('menu-erp-product-delete', 'menu-erp-product', '删除ERP 产品', 'BUTTON', 'ACTIVE', 'erp:erp_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-product'),
('1', 'menu-erp-product-query'),
('1', 'menu-erp-product-create'),
('1', 'menu-erp-product-update'),
('1', 'menu-erp-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-product'),
('1', 'menu-erp-product-query'),
('1', 'menu-erp-product-create'),
('1', 'menu-erp-product-update'),
('1', 'menu-erp-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-purchase-in-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 采购入库项 (ErpPurchaseInItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-purchase-in-item',
  'erp-dir',
  'ERP 采购入库项管理',
  '/admin/erp/erp-purchase-in-item',
  'erp/erp-purchase-in-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_purchase_in_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-purchase-in-item-query',  'menu-erp-purchase-in-item', '查询ERP 采购入库项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_in_item:query',  1, NOW(), NOW()),
('menu-erp-purchase-in-item-create', 'menu-erp-purchase-in-item', '新增ERP 采购入库项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_in_item:create', 2, NOW(), NOW()),
('menu-erp-purchase-in-item-update', 'menu-erp-purchase-in-item', '修改ERP 采购入库项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_in_item:update', 3, NOW(), NOW()),
('menu-erp-purchase-in-item-delete', 'menu-erp-purchase-in-item', '删除ERP 采购入库项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_in_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-in-item'),
('1', 'menu-erp-purchase-in-item-query'),
('1', 'menu-erp-purchase-in-item-create'),
('1', 'menu-erp-purchase-in-item-update'),
('1', 'menu-erp-purchase-in-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-in-item'),
('1', 'menu-erp-purchase-in-item-query'),
('1', 'menu-erp-purchase-in-item-create'),
('1', 'menu-erp-purchase-in-item-update'),
('1', 'menu-erp-purchase-in-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-purchase-in.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 采购入库 (ErpPurchaseIn)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-purchase-in',
  'erp-dir',
  'ERP 采购入库管理',
  '/admin/erp/erp-purchase-in',
  'erp/erp-purchase-in/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_purchase_in:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-purchase-in-query',  'menu-erp-purchase-in', '查询ERP 采购入库', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_in:query',  1, NOW(), NOW()),
('menu-erp-purchase-in-create', 'menu-erp-purchase-in', '新增ERP 采购入库', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_in:create', 2, NOW(), NOW()),
('menu-erp-purchase-in-update', 'menu-erp-purchase-in', '修改ERP 采购入库', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_in:update', 3, NOW(), NOW()),
('menu-erp-purchase-in-delete', 'menu-erp-purchase-in', '删除ERP 采购入库', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_in:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-in'),
('1', 'menu-erp-purchase-in-query'),
('1', 'menu-erp-purchase-in-create'),
('1', 'menu-erp-purchase-in-update'),
('1', 'menu-erp-purchase-in-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-in'),
('1', 'menu-erp-purchase-in-query'),
('1', 'menu-erp-purchase-in-create'),
('1', 'menu-erp-purchase-in-update'),
('1', 'menu-erp-purchase-in-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-purchase-order-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 采购订单项 (ErpPurchaseOrderItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-purchase-order-item',
  'erp-dir',
  'ERP 采购订单项管理',
  '/admin/erp/erp-purchase-order-item',
  'erp/erp-purchase-order-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_purchase_order_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-purchase-order-item-query',  'menu-erp-purchase-order-item', '查询ERP 采购订单项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_order_item:query',  1, NOW(), NOW()),
('menu-erp-purchase-order-item-create', 'menu-erp-purchase-order-item', '新增ERP 采购订单项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_order_item:create', 2, NOW(), NOW()),
('menu-erp-purchase-order-item-update', 'menu-erp-purchase-order-item', '修改ERP 采购订单项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_order_item:update', 3, NOW(), NOW()),
('menu-erp-purchase-order-item-delete', 'menu-erp-purchase-order-item', '删除ERP 采购订单项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_order_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-order-item'),
('1', 'menu-erp-purchase-order-item-query'),
('1', 'menu-erp-purchase-order-item-create'),
('1', 'menu-erp-purchase-order-item-update'),
('1', 'menu-erp-purchase-order-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-order-item'),
('1', 'menu-erp-purchase-order-item-query'),
('1', 'menu-erp-purchase-order-item-create'),
('1', 'menu-erp-purchase-order-item-update'),
('1', 'menu-erp-purchase-order-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-purchase-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 采购订单 (ErpPurchaseOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-purchase-order',
  'erp-dir',
  'ERP 采购订单管理',
  '/admin/erp/erp-purchase-order',
  'erp/erp-purchase-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_purchase_order:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-purchase-order-query',  'menu-erp-purchase-order', '查询ERP 采购订单', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_order:query',  1, NOW(), NOW()),
('menu-erp-purchase-order-create', 'menu-erp-purchase-order', '新增ERP 采购订单', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_order:create', 2, NOW(), NOW()),
('menu-erp-purchase-order-update', 'menu-erp-purchase-order', '修改ERP 采购订单', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_order:update', 3, NOW(), NOW()),
('menu-erp-purchase-order-delete', 'menu-erp-purchase-order', '删除ERP 采购订单', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_order:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-order'),
('1', 'menu-erp-purchase-order-query'),
('1', 'menu-erp-purchase-order-create'),
('1', 'menu-erp-purchase-order-update'),
('1', 'menu-erp-purchase-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-order'),
('1', 'menu-erp-purchase-order-query'),
('1', 'menu-erp-purchase-order-create'),
('1', 'menu-erp-purchase-order-update'),
('1', 'menu-erp-purchase-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-purchase-return-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 采购退货项 (ErpPurchaseReturnItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-purchase-return-item',
  'erp-dir',
  'ERP 采购退货项管理',
  '/admin/erp/erp-purchase-return-item',
  'erp/erp-purchase-return-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_purchase_return_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-purchase-return-item-query',  'menu-erp-purchase-return-item', '查询ERP 采购退货项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_return_item:query',  1, NOW(), NOW()),
('menu-erp-purchase-return-item-create', 'menu-erp-purchase-return-item', '新增ERP 采购退货项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_return_item:create', 2, NOW(), NOW()),
('menu-erp-purchase-return-item-update', 'menu-erp-purchase-return-item', '修改ERP 采购退货项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_return_item:update', 3, NOW(), NOW()),
('menu-erp-purchase-return-item-delete', 'menu-erp-purchase-return-item', '删除ERP 采购退货项', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_return_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-return-item'),
('1', 'menu-erp-purchase-return-item-query'),
('1', 'menu-erp-purchase-return-item-create'),
('1', 'menu-erp-purchase-return-item-update'),
('1', 'menu-erp-purchase-return-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-return-item'),
('1', 'menu-erp-purchase-return-item-query'),
('1', 'menu-erp-purchase-return-item-create'),
('1', 'menu-erp-purchase-return-item-update'),
('1', 'menu-erp-purchase-return-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-purchase-return.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 采购退货 (ErpPurchaseReturn)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-purchase-return',
  'erp-dir',
  'ERP 采购退货管理',
  '/admin/erp/erp-purchase-return',
  'erp/erp-purchase-return/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_purchase_return:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-purchase-return-query',  'menu-erp-purchase-return', '查询ERP 采购退货', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_return:query',  1, NOW(), NOW()),
('menu-erp-purchase-return-create', 'menu-erp-purchase-return', '新增ERP 采购退货', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_return:create', 2, NOW(), NOW()),
('menu-erp-purchase-return-update', 'menu-erp-purchase-return', '修改ERP 采购退货', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_return:update', 3, NOW(), NOW()),
('menu-erp-purchase-return-delete', 'menu-erp-purchase-return', '删除ERP 采购退货', 'BUTTON', 'ACTIVE', 'erp:erp_purchase_return:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-return'),
('1', 'menu-erp-purchase-return-query'),
('1', 'menu-erp-purchase-return-create'),
('1', 'menu-erp-purchase-return-update'),
('1', 'menu-erp-purchase-return-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-purchase-return'),
('1', 'menu-erp-purchase-return-query'),
('1', 'menu-erp-purchase-return-create'),
('1', 'menu-erp-purchase-return-update'),
('1', 'menu-erp-purchase-return-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-sale-order-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 销售订单项 (ErpSaleOrderItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-sale-order-item',
  'erp-dir',
  'ERP 销售订单项管理',
  '/admin/erp/erp-sale-order-item',
  'erp/erp-sale-order-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_sale_order_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-sale-order-item-query',  'menu-erp-sale-order-item', '查询ERP 销售订单项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_order_item:query',  1, NOW(), NOW()),
('menu-erp-sale-order-item-create', 'menu-erp-sale-order-item', '新增ERP 销售订单项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_order_item:create', 2, NOW(), NOW()),
('menu-erp-sale-order-item-update', 'menu-erp-sale-order-item', '修改ERP 销售订单项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_order_item:update', 3, NOW(), NOW()),
('menu-erp-sale-order-item-delete', 'menu-erp-sale-order-item', '删除ERP 销售订单项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_order_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-order-item'),
('1', 'menu-erp-sale-order-item-query'),
('1', 'menu-erp-sale-order-item-create'),
('1', 'menu-erp-sale-order-item-update'),
('1', 'menu-erp-sale-order-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-order-item'),
('1', 'menu-erp-sale-order-item-query'),
('1', 'menu-erp-sale-order-item-create'),
('1', 'menu-erp-sale-order-item-update'),
('1', 'menu-erp-sale-order-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-sale-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 销售订单 (ErpSaleOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-sale-order',
  'erp-dir',
  'ERP 销售订单管理',
  '/admin/erp/erp-sale-order',
  'erp/erp-sale-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_sale_order:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-sale-order-query',  'menu-erp-sale-order', '查询ERP 销售订单', 'BUTTON', 'ACTIVE', 'erp:erp_sale_order:query',  1, NOW(), NOW()),
('menu-erp-sale-order-create', 'menu-erp-sale-order', '新增ERP 销售订单', 'BUTTON', 'ACTIVE', 'erp:erp_sale_order:create', 2, NOW(), NOW()),
('menu-erp-sale-order-update', 'menu-erp-sale-order', '修改ERP 销售订单', 'BUTTON', 'ACTIVE', 'erp:erp_sale_order:update', 3, NOW(), NOW()),
('menu-erp-sale-order-delete', 'menu-erp-sale-order', '删除ERP 销售订单', 'BUTTON', 'ACTIVE', 'erp:erp_sale_order:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-order'),
('1', 'menu-erp-sale-order-query'),
('1', 'menu-erp-sale-order-create'),
('1', 'menu-erp-sale-order-update'),
('1', 'menu-erp-sale-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-order'),
('1', 'menu-erp-sale-order-query'),
('1', 'menu-erp-sale-order-create'),
('1', 'menu-erp-sale-order-update'),
('1', 'menu-erp-sale-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-sale-out-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 销售出库项 (ErpSaleOutItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-sale-out-item',
  'erp-dir',
  'ERP 销售出库项管理',
  '/admin/erp/erp-sale-out-item',
  'erp/erp-sale-out-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_sale_out_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-sale-out-item-query',  'menu-erp-sale-out-item', '查询ERP 销售出库项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_out_item:query',  1, NOW(), NOW()),
('menu-erp-sale-out-item-create', 'menu-erp-sale-out-item', '新增ERP 销售出库项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_out_item:create', 2, NOW(), NOW()),
('menu-erp-sale-out-item-update', 'menu-erp-sale-out-item', '修改ERP 销售出库项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_out_item:update', 3, NOW(), NOW()),
('menu-erp-sale-out-item-delete', 'menu-erp-sale-out-item', '删除ERP 销售出库项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_out_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-out-item'),
('1', 'menu-erp-sale-out-item-query'),
('1', 'menu-erp-sale-out-item-create'),
('1', 'menu-erp-sale-out-item-update'),
('1', 'menu-erp-sale-out-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-out-item'),
('1', 'menu-erp-sale-out-item-query'),
('1', 'menu-erp-sale-out-item-create'),
('1', 'menu-erp-sale-out-item-update'),
('1', 'menu-erp-sale-out-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-sale-out.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 销售出库 (ErpSaleOut)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-sale-out',
  'erp-dir',
  'ERP 销售出库管理',
  '/admin/erp/erp-sale-out',
  'erp/erp-sale-out/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_sale_out:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-sale-out-query',  'menu-erp-sale-out', '查询ERP 销售出库', 'BUTTON', 'ACTIVE', 'erp:erp_sale_out:query',  1, NOW(), NOW()),
('menu-erp-sale-out-create', 'menu-erp-sale-out', '新增ERP 销售出库', 'BUTTON', 'ACTIVE', 'erp:erp_sale_out:create', 2, NOW(), NOW()),
('menu-erp-sale-out-update', 'menu-erp-sale-out', '修改ERP 销售出库', 'BUTTON', 'ACTIVE', 'erp:erp_sale_out:update', 3, NOW(), NOW()),
('menu-erp-sale-out-delete', 'menu-erp-sale-out', '删除ERP 销售出库', 'BUTTON', 'ACTIVE', 'erp:erp_sale_out:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-out'),
('1', 'menu-erp-sale-out-query'),
('1', 'menu-erp-sale-out-create'),
('1', 'menu-erp-sale-out-update'),
('1', 'menu-erp-sale-out-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-out'),
('1', 'menu-erp-sale-out-query'),
('1', 'menu-erp-sale-out-create'),
('1', 'menu-erp-sale-out-update'),
('1', 'menu-erp-sale-out-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-sale-return-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 销售退货项 (ErpSaleReturnItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-sale-return-item',
  'erp-dir',
  'ERP 销售退货项管理',
  '/admin/erp/erp-sale-return-item',
  'erp/erp-sale-return-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_sale_return_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-sale-return-item-query',  'menu-erp-sale-return-item', '查询ERP 销售退货项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_return_item:query',  1, NOW(), NOW()),
('menu-erp-sale-return-item-create', 'menu-erp-sale-return-item', '新增ERP 销售退货项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_return_item:create', 2, NOW(), NOW()),
('menu-erp-sale-return-item-update', 'menu-erp-sale-return-item', '修改ERP 销售退货项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_return_item:update', 3, NOW(), NOW()),
('menu-erp-sale-return-item-delete', 'menu-erp-sale-return-item', '删除ERP 销售退货项', 'BUTTON', 'ACTIVE', 'erp:erp_sale_return_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-return-item'),
('1', 'menu-erp-sale-return-item-query'),
('1', 'menu-erp-sale-return-item-create'),
('1', 'menu-erp-sale-return-item-update'),
('1', 'menu-erp-sale-return-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-return-item'),
('1', 'menu-erp-sale-return-item-query'),
('1', 'menu-erp-sale-return-item-create'),
('1', 'menu-erp-sale-return-item-update'),
('1', 'menu-erp-sale-return-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-sale-return.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 销售退货 (ErpSaleReturn)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-sale-return',
  'erp-dir',
  'ERP 销售退货管理',
  '/admin/erp/erp-sale-return',
  'erp/erp-sale-return/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_sale_return:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-sale-return-query',  'menu-erp-sale-return', '查询ERP 销售退货', 'BUTTON', 'ACTIVE', 'erp:erp_sale_return:query',  1, NOW(), NOW()),
('menu-erp-sale-return-create', 'menu-erp-sale-return', '新增ERP 销售退货', 'BUTTON', 'ACTIVE', 'erp:erp_sale_return:create', 2, NOW(), NOW()),
('menu-erp-sale-return-update', 'menu-erp-sale-return', '修改ERP 销售退货', 'BUTTON', 'ACTIVE', 'erp:erp_sale_return:update', 3, NOW(), NOW()),
('menu-erp-sale-return-delete', 'menu-erp-sale-return', '删除ERP 销售退货', 'BUTTON', 'ACTIVE', 'erp:erp_sale_return:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-return'),
('1', 'menu-erp-sale-return-query'),
('1', 'menu-erp-sale-return-create'),
('1', 'menu-erp-sale-return-update'),
('1', 'menu-erp-sale-return-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-sale-return'),
('1', 'menu-erp-sale-return-query'),
('1', 'menu-erp-sale-return-create'),
('1', 'menu-erp-sale-return-update'),
('1', 'menu-erp-sale-return-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-check-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 库存盘点单项 (ErpStockCheckItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-check-item',
  'erp-dir',
  'ERP 库存盘点单项管理',
  '/admin/erp/erp-stock-check-item',
  'erp/erp-stock-check-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_check_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-check-item-query',  'menu-erp-stock-check-item', '查询ERP 库存盘点单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_check_item:query',  1, NOW(), NOW()),
('menu-erp-stock-check-item-create', 'menu-erp-stock-check-item', '新增ERP 库存盘点单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_check_item:create', 2, NOW(), NOW()),
('menu-erp-stock-check-item-update', 'menu-erp-stock-check-item', '修改ERP 库存盘点单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_check_item:update', 3, NOW(), NOW()),
('menu-erp-stock-check-item-delete', 'menu-erp-stock-check-item', '删除ERP 库存盘点单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_check_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-check-item'),
('1', 'menu-erp-stock-check-item-query'),
('1', 'menu-erp-stock-check-item-create'),
('1', 'menu-erp-stock-check-item-update'),
('1', 'menu-erp-stock-check-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-check-item'),
('1', 'menu-erp-stock-check-item-query'),
('1', 'menu-erp-stock-check-item-create'),
('1', 'menu-erp-stock-check-item-update'),
('1', 'menu-erp-stock-check-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-check.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 库存盘点单 (ErpStockCheck)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-check',
  'erp-dir',
  'ERP 库存盘点单管理',
  '/admin/erp/erp-stock-check',
  'erp/erp-stock-check/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_check:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-check-query',  'menu-erp-stock-check', '查询ERP 库存盘点单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_check:query',  1, NOW(), NOW()),
('menu-erp-stock-check-create', 'menu-erp-stock-check', '新增ERP 库存盘点单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_check:create', 2, NOW(), NOW()),
('menu-erp-stock-check-update', 'menu-erp-stock-check', '修改ERP 库存盘点单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_check:update', 3, NOW(), NOW()),
('menu-erp-stock-check-delete', 'menu-erp-stock-check', '删除ERP 库存盘点单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_check:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-check'),
('1', 'menu-erp-stock-check-query'),
('1', 'menu-erp-stock-check-create'),
('1', 'menu-erp-stock-check-update'),
('1', 'menu-erp-stock-check-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-check'),
('1', 'menu-erp-stock-check-query'),
('1', 'menu-erp-stock-check-create'),
('1', 'menu-erp-stock-check-update'),
('1', 'menu-erp-stock-check-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-in-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 其它入库单项 (ErpStockInItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-in-item',
  'erp-dir',
  'ERP 其它入库单项管理',
  '/admin/erp/erp-stock-in-item',
  'erp/erp-stock-in-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_in_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-in-item-query',  'menu-erp-stock-in-item', '查询ERP 其它入库单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_in_item:query',  1, NOW(), NOW()),
('menu-erp-stock-in-item-create', 'menu-erp-stock-in-item', '新增ERP 其它入库单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_in_item:create', 2, NOW(), NOW()),
('menu-erp-stock-in-item-update', 'menu-erp-stock-in-item', '修改ERP 其它入库单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_in_item:update', 3, NOW(), NOW()),
('menu-erp-stock-in-item-delete', 'menu-erp-stock-in-item', '删除ERP 其它入库单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_in_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-in-item'),
('1', 'menu-erp-stock-in-item-query'),
('1', 'menu-erp-stock-in-item-create'),
('1', 'menu-erp-stock-in-item-update'),
('1', 'menu-erp-stock-in-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-in-item'),
('1', 'menu-erp-stock-in-item-query'),
('1', 'menu-erp-stock-in-item-create'),
('1', 'menu-erp-stock-in-item-update'),
('1', 'menu-erp-stock-in-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-in.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 其它入库单 (ErpStockIn)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-in',
  'erp-dir',
  'ERP 其它入库单管理',
  '/admin/erp/erp-stock-in',
  'erp/erp-stock-in/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_in:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-in-query',  'menu-erp-stock-in', '查询ERP 其它入库单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_in:query',  1, NOW(), NOW()),
('menu-erp-stock-in-create', 'menu-erp-stock-in', '新增ERP 其它入库单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_in:create', 2, NOW(), NOW()),
('menu-erp-stock-in-update', 'menu-erp-stock-in', '修改ERP 其它入库单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_in:update', 3, NOW(), NOW()),
('menu-erp-stock-in-delete', 'menu-erp-stock-in', '删除ERP 其它入库单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_in:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-in'),
('1', 'menu-erp-stock-in-query'),
('1', 'menu-erp-stock-in-create'),
('1', 'menu-erp-stock-in-update'),
('1', 'menu-erp-stock-in-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-in'),
('1', 'menu-erp-stock-in-query'),
('1', 'menu-erp-stock-in-create'),
('1', 'menu-erp-stock-in-update'),
('1', 'menu-erp-stock-in-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-move-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 库存调拨单项 (ErpStockMoveItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-move-item',
  'erp-dir',
  'ERP 库存调拨单项管理',
  '/admin/erp/erp-stock-move-item',
  'erp/erp-stock-move-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_move_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-move-item-query',  'menu-erp-stock-move-item', '查询ERP 库存调拨单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_move_item:query',  1, NOW(), NOW()),
('menu-erp-stock-move-item-create', 'menu-erp-stock-move-item', '新增ERP 库存调拨单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_move_item:create', 2, NOW(), NOW()),
('menu-erp-stock-move-item-update', 'menu-erp-stock-move-item', '修改ERP 库存调拨单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_move_item:update', 3, NOW(), NOW()),
('menu-erp-stock-move-item-delete', 'menu-erp-stock-move-item', '删除ERP 库存调拨单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_move_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-move-item'),
('1', 'menu-erp-stock-move-item-query'),
('1', 'menu-erp-stock-move-item-create'),
('1', 'menu-erp-stock-move-item-update'),
('1', 'menu-erp-stock-move-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-move-item'),
('1', 'menu-erp-stock-move-item-query'),
('1', 'menu-erp-stock-move-item-create'),
('1', 'menu-erp-stock-move-item-update'),
('1', 'menu-erp-stock-move-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-move.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 库存调拨单 (ErpStockMove)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-move',
  'erp-dir',
  'ERP 库存调拨单管理',
  '/admin/erp/erp-stock-move',
  'erp/erp-stock-move/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_move:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-move-query',  'menu-erp-stock-move', '查询ERP 库存调拨单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_move:query',  1, NOW(), NOW()),
('menu-erp-stock-move-create', 'menu-erp-stock-move', '新增ERP 库存调拨单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_move:create', 2, NOW(), NOW()),
('menu-erp-stock-move-update', 'menu-erp-stock-move', '修改ERP 库存调拨单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_move:update', 3, NOW(), NOW()),
('menu-erp-stock-move-delete', 'menu-erp-stock-move', '删除ERP 库存调拨单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_move:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-move'),
('1', 'menu-erp-stock-move-query'),
('1', 'menu-erp-stock-move-create'),
('1', 'menu-erp-stock-move-update'),
('1', 'menu-erp-stock-move-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-move'),
('1', 'menu-erp-stock-move-query'),
('1', 'menu-erp-stock-move-create'),
('1', 'menu-erp-stock-move-update'),
('1', 'menu-erp-stock-move-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-out-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 其它出库单项 (ErpStockOutItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-out-item',
  'erp-dir',
  'ERP 其它出库单项管理',
  '/admin/erp/erp-stock-out-item',
  'erp/erp-stock-out-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_out_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-out-item-query',  'menu-erp-stock-out-item', '查询ERP 其它出库单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_out_item:query',  1, NOW(), NOW()),
('menu-erp-stock-out-item-create', 'menu-erp-stock-out-item', '新增ERP 其它出库单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_out_item:create', 2, NOW(), NOW()),
('menu-erp-stock-out-item-update', 'menu-erp-stock-out-item', '修改ERP 其它出库单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_out_item:update', 3, NOW(), NOW()),
('menu-erp-stock-out-item-delete', 'menu-erp-stock-out-item', '删除ERP 其它出库单项', 'BUTTON', 'ACTIVE', 'erp:erp_stock_out_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-out-item'),
('1', 'menu-erp-stock-out-item-query'),
('1', 'menu-erp-stock-out-item-create'),
('1', 'menu-erp-stock-out-item-update'),
('1', 'menu-erp-stock-out-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-out-item'),
('1', 'menu-erp-stock-out-item-query'),
('1', 'menu-erp-stock-out-item-create'),
('1', 'menu-erp-stock-out-item-update'),
('1', 'menu-erp-stock-out-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-out.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 其它出库单 (ErpStockOut)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-out',
  'erp-dir',
  'ERP 其它出库单管理',
  '/admin/erp/erp-stock-out',
  'erp/erp-stock-out/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_out:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-out-query',  'menu-erp-stock-out', '查询ERP 其它出库单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_out:query',  1, NOW(), NOW()),
('menu-erp-stock-out-create', 'menu-erp-stock-out', '新增ERP 其它出库单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_out:create', 2, NOW(), NOW()),
('menu-erp-stock-out-update', 'menu-erp-stock-out', '修改ERP 其它出库单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_out:update', 3, NOW(), NOW()),
('menu-erp-stock-out-delete', 'menu-erp-stock-out', '删除ERP 其它出库单', 'BUTTON', 'ACTIVE', 'erp:erp_stock_out:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-out'),
('1', 'menu-erp-stock-out-query'),
('1', 'menu-erp-stock-out-create'),
('1', 'menu-erp-stock-out-update'),
('1', 'menu-erp-stock-out-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-out'),
('1', 'menu-erp-stock-out-query'),
('1', 'menu-erp-stock-out-create'),
('1', 'menu-erp-stock-out-update'),
('1', 'menu-erp-stock-out-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 产品库存明细 (ErpStockRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock-record',
  'erp-dir',
  'ERP 产品库存明细管理',
  '/admin/erp/erp-stock-record',
  'erp/erp-stock-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-record-query',  'menu-erp-stock-record', '查询ERP 产品库存明细', 'BUTTON', 'ACTIVE', 'erp:erp_stock_record:query',  1, NOW(), NOW()),
('menu-erp-stock-record-create', 'menu-erp-stock-record', '新增ERP 产品库存明细', 'BUTTON', 'ACTIVE', 'erp:erp_stock_record:create', 2, NOW(), NOW()),
('menu-erp-stock-record-update', 'menu-erp-stock-record', '修改ERP 产品库存明细', 'BUTTON', 'ACTIVE', 'erp:erp_stock_record:update', 3, NOW(), NOW()),
('menu-erp-stock-record-delete', 'menu-erp-stock-record', '删除ERP 产品库存明细', 'BUTTON', 'ACTIVE', 'erp:erp_stock_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-record'),
('1', 'menu-erp-stock-record-query'),
('1', 'menu-erp-stock-record-create'),
('1', 'menu-erp-stock-record-update'),
('1', 'menu-erp-stock-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock-record'),
('1', 'menu-erp-stock-record-query'),
('1', 'menu-erp-stock-record-create'),
('1', 'menu-erp-stock-record-update'),
('1', 'menu-erp-stock-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-stock.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 产品库存 (ErpStock)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-stock',
  'erp-dir',
  'ERP 产品库存管理',
  '/admin/erp/erp-stock',
  'erp/erp-stock/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_stock:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-stock-query',  'menu-erp-stock', '查询ERP 产品库存', 'BUTTON', 'ACTIVE', 'erp:erp_stock:query',  1, NOW(), NOW()),
('menu-erp-stock-create', 'menu-erp-stock', '新增ERP 产品库存', 'BUTTON', 'ACTIVE', 'erp:erp_stock:create', 2, NOW(), NOW()),
('menu-erp-stock-update', 'menu-erp-stock', '修改ERP 产品库存', 'BUTTON', 'ACTIVE', 'erp:erp_stock:update', 3, NOW(), NOW()),
('menu-erp-stock-delete', 'menu-erp-stock', '删除ERP 产品库存', 'BUTTON', 'ACTIVE', 'erp:erp_stock:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-stock'),
('1', 'menu-erp-stock-query'),
('1', 'menu-erp-stock-create'),
('1', 'menu-erp-stock-update'),
('1', 'menu-erp-stock-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-stock'),
('1', 'menu-erp-stock-query'),
('1', 'menu-erp-stock-create'),
('1', 'menu-erp-stock-update'),
('1', 'menu-erp-stock-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-supplier.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 供应商 (ErpSupplier)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-supplier',
  'erp-dir',
  'ERP 供应商管理',
  '/admin/erp/erp-supplier',
  'erp/erp-supplier/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_supplier:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-supplier-query',  'menu-erp-supplier', '查询ERP 供应商', 'BUTTON', 'ACTIVE', 'erp:erp_supplier:query',  1, NOW(), NOW()),
('menu-erp-supplier-create', 'menu-erp-supplier', '新增ERP 供应商', 'BUTTON', 'ACTIVE', 'erp:erp_supplier:create', 2, NOW(), NOW()),
('menu-erp-supplier-update', 'menu-erp-supplier', '修改ERP 供应商', 'BUTTON', 'ACTIVE', 'erp:erp_supplier:update', 3, NOW(), NOW()),
('menu-erp-supplier-delete', 'menu-erp-supplier', '删除ERP 供应商', 'BUTTON', 'ACTIVE', 'erp:erp_supplier:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-supplier'),
('1', 'menu-erp-supplier-query'),
('1', 'menu-erp-supplier-create'),
('1', 'menu-erp-supplier-update'),
('1', 'menu-erp-supplier-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-supplier'),
('1', 'menu-erp-supplier-query'),
('1', 'menu-erp-supplier-create'),
('1', 'menu-erp-supplier-update'),
('1', 'menu-erp-supplier-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-erp/contract/erp-warehouse.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for ERP 仓库 (ErpWarehouse)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-erp-warehouse',
  'erp-dir',
  'ERP 仓库管理',
  '/admin/erp/erp-warehouse',
  'erp/erp-warehouse/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'erp:erp_warehouse:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-erp-warehouse-query',  'menu-erp-warehouse', '查询ERP 仓库', 'BUTTON', 'ACTIVE', 'erp:erp_warehouse:query',  1, NOW(), NOW()),
('menu-erp-warehouse-create', 'menu-erp-warehouse', '新增ERP 仓库', 'BUTTON', 'ACTIVE', 'erp:erp_warehouse:create', 2, NOW(), NOW()),
('menu-erp-warehouse-update', 'menu-erp-warehouse', '修改ERP 仓库', 'BUTTON', 'ACTIVE', 'erp:erp_warehouse:update', 3, NOW(), NOW()),
('menu-erp-warehouse-delete', 'menu-erp-warehouse', '删除ERP 仓库', 'BUTTON', 'ACTIVE', 'erp:erp_warehouse:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-erp-warehouse'),
('1', 'menu-erp-warehouse-query'),
('1', 'menu-erp-warehouse-create'),
('1', 'menu-erp-warehouse-update'),
('1', 'menu-erp-warehouse-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-erp-warehouse'),
('1', 'menu-erp-warehouse-query'),
('1', 'menu-erp-warehouse-create'),
('1', 'menu-erp-warehouse-update'),
('1', 'menu-erp-warehouse-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-fms/contract/fms-account.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 资金账户 (FmsAccount)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-fms-account',
  'fms-dir',
  '资金账户管理',
  '/admin/fms/fms-account',
  'fms/fms-account/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'fms:account:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-fms-account-query',  'menu-fms-account', '查询资金账户', 'BUTTON', 'ACTIVE', 'fms:account:query',  1, NOW(), NOW()),
('menu-fms-account-create', 'menu-fms-account', '新增资金账户', 'BUTTON', 'ACTIVE', 'fms:account:create', 2, NOW(), NOW()),
('menu-fms-account-update', 'menu-fms-account', '修改资金账户', 'BUTTON', 'ACTIVE', 'fms:account:update', 3, NOW(), NOW()),
('menu-fms-account-delete', 'menu-fms-account', '删除资金账户', 'BUTTON', 'ACTIVE', 'fms:account:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-fms-account'),
('1', 'menu-fms-account-query'),
('1', 'menu-fms-account-create'),
('1', 'menu-fms-account-update'),
('1', 'menu-fms-account-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-fms-account'),
('1', 'menu-fms-account-query'),
('1', 'menu-fms-account-create'),
('1', 'menu-fms-account-update'),
('1', 'menu-fms-account-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-fms/contract/fms-reconcile.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 对账结算 (FmsReconcile)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-fms-reconcile',
  'fms-dir',
  '对账结算管理',
  '/admin/fms/fms-reconcile',
  'fms/fms-reconcile/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'fms:reconcile:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-fms-reconcile-query',  'menu-fms-reconcile', '查询对账结算', 'BUTTON', 'ACTIVE', 'fms:reconcile:query',  1, NOW(), NOW()),
('menu-fms-reconcile-create', 'menu-fms-reconcile', '新增对账结算', 'BUTTON', 'ACTIVE', 'fms:reconcile:create', 2, NOW(), NOW()),
('menu-fms-reconcile-update', 'menu-fms-reconcile', '修改对账结算', 'BUTTON', 'ACTIVE', 'fms:reconcile:update', 3, NOW(), NOW()),
('menu-fms-reconcile-delete', 'menu-fms-reconcile', '删除对账结算', 'BUTTON', 'ACTIVE', 'fms:reconcile:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-fms-reconcile'),
('1', 'menu-fms-reconcile-query'),
('1', 'menu-fms-reconcile-create'),
('1', 'menu-fms-reconcile-update'),
('1', 'menu-fms-reconcile-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-fms-reconcile'),
('1', 'menu-fms-reconcile-query'),
('1', 'menu-fms-reconcile-create'),
('1', 'menu-fms-reconcile-update'),
('1', 'menu-fms-reconcile-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-fms/contract/fms-voucher.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 收支凭证 (FmsVoucher)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-fms-voucher',
  'fms-dir',
  '收支凭证管理',
  '/admin/fms/fms-voucher',
  'fms/fms-voucher/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'fms:voucher:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-fms-voucher-query',  'menu-fms-voucher', '查询收支凭证', 'BUTTON', 'ACTIVE', 'fms:voucher:query',  1, NOW(), NOW()),
('menu-fms-voucher-create', 'menu-fms-voucher', '新增收支凭证', 'BUTTON', 'ACTIVE', 'fms:voucher:create', 2, NOW(), NOW()),
('menu-fms-voucher-update', 'menu-fms-voucher', '修改收支凭证', 'BUTTON', 'ACTIVE', 'fms:voucher:update', 3, NOW(), NOW()),
('menu-fms-voucher-delete', 'menu-fms-voucher', '删除收支凭证', 'BUTTON', 'ACTIVE', 'fms:voucher:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-fms-voucher'),
('1', 'menu-fms-voucher-query'),
('1', 'menu-fms-voucher-create'),
('1', 'menu-fms-voucher-update'),
('1', 'menu-fms-voucher-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-fms-voucher'),
('1', 'menu-fms-voucher-query'),
('1', 'menu-fms-voucher-create'),
('1', 'menu-fms-voucher-update'),
('1', 'menu-fms-voucher-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-hrm/contract/hrm-employee.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 员工档案 (HrmEmployee)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-hrm-employee',
  'hrm-dir',
  '员工档案管理',
  '/admin/hrm/hrm-employee',
  'hrm/hrm-employee/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'hrm:employee:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-hrm-employee-query',  'menu-hrm-employee', '查询员工档案', 'BUTTON', 'ACTIVE', 'hrm:employee:query',  1, NOW(), NOW()),
('menu-hrm-employee-create', 'menu-hrm-employee', '新增员工档案', 'BUTTON', 'ACTIVE', 'hrm:employee:create', 2, NOW(), NOW()),
('menu-hrm-employee-update', 'menu-hrm-employee', '修改员工档案', 'BUTTON', 'ACTIVE', 'hrm:employee:update', 3, NOW(), NOW()),
('menu-hrm-employee-delete', 'menu-hrm-employee', '删除员工档案', 'BUTTON', 'ACTIVE', 'hrm:employee:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-hrm-employee'),
('1', 'menu-hrm-employee-query'),
('1', 'menu-hrm-employee-create'),
('1', 'menu-hrm-employee-update'),
('1', 'menu-hrm-employee-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-hrm-employee'),
('1', 'menu-hrm-employee-query'),
('1', 'menu-hrm-employee-create'),
('1', 'menu-hrm-employee-update'),
('1', 'menu-hrm-employee-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-hrm/contract/hrm-payroll.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 薪资核算 (HrmPayroll)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-hrm-payroll',
  'hrm-dir',
  '薪资核算管理',
  '/admin/hrm/hrm-payroll',
  'hrm/hrm-payroll/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'hrm:payroll:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-hrm-payroll-query',  'menu-hrm-payroll', '查询薪资核算', 'BUTTON', 'ACTIVE', 'hrm:payroll:query',  1, NOW(), NOW()),
('menu-hrm-payroll-create', 'menu-hrm-payroll', '新增薪资核算', 'BUTTON', 'ACTIVE', 'hrm:payroll:create', 2, NOW(), NOW()),
('menu-hrm-payroll-update', 'menu-hrm-payroll', '修改薪资核算', 'BUTTON', 'ACTIVE', 'hrm:payroll:update', 3, NOW(), NOW()),
('menu-hrm-payroll-delete', 'menu-hrm-payroll', '删除薪资核算', 'BUTTON', 'ACTIVE', 'hrm:payroll:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-hrm-payroll'),
('1', 'menu-hrm-payroll-query'),
('1', 'menu-hrm-payroll-create'),
('1', 'menu-hrm-payroll-update'),
('1', 'menu-hrm-payroll-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-hrm-payroll'),
('1', 'menu-hrm-payroll-query'),
('1', 'menu-hrm-payroll-create'),
('1', 'menu-hrm-payroll-update'),
('1', 'menu-hrm-payroll-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-hrm/contract/hrm-position.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 岗位编制 (HrmPosition)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-hrm-position',
  'hrm-dir',
  '岗位编制管理',
  '/admin/hrm/hrm-position',
  'hrm/hrm-position/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'hrm:position:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-hrm-position-query',  'menu-hrm-position', '查询岗位编制', 'BUTTON', 'ACTIVE', 'hrm:position:query',  1, NOW(), NOW()),
('menu-hrm-position-create', 'menu-hrm-position', '新增岗位编制', 'BUTTON', 'ACTIVE', 'hrm:position:create', 2, NOW(), NOW()),
('menu-hrm-position-update', 'menu-hrm-position', '修改岗位编制', 'BUTTON', 'ACTIVE', 'hrm:position:update', 3, NOW(), NOW()),
('menu-hrm-position-delete', 'menu-hrm-position', '删除岗位编制', 'BUTTON', 'ACTIVE', 'hrm:position:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-hrm-position'),
('1', 'menu-hrm-position-query'),
('1', 'menu-hrm-position-create'),
('1', 'menu-hrm-position-update'),
('1', 'menu-hrm-position-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-hrm-position'),
('1', 'menu-hrm-position-query'),
('1', 'menu-hrm-position-create'),
('1', 'menu-hrm-position-update'),
('1', 'menu-hrm-position-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-channel-material.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N  (ImChannelMaterial)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-channel-material',
  'im-dir',
  'IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N 管理',
  '/admin/im/im-channel-material',
  'im/im-channel-material/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_channel_material:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-channel-material-query',  'menu-im-channel-material', '查询IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N ', 'BUTTON', 'ACTIVE', 'im:im_channel_material:query',  1, NOW(), NOW()),
('menu-im-channel-material-create', 'menu-im-channel-material', '新增IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N ', 'BUTTON', 'ACTIVE', 'im:im_channel_material:create', 2, NOW(), NOW()),
('menu-im-channel-material-update', 'menu-im-channel-material', '修改IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N ', 'BUTTON', 'ACTIVE', 'im:im_channel_material:update', 3, NOW(), NOW()),
('menu-im-channel-material-delete', 'menu-im-channel-material', '删除IM 频道素材 DO业务语义：- 运营素材库，可被反复推送- 一条素材 1:N ', 'BUTTON', 'ACTIVE', 'im:im_channel_material:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-channel-material'),
('1', 'menu-im-channel-material-query'),
('1', 'menu-im-channel-material-create'),
('1', 'menu-im-channel-material-update'),
('1', 'menu-im-channel-material-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-channel-material'),
('1', 'menu-im-channel-material-query'),
('1', 'menu-im-channel-material-create'),
('1', 'menu-im-channel-material-update'),
('1', 'menu-im-channel-material-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-channel-message.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于 (ImChannelMessage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-channel-message',
  'im-dir',
  'IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于管理',
  '/admin/im/im-channel-message',
  'im/im-channel-message/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_channel_message:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-channel-message-query',  'menu-im-channel-message', '查询IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于', 'BUTTON', 'ACTIVE', 'im:im_channel_message:query',  1, NOW(), NOW()),
('menu-im-channel-message-create', 'menu-im-channel-message', '新增IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于', 'BUTTON', 'ACTIVE', 'im:im_channel_message:create', 2, NOW(), NOW()),
('menu-im-channel-message-update', 'menu-im-channel-message', '修改IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于', 'BUTTON', 'ACTIVE', 'im:im_channel_message:update', 3, NOW(), NOW()),
('menu-im-channel-message-delete', 'menu-im-channel-message', '删除IM 频道消息 DO业务语义：- 一次推送 1 行； 为空表示全员- 冗余 便于', 'BUTTON', 'ACTIVE', 'im:im_channel_message:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-channel-message'),
('1', 'menu-im-channel-message-query'),
('1', 'menu-im-channel-message-create'),
('1', 'menu-im-channel-message-update'),
('1', 'menu-im-channel-message-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-channel-message'),
('1', 'menu-im-channel-message-query'),
('1', 'menu-im-channel-message-create'),
('1', 'menu-im-channel-message-update'),
('1', 'menu-im-channel-message-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-channel.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消 (ImChannel)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-channel',
  'im-dir',
  'IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消管理',
  '/admin/im/im-channel',
  'im/im-channel/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_channel:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-channel-query',  'menu-im-channel', '查询IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消', 'BUTTON', 'ACTIVE', 'im:im_channel:query',  1, NOW(), NOW()),
('menu-im-channel-create', 'menu-im-channel', '新增IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消', 'BUTTON', 'ACTIVE', 'im:im_channel:create', 2, NOW(), NOW()),
('menu-im-channel-update', 'menu-im-channel', '修改IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消', 'BUTTON', 'ACTIVE', 'im:im_channel:update', 3, NOW(), NOW()),
('menu-im-channel-delete', 'menu-im-channel', '删除IM 频道 DO业务语义：- 频道是运营单向推送的主体；C 端用户不能向频道发消', 'BUTTON', 'ACTIVE', 'im:im_channel:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-channel'),
('1', 'menu-im-channel-query'),
('1', 'menu-im-channel-create'),
('1', 'menu-im-channel-update'),
('1', 'menu-im-channel-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-channel'),
('1', 'menu-im-channel-query'),
('1', 'menu-im-channel-create'),
('1', 'menu-im-channel-update'),
('1', 'menu-im-channel-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-conversation-read.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 / (ImConversationRead)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-conversation-read',
  'im-dir',
  'IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 /管理',
  '/admin/im/im-conversation-read',
  'im/im-conversation-read/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_conversation_read:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-conversation-read-query',  'menu-im-conversation-read', '查询IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 /', 'BUTTON', 'ACTIVE', 'im:im_conversation_read:query',  1, NOW(), NOW()),
('menu-im-conversation-read-create', 'menu-im-conversation-read', '新增IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 /', 'BUTTON', 'ACTIVE', 'im:im_conversation_read:create', 2, NOW(), NOW()),
('menu-im-conversation-read-update', 'menu-im-conversation-read', '修改IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 /', 'BUTTON', 'ACTIVE', 'im:im_conversation_read:update', 3, NOW(), NOW()),
('menu-im-conversation-read-delete', 'menu-im-conversation-read', '删除IM 会话读位置 DO只表达「用户在某个会话的最大已读位置」，私聊 / 群聊 /', 'BUTTON', 'ACTIVE', 'im:im_conversation_read:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-conversation-read'),
('1', 'menu-im-conversation-read-query'),
('1', 'menu-im-conversation-read-create'),
('1', 'menu-im-conversation-read-update'),
('1', 'menu-im-conversation-read-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-conversation-read'),
('1', 'menu-im-conversation-read-query'),
('1', 'menu-im-conversation-read-create'),
('1', 'menu-im-conversation-read-update'),
('1', 'menu-im-conversation-read-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-face-pack-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 表情包项 DO（系统表情包内的单张表情图） (ImFacePackItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-face-pack-item',
  'im-dir',
  'IM 表情包项 DO（系统表情包内的单张表情图）管理',
  '/admin/im/im-face-pack-item',
  'im/im-face-pack-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_face_pack_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-face-pack-item-query',  'menu-im-face-pack-item', '查询IM 表情包项 DO（系统表情包内的单张表情图）', 'BUTTON', 'ACTIVE', 'im:im_face_pack_item:query',  1, NOW(), NOW()),
('menu-im-face-pack-item-create', 'menu-im-face-pack-item', '新增IM 表情包项 DO（系统表情包内的单张表情图）', 'BUTTON', 'ACTIVE', 'im:im_face_pack_item:create', 2, NOW(), NOW()),
('menu-im-face-pack-item-update', 'menu-im-face-pack-item', '修改IM 表情包项 DO（系统表情包内的单张表情图）', 'BUTTON', 'ACTIVE', 'im:im_face_pack_item:update', 3, NOW(), NOW()),
('menu-im-face-pack-item-delete', 'menu-im-face-pack-item', '删除IM 表情包项 DO（系统表情包内的单张表情图）', 'BUTTON', 'ACTIVE', 'im:im_face_pack_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-face-pack-item'),
('1', 'menu-im-face-pack-item-query'),
('1', 'menu-im-face-pack-item-create'),
('1', 'menu-im-face-pack-item-update'),
('1', 'menu-im-face-pack-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-face-pack-item'),
('1', 'menu-im-face-pack-item-query'),
('1', 'menu-im-face-pack-item-create'),
('1', 'menu-im-face-pack-item-update'),
('1', 'menu-im-face-pack-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-face-pack.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 表情包 DO（运营配置的系统表情包元数据） (ImFacePack)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-face-pack',
  'im-dir',
  'IM 表情包 DO（运营配置的系统表情包元数据）管理',
  '/admin/im/im-face-pack',
  'im/im-face-pack/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_face_pack:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-face-pack-query',  'menu-im-face-pack', '查询IM 表情包 DO（运营配置的系统表情包元数据）', 'BUTTON', 'ACTIVE', 'im:im_face_pack:query',  1, NOW(), NOW()),
('menu-im-face-pack-create', 'menu-im-face-pack', '新增IM 表情包 DO（运营配置的系统表情包元数据）', 'BUTTON', 'ACTIVE', 'im:im_face_pack:create', 2, NOW(), NOW()),
('menu-im-face-pack-update', 'menu-im-face-pack', '修改IM 表情包 DO（运营配置的系统表情包元数据）', 'BUTTON', 'ACTIVE', 'im:im_face_pack:update', 3, NOW(), NOW()),
('menu-im-face-pack-delete', 'menu-im-face-pack', '删除IM 表情包 DO（运营配置的系统表情包元数据）', 'BUTTON', 'ACTIVE', 'im:im_face_pack:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-face-pack'),
('1', 'menu-im-face-pack-query'),
('1', 'menu-im-face-pack-create'),
('1', 'menu-im-face-pack-update'),
('1', 'menu-im-face-pack-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-face-pack'),
('1', 'menu-im-face-pack-query'),
('1', 'menu-im-face-pack-create'),
('1', 'menu-im-face-pack-update'),
('1', 'menu-im-face-pack-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-face-user-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 用户私有表情 DO（个人表情包，对照微信「我的表情」） (ImFaceUserItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-face-user-item',
  'im-dir',
  'IM 用户私有表情 DO（个人表情包，对照微信「我的表情」）管理',
  '/admin/im/im-face-user-item',
  'im/im-face-user-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_face_user_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-face-user-item-query',  'menu-im-face-user-item', '查询IM 用户私有表情 DO（个人表情包，对照微信「我的表情」）', 'BUTTON', 'ACTIVE', 'im:im_face_user_item:query',  1, NOW(), NOW()),
('menu-im-face-user-item-create', 'menu-im-face-user-item', '新增IM 用户私有表情 DO（个人表情包，对照微信「我的表情」）', 'BUTTON', 'ACTIVE', 'im:im_face_user_item:create', 2, NOW(), NOW()),
('menu-im-face-user-item-update', 'menu-im-face-user-item', '修改IM 用户私有表情 DO（个人表情包，对照微信「我的表情」）', 'BUTTON', 'ACTIVE', 'im:im_face_user_item:update', 3, NOW(), NOW()),
('menu-im-face-user-item-delete', 'menu-im-face-user-item', '删除IM 用户私有表情 DO（个人表情包，对照微信「我的表情」）', 'BUTTON', 'ACTIVE', 'im:im_face_user_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-face-user-item'),
('1', 'menu-im-face-user-item-query'),
('1', 'menu-im-face-user-item-create'),
('1', 'menu-im-face-user-item-update'),
('1', 'menu-im-face-user-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-face-user-item'),
('1', 'menu-im-face-user-item-query'),
('1', 'menu-im-face-user-item-create'),
('1', 'menu-im-face-user-item-update'),
('1', 'menu-im-face-user-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-friend-request.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接 (ImFriendRequest)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-friend-request',
  'im-dir',
  'IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接管理',
  '/admin/im/im-friend-request',
  'im/im-friend-request/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_friend_request:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-friend-request-query',  'menu-im-friend-request', '查询IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接', 'BUTTON', 'ACTIVE', 'im:im_friend_request:query',  1, NOW(), NOW()),
('menu-im-friend-request-create', 'menu-im-friend-request', '新增IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接', 'BUTTON', 'ACTIVE', 'im:im_friend_request:create', 2, NOW(), NOW()),
('menu-im-friend-request-update', 'menu-im-friend-request', '修改IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接', 'BUTTON', 'ACTIVE', 'im:im_friend_request:update', 3, NOW(), NOW()),
('menu-im-friend-request-delete', 'menu-im-friend-request', '删除IM 好友申请记录 DO配合「申请 - 审批」流程：- 发起方调 apply 接', 'BUTTON', 'ACTIVE', 'im:im_friend_request:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-friend-request'),
('1', 'menu-im-friend-request-query'),
('1', 'menu-im-friend-request-create'),
('1', 'menu-im-friend-request-update'),
('1', 'menu-im-friend-request-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-friend-request'),
('1', 'menu-im-friend-request-query'),
('1', 'menu-im-friend-request-create'),
('1', 'menu-im-friend-request-update'),
('1', 'menu-im-friend-request-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-friend.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u (ImFriend)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-friend',
  'im-dir',
  'IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u管理',
  '/admin/im/im-friend',
  'im/im-friend/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_friend:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-friend-query',  'menu-im-friend', '查询IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u', 'BUTTON', 'ACTIVE', 'im:im_friend:query',  1, NOW(), NOW()),
('menu-im-friend-create', 'menu-im-friend', '新增IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u', 'BUTTON', 'ACTIVE', 'im:im_friend:create', 2, NOW(), NOW()),
('menu-im-friend-update', 'menu-im-friend', '修改IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u', 'BUTTON', 'ACTIVE', 'im:im_friend:update', 3, NOW(), NOW()),
('menu-im-friend-delete', 'menu-im-friend', '删除IM 好友关系 DO业务语义：- 双向关系：A-B 互为好友会存 2 条记录（u', 'BUTTON', 'ACTIVE', 'im:im_friend:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-friend'),
('1', 'menu-im-friend-query'),
('1', 'menu-im-friend-create'),
('1', 'menu-im-friend-update'),
('1', 'menu-im-friend-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-friend'),
('1', 'menu-im-friend-query'),
('1', 'menu-im-friend-create'),
('1', 'menu-im-friend-update'),
('1', 'menu-im-friend-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-group-member.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 群成员 (ImGroupMember)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-group-member',
  'im-dir',
  'IM 群成员管理',
  '/admin/im/im-group-member',
  'im/im-group-member/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_group_member:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-group-member-query',  'menu-im-group-member', '查询IM 群成员', 'BUTTON', 'ACTIVE', 'im:im_group_member:query',  1, NOW(), NOW()),
('menu-im-group-member-create', 'menu-im-group-member', '新增IM 群成员', 'BUTTON', 'ACTIVE', 'im:im_group_member:create', 2, NOW(), NOW()),
('menu-im-group-member-update', 'menu-im-group-member', '修改IM 群成员', 'BUTTON', 'ACTIVE', 'im:im_group_member:update', 3, NOW(), NOW()),
('menu-im-group-member-delete', 'menu-im-group-member', '删除IM 群成员', 'BUTTON', 'ACTIVE', 'im:im_group_member:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-group-member'),
('1', 'menu-im-group-member-query'),
('1', 'menu-im-group-member-create'),
('1', 'menu-im-group-member-update'),
('1', 'menu-im-group-member-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-group-member'),
('1', 'menu-im-group-member-query'),
('1', 'menu-im-group-member-create'),
('1', 'menu-im-group-member-update'),
('1', 'menu-im-group-member-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-group-message.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 群聊消息 (ImGroupMessage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-group-message',
  'im-dir',
  'IM 群聊消息管理',
  '/admin/im/im-group-message',
  'im/im-group-message/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_group_message:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-group-message-query',  'menu-im-group-message', '查询IM 群聊消息', 'BUTTON', 'ACTIVE', 'im:im_group_message:query',  1, NOW(), NOW()),
('menu-im-group-message-create', 'menu-im-group-message', '新增IM 群聊消息', 'BUTTON', 'ACTIVE', 'im:im_group_message:create', 2, NOW(), NOW()),
('menu-im-group-message-update', 'menu-im-group-message', '修改IM 群聊消息', 'BUTTON', 'ACTIVE', 'im:im_group_message:update', 3, NOW(), NOW()),
('menu-im-group-message-delete', 'menu-im-group-message', '删除IM 群聊消息', 'BUTTON', 'ACTIVE', 'im:im_group_message:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-group-message'),
('1', 'menu-im-group-message-query'),
('1', 'menu-im-group-message-create'),
('1', 'menu-im-group-message-update'),
('1', 'menu-im-group-message-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-group-message'),
('1', 'menu-im-group-message-query'),
('1', 'menu-im-group-message-create'),
('1', 'menu-im-group-message-update'),
('1', 'menu-im-group-message-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-group-request.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply (ImGroupRequest)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-group-request',
  'im-dir',
  'IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply管理',
  '/admin/im/im-group-request',
  'im/im-group-request/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_group_request:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-group-request-query',  'menu-im-group-request', '查询IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply', 'BUTTON', 'ACTIVE', 'im:im_group_request:query',  1, NOW(), NOW()),
('menu-im-group-request-create', 'menu-im-group-request', '新增IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply', 'BUTTON', 'ACTIVE', 'im:im_group_request:create', 2, NOW(), NOW()),
('menu-im-group-request-update', 'menu-im-group-request', '修改IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply', 'BUTTON', 'ACTIVE', 'im:im_group_request:update', 3, NOW(), NOW()),
('menu-im-group-request-delete', 'menu-im-group-request', '删除IM 加群申请记录 DO配合「申请 - 审批」流程：用户主动申请：调 apply', 'BUTTON', 'ACTIVE', 'im:im_group_request:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-group-request'),
('1', 'menu-im-group-request-query'),
('1', 'menu-im-group-request-create'),
('1', 'menu-im-group-request-update'),
('1', 'menu-im-group-request-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-group-request'),
('1', 'menu-im-group-request-query'),
('1', 'menu-im-group-request-create'),
('1', 'menu-im-group-request-update'),
('1', 'menu-im-group-request-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-group.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 群信息 (ImGroup)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-group',
  'im-dir',
  'IM 群信息管理',
  '/admin/im/im-group',
  'im/im-group/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_group:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-group-query',  'menu-im-group', '查询IM 群信息', 'BUTTON', 'ACTIVE', 'im:im_group:query',  1, NOW(), NOW()),
('menu-im-group-create', 'menu-im-group', '新增IM 群信息', 'BUTTON', 'ACTIVE', 'im:im_group:create', 2, NOW(), NOW()),
('menu-im-group-update', 'menu-im-group', '修改IM 群信息', 'BUTTON', 'ACTIVE', 'im:im_group:update', 3, NOW(), NOW()),
('menu-im-group-delete', 'menu-im-group', '删除IM 群信息', 'BUTTON', 'ACTIVE', 'im:im_group:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-group'),
('1', 'menu-im-group-query'),
('1', 'menu-im-group-create'),
('1', 'menu-im-group-update'),
('1', 'menu-im-group-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-group'),
('1', 'menu-im-group-query'),
('1', 'menu-im-group-create'),
('1', 'menu-im-group-update'),
('1', 'menu-im-group-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-private-message.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 私聊消息 (ImPrivateMessage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-private-message',
  'im-dir',
  'IM 私聊消息管理',
  '/admin/im/im-private-message',
  'im/im-private-message/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_private_message:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-private-message-query',  'menu-im-private-message', '查询IM 私聊消息', 'BUTTON', 'ACTIVE', 'im:im_private_message:query',  1, NOW(), NOW()),
('menu-im-private-message-create', 'menu-im-private-message', '新增IM 私聊消息', 'BUTTON', 'ACTIVE', 'im:im_private_message:create', 2, NOW(), NOW()),
('menu-im-private-message-update', 'menu-im-private-message', '修改IM 私聊消息', 'BUTTON', 'ACTIVE', 'im:im_private_message:update', 3, NOW(), NOW()),
('menu-im-private-message-delete', 'menu-im-private-message', '删除IM 私聊消息', 'BUTTON', 'ACTIVE', 'im:im_private_message:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-private-message'),
('1', 'menu-im-private-message-query'),
('1', 'menu-im-private-message-create'),
('1', 'menu-im-private-message-update'),
('1', 'menu-im-private-message-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-private-message'),
('1', 'menu-im-private-message-query'),
('1', 'menu-im-private-message-create'),
('1', 'menu-im-private-message-update'),
('1', 'menu-im-private-message-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-rtc-call.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED → (ImRtcCall)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-rtc-call',
  'im-dir',
  'IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED →管理',
  '/admin/im/im-rtc-call',
  'im/im-rtc-call/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_rtc_call:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-rtc-call-query',  'menu-im-rtc-call', '查询IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED →', 'BUTTON', 'ACTIVE', 'im:im_rtc_call:query',  1, NOW(), NOW()),
('menu-im-rtc-call-create', 'menu-im-rtc-call', '新增IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED →', 'BUTTON', 'ACTIVE', 'im:im_rtc_call:create', 2, NOW(), NOW()),
('menu-im-rtc-call-update', 'menu-im-rtc-call', '修改IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED →', 'BUTTON', 'ACTIVE', 'im:im_rtc_call:update', 3, NOW(), NOW()),
('menu-im-rtc-call-delete', 'menu-im-rtc-call', '删除IM 通话记录 DO（房间级 / 主表）一通通话一行；状态机 CREATED →', 'BUTTON', 'ACTIVE', 'im:im_rtc_call:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-rtc-call'),
('1', 'menu-im-rtc-call-query'),
('1', 'menu-im-rtc-call-create'),
('1', 'menu-im-rtc-call-update'),
('1', 'menu-im-rtc-call-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-rtc-call'),
('1', 'menu-im-rtc-call-query'),
('1', 'menu-im-rtc-call-create'),
('1', 'menu-im-rtc-call-update'),
('1', 'menu-im-rtc-call-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-rtc-participant.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主 (ImRtcParticipant)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-rtc-participant',
  'im-dir',
  'IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主管理',
  '/admin/im/im-rtc-participant',
  'im/im-rtc-participant/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_rtc_participant:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-rtc-participant-query',  'menu-im-rtc-participant', '查询IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主', 'BUTTON', 'ACTIVE', 'im:im_rtc_participant:query',  1, NOW(), NOW()),
('menu-im-rtc-participant-create', 'menu-im-rtc-participant', '新增IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主', 'BUTTON', 'ACTIVE', 'im:im_rtc_participant:create', 2, NOW(), NOW()),
('menu-im-rtc-participant-update', 'menu-im-rtc-participant', '修改IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主', 'BUTTON', 'ACTIVE', 'im:im_rtc_participant:update', 3, NOW(), NOW()),
('menu-im-rtc-participant-delete', 'menu-im-rtc-participant', '删除IM 通话参与者 DO（用户级 / 明细表）一通通话每个参与者一行；通过 关联主', 'BUTTON', 'ACTIVE', 'im:im_rtc_participant:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-rtc-participant'),
('1', 'menu-im-rtc-participant-query'),
('1', 'menu-im-rtc-participant-create'),
('1', 'menu-im-rtc-participant-update'),
('1', 'menu-im-rtc-participant-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-rtc-participant'),
('1', 'menu-im-rtc-participant-query'),
('1', 'menu-im-rtc-participant-create'),
('1', 'menu-im-rtc-participant-update'),
('1', 'menu-im-rtc-participant-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-im/contract/im-sensitive-word.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IM 敏感词 (ImSensitiveWord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-im-sensitive-word',
  'im-dir',
  'IM 敏感词管理',
  '/admin/im/im-sensitive-word',
  'im/im-sensitive-word/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'im:im_sensitive_word:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-im-sensitive-word-query',  'menu-im-sensitive-word', '查询IM 敏感词', 'BUTTON', 'ACTIVE', 'im:im_sensitive_word:query',  1, NOW(), NOW()),
('menu-im-sensitive-word-create', 'menu-im-sensitive-word', '新增IM 敏感词', 'BUTTON', 'ACTIVE', 'im:im_sensitive_word:create', 2, NOW(), NOW()),
('menu-im-sensitive-word-update', 'menu-im-sensitive-word', '修改IM 敏感词', 'BUTTON', 'ACTIVE', 'im:im_sensitive_word:update', 3, NOW(), NOW()),
('menu-im-sensitive-word-delete', 'menu-im-sensitive-word', '删除IM 敏感词', 'BUTTON', 'ACTIVE', 'im:im_sensitive_word:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-im-sensitive-word'),
('1', 'menu-im-sensitive-word-query'),
('1', 'menu-im-sensitive-word-create'),
('1', 'menu-im-sensitive-word-update'),
('1', 'menu-im-sensitive-word-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-im-sensitive-word'),
('1', 'menu-im-sensitive-word-query'),
('1', 'menu-im-sensitive-word-create'),
('1', 'menu-im-sensitive-word-update'),
('1', 'menu-im-sensitive-word-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-alert-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 告警配置 (IotAlertConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-alert-config',
  'iot-dir',
  'IoT 告警配置管理',
  '/admin/iot/iot-alert-config',
  'iot/iot-alert-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_alert_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-alert-config-query',  'menu-iot-alert-config', '查询IoT 告警配置', 'BUTTON', 'ACTIVE', 'iot:iot_alert_config:query',  1, NOW(), NOW()),
('menu-iot-alert-config-create', 'menu-iot-alert-config', '新增IoT 告警配置', 'BUTTON', 'ACTIVE', 'iot:iot_alert_config:create', 2, NOW(), NOW()),
('menu-iot-alert-config-update', 'menu-iot-alert-config', '修改IoT 告警配置', 'BUTTON', 'ACTIVE', 'iot:iot_alert_config:update', 3, NOW(), NOW()),
('menu-iot-alert-config-delete', 'menu-iot-alert-config', '删除IoT 告警配置', 'BUTTON', 'ACTIVE', 'iot:iot_alert_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-alert-config'),
('1', 'menu-iot-alert-config-query'),
('1', 'menu-iot-alert-config-create'),
('1', 'menu-iot-alert-config-update'),
('1', 'menu-iot-alert-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-alert-config'),
('1', 'menu-iot-alert-config-query'),
('1', 'menu-iot-alert-config-create'),
('1', 'menu-iot-alert-config-update'),
('1', 'menu-iot-alert-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-alert-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 告警记录 (IotAlertRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-alert-record',
  'iot-dir',
  'IoT 告警记录管理',
  '/admin/iot/iot-alert-record',
  'iot/iot-alert-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_alert_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-alert-record-query',  'menu-iot-alert-record', '查询IoT 告警记录', 'BUTTON', 'ACTIVE', 'iot:iot_alert_record:query',  1, NOW(), NOW()),
('menu-iot-alert-record-create', 'menu-iot-alert-record', '新增IoT 告警记录', 'BUTTON', 'ACTIVE', 'iot:iot_alert_record:create', 2, NOW(), NOW()),
('menu-iot-alert-record-update', 'menu-iot-alert-record', '修改IoT 告警记录', 'BUTTON', 'ACTIVE', 'iot:iot_alert_record:update', 3, NOW(), NOW()),
('menu-iot-alert-record-delete', 'menu-iot-alert-record', '删除IoT 告警记录', 'BUTTON', 'ACTIVE', 'iot:iot_alert_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-alert-record'),
('1', 'menu-iot-alert-record-query'),
('1', 'menu-iot-alert-record-create'),
('1', 'menu-iot-alert-record-update'),
('1', 'menu-iot-alert-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-alert-record'),
('1', 'menu-iot-alert-record-query'),
('1', 'menu-iot-alert-record-create'),
('1', 'menu-iot-alert-record-update'),
('1', 'menu-iot-alert-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-data-rule.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 数据流转规则 DO监听 数据源，转发到 数据目的 (IotDataRule)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-data-rule',
  'iot-dir',
  'IoT 数据流转规则 DO监听 数据源，转发到 数据目的管理',
  '/admin/iot/iot-data-rule',
  'iot/iot-data-rule/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_data_rule:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-data-rule-query',  'menu-iot-data-rule', '查询IoT 数据流转规则 DO监听 数据源，转发到 数据目的', 'BUTTON', 'ACTIVE', 'iot:iot_data_rule:query',  1, NOW(), NOW()),
('menu-iot-data-rule-create', 'menu-iot-data-rule', '新增IoT 数据流转规则 DO监听 数据源，转发到 数据目的', 'BUTTON', 'ACTIVE', 'iot:iot_data_rule:create', 2, NOW(), NOW()),
('menu-iot-data-rule-update', 'menu-iot-data-rule', '修改IoT 数据流转规则 DO监听 数据源，转发到 数据目的', 'BUTTON', 'ACTIVE', 'iot:iot_data_rule:update', 3, NOW(), NOW()),
('menu-iot-data-rule-delete', 'menu-iot-data-rule', '删除IoT 数据流转规则 DO监听 数据源，转发到 数据目的', 'BUTTON', 'ACTIVE', 'iot:iot_data_rule:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-data-rule'),
('1', 'menu-iot-data-rule-query'),
('1', 'menu-iot-data-rule-create'),
('1', 'menu-iot-data-rule-update'),
('1', 'menu-iot-data-rule-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-data-rule'),
('1', 'menu-iot-data-rule-query'),
('1', 'menu-iot-data-rule-create'),
('1', 'menu-iot-data-rule-update'),
('1', 'menu-iot-data-rule-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-data-sink.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 数据流转目的 (IotDataSink)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-data-sink',
  'iot-dir',
  'IoT 数据流转目的管理',
  '/admin/iot/iot-data-sink',
  'iot/iot-data-sink/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_data_sink:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-data-sink-query',  'menu-iot-data-sink', '查询IoT 数据流转目的', 'BUTTON', 'ACTIVE', 'iot:iot_data_sink:query',  1, NOW(), NOW()),
('menu-iot-data-sink-create', 'menu-iot-data-sink', '新增IoT 数据流转目的', 'BUTTON', 'ACTIVE', 'iot:iot_data_sink:create', 2, NOW(), NOW()),
('menu-iot-data-sink-update', 'menu-iot-data-sink', '修改IoT 数据流转目的', 'BUTTON', 'ACTIVE', 'iot:iot_data_sink:update', 3, NOW(), NOW()),
('menu-iot-data-sink-delete', 'menu-iot-data-sink', '删除IoT 数据流转目的', 'BUTTON', 'ACTIVE', 'iot:iot_data_sink:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-data-sink'),
('1', 'menu-iot-data-sink-query'),
('1', 'menu-iot-data-sink-create'),
('1', 'menu-iot-data-sink-update'),
('1', 'menu-iot-data-sink-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-data-sink'),
('1', 'menu-iot-data-sink-query'),
('1', 'menu-iot-data-sink-create'),
('1', 'menu-iot-data-sink-update'),
('1', 'menu-iot-data-sink-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-device-group.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 设备分组 (IotDeviceGroup)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-device-group',
  'iot-dir',
  'IoT 设备分组管理',
  '/admin/iot/iot-device-group',
  'iot/iot-device-group/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_device_group:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-device-group-query',  'menu-iot-device-group', '查询IoT 设备分组', 'BUTTON', 'ACTIVE', 'iot:iot_device_group:query',  1, NOW(), NOW()),
('menu-iot-device-group-create', 'menu-iot-device-group', '新增IoT 设备分组', 'BUTTON', 'ACTIVE', 'iot:iot_device_group:create', 2, NOW(), NOW()),
('menu-iot-device-group-update', 'menu-iot-device-group', '修改IoT 设备分组', 'BUTTON', 'ACTIVE', 'iot:iot_device_group:update', 3, NOW(), NOW()),
('menu-iot-device-group-delete', 'menu-iot-device-group', '删除IoT 设备分组', 'BUTTON', 'ACTIVE', 'iot:iot_device_group:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-device-group'),
('1', 'menu-iot-device-group-query'),
('1', 'menu-iot-device-group-create'),
('1', 'menu-iot-device-group-update'),
('1', 'menu-iot-device-group-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-device-group'),
('1', 'menu-iot-device-group-query'),
('1', 'menu-iot-device-group-create'),
('1', 'menu-iot-device-group-update'),
('1', 'menu-iot-device-group-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-device-modbus-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 设备 Modbus 连接配置 (IotDeviceModbusConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-device-modbus-config',
  'iot-dir',
  'IoT 设备 Modbus 连接配置管理',
  '/admin/iot/iot-device-modbus-config',
  'iot/iot-device-modbus-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_device_modbus_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-device-modbus-config-query',  'menu-iot-device-modbus-config', '查询IoT 设备 Modbus 连接配置', 'BUTTON', 'ACTIVE', 'iot:iot_device_modbus_config:query',  1, NOW(), NOW()),
('menu-iot-device-modbus-config-create', 'menu-iot-device-modbus-config', '新增IoT 设备 Modbus 连接配置', 'BUTTON', 'ACTIVE', 'iot:iot_device_modbus_config:create', 2, NOW(), NOW()),
('menu-iot-device-modbus-config-update', 'menu-iot-device-modbus-config', '修改IoT 设备 Modbus 连接配置', 'BUTTON', 'ACTIVE', 'iot:iot_device_modbus_config:update', 3, NOW(), NOW()),
('menu-iot-device-modbus-config-delete', 'menu-iot-device-modbus-config', '删除IoT 设备 Modbus 连接配置', 'BUTTON', 'ACTIVE', 'iot:iot_device_modbus_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-device-modbus-config'),
('1', 'menu-iot-device-modbus-config-query'),
('1', 'menu-iot-device-modbus-config-create'),
('1', 'menu-iot-device-modbus-config-update'),
('1', 'menu-iot-device-modbus-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-device-modbus-config'),
('1', 'menu-iot-device-modbus-config-query'),
('1', 'menu-iot-device-modbus-config-create'),
('1', 'menu-iot-device-modbus-config-update'),
('1', 'menu-iot-device-modbus-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-device-modbus-point.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 设备 Modbus 点位配置 (IotDeviceModbusPoint)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-device-modbus-point',
  'iot-dir',
  'IoT 设备 Modbus 点位配置管理',
  '/admin/iot/iot-device-modbus-point',
  'iot/iot-device-modbus-point/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_device_modbus_point:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-device-modbus-point-query',  'menu-iot-device-modbus-point', '查询IoT 设备 Modbus 点位配置', 'BUTTON', 'ACTIVE', 'iot:iot_device_modbus_point:query',  1, NOW(), NOW()),
('menu-iot-device-modbus-point-create', 'menu-iot-device-modbus-point', '新增IoT 设备 Modbus 点位配置', 'BUTTON', 'ACTIVE', 'iot:iot_device_modbus_point:create', 2, NOW(), NOW()),
('menu-iot-device-modbus-point-update', 'menu-iot-device-modbus-point', '修改IoT 设备 Modbus 点位配置', 'BUTTON', 'ACTIVE', 'iot:iot_device_modbus_point:update', 3, NOW(), NOW()),
('menu-iot-device-modbus-point-delete', 'menu-iot-device-modbus-point', '删除IoT 设备 Modbus 点位配置', 'BUTTON', 'ACTIVE', 'iot:iot_device_modbus_point:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-device-modbus-point'),
('1', 'menu-iot-device-modbus-point-query'),
('1', 'menu-iot-device-modbus-point-create'),
('1', 'menu-iot-device-modbus-point-update'),
('1', 'menu-iot-device-modbus-point-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-device-modbus-point'),
('1', 'menu-iot-device-modbus-point-query'),
('1', 'menu-iot-device-modbus-point-create'),
('1', 'menu-iot-device-modbus-point-update'),
('1', 'menu-iot-device-modbus-point-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-device.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 设备 (IotDevice)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-device',
  'iot-dir',
  'IoT 设备管理',
  '/admin/iot/iot-device',
  'iot/iot-device/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_device:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-device-query',  'menu-iot-device', '查询IoT 设备', 'BUTTON', 'ACTIVE', 'iot:iot_device:query',  1, NOW(), NOW()),
('menu-iot-device-create', 'menu-iot-device', '新增IoT 设备', 'BUTTON', 'ACTIVE', 'iot:iot_device:create', 2, NOW(), NOW()),
('menu-iot-device-update', 'menu-iot-device', '修改IoT 设备', 'BUTTON', 'ACTIVE', 'iot:iot_device:update', 3, NOW(), NOW()),
('menu-iot-device-delete', 'menu-iot-device', '删除IoT 设备', 'BUTTON', 'ACTIVE', 'iot:iot_device:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-device'),
('1', 'menu-iot-device-query'),
('1', 'menu-iot-device-create'),
('1', 'menu-iot-device-update'),
('1', 'menu-iot-device-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-device'),
('1', 'menu-iot-device-query'),
('1', 'menu-iot-device-create'),
('1', 'menu-iot-device-update'),
('1', 'menu-iot-device-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-ota-firmware.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT OTA 固件 (IotOtaFirmware)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-ota-firmware',
  'iot-dir',
  'IoT OTA 固件管理',
  '/admin/iot/iot-ota-firmware',
  'iot/iot-ota-firmware/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_ota_firmware:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-ota-firmware-query',  'menu-iot-ota-firmware', '查询IoT OTA 固件', 'BUTTON', 'ACTIVE', 'iot:iot_ota_firmware:query',  1, NOW(), NOW()),
('menu-iot-ota-firmware-create', 'menu-iot-ota-firmware', '新增IoT OTA 固件', 'BUTTON', 'ACTIVE', 'iot:iot_ota_firmware:create', 2, NOW(), NOW()),
('menu-iot-ota-firmware-update', 'menu-iot-ota-firmware', '修改IoT OTA 固件', 'BUTTON', 'ACTIVE', 'iot:iot_ota_firmware:update', 3, NOW(), NOW()),
('menu-iot-ota-firmware-delete', 'menu-iot-ota-firmware', '删除IoT OTA 固件', 'BUTTON', 'ACTIVE', 'iot:iot_ota_firmware:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-ota-firmware'),
('1', 'menu-iot-ota-firmware-query'),
('1', 'menu-iot-ota-firmware-create'),
('1', 'menu-iot-ota-firmware-update'),
('1', 'menu-iot-ota-firmware-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-ota-firmware'),
('1', 'menu-iot-ota-firmware-query'),
('1', 'menu-iot-ota-firmware-create'),
('1', 'menu-iot-ota-firmware-update'),
('1', 'menu-iot-ota-firmware-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-ota-task-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT OTA 升级任务记录 (IotOtaTaskRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-ota-task-record',
  'iot-dir',
  'IoT OTA 升级任务记录管理',
  '/admin/iot/iot-ota-task-record',
  'iot/iot-ota-task-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_ota_task_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-ota-task-record-query',  'menu-iot-ota-task-record', '查询IoT OTA 升级任务记录', 'BUTTON', 'ACTIVE', 'iot:iot_ota_task_record:query',  1, NOW(), NOW()),
('menu-iot-ota-task-record-create', 'menu-iot-ota-task-record', '新增IoT OTA 升级任务记录', 'BUTTON', 'ACTIVE', 'iot:iot_ota_task_record:create', 2, NOW(), NOW()),
('menu-iot-ota-task-record-update', 'menu-iot-ota-task-record', '修改IoT OTA 升级任务记录', 'BUTTON', 'ACTIVE', 'iot:iot_ota_task_record:update', 3, NOW(), NOW()),
('menu-iot-ota-task-record-delete', 'menu-iot-ota-task-record', '删除IoT OTA 升级任务记录', 'BUTTON', 'ACTIVE', 'iot:iot_ota_task_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-ota-task-record'),
('1', 'menu-iot-ota-task-record-query'),
('1', 'menu-iot-ota-task-record-create'),
('1', 'menu-iot-ota-task-record-update'),
('1', 'menu-iot-ota-task-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-ota-task-record'),
('1', 'menu-iot-ota-task-record-query'),
('1', 'menu-iot-ota-task-record-create'),
('1', 'menu-iot-ota-task-record-update'),
('1', 'menu-iot-ota-task-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-ota-task.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT OTA 升级任务 (IotOtaTask)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-ota-task',
  'iot-dir',
  'IoT OTA 升级任务管理',
  '/admin/iot/iot-ota-task',
  'iot/iot-ota-task/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_ota_task:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-ota-task-query',  'menu-iot-ota-task', '查询IoT OTA 升级任务', 'BUTTON', 'ACTIVE', 'iot:iot_ota_task:query',  1, NOW(), NOW()),
('menu-iot-ota-task-create', 'menu-iot-ota-task', '新增IoT OTA 升级任务', 'BUTTON', 'ACTIVE', 'iot:iot_ota_task:create', 2, NOW(), NOW()),
('menu-iot-ota-task-update', 'menu-iot-ota-task', '修改IoT OTA 升级任务', 'BUTTON', 'ACTIVE', 'iot:iot_ota_task:update', 3, NOW(), NOW()),
('menu-iot-ota-task-delete', 'menu-iot-ota-task', '删除IoT OTA 升级任务', 'BUTTON', 'ACTIVE', 'iot:iot_ota_task:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-ota-task'),
('1', 'menu-iot-ota-task-query'),
('1', 'menu-iot-ota-task-create'),
('1', 'menu-iot-ota-task-update'),
('1', 'menu-iot-ota-task-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-ota-task'),
('1', 'menu-iot-ota-task-query'),
('1', 'menu-iot-ota-task-create'),
('1', 'menu-iot-ota-task-update'),
('1', 'menu-iot-ota-task-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-product-category.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 产品分类 (IotProductCategory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-product-category',
  'iot-dir',
  'IoT 产品分类管理',
  '/admin/iot/iot-product-category',
  'iot/iot-product-category/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_product_category:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-product-category-query',  'menu-iot-product-category', '查询IoT 产品分类', 'BUTTON', 'ACTIVE', 'iot:iot_product_category:query',  1, NOW(), NOW()),
('menu-iot-product-category-create', 'menu-iot-product-category', '新增IoT 产品分类', 'BUTTON', 'ACTIVE', 'iot:iot_product_category:create', 2, NOW(), NOW()),
('menu-iot-product-category-update', 'menu-iot-product-category', '修改IoT 产品分类', 'BUTTON', 'ACTIVE', 'iot:iot_product_category:update', 3, NOW(), NOW()),
('menu-iot-product-category-delete', 'menu-iot-product-category', '删除IoT 产品分类', 'BUTTON', 'ACTIVE', 'iot:iot_product_category:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-product-category'),
('1', 'menu-iot-product-category-query'),
('1', 'menu-iot-product-category-create'),
('1', 'menu-iot-product-category-update'),
('1', 'menu-iot-product-category-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-product-category'),
('1', 'menu-iot-product-category-query'),
('1', 'menu-iot-product-category-create'),
('1', 'menu-iot-product-category-update'),
('1', 'menu-iot-product-category-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 产品 (IotProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-product',
  'iot-dir',
  'IoT 产品管理',
  '/admin/iot/iot-product',
  'iot/iot-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-product-query',  'menu-iot-product', '查询IoT 产品', 'BUTTON', 'ACTIVE', 'iot:iot_product:query',  1, NOW(), NOW()),
('menu-iot-product-create', 'menu-iot-product', '新增IoT 产品', 'BUTTON', 'ACTIVE', 'iot:iot_product:create', 2, NOW(), NOW()),
('menu-iot-product-update', 'menu-iot-product', '修改IoT 产品', 'BUTTON', 'ACTIVE', 'iot:iot_product:update', 3, NOW(), NOW()),
('menu-iot-product-delete', 'menu-iot-product', '删除IoT 产品', 'BUTTON', 'ACTIVE', 'iot:iot_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-product'),
('1', 'menu-iot-product-query'),
('1', 'menu-iot-product-create'),
('1', 'menu-iot-product-update'),
('1', 'menu-iot-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-product'),
('1', 'menu-iot-product-query'),
('1', 'menu-iot-product-create'),
('1', 'menu-iot-product-update'),
('1', 'menu-iot-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-scene-rule.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 场景联动规则 (IotSceneRule)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-scene-rule',
  'iot-dir',
  'IoT 场景联动规则管理',
  '/admin/iot/iot-scene-rule',
  'iot/iot-scene-rule/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_scene_rule:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-scene-rule-query',  'menu-iot-scene-rule', '查询IoT 场景联动规则', 'BUTTON', 'ACTIVE', 'iot:iot_scene_rule:query',  1, NOW(), NOW()),
('menu-iot-scene-rule-create', 'menu-iot-scene-rule', '新增IoT 场景联动规则', 'BUTTON', 'ACTIVE', 'iot:iot_scene_rule:create', 2, NOW(), NOW()),
('menu-iot-scene-rule-update', 'menu-iot-scene-rule', '修改IoT 场景联动规则', 'BUTTON', 'ACTIVE', 'iot:iot_scene_rule:update', 3, NOW(), NOW()),
('menu-iot-scene-rule-delete', 'menu-iot-scene-rule', '删除IoT 场景联动规则', 'BUTTON', 'ACTIVE', 'iot:iot_scene_rule:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-scene-rule'),
('1', 'menu-iot-scene-rule-query'),
('1', 'menu-iot-scene-rule-create'),
('1', 'menu-iot-scene-rule-update'),
('1', 'menu-iot-scene-rule-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-scene-rule'),
('1', 'menu-iot-scene-rule-query'),
('1', 'menu-iot-scene-rule-create'),
('1', 'menu-iot-scene-rule-update'),
('1', 'menu-iot-scene-rule-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-iot/contract/iot-thing-model.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服 (IotThingModel)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-iot-thing-model',
  'iot-dir',
  'IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服管理',
  '/admin/iot/iot-thing-model',
  'iot/iot-thing-model/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'iot:iot_thing_model:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-iot-thing-model-query',  'menu-iot-thing-model', '查询IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服', 'BUTTON', 'ACTIVE', 'iot:iot_thing_model:query',  1, NOW(), NOW()),
('menu-iot-thing-model-create', 'menu-iot-thing-model', '新增IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服', 'BUTTON', 'ACTIVE', 'iot:iot_thing_model:create', 2, NOW(), NOW()),
('menu-iot-thing-model-update', 'menu-iot-thing-model', '修改IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服', 'BUTTON', 'ACTIVE', 'iot:iot_thing_model:update', 3, NOW(), NOW()),
('menu-iot-thing-model-delete', 'menu-iot-thing-model', '删除IoT 产品物模型功能 DO每个 和 是“一对多”的关系，它的每个属性、事件、服', 'BUTTON', 'ACTIVE', 'iot:iot_thing_model:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-iot-thing-model'),
('1', 'menu-iot-thing-model-query'),
('1', 'menu-iot-thing-model-create'),
('1', 'menu-iot-thing-model-update'),
('1', 'menu-iot-thing-model-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-iot-thing-model'),
('1', 'menu-iot-thing-model-query'),
('1', 'menu-iot-thing-model-create'),
('1', 'menu-iot-thing-model-update'),
('1', 'menu-iot-thing-model-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/after-sale-log.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 交易售后日志 (AfterSaleLog)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-after-sale-log',
  'mall-dir',
  '交易售后日志管理',
  '/admin/mall/after-sale-log',
  'mall/after-sale-log/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:after_sale_log:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-after-sale-log-query',  'menu-after-sale-log', '查询交易售后日志', 'BUTTON', 'ACTIVE', 'mall:after_sale_log:query',  1, NOW(), NOW()),
('menu-after-sale-log-create', 'menu-after-sale-log', '新增交易售后日志', 'BUTTON', 'ACTIVE', 'mall:after_sale_log:create', 2, NOW(), NOW()),
('menu-after-sale-log-update', 'menu-after-sale-log', '修改交易售后日志', 'BUTTON', 'ACTIVE', 'mall:after_sale_log:update', 3, NOW(), NOW()),
('menu-after-sale-log-delete', 'menu-after-sale-log', '删除交易售后日志', 'BUTTON', 'ACTIVE', 'mall:after_sale_log:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-after-sale-log'),
('1', 'menu-after-sale-log-query'),
('1', 'menu-after-sale-log-create'),
('1', 'menu-after-sale-log-update'),
('1', 'menu-after-sale-log-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-after-sale-log'),
('1', 'menu-after-sale-log-query'),
('1', 'menu-after-sale-log-create'),
('1', 'menu-after-sale-log-update'),
('1', 'menu-after-sale-log-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/after-sale.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 售后订单，用于处理 交易订单的退款退货流程 (AfterSale)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-after-sale',
  'mall-dir',
  '售后订单，用于处理 交易订单的退款退货流程管理',
  '/admin/mall/after-sale',
  'mall/after-sale/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:after_sale:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-after-sale-query',  'menu-after-sale', '查询售后订单，用于处理 交易订单的退款退货流程', 'BUTTON', 'ACTIVE', 'mall:after_sale:query',  1, NOW(), NOW()),
('menu-after-sale-create', 'menu-after-sale', '新增售后订单，用于处理 交易订单的退款退货流程', 'BUTTON', 'ACTIVE', 'mall:after_sale:create', 2, NOW(), NOW()),
('menu-after-sale-update', 'menu-after-sale', '修改售后订单，用于处理 交易订单的退款退货流程', 'BUTTON', 'ACTIVE', 'mall:after_sale:update', 3, NOW(), NOW()),
('menu-after-sale-delete', 'menu-after-sale', '删除售后订单，用于处理 交易订单的退款退货流程', 'BUTTON', 'ACTIVE', 'mall:after_sale:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-after-sale'),
('1', 'menu-after-sale-query'),
('1', 'menu-after-sale-create'),
('1', 'menu-after-sale-update'),
('1', 'menu-after-sale-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-after-sale'),
('1', 'menu-after-sale-query'),
('1', 'menu-after-sale-create'),
('1', 'menu-after-sale-update'),
('1', 'menu-after-sale-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/article-category.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 文章分类 (ArticleCategory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-article-category',
  'mall-dir',
  '文章分类管理',
  '/admin/mall/article-category',
  'mall/article-category/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:article_category:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-article-category-query',  'menu-article-category', '查询文章分类', 'BUTTON', 'ACTIVE', 'mall:article_category:query',  1, NOW(), NOW()),
('menu-article-category-create', 'menu-article-category', '新增文章分类', 'BUTTON', 'ACTIVE', 'mall:article_category:create', 2, NOW(), NOW()),
('menu-article-category-update', 'menu-article-category', '修改文章分类', 'BUTTON', 'ACTIVE', 'mall:article_category:update', 3, NOW(), NOW()),
('menu-article-category-delete', 'menu-article-category', '删除文章分类', 'BUTTON', 'ACTIVE', 'mall:article_category:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-article-category'),
('1', 'menu-article-category-query'),
('1', 'menu-article-category-create'),
('1', 'menu-article-category-update'),
('1', 'menu-article-category-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-article-category'),
('1', 'menu-article-category-query'),
('1', 'menu-article-category-create'),
('1', 'menu-article-category-update'),
('1', 'menu-article-category-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/article.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 文章管理 (Article)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-article',
  'mall-dir',
  '文章管理管理',
  '/admin/mall/article',
  'mall/article/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:article:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-article-query',  'menu-article', '查询文章管理', 'BUTTON', 'ACTIVE', 'mall:article:query',  1, NOW(), NOW()),
('menu-article-create', 'menu-article', '新增文章管理', 'BUTTON', 'ACTIVE', 'mall:article:create', 2, NOW(), NOW()),
('menu-article-update', 'menu-article', '修改文章管理', 'BUTTON', 'ACTIVE', 'mall:article:update', 3, NOW(), NOW()),
('menu-article-delete', 'menu-article', '删除文章管理', 'BUTTON', 'ACTIVE', 'mall:article:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-article'),
('1', 'menu-article-query'),
('1', 'menu-article-create'),
('1', 'menu-article-update'),
('1', 'menu-article-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-article'),
('1', 'menu-article-query'),
('1', 'menu-article-create'),
('1', 'menu-article-update'),
('1', 'menu-article-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/banner.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for banner (Banner)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-banner',
  'mall-dir',
  'banner管理',
  '/admin/mall/banner',
  'mall/banner/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:banner:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-banner-query',  'menu-banner', '查询banner', 'BUTTON', 'ACTIVE', 'mall:banner:query',  1, NOW(), NOW()),
('menu-banner-create', 'menu-banner', '新增banner', 'BUTTON', 'ACTIVE', 'mall:banner:create', 2, NOW(), NOW()),
('menu-banner-update', 'menu-banner', '修改banner', 'BUTTON', 'ACTIVE', 'mall:banner:update', 3, NOW(), NOW()),
('menu-banner-delete', 'menu-banner', '删除banner', 'BUTTON', 'ACTIVE', 'mall:banner:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-banner'),
('1', 'menu-banner-query'),
('1', 'menu-banner-create'),
('1', 'menu-banner-update'),
('1', 'menu-banner-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-banner'),
('1', 'menu-banner-query'),
('1', 'menu-banner-create'),
('1', 'menu-banner-update'),
('1', 'menu-banner-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/bargain-activity.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 砍价活动 (BargainActivity)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bargain-activity',
  'mall-dir',
  '砍价活动管理',
  '/admin/mall/bargain-activity',
  'mall/bargain-activity/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:bargain_activity:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bargain-activity-query',  'menu-bargain-activity', '查询砍价活动', 'BUTTON', 'ACTIVE', 'mall:bargain_activity:query',  1, NOW(), NOW()),
('menu-bargain-activity-create', 'menu-bargain-activity', '新增砍价活动', 'BUTTON', 'ACTIVE', 'mall:bargain_activity:create', 2, NOW(), NOW()),
('menu-bargain-activity-update', 'menu-bargain-activity', '修改砍价活动', 'BUTTON', 'ACTIVE', 'mall:bargain_activity:update', 3, NOW(), NOW()),
('menu-bargain-activity-delete', 'menu-bargain-activity', '删除砍价活动', 'BUTTON', 'ACTIVE', 'mall:bargain_activity:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bargain-activity'),
('1', 'menu-bargain-activity-query'),
('1', 'menu-bargain-activity-create'),
('1', 'menu-bargain-activity-update'),
('1', 'menu-bargain-activity-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bargain-activity'),
('1', 'menu-bargain-activity-query'),
('1', 'menu-bargain-activity-create'),
('1', 'menu-bargain-activity-update'),
('1', 'menu-bargain-activity-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/bargain-help.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 砍价助力 (BargainHelp)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bargain-help',
  'mall-dir',
  '砍价助力管理',
  '/admin/mall/bargain-help',
  'mall/bargain-help/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:bargain_help:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bargain-help-query',  'menu-bargain-help', '查询砍价助力', 'BUTTON', 'ACTIVE', 'mall:bargain_help:query',  1, NOW(), NOW()),
('menu-bargain-help-create', 'menu-bargain-help', '新增砍价助力', 'BUTTON', 'ACTIVE', 'mall:bargain_help:create', 2, NOW(), NOW()),
('menu-bargain-help-update', 'menu-bargain-help', '修改砍价助力', 'BUTTON', 'ACTIVE', 'mall:bargain_help:update', 3, NOW(), NOW()),
('menu-bargain-help-delete', 'menu-bargain-help', '删除砍价助力', 'BUTTON', 'ACTIVE', 'mall:bargain_help:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bargain-help'),
('1', 'menu-bargain-help-query'),
('1', 'menu-bargain-help-create'),
('1', 'menu-bargain-help-update'),
('1', 'menu-bargain-help-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bargain-help'),
('1', 'menu-bargain-help-query'),
('1', 'menu-bargain-help-create'),
('1', 'menu-bargain-help-update'),
('1', 'menu-bargain-help-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/bargain-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 砍价记录 DO TO (BargainRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-bargain-record',
  'mall-dir',
  '砍价记录 DO TO管理',
  '/admin/mall/bargain-record',
  'mall/bargain-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:bargain_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-bargain-record-query',  'menu-bargain-record', '查询砍价记录 DO TO', 'BUTTON', 'ACTIVE', 'mall:bargain_record:query',  1, NOW(), NOW()),
('menu-bargain-record-create', 'menu-bargain-record', '新增砍价记录 DO TO', 'BUTTON', 'ACTIVE', 'mall:bargain_record:create', 2, NOW(), NOW()),
('menu-bargain-record-update', 'menu-bargain-record', '修改砍价记录 DO TO', 'BUTTON', 'ACTIVE', 'mall:bargain_record:update', 3, NOW(), NOW()),
('menu-bargain-record-delete', 'menu-bargain-record', '删除砍价记录 DO TO', 'BUTTON', 'ACTIVE', 'mall:bargain_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-bargain-record'),
('1', 'menu-bargain-record-query'),
('1', 'menu-bargain-record-create'),
('1', 'menu-bargain-record-update'),
('1', 'menu-bargain-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-bargain-record'),
('1', 'menu-bargain-record-query'),
('1', 'menu-bargain-record-create'),
('1', 'menu-bargain-record-update'),
('1', 'menu-bargain-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/brokerage-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 佣金记录 (BrokerageRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-brokerage-record',
  'mall-dir',
  '佣金记录管理',
  '/admin/mall/brokerage-record',
  'mall/brokerage-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:brokerage_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-brokerage-record-query',  'menu-brokerage-record', '查询佣金记录', 'BUTTON', 'ACTIVE', 'mall:brokerage_record:query',  1, NOW(), NOW()),
('menu-brokerage-record-create', 'menu-brokerage-record', '新增佣金记录', 'BUTTON', 'ACTIVE', 'mall:brokerage_record:create', 2, NOW(), NOW()),
('menu-brokerage-record-update', 'menu-brokerage-record', '修改佣金记录', 'BUTTON', 'ACTIVE', 'mall:brokerage_record:update', 3, NOW(), NOW()),
('menu-brokerage-record-delete', 'menu-brokerage-record', '删除佣金记录', 'BUTTON', 'ACTIVE', 'mall:brokerage_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-brokerage-record'),
('1', 'menu-brokerage-record-query'),
('1', 'menu-brokerage-record-create'),
('1', 'menu-brokerage-record-update'),
('1', 'menu-brokerage-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-brokerage-record'),
('1', 'menu-brokerage-record-query'),
('1', 'menu-brokerage-record-create'),
('1', 'menu-brokerage-record-update'),
('1', 'menu-brokerage-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/brokerage-user.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 分销用户 (BrokerageUser)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-brokerage-user',
  'mall-dir',
  '分销用户管理',
  '/admin/mall/brokerage-user',
  'mall/brokerage-user/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:brokerage_user:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-brokerage-user-query',  'menu-brokerage-user', '查询分销用户', 'BUTTON', 'ACTIVE', 'mall:brokerage_user:query',  1, NOW(), NOW()),
('menu-brokerage-user-create', 'menu-brokerage-user', '新增分销用户', 'BUTTON', 'ACTIVE', 'mall:brokerage_user:create', 2, NOW(), NOW()),
('menu-brokerage-user-update', 'menu-brokerage-user', '修改分销用户', 'BUTTON', 'ACTIVE', 'mall:brokerage_user:update', 3, NOW(), NOW()),
('menu-brokerage-user-delete', 'menu-brokerage-user', '删除分销用户', 'BUTTON', 'ACTIVE', 'mall:brokerage_user:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-brokerage-user'),
('1', 'menu-brokerage-user-query'),
('1', 'menu-brokerage-user-create'),
('1', 'menu-brokerage-user-update'),
('1', 'menu-brokerage-user-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-brokerage-user'),
('1', 'menu-brokerage-user-query'),
('1', 'menu-brokerage-user-create'),
('1', 'menu-brokerage-user-update'),
('1', 'menu-brokerage-user-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/brokerage-withdraw.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 佣金提现 (BrokerageWithdraw)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-brokerage-withdraw',
  'mall-dir',
  '佣金提现管理',
  '/admin/mall/brokerage-withdraw',
  'mall/brokerage-withdraw/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:brokerage_withdraw:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-brokerage-withdraw-query',  'menu-brokerage-withdraw', '查询佣金提现', 'BUTTON', 'ACTIVE', 'mall:brokerage_withdraw:query',  1, NOW(), NOW()),
('menu-brokerage-withdraw-create', 'menu-brokerage-withdraw', '新增佣金提现', 'BUTTON', 'ACTIVE', 'mall:brokerage_withdraw:create', 2, NOW(), NOW()),
('menu-brokerage-withdraw-update', 'menu-brokerage-withdraw', '修改佣金提现', 'BUTTON', 'ACTIVE', 'mall:brokerage_withdraw:update', 3, NOW(), NOW()),
('menu-brokerage-withdraw-delete', 'menu-brokerage-withdraw', '删除佣金提现', 'BUTTON', 'ACTIVE', 'mall:brokerage_withdraw:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-brokerage-withdraw'),
('1', 'menu-brokerage-withdraw-query'),
('1', 'menu-brokerage-withdraw-create'),
('1', 'menu-brokerage-withdraw-update'),
('1', 'menu-brokerage-withdraw-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-brokerage-withdraw'),
('1', 'menu-brokerage-withdraw-query'),
('1', 'menu-brokerage-withdraw-create'),
('1', 'menu-brokerage-withdraw-update'),
('1', 'menu-brokerage-withdraw-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/cart.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联 (Cart)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-cart',
  'mall-dir',
  '购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联管理',
  '/admin/mall/cart',
  'mall/cart/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:cart:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-cart-query',  'menu-cart', '查询购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联', 'BUTTON', 'ACTIVE', 'mall:cart:query',  1, NOW(), NOW()),
('menu-cart-create', 'menu-cart', '新增购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联', 'BUTTON', 'ACTIVE', 'mall:cart:create', 2, NOW(), NOW()),
('menu-cart-update', 'menu-cart', '修改购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联', 'BUTTON', 'ACTIVE', 'mall:cart:update', 3, NOW(), NOW()),
('menu-cart-delete', 'menu-cart', '删除购物车的商品信息 DO每个商品，对应一条记录，通过 和 关联', 'BUTTON', 'ACTIVE', 'mall:cart:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-cart'),
('1', 'menu-cart-query'),
('1', 'menu-cart-create'),
('1', 'menu-cart-update'),
('1', 'menu-cart-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-cart'),
('1', 'menu-cart-query'),
('1', 'menu-cart-create'),
('1', 'menu-cart-update'),
('1', 'menu-cart-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/combination-activity.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 拼团活动 (CombinationActivity)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-combination-activity',
  'mall-dir',
  '拼团活动管理',
  '/admin/mall/combination-activity',
  'mall/combination-activity/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:combination_activity:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-combination-activity-query',  'menu-combination-activity', '查询拼团活动', 'BUTTON', 'ACTIVE', 'mall:combination_activity:query',  1, NOW(), NOW()),
('menu-combination-activity-create', 'menu-combination-activity', '新增拼团活动', 'BUTTON', 'ACTIVE', 'mall:combination_activity:create', 2, NOW(), NOW()),
('menu-combination-activity-update', 'menu-combination-activity', '修改拼团活动', 'BUTTON', 'ACTIVE', 'mall:combination_activity:update', 3, NOW(), NOW()),
('menu-combination-activity-delete', 'menu-combination-activity', '删除拼团活动', 'BUTTON', 'ACTIVE', 'mall:combination_activity:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-combination-activity'),
('1', 'menu-combination-activity-query'),
('1', 'menu-combination-activity-create'),
('1', 'menu-combination-activity-update'),
('1', 'menu-combination-activity-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-combination-activity'),
('1', 'menu-combination-activity-query'),
('1', 'menu-combination-activity-create'),
('1', 'menu-combination-activity-update'),
('1', 'menu-combination-activity-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/combination-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 拼团商品 (CombinationProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-combination-product',
  'mall-dir',
  '拼团商品管理',
  '/admin/mall/combination-product',
  'mall/combination-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:combination_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-combination-product-query',  'menu-combination-product', '查询拼团商品', 'BUTTON', 'ACTIVE', 'mall:combination_product:query',  1, NOW(), NOW()),
('menu-combination-product-create', 'menu-combination-product', '新增拼团商品', 'BUTTON', 'ACTIVE', 'mall:combination_product:create', 2, NOW(), NOW()),
('menu-combination-product-update', 'menu-combination-product', '修改拼团商品', 'BUTTON', 'ACTIVE', 'mall:combination_product:update', 3, NOW(), NOW()),
('menu-combination-product-delete', 'menu-combination-product', '删除拼团商品', 'BUTTON', 'ACTIVE', 'mall:combination_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-combination-product'),
('1', 'menu-combination-product-query'),
('1', 'menu-combination-product-create'),
('1', 'menu-combination-product-update'),
('1', 'menu-combination-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-combination-product'),
('1', 'menu-combination-product-query'),
('1', 'menu-combination-product-create'),
('1', 'menu-combination-product-update'),
('1', 'menu-combination-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/combination-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人 (CombinationRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-combination-record',
  'mall-dir',
  '拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人管理',
  '/admin/mall/combination-record',
  'mall/combination-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:combination_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-combination-record-query',  'menu-combination-record', '查询拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人', 'BUTTON', 'ACTIVE', 'mall:combination_record:query',  1, NOW(), NOW()),
('menu-combination-record-create', 'menu-combination-record', '新增拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人', 'BUTTON', 'ACTIVE', 'mall:combination_record:create', 2, NOW(), NOW()),
('menu-combination-record-update', 'menu-combination-record', '修改拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人', 'BUTTON', 'ACTIVE', 'mall:combination_record:update', 3, NOW(), NOW()),
('menu-combination-record-delete', 'menu-combination-record', '删除拼团记录 DO1. 用户参与拼团时，会创建一条记录2. 团长的拼团记录，和参团人', 'BUTTON', 'ACTIVE', 'mall:combination_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-combination-record'),
('1', 'menu-combination-record-query'),
('1', 'menu-combination-record-create'),
('1', 'menu-combination-record-update'),
('1', 'menu-combination-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-combination-record'),
('1', 'menu-combination-record-query'),
('1', 'menu-combination-record-create'),
('1', 'menu-combination-record-update'),
('1', 'menu-combination-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/coupon-template.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 优惠劵模板 DO当用户领取时，会生成 优惠劵 (CouponTemplate)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-coupon-template',
  'mall-dir',
  '优惠劵模板 DO当用户领取时，会生成 优惠劵管理',
  '/admin/mall/coupon-template',
  'mall/coupon-template/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:coupon_template:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-coupon-template-query',  'menu-coupon-template', '查询优惠劵模板 DO当用户领取时，会生成 优惠劵', 'BUTTON', 'ACTIVE', 'mall:coupon_template:query',  1, NOW(), NOW()),
('menu-coupon-template-create', 'menu-coupon-template', '新增优惠劵模板 DO当用户领取时，会生成 优惠劵', 'BUTTON', 'ACTIVE', 'mall:coupon_template:create', 2, NOW(), NOW()),
('menu-coupon-template-update', 'menu-coupon-template', '修改优惠劵模板 DO当用户领取时，会生成 优惠劵', 'BUTTON', 'ACTIVE', 'mall:coupon_template:update', 3, NOW(), NOW()),
('menu-coupon-template-delete', 'menu-coupon-template', '删除优惠劵模板 DO当用户领取时，会生成 优惠劵', 'BUTTON', 'ACTIVE', 'mall:coupon_template:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-coupon-template'),
('1', 'menu-coupon-template-query'),
('1', 'menu-coupon-template-create'),
('1', 'menu-coupon-template-update'),
('1', 'menu-coupon-template-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-coupon-template'),
('1', 'menu-coupon-template-query'),
('1', 'menu-coupon-template-create'),
('1', 'menu-coupon-template-update'),
('1', 'menu-coupon-template-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/coupon.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 优惠劵 (Coupon)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-coupon',
  'mall-dir',
  '优惠劵管理',
  '/admin/mall/coupon',
  'mall/coupon/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:coupon:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-coupon-query',  'menu-coupon', '查询优惠劵', 'BUTTON', 'ACTIVE', 'mall:coupon:query',  1, NOW(), NOW()),
('menu-coupon-create', 'menu-coupon', '新增优惠劵', 'BUTTON', 'ACTIVE', 'mall:coupon:create', 2, NOW(), NOW()),
('menu-coupon-update', 'menu-coupon', '修改优惠劵', 'BUTTON', 'ACTIVE', 'mall:coupon:update', 3, NOW(), NOW()),
('menu-coupon-delete', 'menu-coupon', '删除优惠劵', 'BUTTON', 'ACTIVE', 'mall:coupon:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-coupon'),
('1', 'menu-coupon-query'),
('1', 'menu-coupon-create'),
('1', 'menu-coupon-update'),
('1', 'menu-coupon-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-coupon'),
('1', 'menu-coupon-query'),
('1', 'menu-coupon-create'),
('1', 'menu-coupon-update'),
('1', 'menu-coupon-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/delivery-express-template-charge.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 快递运费模板计费配置 (DeliveryExpressTemplateCharge)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-delivery-express-template-charge',
  'mall-dir',
  '快递运费模板计费配置管理',
  '/admin/mall/delivery-express-template-charge',
  'mall/delivery-express-template-charge/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:delivery_express_template_charge:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-delivery-express-template-charge-query',  'menu-delivery-express-template-charge', '查询快递运费模板计费配置', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template_charge:query',  1, NOW(), NOW()),
('menu-delivery-express-template-charge-create', 'menu-delivery-express-template-charge', '新增快递运费模板计费配置', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template_charge:create', 2, NOW(), NOW()),
('menu-delivery-express-template-charge-update', 'menu-delivery-express-template-charge', '修改快递运费模板计费配置', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template_charge:update', 3, NOW(), NOW()),
('menu-delivery-express-template-charge-delete', 'menu-delivery-express-template-charge', '删除快递运费模板计费配置', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template_charge:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-delivery-express-template-charge'),
('1', 'menu-delivery-express-template-charge-query'),
('1', 'menu-delivery-express-template-charge-create'),
('1', 'menu-delivery-express-template-charge-update'),
('1', 'menu-delivery-express-template-charge-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-delivery-express-template-charge'),
('1', 'menu-delivery-express-template-charge-query'),
('1', 'menu-delivery-express-template-charge-create'),
('1', 'menu-delivery-express-template-charge-update'),
('1', 'menu-delivery-express-template-charge-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/delivery-express-template-free.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 快递运费模板包邮配置 (DeliveryExpressTemplateFree)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-delivery-express-template-free',
  'mall-dir',
  '快递运费模板包邮配置管理',
  '/admin/mall/delivery-express-template-free',
  'mall/delivery-express-template-free/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:delivery_express_template_free:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-delivery-express-template-free-query',  'menu-delivery-express-template-free', '查询快递运费模板包邮配置', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template_free:query',  1, NOW(), NOW()),
('menu-delivery-express-template-free-create', 'menu-delivery-express-template-free', '新增快递运费模板包邮配置', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template_free:create', 2, NOW(), NOW()),
('menu-delivery-express-template-free-update', 'menu-delivery-express-template-free', '修改快递运费模板包邮配置', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template_free:update', 3, NOW(), NOW()),
('menu-delivery-express-template-free-delete', 'menu-delivery-express-template-free', '删除快递运费模板包邮配置', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template_free:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-delivery-express-template-free'),
('1', 'menu-delivery-express-template-free-query'),
('1', 'menu-delivery-express-template-free-create'),
('1', 'menu-delivery-express-template-free-update'),
('1', 'menu-delivery-express-template-free-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-delivery-express-template-free'),
('1', 'menu-delivery-express-template-free-query'),
('1', 'menu-delivery-express-template-free-create'),
('1', 'menu-delivery-express-template-free-update'),
('1', 'menu-delivery-express-template-free-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/delivery-express-template.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 快递运费模板 (DeliveryExpressTemplate)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-delivery-express-template',
  'mall-dir',
  '快递运费模板管理',
  '/admin/mall/delivery-express-template',
  'mall/delivery-express-template/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:delivery_express_template:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-delivery-express-template-query',  'menu-delivery-express-template', '查询快递运费模板', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template:query',  1, NOW(), NOW()),
('menu-delivery-express-template-create', 'menu-delivery-express-template', '新增快递运费模板', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template:create', 2, NOW(), NOW()),
('menu-delivery-express-template-update', 'menu-delivery-express-template', '修改快递运费模板', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template:update', 3, NOW(), NOW()),
('menu-delivery-express-template-delete', 'menu-delivery-express-template', '删除快递运费模板', 'BUTTON', 'ACTIVE', 'mall:delivery_express_template:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-delivery-express-template'),
('1', 'menu-delivery-express-template-query'),
('1', 'menu-delivery-express-template-create'),
('1', 'menu-delivery-express-template-update'),
('1', 'menu-delivery-express-template-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-delivery-express-template'),
('1', 'menu-delivery-express-template-query'),
('1', 'menu-delivery-express-template-create'),
('1', 'menu-delivery-express-template-update'),
('1', 'menu-delivery-express-template-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/delivery-express.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 快递公司 (DeliveryExpress)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-delivery-express',
  'mall-dir',
  '快递公司管理',
  '/admin/mall/delivery-express',
  'mall/delivery-express/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:delivery_express:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-delivery-express-query',  'menu-delivery-express', '查询快递公司', 'BUTTON', 'ACTIVE', 'mall:delivery_express:query',  1, NOW(), NOW()),
('menu-delivery-express-create', 'menu-delivery-express', '新增快递公司', 'BUTTON', 'ACTIVE', 'mall:delivery_express:create', 2, NOW(), NOW()),
('menu-delivery-express-update', 'menu-delivery-express', '修改快递公司', 'BUTTON', 'ACTIVE', 'mall:delivery_express:update', 3, NOW(), NOW()),
('menu-delivery-express-delete', 'menu-delivery-express', '删除快递公司', 'BUTTON', 'ACTIVE', 'mall:delivery_express:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-delivery-express'),
('1', 'menu-delivery-express-query'),
('1', 'menu-delivery-express-create'),
('1', 'menu-delivery-express-update'),
('1', 'menu-delivery-express-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-delivery-express'),
('1', 'menu-delivery-express-query'),
('1', 'menu-delivery-express-create'),
('1', 'menu-delivery-express-update'),
('1', 'menu-delivery-express-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/delivery-pick-up-store.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 自提门店 (DeliveryPickUpStore)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-delivery-pick-up-store',
  'mall-dir',
  '自提门店管理',
  '/admin/mall/delivery-pick-up-store',
  'mall/delivery-pick-up-store/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:delivery_pick_up_store:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-delivery-pick-up-store-query',  'menu-delivery-pick-up-store', '查询自提门店', 'BUTTON', 'ACTIVE', 'mall:delivery_pick_up_store:query',  1, NOW(), NOW()),
('menu-delivery-pick-up-store-create', 'menu-delivery-pick-up-store', '新增自提门店', 'BUTTON', 'ACTIVE', 'mall:delivery_pick_up_store:create', 2, NOW(), NOW()),
('menu-delivery-pick-up-store-update', 'menu-delivery-pick-up-store', '修改自提门店', 'BUTTON', 'ACTIVE', 'mall:delivery_pick_up_store:update', 3, NOW(), NOW()),
('menu-delivery-pick-up-store-delete', 'menu-delivery-pick-up-store', '删除自提门店', 'BUTTON', 'ACTIVE', 'mall:delivery_pick_up_store:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-delivery-pick-up-store'),
('1', 'menu-delivery-pick-up-store-query'),
('1', 'menu-delivery-pick-up-store-create'),
('1', 'menu-delivery-pick-up-store-update'),
('1', 'menu-delivery-pick-up-store-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-delivery-pick-up-store'),
('1', 'menu-delivery-pick-up-store-query'),
('1', 'menu-delivery-pick-up-store-create'),
('1', 'menu-delivery-pick-up-store-update'),
('1', 'menu-delivery-pick-up-store-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/discount-activity.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一 (DiscountActivity)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-discount-activity',
  'mall-dir',
  '限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一管理',
  '/admin/mall/discount-activity',
  'mall/discount-activity/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:discount_activity:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-discount-activity-query',  'menu-discount-activity', '查询限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一', 'BUTTON', 'ACTIVE', 'mall:discount_activity:query',  1, NOW(), NOW()),
('menu-discount-activity-create', 'menu-discount-activity', '新增限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一', 'BUTTON', 'ACTIVE', 'mall:discount_activity:create', 2, NOW(), NOW()),
('menu-discount-activity-update', 'menu-discount-activity', '修改限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一', 'BUTTON', 'ACTIVE', 'mall:discount_activity:update', 3, NOW(), NOW()),
('menu-discount-activity-delete', 'menu-discount-activity', '删除限时折扣活动 DO一个活动下，可以有 商品；一个商品，在指定时间段内，只能属于一', 'BUTTON', 'ACTIVE', 'mall:discount_activity:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-discount-activity'),
('1', 'menu-discount-activity-query'),
('1', 'menu-discount-activity-create'),
('1', 'menu-discount-activity-update'),
('1', 'menu-discount-activity-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-discount-activity'),
('1', 'menu-discount-activity-query'),
('1', 'menu-discount-activity-create'),
('1', 'menu-discount-activity-update'),
('1', 'menu-discount-activity-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/discount-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 限时折扣商品 (DiscountProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-discount-product',
  'mall-dir',
  '限时折扣商品管理',
  '/admin/mall/discount-product',
  'mall/discount-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:discount_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-discount-product-query',  'menu-discount-product', '查询限时折扣商品', 'BUTTON', 'ACTIVE', 'mall:discount_product:query',  1, NOW(), NOW()),
('menu-discount-product-create', 'menu-discount-product', '新增限时折扣商品', 'BUTTON', 'ACTIVE', 'mall:discount_product:create', 2, NOW(), NOW()),
('menu-discount-product-update', 'menu-discount-product', '修改限时折扣商品', 'BUTTON', 'ACTIVE', 'mall:discount_product:update', 3, NOW(), NOW()),
('menu-discount-product-delete', 'menu-discount-product', '删除限时折扣商品', 'BUTTON', 'ACTIVE', 'mall:discount_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-discount-product'),
('1', 'menu-discount-product-query'),
('1', 'menu-discount-product-create'),
('1', 'menu-discount-product-update'),
('1', 'menu-discount-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-discount-product'),
('1', 'menu-discount-product-query'),
('1', 'menu-discount-product-create'),
('1', 'menu-discount-product-update'),
('1', 'menu-discount-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/diy-page.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 装修页面 (DiyPage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-diy-page',
  'mall-dir',
  '装修页面管理',
  '/admin/mall/diy-page',
  'mall/diy-page/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:diy_page:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-diy-page-query',  'menu-diy-page', '查询装修页面', 'BUTTON', 'ACTIVE', 'mall:diy_page:query',  1, NOW(), NOW()),
('menu-diy-page-create', 'menu-diy-page', '新增装修页面', 'BUTTON', 'ACTIVE', 'mall:diy_page:create', 2, NOW(), NOW()),
('menu-diy-page-update', 'menu-diy-page', '修改装修页面', 'BUTTON', 'ACTIVE', 'mall:diy_page:update', 3, NOW(), NOW()),
('menu-diy-page-delete', 'menu-diy-page', '删除装修页面', 'BUTTON', 'ACTIVE', 'mall:diy_page:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-diy-page'),
('1', 'menu-diy-page-query'),
('1', 'menu-diy-page-create'),
('1', 'menu-diy-page-update'),
('1', 'menu-diy-page-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-diy-page'),
('1', 'menu-diy-page-query'),
('1', 'menu-diy-page-create'),
('1', 'menu-diy-page-update'),
('1', 'menu-diy-page-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/diy-template.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2.  (DiyTemplate)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-diy-template',
  'mall-dir',
  '装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2. 管理',
  '/admin/mall/diy-template',
  'mall/diy-template/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:diy_template:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-diy-template-query',  'menu-diy-template', '查询装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2. ', 'BUTTON', 'ACTIVE', 'mall:diy_template:query',  1, NOW(), NOW()),
('menu-diy-template-create', 'menu-diy-template', '新增装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2. ', 'BUTTON', 'ACTIVE', 'mall:diy_template:create', 2, NOW(), NOW()),
('menu-diy-template-update', 'menu-diy-template', '修改装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2. ', 'BUTTON', 'ACTIVE', 'mall:diy_template:update', 3, NOW(), NOW()),
('menu-diy-template-delete', 'menu-diy-template', '删除装修模板 DO1. 新建一个模版，下面可以包含多个 页面，例如说首页、我的2. ', 'BUTTON', 'ACTIVE', 'mall:diy_template:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-diy-template'),
('1', 'menu-diy-template-query'),
('1', 'menu-diy-template-create'),
('1', 'menu-diy-template-update'),
('1', 'menu-diy-template-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-diy-template'),
('1', 'menu-diy-template-query'),
('1', 'menu-diy-template-create'),
('1', 'menu-diy-template-update'),
('1', 'menu-diy-template-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/ke-fu-conversation.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 客服会话 (KeFuConversation)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ke-fu-conversation',
  'mall-dir',
  '客服会话管理',
  '/admin/mall/ke-fu-conversation',
  'mall/ke-fu-conversation/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:ke_fu_conversation:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ke-fu-conversation-query',  'menu-ke-fu-conversation', '查询客服会话', 'BUTTON', 'ACTIVE', 'mall:ke_fu_conversation:query',  1, NOW(), NOW()),
('menu-ke-fu-conversation-create', 'menu-ke-fu-conversation', '新增客服会话', 'BUTTON', 'ACTIVE', 'mall:ke_fu_conversation:create', 2, NOW(), NOW()),
('menu-ke-fu-conversation-update', 'menu-ke-fu-conversation', '修改客服会话', 'BUTTON', 'ACTIVE', 'mall:ke_fu_conversation:update', 3, NOW(), NOW()),
('menu-ke-fu-conversation-delete', 'menu-ke-fu-conversation', '删除客服会话', 'BUTTON', 'ACTIVE', 'mall:ke_fu_conversation:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ke-fu-conversation'),
('1', 'menu-ke-fu-conversation-query'),
('1', 'menu-ke-fu-conversation-create'),
('1', 'menu-ke-fu-conversation-update'),
('1', 'menu-ke-fu-conversation-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ke-fu-conversation'),
('1', 'menu-ke-fu-conversation-query'),
('1', 'menu-ke-fu-conversation-create'),
('1', 'menu-ke-fu-conversation-update'),
('1', 'menu-ke-fu-conversation-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/ke-fu-message.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 客服消息 (KeFuMessage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-ke-fu-message',
  'mall-dir',
  '客服消息管理',
  '/admin/mall/ke-fu-message',
  'mall/ke-fu-message/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:ke_fu_message:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-ke-fu-message-query',  'menu-ke-fu-message', '查询客服消息', 'BUTTON', 'ACTIVE', 'mall:ke_fu_message:query',  1, NOW(), NOW()),
('menu-ke-fu-message-create', 'menu-ke-fu-message', '新增客服消息', 'BUTTON', 'ACTIVE', 'mall:ke_fu_message:create', 2, NOW(), NOW()),
('menu-ke-fu-message-update', 'menu-ke-fu-message', '修改客服消息', 'BUTTON', 'ACTIVE', 'mall:ke_fu_message:update', 3, NOW(), NOW()),
('menu-ke-fu-message-delete', 'menu-ke-fu-message', '删除客服消息', 'BUTTON', 'ACTIVE', 'mall:ke_fu_message:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-ke-fu-message'),
('1', 'menu-ke-fu-message-query'),
('1', 'menu-ke-fu-message-create'),
('1', 'menu-ke-fu-message-update'),
('1', 'menu-ke-fu-message-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-ke-fu-message'),
('1', 'menu-ke-fu-message-query'),
('1', 'menu-ke-fu-message-create'),
('1', 'menu-ke-fu-message-update'),
('1', 'menu-ke-fu-message-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/point-activity.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 积分商城活动 (PointActivity)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-point-activity',
  'mall-dir',
  '积分商城活动管理',
  '/admin/mall/point-activity',
  'mall/point-activity/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:point_activity:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-point-activity-query',  'menu-point-activity', '查询积分商城活动', 'BUTTON', 'ACTIVE', 'mall:point_activity:query',  1, NOW(), NOW()),
('menu-point-activity-create', 'menu-point-activity', '新增积分商城活动', 'BUTTON', 'ACTIVE', 'mall:point_activity:create', 2, NOW(), NOW()),
('menu-point-activity-update', 'menu-point-activity', '修改积分商城活动', 'BUTTON', 'ACTIVE', 'mall:point_activity:update', 3, NOW(), NOW()),
('menu-point-activity-delete', 'menu-point-activity', '删除积分商城活动', 'BUTTON', 'ACTIVE', 'mall:point_activity:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-point-activity'),
('1', 'menu-point-activity-query'),
('1', 'menu-point-activity-create'),
('1', 'menu-point-activity-update'),
('1', 'menu-point-activity-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-point-activity'),
('1', 'menu-point-activity-query'),
('1', 'menu-point-activity-create'),
('1', 'menu-point-activity-update'),
('1', 'menu-point-activity-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/point-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 积分商城商品 (PointProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-point-product',
  'mall-dir',
  '积分商城商品管理',
  '/admin/mall/point-product',
  'mall/point-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:point_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-point-product-query',  'menu-point-product', '查询积分商城商品', 'BUTTON', 'ACTIVE', 'mall:point_product:query',  1, NOW(), NOW()),
('menu-point-product-create', 'menu-point-product', '新增积分商城商品', 'BUTTON', 'ACTIVE', 'mall:point_product:create', 2, NOW(), NOW()),
('menu-point-product-update', 'menu-point-product', '修改积分商城商品', 'BUTTON', 'ACTIVE', 'mall:point_product:update', 3, NOW(), NOW()),
('menu-point-product-delete', 'menu-point-product', '删除积分商城商品', 'BUTTON', 'ACTIVE', 'mall:point_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-point-product'),
('1', 'menu-point-product-query'),
('1', 'menu-point-product-create'),
('1', 'menu-point-product-update'),
('1', 'menu-point-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-point-product'),
('1', 'menu-point-product-query'),
('1', 'menu-point-product-create'),
('1', 'menu-point-product-update'),
('1', 'menu-point-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-brand.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品品牌 (ProductBrand)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-brand',
  'mall-dir',
  '商品品牌管理',
  '/admin/mall/product-brand',
  'mall/product-brand/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_brand:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-brand-query',  'menu-product-brand', '查询商品品牌', 'BUTTON', 'ACTIVE', 'mall:product_brand:query',  1, NOW(), NOW()),
('menu-product-brand-create', 'menu-product-brand', '新增商品品牌', 'BUTTON', 'ACTIVE', 'mall:product_brand:create', 2, NOW(), NOW()),
('menu-product-brand-update', 'menu-product-brand', '修改商品品牌', 'BUTTON', 'ACTIVE', 'mall:product_brand:update', 3, NOW(), NOW()),
('menu-product-brand-delete', 'menu-product-brand', '删除商品品牌', 'BUTTON', 'ACTIVE', 'mall:product_brand:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-brand'),
('1', 'menu-product-brand-query'),
('1', 'menu-product-brand-create'),
('1', 'menu-product-brand-update'),
('1', 'menu-product-brand-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-brand'),
('1', 'menu-product-brand-query'),
('1', 'menu-product-brand-create'),
('1', 'menu-product-brand-update'),
('1', 'menu-product-brand-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-browse-history.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品浏览记录 (ProductBrowseHistory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-browse-history',
  'mall-dir',
  '商品浏览记录管理',
  '/admin/mall/product-browse-history',
  'mall/product-browse-history/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_browse_history:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-browse-history-query',  'menu-product-browse-history', '查询商品浏览记录', 'BUTTON', 'ACTIVE', 'mall:product_browse_history:query',  1, NOW(), NOW()),
('menu-product-browse-history-create', 'menu-product-browse-history', '新增商品浏览记录', 'BUTTON', 'ACTIVE', 'mall:product_browse_history:create', 2, NOW(), NOW()),
('menu-product-browse-history-update', 'menu-product-browse-history', '修改商品浏览记录', 'BUTTON', 'ACTIVE', 'mall:product_browse_history:update', 3, NOW(), NOW()),
('menu-product-browse-history-delete', 'menu-product-browse-history', '删除商品浏览记录', 'BUTTON', 'ACTIVE', 'mall:product_browse_history:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-browse-history'),
('1', 'menu-product-browse-history-query'),
('1', 'menu-product-browse-history-create'),
('1', 'menu-product-browse-history-update'),
('1', 'menu-product-browse-history-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-browse-history'),
('1', 'menu-product-browse-history-query'),
('1', 'menu-product-browse-history-create'),
('1', 'menu-product-browse-history-update'),
('1', 'menu-product-browse-history-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-category.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品分类 (ProductCategory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-category',
  'mall-dir',
  '商品分类管理',
  '/admin/mall/product-category',
  'mall/product-category/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_category:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-category-query',  'menu-product-category', '查询商品分类', 'BUTTON', 'ACTIVE', 'mall:product_category:query',  1, NOW(), NOW()),
('menu-product-category-create', 'menu-product-category', '新增商品分类', 'BUTTON', 'ACTIVE', 'mall:product_category:create', 2, NOW(), NOW()),
('menu-product-category-update', 'menu-product-category', '修改商品分类', 'BUTTON', 'ACTIVE', 'mall:product_category:update', 3, NOW(), NOW()),
('menu-product-category-delete', 'menu-product-category', '删除商品分类', 'BUTTON', 'ACTIVE', 'mall:product_category:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-category'),
('1', 'menu-product-category-query'),
('1', 'menu-product-category-create'),
('1', 'menu-product-category-update'),
('1', 'menu-product-category-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-category'),
('1', 'menu-product-category-query'),
('1', 'menu-product-category-create'),
('1', 'menu-product-category-update'),
('1', 'menu-product-category-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-comment.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品评论 (ProductComment)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-comment',
  'mall-dir',
  '商品评论管理',
  '/admin/mall/product-comment',
  'mall/product-comment/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_comment:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-comment-query',  'menu-product-comment', '查询商品评论', 'BUTTON', 'ACTIVE', 'mall:product_comment:query',  1, NOW(), NOW()),
('menu-product-comment-create', 'menu-product-comment', '新增商品评论', 'BUTTON', 'ACTIVE', 'mall:product_comment:create', 2, NOW(), NOW()),
('menu-product-comment-update', 'menu-product-comment', '修改商品评论', 'BUTTON', 'ACTIVE', 'mall:product_comment:update', 3, NOW(), NOW()),
('menu-product-comment-delete', 'menu-product-comment', '删除商品评论', 'BUTTON', 'ACTIVE', 'mall:product_comment:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-comment'),
('1', 'menu-product-comment-query'),
('1', 'menu-product-comment-create'),
('1', 'menu-product-comment-update'),
('1', 'menu-product-comment-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-comment'),
('1', 'menu-product-comment-query'),
('1', 'menu-product-comment-create'),
('1', 'menu-product-comment-update'),
('1', 'menu-product-comment-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-favorite.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品收藏 (ProductFavorite)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-favorite',
  'mall-dir',
  '商品收藏管理',
  '/admin/mall/product-favorite',
  'mall/product-favorite/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_favorite:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-favorite-query',  'menu-product-favorite', '查询商品收藏', 'BUTTON', 'ACTIVE', 'mall:product_favorite:query',  1, NOW(), NOW()),
('menu-product-favorite-create', 'menu-product-favorite', '新增商品收藏', 'BUTTON', 'ACTIVE', 'mall:product_favorite:create', 2, NOW(), NOW()),
('menu-product-favorite-update', 'menu-product-favorite', '修改商品收藏', 'BUTTON', 'ACTIVE', 'mall:product_favorite:update', 3, NOW(), NOW()),
('menu-product-favorite-delete', 'menu-product-favorite', '删除商品收藏', 'BUTTON', 'ACTIVE', 'mall:product_favorite:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-favorite'),
('1', 'menu-product-favorite-query'),
('1', 'menu-product-favorite-create'),
('1', 'menu-product-favorite-update'),
('1', 'menu-product-favorite-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-favorite'),
('1', 'menu-product-favorite-query'),
('1', 'menu-product-favorite-create'),
('1', 'menu-product-favorite-update'),
('1', 'menu-product-favorite-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-property-value.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品属性值 (ProductPropertyValue)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-property-value',
  'mall-dir',
  '商品属性值管理',
  '/admin/mall/product-property-value',
  'mall/product-property-value/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_property_value:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-property-value-query',  'menu-product-property-value', '查询商品属性值', 'BUTTON', 'ACTIVE', 'mall:product_property_value:query',  1, NOW(), NOW()),
('menu-product-property-value-create', 'menu-product-property-value', '新增商品属性值', 'BUTTON', 'ACTIVE', 'mall:product_property_value:create', 2, NOW(), NOW()),
('menu-product-property-value-update', 'menu-product-property-value', '修改商品属性值', 'BUTTON', 'ACTIVE', 'mall:product_property_value:update', 3, NOW(), NOW()),
('menu-product-property-value-delete', 'menu-product-property-value', '删除商品属性值', 'BUTTON', 'ACTIVE', 'mall:product_property_value:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-property-value'),
('1', 'menu-product-property-value-query'),
('1', 'menu-product-property-value-create'),
('1', 'menu-product-property-value-update'),
('1', 'menu-product-property-value-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-property-value'),
('1', 'menu-product-property-value-query'),
('1', 'menu-product-property-value-create'),
('1', 'menu-product-property-value-update'),
('1', 'menu-product-property-value-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-property.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品属性项 (ProductProperty)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-property',
  'mall-dir',
  '商品属性项管理',
  '/admin/mall/product-property',
  'mall/product-property/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_property:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-property-query',  'menu-product-property', '查询商品属性项', 'BUTTON', 'ACTIVE', 'mall:product_property:query',  1, NOW(), NOW()),
('menu-product-property-create', 'menu-product-property', '新增商品属性项', 'BUTTON', 'ACTIVE', 'mall:product_property:create', 2, NOW(), NOW()),
('menu-product-property-update', 'menu-product-property', '修改商品属性项', 'BUTTON', 'ACTIVE', 'mall:product_property:update', 3, NOW(), NOW()),
('menu-product-property-delete', 'menu-product-property', '删除商品属性项', 'BUTTON', 'ACTIVE', 'mall:product_property:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-property'),
('1', 'menu-product-property-query'),
('1', 'menu-product-property-create'),
('1', 'menu-product-property-update'),
('1', 'menu-product-property-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-property'),
('1', 'menu-product-property-query'),
('1', 'menu-product-property-create'),
('1', 'menu-product-property-update'),
('1', 'menu-product-property-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-sku.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品 SKU (ProductSku)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-sku',
  'mall-dir',
  '商品 SKU管理',
  '/admin/mall/product-sku',
  'mall/product-sku/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_sku:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-sku-query',  'menu-product-sku', '查询商品 SKU', 'BUTTON', 'ACTIVE', 'mall:product_sku:query',  1, NOW(), NOW()),
('menu-product-sku-create', 'menu-product-sku', '新增商品 SKU', 'BUTTON', 'ACTIVE', 'mall:product_sku:create', 2, NOW(), NOW()),
('menu-product-sku-update', 'menu-product-sku', '修改商品 SKU', 'BUTTON', 'ACTIVE', 'mall:product_sku:update', 3, NOW(), NOW()),
('menu-product-sku-delete', 'menu-product-sku', '删除商品 SKU', 'BUTTON', 'ACTIVE', 'mall:product_sku:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-sku'),
('1', 'menu-product-sku-query'),
('1', 'menu-product-sku-create'),
('1', 'menu-product-sku-update'),
('1', 'menu-product-sku-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-sku'),
('1', 'menu-product-sku-query'),
('1', 'menu-product-sku-create'),
('1', 'menu-product-sku-update'),
('1', 'menu-product-sku-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-spu.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品 SPU (ProductSpu)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-spu',
  'mall-dir',
  '商品 SPU管理',
  '/admin/mall/product-spu',
  'mall/product-spu/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_spu:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-spu-query',  'menu-product-spu', '查询商品 SPU', 'BUTTON', 'ACTIVE', 'mall:product_spu:query',  1, NOW(), NOW()),
('menu-product-spu-create', 'menu-product-spu', '新增商品 SPU', 'BUTTON', 'ACTIVE', 'mall:product_spu:create', 2, NOW(), NOW()),
('menu-product-spu-update', 'menu-product-spu', '修改商品 SPU', 'BUTTON', 'ACTIVE', 'mall:product_spu:update', 3, NOW(), NOW()),
('menu-product-spu-delete', 'menu-product-spu', '删除商品 SPU', 'BUTTON', 'ACTIVE', 'mall:product_spu:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-spu'),
('1', 'menu-product-spu-query'),
('1', 'menu-product-spu-create'),
('1', 'menu-product-spu-update'),
('1', 'menu-product-spu-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-spu'),
('1', 'menu-product-spu-query'),
('1', 'menu-product-spu-create'),
('1', 'menu-product-spu-update'),
('1', 'menu-product-spu-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/product-statistics.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商品统计 (ProductStatistics)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-product-statistics',
  'mall-dir',
  '商品统计管理',
  '/admin/mall/product-statistics',
  'mall/product-statistics/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:product_statistics:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-product-statistics-query',  'menu-product-statistics', '查询商品统计', 'BUTTON', 'ACTIVE', 'mall:product_statistics:query',  1, NOW(), NOW()),
('menu-product-statistics-create', 'menu-product-statistics', '新增商品统计', 'BUTTON', 'ACTIVE', 'mall:product_statistics:create', 2, NOW(), NOW()),
('menu-product-statistics-update', 'menu-product-statistics', '修改商品统计', 'BUTTON', 'ACTIVE', 'mall:product_statistics:update', 3, NOW(), NOW()),
('menu-product-statistics-delete', 'menu-product-statistics', '删除商品统计', 'BUTTON', 'ACTIVE', 'mall:product_statistics:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-product-statistics'),
('1', 'menu-product-statistics-query'),
('1', 'menu-product-statistics-create'),
('1', 'menu-product-statistics-update'),
('1', 'menu-product-statistics-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-product-statistics'),
('1', 'menu-product-statistics-query'),
('1', 'menu-product-statistics-create'),
('1', 'menu-product-statistics-update'),
('1', 'menu-product-statistics-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/reward-activity.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 满减送活动 (RewardActivity)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-reward-activity',
  'mall-dir',
  '满减送活动管理',
  '/admin/mall/reward-activity',
  'mall/reward-activity/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:reward_activity:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-reward-activity-query',  'menu-reward-activity', '查询满减送活动', 'BUTTON', 'ACTIVE', 'mall:reward_activity:query',  1, NOW(), NOW()),
('menu-reward-activity-create', 'menu-reward-activity', '新增满减送活动', 'BUTTON', 'ACTIVE', 'mall:reward_activity:create', 2, NOW(), NOW()),
('menu-reward-activity-update', 'menu-reward-activity', '修改满减送活动', 'BUTTON', 'ACTIVE', 'mall:reward_activity:update', 3, NOW(), NOW()),
('menu-reward-activity-delete', 'menu-reward-activity', '删除满减送活动', 'BUTTON', 'ACTIVE', 'mall:reward_activity:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-reward-activity'),
('1', 'menu-reward-activity-query'),
('1', 'menu-reward-activity-create'),
('1', 'menu-reward-activity-update'),
('1', 'menu-reward-activity-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-reward-activity'),
('1', 'menu-reward-activity-query'),
('1', 'menu-reward-activity-create'),
('1', 'menu-reward-activity-update'),
('1', 'menu-reward-activity-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/seckill-activity.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 秒杀活动 (SeckillActivity)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-seckill-activity',
  'mall-dir',
  '秒杀活动管理',
  '/admin/mall/seckill-activity',
  'mall/seckill-activity/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:seckill_activity:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-seckill-activity-query',  'menu-seckill-activity', '查询秒杀活动', 'BUTTON', 'ACTIVE', 'mall:seckill_activity:query',  1, NOW(), NOW()),
('menu-seckill-activity-create', 'menu-seckill-activity', '新增秒杀活动', 'BUTTON', 'ACTIVE', 'mall:seckill_activity:create', 2, NOW(), NOW()),
('menu-seckill-activity-update', 'menu-seckill-activity', '修改秒杀活动', 'BUTTON', 'ACTIVE', 'mall:seckill_activity:update', 3, NOW(), NOW()),
('menu-seckill-activity-delete', 'menu-seckill-activity', '删除秒杀活动', 'BUTTON', 'ACTIVE', 'mall:seckill_activity:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-seckill-activity'),
('1', 'menu-seckill-activity-query'),
('1', 'menu-seckill-activity-create'),
('1', 'menu-seckill-activity-update'),
('1', 'menu-seckill-activity-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-seckill-activity'),
('1', 'menu-seckill-activity-query'),
('1', 'menu-seckill-activity-create'),
('1', 'menu-seckill-activity-update'),
('1', 'menu-seckill-activity-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/seckill-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 秒杀时段 (SeckillConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-seckill-config',
  'mall-dir',
  '秒杀时段管理',
  '/admin/mall/seckill-config',
  'mall/seckill-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:seckill_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-seckill-config-query',  'menu-seckill-config', '查询秒杀时段', 'BUTTON', 'ACTIVE', 'mall:seckill_config:query',  1, NOW(), NOW()),
('menu-seckill-config-create', 'menu-seckill-config', '新增秒杀时段', 'BUTTON', 'ACTIVE', 'mall:seckill_config:create', 2, NOW(), NOW()),
('menu-seckill-config-update', 'menu-seckill-config', '修改秒杀时段', 'BUTTON', 'ACTIVE', 'mall:seckill_config:update', 3, NOW(), NOW()),
('menu-seckill-config-delete', 'menu-seckill-config', '删除秒杀时段', 'BUTTON', 'ACTIVE', 'mall:seckill_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-seckill-config'),
('1', 'menu-seckill-config-query'),
('1', 'menu-seckill-config-create'),
('1', 'menu-seckill-config-update'),
('1', 'menu-seckill-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-seckill-config'),
('1', 'menu-seckill-config-query'),
('1', 'menu-seckill-config-create'),
('1', 'menu-seckill-config-update'),
('1', 'menu-seckill-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/seckill-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 秒杀参与商品 (SeckillProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-seckill-product',
  'mall-dir',
  '秒杀参与商品管理',
  '/admin/mall/seckill-product',
  'mall/seckill-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:seckill_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-seckill-product-query',  'menu-seckill-product', '查询秒杀参与商品', 'BUTTON', 'ACTIVE', 'mall:seckill_product:query',  1, NOW(), NOW()),
('menu-seckill-product-create', 'menu-seckill-product', '新增秒杀参与商品', 'BUTTON', 'ACTIVE', 'mall:seckill_product:create', 2, NOW(), NOW()),
('menu-seckill-product-update', 'menu-seckill-product', '修改秒杀参与商品', 'BUTTON', 'ACTIVE', 'mall:seckill_product:update', 3, NOW(), NOW()),
('menu-seckill-product-delete', 'menu-seckill-product', '删除秒杀参与商品', 'BUTTON', 'ACTIVE', 'mall:seckill_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-seckill-product'),
('1', 'menu-seckill-product-query'),
('1', 'menu-seckill-product-create'),
('1', 'menu-seckill-product-update'),
('1', 'menu-seckill-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-seckill-product'),
('1', 'menu-seckill-product-query'),
('1', 'menu-seckill-product-create'),
('1', 'menu-seckill-product-update'),
('1', 'menu-seckill-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/trade-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 交易中心配置 (TradeConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-trade-config',
  'mall-dir',
  '交易中心配置管理',
  '/admin/mall/trade-config',
  'mall/trade-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:trade_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-trade-config-query',  'menu-trade-config', '查询交易中心配置', 'BUTTON', 'ACTIVE', 'mall:trade_config:query',  1, NOW(), NOW()),
('menu-trade-config-create', 'menu-trade-config', '新增交易中心配置', 'BUTTON', 'ACTIVE', 'mall:trade_config:create', 2, NOW(), NOW()),
('menu-trade-config-update', 'menu-trade-config', '修改交易中心配置', 'BUTTON', 'ACTIVE', 'mall:trade_config:update', 3, NOW(), NOW()),
('menu-trade-config-delete', 'menu-trade-config', '删除交易中心配置', 'BUTTON', 'ACTIVE', 'mall:trade_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-trade-config'),
('1', 'menu-trade-config-query'),
('1', 'menu-trade-config-create'),
('1', 'menu-trade-config-update'),
('1', 'menu-trade-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-trade-config'),
('1', 'menu-trade-config-query'),
('1', 'menu-trade-config-create'),
('1', 'menu-trade-config-update'),
('1', 'menu-trade-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/trade-order-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 交易订单项 (TradeOrderItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-trade-order-item',
  'mall-dir',
  '交易订单项管理',
  '/admin/mall/trade-order-item',
  'mall/trade-order-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:trade_order_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-trade-order-item-query',  'menu-trade-order-item', '查询交易订单项', 'BUTTON', 'ACTIVE', 'mall:trade_order_item:query',  1, NOW(), NOW()),
('menu-trade-order-item-create', 'menu-trade-order-item', '新增交易订单项', 'BUTTON', 'ACTIVE', 'mall:trade_order_item:create', 2, NOW(), NOW()),
('menu-trade-order-item-update', 'menu-trade-order-item', '修改交易订单项', 'BUTTON', 'ACTIVE', 'mall:trade_order_item:update', 3, NOW(), NOW()),
('menu-trade-order-item-delete', 'menu-trade-order-item', '删除交易订单项', 'BUTTON', 'ACTIVE', 'mall:trade_order_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-trade-order-item'),
('1', 'menu-trade-order-item-query'),
('1', 'menu-trade-order-item-create'),
('1', 'menu-trade-order-item-update'),
('1', 'menu-trade-order-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-trade-order-item'),
('1', 'menu-trade-order-item-query'),
('1', 'menu-trade-order-item-create'),
('1', 'menu-trade-order-item-update'),
('1', 'menu-trade-order-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/trade-order-log.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 订单日志 (TradeOrderLog)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-trade-order-log',
  'mall-dir',
  '订单日志管理',
  '/admin/mall/trade-order-log',
  'mall/trade-order-log/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:trade_order_log:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-trade-order-log-query',  'menu-trade-order-log', '查询订单日志', 'BUTTON', 'ACTIVE', 'mall:trade_order_log:query',  1, NOW(), NOW()),
('menu-trade-order-log-create', 'menu-trade-order-log', '新增订单日志', 'BUTTON', 'ACTIVE', 'mall:trade_order_log:create', 2, NOW(), NOW()),
('menu-trade-order-log-update', 'menu-trade-order-log', '修改订单日志', 'BUTTON', 'ACTIVE', 'mall:trade_order_log:update', 3, NOW(), NOW()),
('menu-trade-order-log-delete', 'menu-trade-order-log', '删除订单日志', 'BUTTON', 'ACTIVE', 'mall:trade_order_log:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-trade-order-log'),
('1', 'menu-trade-order-log-query'),
('1', 'menu-trade-order-log-create'),
('1', 'menu-trade-order-log-update'),
('1', 'menu-trade-order-log-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-trade-order-log'),
('1', 'menu-trade-order-log-query'),
('1', 'menu-trade-order-log-create'),
('1', 'menu-trade-order-log-update'),
('1', 'menu-trade-order-log-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/trade-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 交易订单 (TradeOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-trade-order',
  'mall-dir',
  '交易订单管理',
  '/admin/mall/trade-order',
  'mall/trade-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:trade_order:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-trade-order-query',  'menu-trade-order', '查询交易订单', 'BUTTON', 'ACTIVE', 'mall:trade_order:query',  1, NOW(), NOW()),
('menu-trade-order-create', 'menu-trade-order', '新增交易订单', 'BUTTON', 'ACTIVE', 'mall:trade_order:create', 2, NOW(), NOW()),
('menu-trade-order-update', 'menu-trade-order', '修改交易订单', 'BUTTON', 'ACTIVE', 'mall:trade_order:update', 3, NOW(), NOW()),
('menu-trade-order-delete', 'menu-trade-order', '删除交易订单', 'BUTTON', 'ACTIVE', 'mall:trade_order:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-trade-order'),
('1', 'menu-trade-order-query'),
('1', 'menu-trade-order-create'),
('1', 'menu-trade-order-update'),
('1', 'menu-trade-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-trade-order'),
('1', 'menu-trade-order-query'),
('1', 'menu-trade-order-create'),
('1', 'menu-trade-order-update'),
('1', 'menu-trade-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mall/contract/trade-statistics.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 交易统计 DO以天为维度，统计全部的数据 (TradeStatistics)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-trade-statistics',
  'mall-dir',
  '交易统计 DO以天为维度，统计全部的数据管理',
  '/admin/mall/trade-statistics',
  'mall/trade-statistics/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mall:trade_statistics:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-trade-statistics-query',  'menu-trade-statistics', '查询交易统计 DO以天为维度，统计全部的数据', 'BUTTON', 'ACTIVE', 'mall:trade_statistics:query',  1, NOW(), NOW()),
('menu-trade-statistics-create', 'menu-trade-statistics', '新增交易统计 DO以天为维度，统计全部的数据', 'BUTTON', 'ACTIVE', 'mall:trade_statistics:create', 2, NOW(), NOW()),
('menu-trade-statistics-update', 'menu-trade-statistics', '修改交易统计 DO以天为维度，统计全部的数据', 'BUTTON', 'ACTIVE', 'mall:trade_statistics:update', 3, NOW(), NOW()),
('menu-trade-statistics-delete', 'menu-trade-statistics', '删除交易统计 DO以天为维度，统计全部的数据', 'BUTTON', 'ACTIVE', 'mall:trade_statistics:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-trade-statistics'),
('1', 'menu-trade-statistics-query'),
('1', 'menu-trade-statistics-create'),
('1', 'menu-trade-statistics-update'),
('1', 'menu-trade-statistics-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-trade-statistics'),
('1', 'menu-trade-statistics-query'),
('1', 'menu-trade-statistics-create'),
('1', 'menu-trade-statistics-update'),
('1', 'menu-trade-statistics-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-address.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 用户收件地址 (MemberAddress)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-address',
  'member-dir',
  '用户收件地址管理',
  '/admin/member/member-address',
  'member/member-address/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_address:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-address-query',  'menu-member-address', '查询用户收件地址', 'BUTTON', 'ACTIVE', 'member:member_address:query',  1, NOW(), NOW()),
('menu-member-address-create', 'menu-member-address', '新增用户收件地址', 'BUTTON', 'ACTIVE', 'member:member_address:create', 2, NOW(), NOW()),
('menu-member-address-update', 'menu-member-address', '修改用户收件地址', 'BUTTON', 'ACTIVE', 'member:member_address:update', 3, NOW(), NOW()),
('menu-member-address-delete', 'menu-member-address', '删除用户收件地址', 'BUTTON', 'ACTIVE', 'member:member_address:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-address'),
('1', 'menu-member-address-query'),
('1', 'menu-member-address-create'),
('1', 'menu-member-address-update'),
('1', 'menu-member-address-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-address'),
('1', 'menu-member-address-query'),
('1', 'menu-member-address-create'),
('1', 'menu-member-address-update'),
('1', 'menu-member-address-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员配置 (MemberConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-config',
  'member-dir',
  '会员配置管理',
  '/admin/member/member-config',
  'member/member-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-config-query',  'menu-member-config', '查询会员配置', 'BUTTON', 'ACTIVE', 'member:member_config:query',  1, NOW(), NOW()),
('menu-member-config-create', 'menu-member-config', '新增会员配置', 'BUTTON', 'ACTIVE', 'member:member_config:create', 2, NOW(), NOW()),
('menu-member-config-update', 'menu-member-config', '修改会员配置', 'BUTTON', 'ACTIVE', 'member:member_config:update', 3, NOW(), NOW()),
('menu-member-config-delete', 'menu-member-config', '删除会员配置', 'BUTTON', 'ACTIVE', 'member:member_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-config'),
('1', 'menu-member-config-query'),
('1', 'menu-member-config-create'),
('1', 'menu-member-config-update'),
('1', 'menu-member-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-config'),
('1', 'menu-member-config-query'),
('1', 'menu-member-config-create'),
('1', 'menu-member-config-update'),
('1', 'menu-member-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-experience-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员经验记录 (MemberExperienceRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-experience-record',
  'member-dir',
  '会员经验记录管理',
  '/admin/member/member-experience-record',
  'member/member-experience-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_experience_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-experience-record-query',  'menu-member-experience-record', '查询会员经验记录', 'BUTTON', 'ACTIVE', 'member:member_experience_record:query',  1, NOW(), NOW()),
('menu-member-experience-record-create', 'menu-member-experience-record', '新增会员经验记录', 'BUTTON', 'ACTIVE', 'member:member_experience_record:create', 2, NOW(), NOW()),
('menu-member-experience-record-update', 'menu-member-experience-record', '修改会员经验记录', 'BUTTON', 'ACTIVE', 'member:member_experience_record:update', 3, NOW(), NOW()),
('menu-member-experience-record-delete', 'menu-member-experience-record', '删除会员经验记录', 'BUTTON', 'ACTIVE', 'member:member_experience_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-experience-record'),
('1', 'menu-member-experience-record-query'),
('1', 'menu-member-experience-record-create'),
('1', 'menu-member-experience-record-update'),
('1', 'menu-member-experience-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-experience-record'),
('1', 'menu-member-experience-record-query'),
('1', 'menu-member-experience-record-create'),
('1', 'menu-member-experience-record-update'),
('1', 'menu-member-experience-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-group.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 用户分组 (MemberGroup)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-group',
  'member-dir',
  '用户分组管理',
  '/admin/member/member-group',
  'member/member-group/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_group:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-group-query',  'menu-member-group', '查询用户分组', 'BUTTON', 'ACTIVE', 'member:member_group:query',  1, NOW(), NOW()),
('menu-member-group-create', 'menu-member-group', '新增用户分组', 'BUTTON', 'ACTIVE', 'member:member_group:create', 2, NOW(), NOW()),
('menu-member-group-update', 'menu-member-group', '修改用户分组', 'BUTTON', 'ACTIVE', 'member:member_group:update', 3, NOW(), NOW()),
('menu-member-group-delete', 'menu-member-group', '删除用户分组', 'BUTTON', 'ACTIVE', 'member:member_group:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-group'),
('1', 'menu-member-group-query'),
('1', 'menu-member-group-create'),
('1', 'menu-member-group-update'),
('1', 'menu-member-group-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-group'),
('1', 'menu-member-group-query'),
('1', 'menu-member-group-create'),
('1', 'menu-member-group-update'),
('1', 'menu-member-group-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-level-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员等级记录 DO用户每次等级发生变更时，记录一条日志 (MemberLevelRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-level-record',
  'member-dir',
  '会员等级记录 DO用户每次等级发生变更时，记录一条日志管理',
  '/admin/member/member-level-record',
  'member/member-level-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_level_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-level-record-query',  'menu-member-level-record', '查询会员等级记录 DO用户每次等级发生变更时，记录一条日志', 'BUTTON', 'ACTIVE', 'member:member_level_record:query',  1, NOW(), NOW()),
('menu-member-level-record-create', 'menu-member-level-record', '新增会员等级记录 DO用户每次等级发生变更时，记录一条日志', 'BUTTON', 'ACTIVE', 'member:member_level_record:create', 2, NOW(), NOW()),
('menu-member-level-record-update', 'menu-member-level-record', '修改会员等级记录 DO用户每次等级发生变更时，记录一条日志', 'BUTTON', 'ACTIVE', 'member:member_level_record:update', 3, NOW(), NOW()),
('menu-member-level-record-delete', 'menu-member-level-record', '删除会员等级记录 DO用户每次等级发生变更时，记录一条日志', 'BUTTON', 'ACTIVE', 'member:member_level_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-level-record'),
('1', 'menu-member-level-record-query'),
('1', 'menu-member-level-record-create'),
('1', 'menu-member-level-record-update'),
('1', 'menu-member-level-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-level-record'),
('1', 'menu-member-level-record-query'),
('1', 'menu-member-level-record-create'),
('1', 'menu-member-level-record-update'),
('1', 'menu-member-level-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-level.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员等级 DO配置每个等级需要的积分 (MemberLevel)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-level',
  'member-dir',
  '会员等级 DO配置每个等级需要的积分管理',
  '/admin/member/member-level',
  'member/member-level/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_level:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-level-query',  'menu-member-level', '查询会员等级 DO配置每个等级需要的积分', 'BUTTON', 'ACTIVE', 'member:member_level:query',  1, NOW(), NOW()),
('menu-member-level-create', 'menu-member-level', '新增会员等级 DO配置每个等级需要的积分', 'BUTTON', 'ACTIVE', 'member:member_level:create', 2, NOW(), NOW()),
('menu-member-level-update', 'menu-member-level', '修改会员等级 DO配置每个等级需要的积分', 'BUTTON', 'ACTIVE', 'member:member_level:update', 3, NOW(), NOW()),
('menu-member-level-delete', 'menu-member-level', '删除会员等级 DO配置每个等级需要的积分', 'BUTTON', 'ACTIVE', 'member:member_level:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-level'),
('1', 'menu-member-level-query'),
('1', 'menu-member-level-create'),
('1', 'menu-member-level-update'),
('1', 'menu-member-level-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-level'),
('1', 'menu-member-level-query'),
('1', 'menu-member-level-create'),
('1', 'menu-member-level-update'),
('1', 'menu-member-level-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-point-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 用户积分记录 (MemberPointRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-point-record',
  'member-dir',
  '用户积分记录管理',
  '/admin/member/member-point-record',
  'member/member-point-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_point_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-point-record-query',  'menu-member-point-record', '查询用户积分记录', 'BUTTON', 'ACTIVE', 'member:member_point_record:query',  1, NOW(), NOW()),
('menu-member-point-record-create', 'menu-member-point-record', '新增用户积分记录', 'BUTTON', 'ACTIVE', 'member:member_point_record:create', 2, NOW(), NOW()),
('menu-member-point-record-update', 'menu-member-point-record', '修改用户积分记录', 'BUTTON', 'ACTIVE', 'member:member_point_record:update', 3, NOW(), NOW()),
('menu-member-point-record-delete', 'menu-member-point-record', '删除用户积分记录', 'BUTTON', 'ACTIVE', 'member:member_point_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-point-record'),
('1', 'menu-member-point-record-query'),
('1', 'menu-member-point-record-create'),
('1', 'menu-member-point-record-update'),
('1', 'menu-member-point-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-point-record'),
('1', 'menu-member-point-record-query'),
('1', 'menu-member-point-record-create'),
('1', 'menu-member-point-record-update'),
('1', 'menu-member-point-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-sign-in-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 签到规则 (MemberSignInConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-sign-in-config',
  'member-dir',
  '签到规则管理',
  '/admin/member/member-sign-in-config',
  'member/member-sign-in-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_sign_in_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-sign-in-config-query',  'menu-member-sign-in-config', '查询签到规则', 'BUTTON', 'ACTIVE', 'member:member_sign_in_config:query',  1, NOW(), NOW()),
('menu-member-sign-in-config-create', 'menu-member-sign-in-config', '新增签到规则', 'BUTTON', 'ACTIVE', 'member:member_sign_in_config:create', 2, NOW(), NOW()),
('menu-member-sign-in-config-update', 'menu-member-sign-in-config', '修改签到规则', 'BUTTON', 'ACTIVE', 'member:member_sign_in_config:update', 3, NOW(), NOW()),
('menu-member-sign-in-config-delete', 'menu-member-sign-in-config', '删除签到规则', 'BUTTON', 'ACTIVE', 'member:member_sign_in_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-sign-in-config'),
('1', 'menu-member-sign-in-config-query'),
('1', 'menu-member-sign-in-config-create'),
('1', 'menu-member-sign-in-config-update'),
('1', 'menu-member-sign-in-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-sign-in-config'),
('1', 'menu-member-sign-in-config-query'),
('1', 'menu-member-sign-in-config-create'),
('1', 'menu-member-sign-in-config-update'),
('1', 'menu-member-sign-in-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-sign-in-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 签到记录 (MemberSignInRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-sign-in-record',
  'member-dir',
  '签到记录管理',
  '/admin/member/member-sign-in-record',
  'member/member-sign-in-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_sign_in_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-sign-in-record-query',  'menu-member-sign-in-record', '查询签到记录', 'BUTTON', 'ACTIVE', 'member:member_sign_in_record:query',  1, NOW(), NOW()),
('menu-member-sign-in-record-create', 'menu-member-sign-in-record', '新增签到记录', 'BUTTON', 'ACTIVE', 'member:member_sign_in_record:create', 2, NOW(), NOW()),
('menu-member-sign-in-record-update', 'menu-member-sign-in-record', '修改签到记录', 'BUTTON', 'ACTIVE', 'member:member_sign_in_record:update', 3, NOW(), NOW()),
('menu-member-sign-in-record-delete', 'menu-member-sign-in-record', '删除签到记录', 'BUTTON', 'ACTIVE', 'member:member_sign_in_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-sign-in-record'),
('1', 'menu-member-sign-in-record-query'),
('1', 'menu-member-sign-in-record-create'),
('1', 'menu-member-sign-in-record-update'),
('1', 'menu-member-sign-in-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-sign-in-record'),
('1', 'menu-member-sign-in-record-query'),
('1', 'menu-member-sign-in-record-create'),
('1', 'menu-member-sign-in-record-update'),
('1', 'menu-member-sign-in-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-tag.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员标签 (MemberTag)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-tag',
  'member-dir',
  '会员标签管理',
  '/admin/member/member-tag',
  'member/member-tag/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_tag:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-tag-query',  'menu-member-tag', '查询会员标签', 'BUTTON', 'ACTIVE', 'member:member_tag:query',  1, NOW(), NOW()),
('menu-member-tag-create', 'menu-member-tag', '新增会员标签', 'BUTTON', 'ACTIVE', 'member:member_tag:create', 2, NOW(), NOW()),
('menu-member-tag-update', 'menu-member-tag', '修改会员标签', 'BUTTON', 'ACTIVE', 'member:member_tag:update', 3, NOW(), NOW()),
('menu-member-tag-delete', 'menu-member-tag', '删除会员标签', 'BUTTON', 'ACTIVE', 'member:member_tag:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-tag'),
('1', 'menu-member-tag-query'),
('1', 'menu-member-tag-create'),
('1', 'menu-member-tag-update'),
('1', 'menu-member-tag-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-tag'),
('1', 'menu-member-tag-query'),
('1', 'menu-member-tag-create'),
('1', 'menu-member-tag-update'),
('1', 'menu-member-tag-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-member/contract/member-user.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员用户 DOuk_mobile 索引：基于 字段 (MemberUser)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-member-user',
  'member-dir',
  '会员用户 DOuk_mobile 索引：基于 字段管理',
  '/admin/member/member-user',
  'member/member-user/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'member:member_user:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-member-user-query',  'menu-member-user', '查询会员用户 DOuk_mobile 索引：基于 字段', 'BUTTON', 'ACTIVE', 'member:member_user:query',  1, NOW(), NOW()),
('menu-member-user-create', 'menu-member-user', '新增会员用户 DOuk_mobile 索引：基于 字段', 'BUTTON', 'ACTIVE', 'member:member_user:create', 2, NOW(), NOW()),
('menu-member-user-update', 'menu-member-user', '修改会员用户 DOuk_mobile 索引：基于 字段', 'BUTTON', 'ACTIVE', 'member:member_user:update', 3, NOW(), NOW()),
('menu-member-user-delete', 'menu-member-user', '删除会员用户 DOuk_mobile 索引：基于 字段', 'BUTTON', 'ACTIVE', 'member:member_user:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-member-user'),
('1', 'menu-member-user-query'),
('1', 'menu-member-user-create'),
('1', 'menu-member-user-update'),
('1', 'menu-member-user-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-member-user'),
('1', 'menu-member-user-query'),
('1', 'menu-member-user-create'),
('1', 'menu-member-user-update'),
('1', 'menu-member-user-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-cal-holiday.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 假期设置 (MesCalHoliday)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-cal-holiday',
  'mes-dir',
  'MES 假期设置管理',
  '/admin/mes/mes-cal-holiday',
  'mes/mes-cal-holiday/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_cal_holiday:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-cal-holiday-query',  'menu-mes-cal-holiday', '查询MES 假期设置', 'BUTTON', 'ACTIVE', 'mes:mes_cal_holiday:query',  1, NOW(), NOW()),
('menu-mes-cal-holiday-create', 'menu-mes-cal-holiday', '新增MES 假期设置', 'BUTTON', 'ACTIVE', 'mes:mes_cal_holiday:create', 2, NOW(), NOW()),
('menu-mes-cal-holiday-update', 'menu-mes-cal-holiday', '修改MES 假期设置', 'BUTTON', 'ACTIVE', 'mes:mes_cal_holiday:update', 3, NOW(), NOW()),
('menu-mes-cal-holiday-delete', 'menu-mes-cal-holiday', '删除MES 假期设置', 'BUTTON', 'ACTIVE', 'mes:mes_cal_holiday:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-holiday'),
('1', 'menu-mes-cal-holiday-query'),
('1', 'menu-mes-cal-holiday-create'),
('1', 'menu-mes-cal-holiday-update'),
('1', 'menu-mes-cal-holiday-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-holiday'),
('1', 'menu-mes-cal-holiday-query'),
('1', 'menu-mes-cal-holiday-create'),
('1', 'menu-mes-cal-holiday-update'),
('1', 'menu-mes-cal-holiday-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-cal-plan-shift.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 计划班次 (MesCalPlanShift)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-cal-plan-shift',
  'mes-dir',
  'MES 计划班次管理',
  '/admin/mes/mes-cal-plan-shift',
  'mes/mes-cal-plan-shift/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_cal_plan_shift:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-cal-plan-shift-query',  'menu-mes-cal-plan-shift', '查询MES 计划班次', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan_shift:query',  1, NOW(), NOW()),
('menu-mes-cal-plan-shift-create', 'menu-mes-cal-plan-shift', '新增MES 计划班次', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan_shift:create', 2, NOW(), NOW()),
('menu-mes-cal-plan-shift-update', 'menu-mes-cal-plan-shift', '修改MES 计划班次', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan_shift:update', 3, NOW(), NOW()),
('menu-mes-cal-plan-shift-delete', 'menu-mes-cal-plan-shift', '删除MES 计划班次', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan_shift:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-plan-shift'),
('1', 'menu-mes-cal-plan-shift-query'),
('1', 'menu-mes-cal-plan-shift-create'),
('1', 'menu-mes-cal-plan-shift-update'),
('1', 'menu-mes-cal-plan-shift-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-plan-shift'),
('1', 'menu-mes-cal-plan-shift-query'),
('1', 'menu-mes-cal-plan-shift-create'),
('1', 'menu-mes-cal-plan-shift-update'),
('1', 'menu-mes-cal-plan-shift-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-cal-plan-team.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 计划班组关联 (MesCalPlanTeam)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-cal-plan-team',
  'mes-dir',
  'MES 计划班组关联管理',
  '/admin/mes/mes-cal-plan-team',
  'mes/mes-cal-plan-team/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_cal_plan_team:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-cal-plan-team-query',  'menu-mes-cal-plan-team', '查询MES 计划班组关联', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan_team:query',  1, NOW(), NOW()),
('menu-mes-cal-plan-team-create', 'menu-mes-cal-plan-team', '新增MES 计划班组关联', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan_team:create', 2, NOW(), NOW()),
('menu-mes-cal-plan-team-update', 'menu-mes-cal-plan-team', '修改MES 计划班组关联', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan_team:update', 3, NOW(), NOW()),
('menu-mes-cal-plan-team-delete', 'menu-mes-cal-plan-team', '删除MES 计划班组关联', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan_team:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-plan-team'),
('1', 'menu-mes-cal-plan-team-query'),
('1', 'menu-mes-cal-plan-team-create'),
('1', 'menu-mes-cal-plan-team-update'),
('1', 'menu-mes-cal-plan-team-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-plan-team'),
('1', 'menu-mes-cal-plan-team-query'),
('1', 'menu-mes-cal-plan-team-create'),
('1', 'menu-mes-cal-plan-team-update'),
('1', 'menu-mes-cal-plan-team-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-cal-plan.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 排班计划 (MesCalPlan)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-cal-plan',
  'mes-dir',
  'MES 排班计划管理',
  '/admin/mes/mes-cal-plan',
  'mes/mes-cal-plan/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_cal_plan:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-cal-plan-query',  'menu-mes-cal-plan', '查询MES 排班计划', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan:query',  1, NOW(), NOW()),
('menu-mes-cal-plan-create', 'menu-mes-cal-plan', '新增MES 排班计划', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan:create', 2, NOW(), NOW()),
('menu-mes-cal-plan-update', 'menu-mes-cal-plan', '修改MES 排班计划', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan:update', 3, NOW(), NOW()),
('menu-mes-cal-plan-delete', 'menu-mes-cal-plan', '删除MES 排班计划', 'BUTTON', 'ACTIVE', 'mes:mes_cal_plan:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-plan'),
('1', 'menu-mes-cal-plan-query'),
('1', 'menu-mes-cal-plan-create'),
('1', 'menu-mes-cal-plan-update'),
('1', 'menu-mes-cal-plan-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-plan'),
('1', 'menu-mes-cal-plan-query'),
('1', 'menu-mes-cal-plan-create'),
('1', 'menu-mes-cal-plan-update'),
('1', 'menu-mes-cal-plan-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-cal-team-member.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 班组成员 (MesCalTeamMember)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-cal-team-member',
  'mes-dir',
  'MES 班组成员管理',
  '/admin/mes/mes-cal-team-member',
  'mes/mes-cal-team-member/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_cal_team_member:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-cal-team-member-query',  'menu-mes-cal-team-member', '查询MES 班组成员', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team_member:query',  1, NOW(), NOW()),
('menu-mes-cal-team-member-create', 'menu-mes-cal-team-member', '新增MES 班组成员', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team_member:create', 2, NOW(), NOW()),
('menu-mes-cal-team-member-update', 'menu-mes-cal-team-member', '修改MES 班组成员', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team_member:update', 3, NOW(), NOW()),
('menu-mes-cal-team-member-delete', 'menu-mes-cal-team-member', '删除MES 班组成员', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team_member:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-team-member'),
('1', 'menu-mes-cal-team-member-query'),
('1', 'menu-mes-cal-team-member-create'),
('1', 'menu-mes-cal-team-member-update'),
('1', 'menu-mes-cal-team-member-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-team-member'),
('1', 'menu-mes-cal-team-member-query'),
('1', 'menu-mes-cal-team-member-create'),
('1', 'menu-mes-cal-team-member-update'),
('1', 'menu-mes-cal-team-member-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-cal-team-shift.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 班组排班 (MesCalTeamShift)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-cal-team-shift',
  'mes-dir',
  'MES 班组排班管理',
  '/admin/mes/mes-cal-team-shift',
  'mes/mes-cal-team-shift/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_cal_team_shift:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-cal-team-shift-query',  'menu-mes-cal-team-shift', '查询MES 班组排班', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team_shift:query',  1, NOW(), NOW()),
('menu-mes-cal-team-shift-create', 'menu-mes-cal-team-shift', '新增MES 班组排班', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team_shift:create', 2, NOW(), NOW()),
('menu-mes-cal-team-shift-update', 'menu-mes-cal-team-shift', '修改MES 班组排班', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team_shift:update', 3, NOW(), NOW()),
('menu-mes-cal-team-shift-delete', 'menu-mes-cal-team-shift', '删除MES 班组排班', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team_shift:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-team-shift'),
('1', 'menu-mes-cal-team-shift-query'),
('1', 'menu-mes-cal-team-shift-create'),
('1', 'menu-mes-cal-team-shift-update'),
('1', 'menu-mes-cal-team-shift-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-team-shift'),
('1', 'menu-mes-cal-team-shift-query'),
('1', 'menu-mes-cal-team-shift-create'),
('1', 'menu-mes-cal-team-shift-update'),
('1', 'menu-mes-cal-team-shift-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-cal-team.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 班组 (MesCalTeam)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-cal-team',
  'mes-dir',
  'MES 班组管理',
  '/admin/mes/mes-cal-team',
  'mes/mes-cal-team/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_cal_team:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-cal-team-query',  'menu-mes-cal-team', '查询MES 班组', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team:query',  1, NOW(), NOW()),
('menu-mes-cal-team-create', 'menu-mes-cal-team', '新增MES 班组', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team:create', 2, NOW(), NOW()),
('menu-mes-cal-team-update', 'menu-mes-cal-team', '修改MES 班组', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team:update', 3, NOW(), NOW()),
('menu-mes-cal-team-delete', 'menu-mes-cal-team', '删除MES 班组', 'BUTTON', 'ACTIVE', 'mes:mes_cal_team:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-team'),
('1', 'menu-mes-cal-team-query'),
('1', 'menu-mes-cal-team-create'),
('1', 'menu-mes-cal-team-update'),
('1', 'menu-mes-cal-team-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-cal-team'),
('1', 'menu-mes-cal-team-query'),
('1', 'menu-mes-cal-team-create'),
('1', 'menu-mes-cal-team-update'),
('1', 'menu-mes-cal-team-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-check-plan-machinery.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 点检保养方案设备 (MesDvCheckPlanMachinery)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-check-plan-machinery',
  'mes-dir',
  'MES 点检保养方案设备管理',
  '/admin/mes/mes-dv-check-plan-machinery',
  'mes/mes-dv-check-plan-machinery/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_check_plan_machinery:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-check-plan-machinery-query',  'menu-mes-dv-check-plan-machinery', '查询MES 点检保养方案设备', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan_machinery:query',  1, NOW(), NOW()),
('menu-mes-dv-check-plan-machinery-create', 'menu-mes-dv-check-plan-machinery', '新增MES 点检保养方案设备', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan_machinery:create', 2, NOW(), NOW()),
('menu-mes-dv-check-plan-machinery-update', 'menu-mes-dv-check-plan-machinery', '修改MES 点检保养方案设备', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan_machinery:update', 3, NOW(), NOW()),
('menu-mes-dv-check-plan-machinery-delete', 'menu-mes-dv-check-plan-machinery', '删除MES 点检保养方案设备', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan_machinery:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-plan-machinery'),
('1', 'menu-mes-dv-check-plan-machinery-query'),
('1', 'menu-mes-dv-check-plan-machinery-create'),
('1', 'menu-mes-dv-check-plan-machinery-update'),
('1', 'menu-mes-dv-check-plan-machinery-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-plan-machinery'),
('1', 'menu-mes-dv-check-plan-machinery-query'),
('1', 'menu-mes-dv-check-plan-machinery-create'),
('1', 'menu-mes-dv-check-plan-machinery-update'),
('1', 'menu-mes-dv-check-plan-machinery-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-check-plan-subject.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 点检保养方案项目 (MesDvCheckPlanSubject)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-check-plan-subject',
  'mes-dir',
  'MES 点检保养方案项目管理',
  '/admin/mes/mes-dv-check-plan-subject',
  'mes/mes-dv-check-plan-subject/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_check_plan_subject:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-check-plan-subject-query',  'menu-mes-dv-check-plan-subject', '查询MES 点检保养方案项目', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan_subject:query',  1, NOW(), NOW()),
('menu-mes-dv-check-plan-subject-create', 'menu-mes-dv-check-plan-subject', '新增MES 点检保养方案项目', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan_subject:create', 2, NOW(), NOW()),
('menu-mes-dv-check-plan-subject-update', 'menu-mes-dv-check-plan-subject', '修改MES 点检保养方案项目', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan_subject:update', 3, NOW(), NOW()),
('menu-mes-dv-check-plan-subject-delete', 'menu-mes-dv-check-plan-subject', '删除MES 点检保养方案项目', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan_subject:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-plan-subject'),
('1', 'menu-mes-dv-check-plan-subject-query'),
('1', 'menu-mes-dv-check-plan-subject-create'),
('1', 'menu-mes-dv-check-plan-subject-update'),
('1', 'menu-mes-dv-check-plan-subject-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-plan-subject'),
('1', 'menu-mes-dv-check-plan-subject-query'),
('1', 'menu-mes-dv-check-plan-subject-create'),
('1', 'menu-mes-dv-check-plan-subject-update'),
('1', 'menu-mes-dv-check-plan-subject-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-check-plan.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 点检保养方案 (MesDvCheckPlan)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-check-plan',
  'mes-dir',
  'MES 点检保养方案管理',
  '/admin/mes/mes-dv-check-plan',
  'mes/mes-dv-check-plan/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_check_plan:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-check-plan-query',  'menu-mes-dv-check-plan', '查询MES 点检保养方案', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan:query',  1, NOW(), NOW()),
('menu-mes-dv-check-plan-create', 'menu-mes-dv-check-plan', '新增MES 点检保养方案', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan:create', 2, NOW(), NOW()),
('menu-mes-dv-check-plan-update', 'menu-mes-dv-check-plan', '修改MES 点检保养方案', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan:update', 3, NOW(), NOW()),
('menu-mes-dv-check-plan-delete', 'menu-mes-dv-check-plan', '删除MES 点检保养方案', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_plan:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-plan'),
('1', 'menu-mes-dv-check-plan-query'),
('1', 'menu-mes-dv-check-plan-create'),
('1', 'menu-mes-dv-check-plan-update'),
('1', 'menu-mes-dv-check-plan-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-plan'),
('1', 'menu-mes-dv-check-plan-query'),
('1', 'menu-mes-dv-check-plan-create'),
('1', 'menu-mes-dv-check-plan-update'),
('1', 'menu-mes-dv-check-plan-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-check-record-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 设备点检记录明细 (MesDvCheckRecordLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-check-record-line',
  'mes-dir',
  'MES 设备点检记录明细管理',
  '/admin/mes/mes-dv-check-record-line',
  'mes/mes-dv-check-record-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_check_record_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-check-record-line-query',  'menu-mes-dv-check-record-line', '查询MES 设备点检记录明细', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_record_line:query',  1, NOW(), NOW()),
('menu-mes-dv-check-record-line-create', 'menu-mes-dv-check-record-line', '新增MES 设备点检记录明细', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_record_line:create', 2, NOW(), NOW()),
('menu-mes-dv-check-record-line-update', 'menu-mes-dv-check-record-line', '修改MES 设备点检记录明细', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_record_line:update', 3, NOW(), NOW()),
('menu-mes-dv-check-record-line-delete', 'menu-mes-dv-check-record-line', '删除MES 设备点检记录明细', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_record_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-record-line'),
('1', 'menu-mes-dv-check-record-line-query'),
('1', 'menu-mes-dv-check-record-line-create'),
('1', 'menu-mes-dv-check-record-line-update'),
('1', 'menu-mes-dv-check-record-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-record-line'),
('1', 'menu-mes-dv-check-record-line-query'),
('1', 'menu-mes-dv-check-record-line-create'),
('1', 'menu-mes-dv-check-record-line-update'),
('1', 'menu-mes-dv-check-record-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-check-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 设备点检记录 (MesDvCheckRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-check-record',
  'mes-dir',
  'MES 设备点检记录管理',
  '/admin/mes/mes-dv-check-record',
  'mes/mes-dv-check-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_check_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-check-record-query',  'menu-mes-dv-check-record', '查询MES 设备点检记录', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_record:query',  1, NOW(), NOW()),
('menu-mes-dv-check-record-create', 'menu-mes-dv-check-record', '新增MES 设备点检记录', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_record:create', 2, NOW(), NOW()),
('menu-mes-dv-check-record-update', 'menu-mes-dv-check-record', '修改MES 设备点检记录', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_record:update', 3, NOW(), NOW()),
('menu-mes-dv-check-record-delete', 'menu-mes-dv-check-record', '删除MES 设备点检记录', 'BUTTON', 'ACTIVE', 'mes:mes_dv_check_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-record'),
('1', 'menu-mes-dv-check-record-query'),
('1', 'menu-mes-dv-check-record-create'),
('1', 'menu-mes-dv-check-record-update'),
('1', 'menu-mes-dv-check-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-check-record'),
('1', 'menu-mes-dv-check-record-query'),
('1', 'menu-mes-dv-check-record-create'),
('1', 'menu-mes-dv-check-record-update'),
('1', 'menu-mes-dv-check-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-machinery-type.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 设备类型 (MesDvMachineryType)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-machinery-type',
  'mes-dir',
  'MES 设备类型管理',
  '/admin/mes/mes-dv-machinery-type',
  'mes/mes-dv-machinery-type/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_machinery_type:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-machinery-type-query',  'menu-mes-dv-machinery-type', '查询MES 设备类型', 'BUTTON', 'ACTIVE', 'mes:mes_dv_machinery_type:query',  1, NOW(), NOW()),
('menu-mes-dv-machinery-type-create', 'menu-mes-dv-machinery-type', '新增MES 设备类型', 'BUTTON', 'ACTIVE', 'mes:mes_dv_machinery_type:create', 2, NOW(), NOW()),
('menu-mes-dv-machinery-type-update', 'menu-mes-dv-machinery-type', '修改MES 设备类型', 'BUTTON', 'ACTIVE', 'mes:mes_dv_machinery_type:update', 3, NOW(), NOW()),
('menu-mes-dv-machinery-type-delete', 'menu-mes-dv-machinery-type', '删除MES 设备类型', 'BUTTON', 'ACTIVE', 'mes:mes_dv_machinery_type:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-machinery-type'),
('1', 'menu-mes-dv-machinery-type-query'),
('1', 'menu-mes-dv-machinery-type-create'),
('1', 'menu-mes-dv-machinery-type-update'),
('1', 'menu-mes-dv-machinery-type-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-machinery-type'),
('1', 'menu-mes-dv-machinery-type-query'),
('1', 'menu-mes-dv-machinery-type-create'),
('1', 'menu-mes-dv-machinery-type-update'),
('1', 'menu-mes-dv-machinery-type-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-machinery.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 设备台账 (MesDvMachinery)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-machinery',
  'mes-dir',
  'MES 设备台账管理',
  '/admin/mes/mes-dv-machinery',
  'mes/mes-dv-machinery/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_machinery:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-machinery-query',  'menu-mes-dv-machinery', '查询MES 设备台账', 'BUTTON', 'ACTIVE', 'mes:mes_dv_machinery:query',  1, NOW(), NOW()),
('menu-mes-dv-machinery-create', 'menu-mes-dv-machinery', '新增MES 设备台账', 'BUTTON', 'ACTIVE', 'mes:mes_dv_machinery:create', 2, NOW(), NOW()),
('menu-mes-dv-machinery-update', 'menu-mes-dv-machinery', '修改MES 设备台账', 'BUTTON', 'ACTIVE', 'mes:mes_dv_machinery:update', 3, NOW(), NOW()),
('menu-mes-dv-machinery-delete', 'menu-mes-dv-machinery', '删除MES 设备台账', 'BUTTON', 'ACTIVE', 'mes:mes_dv_machinery:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-machinery'),
('1', 'menu-mes-dv-machinery-query'),
('1', 'menu-mes-dv-machinery-create'),
('1', 'menu-mes-dv-machinery-update'),
('1', 'menu-mes-dv-machinery-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-machinery'),
('1', 'menu-mes-dv-machinery-query'),
('1', 'menu-mes-dv-machinery-create'),
('1', 'menu-mes-dv-machinery-update'),
('1', 'menu-mes-dv-machinery-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-mainten-record-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 设备保养记录明细 (MesDvMaintenRecordLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-mainten-record-line',
  'mes-dir',
  'MES 设备保养记录明细管理',
  '/admin/mes/mes-dv-mainten-record-line',
  'mes/mes-dv-mainten-record-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_mainten_record_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-mainten-record-line-query',  'menu-mes-dv-mainten-record-line', '查询MES 设备保养记录明细', 'BUTTON', 'ACTIVE', 'mes:mes_dv_mainten_record_line:query',  1, NOW(), NOW()),
('menu-mes-dv-mainten-record-line-create', 'menu-mes-dv-mainten-record-line', '新增MES 设备保养记录明细', 'BUTTON', 'ACTIVE', 'mes:mes_dv_mainten_record_line:create', 2, NOW(), NOW()),
('menu-mes-dv-mainten-record-line-update', 'menu-mes-dv-mainten-record-line', '修改MES 设备保养记录明细', 'BUTTON', 'ACTIVE', 'mes:mes_dv_mainten_record_line:update', 3, NOW(), NOW()),
('menu-mes-dv-mainten-record-line-delete', 'menu-mes-dv-mainten-record-line', '删除MES 设备保养记录明细', 'BUTTON', 'ACTIVE', 'mes:mes_dv_mainten_record_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-mainten-record-line'),
('1', 'menu-mes-dv-mainten-record-line-query'),
('1', 'menu-mes-dv-mainten-record-line-create'),
('1', 'menu-mes-dv-mainten-record-line-update'),
('1', 'menu-mes-dv-mainten-record-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-mainten-record-line'),
('1', 'menu-mes-dv-mainten-record-line-query'),
('1', 'menu-mes-dv-mainten-record-line-create'),
('1', 'menu-mes-dv-mainten-record-line-update'),
('1', 'menu-mes-dv-mainten-record-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-mainten-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 设备保养记录 (MesDvMaintenRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-mainten-record',
  'mes-dir',
  'MES 设备保养记录管理',
  '/admin/mes/mes-dv-mainten-record',
  'mes/mes-dv-mainten-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_mainten_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-mainten-record-query',  'menu-mes-dv-mainten-record', '查询MES 设备保养记录', 'BUTTON', 'ACTIVE', 'mes:mes_dv_mainten_record:query',  1, NOW(), NOW()),
('menu-mes-dv-mainten-record-create', 'menu-mes-dv-mainten-record', '新增MES 设备保养记录', 'BUTTON', 'ACTIVE', 'mes:mes_dv_mainten_record:create', 2, NOW(), NOW()),
('menu-mes-dv-mainten-record-update', 'menu-mes-dv-mainten-record', '修改MES 设备保养记录', 'BUTTON', 'ACTIVE', 'mes:mes_dv_mainten_record:update', 3, NOW(), NOW()),
('menu-mes-dv-mainten-record-delete', 'menu-mes-dv-mainten-record', '删除MES 设备保养记录', 'BUTTON', 'ACTIVE', 'mes:mes_dv_mainten_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-mainten-record'),
('1', 'menu-mes-dv-mainten-record-query'),
('1', 'menu-mes-dv-mainten-record-create'),
('1', 'menu-mes-dv-mainten-record-update'),
('1', 'menu-mes-dv-mainten-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-mainten-record'),
('1', 'menu-mes-dv-mainten-record-query'),
('1', 'menu-mes-dv-mainten-record-create'),
('1', 'menu-mes-dv-mainten-record-update'),
('1', 'menu-mes-dv-mainten-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-repair-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 维修工单行 (MesDvRepairLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-repair-line',
  'mes-dir',
  'MES 维修工单行管理',
  '/admin/mes/mes-dv-repair-line',
  'mes/mes-dv-repair-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_repair_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-repair-line-query',  'menu-mes-dv-repair-line', '查询MES 维修工单行', 'BUTTON', 'ACTIVE', 'mes:mes_dv_repair_line:query',  1, NOW(), NOW()),
('menu-mes-dv-repair-line-create', 'menu-mes-dv-repair-line', '新增MES 维修工单行', 'BUTTON', 'ACTIVE', 'mes:mes_dv_repair_line:create', 2, NOW(), NOW()),
('menu-mes-dv-repair-line-update', 'menu-mes-dv-repair-line', '修改MES 维修工单行', 'BUTTON', 'ACTIVE', 'mes:mes_dv_repair_line:update', 3, NOW(), NOW()),
('menu-mes-dv-repair-line-delete', 'menu-mes-dv-repair-line', '删除MES 维修工单行', 'BUTTON', 'ACTIVE', 'mes:mes_dv_repair_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-repair-line'),
('1', 'menu-mes-dv-repair-line-query'),
('1', 'menu-mes-dv-repair-line-create'),
('1', 'menu-mes-dv-repair-line-update'),
('1', 'menu-mes-dv-repair-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-repair-line'),
('1', 'menu-mes-dv-repair-line-query'),
('1', 'menu-mes-dv-repair-line-create'),
('1', 'menu-mes-dv-repair-line-update'),
('1', 'menu-mes-dv-repair-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-repair.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 维修工单 (MesDvRepair)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-repair',
  'mes-dir',
  'MES 维修工单管理',
  '/admin/mes/mes-dv-repair',
  'mes/mes-dv-repair/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_repair:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-repair-query',  'menu-mes-dv-repair', '查询MES 维修工单', 'BUTTON', 'ACTIVE', 'mes:mes_dv_repair:query',  1, NOW(), NOW()),
('menu-mes-dv-repair-create', 'menu-mes-dv-repair', '新增MES 维修工单', 'BUTTON', 'ACTIVE', 'mes:mes_dv_repair:create', 2, NOW(), NOW()),
('menu-mes-dv-repair-update', 'menu-mes-dv-repair', '修改MES 维修工单', 'BUTTON', 'ACTIVE', 'mes:mes_dv_repair:update', 3, NOW(), NOW()),
('menu-mes-dv-repair-delete', 'menu-mes-dv-repair', '删除MES 维修工单', 'BUTTON', 'ACTIVE', 'mes:mes_dv_repair:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-repair'),
('1', 'menu-mes-dv-repair-query'),
('1', 'menu-mes-dv-repair-create'),
('1', 'menu-mes-dv-repair-update'),
('1', 'menu-mes-dv-repair-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-repair'),
('1', 'menu-mes-dv-repair-query'),
('1', 'menu-mes-dv-repair-create'),
('1', 'menu-mes-dv-repair-update'),
('1', 'menu-mes-dv-repair-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-dv-subject.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 点检保养项目 (MesDvSubject)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-dv-subject',
  'mes-dir',
  'MES 点检保养项目管理',
  '/admin/mes/mes-dv-subject',
  'mes/mes-dv-subject/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_dv_subject:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-dv-subject-query',  'menu-mes-dv-subject', '查询MES 点检保养项目', 'BUTTON', 'ACTIVE', 'mes:mes_dv_subject:query',  1, NOW(), NOW()),
('menu-mes-dv-subject-create', 'menu-mes-dv-subject', '新增MES 点检保养项目', 'BUTTON', 'ACTIVE', 'mes:mes_dv_subject:create', 2, NOW(), NOW()),
('menu-mes-dv-subject-update', 'menu-mes-dv-subject', '修改MES 点检保养项目', 'BUTTON', 'ACTIVE', 'mes:mes_dv_subject:update', 3, NOW(), NOW()),
('menu-mes-dv-subject-delete', 'menu-mes-dv-subject', '删除MES 点检保养项目', 'BUTTON', 'ACTIVE', 'mes:mes_dv_subject:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-subject'),
('1', 'menu-mes-dv-subject-query'),
('1', 'menu-mes-dv-subject-create'),
('1', 'menu-mes-dv-subject-update'),
('1', 'menu-mes-dv-subject-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-dv-subject'),
('1', 'menu-mes-dv-subject-query'),
('1', 'menu-mes-dv-subject-create'),
('1', 'menu-mes-dv-subject-update'),
('1', 'menu-mes-dv-subject-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-auto-code-part.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 编码规则组成 (MesMdAutoCodePart)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-auto-code-part',
  'mes-dir',
  'MES 编码规则组成管理',
  '/admin/mes/mes-md-auto-code-part',
  'mes/mes-md-auto-code-part/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_auto_code_part:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-auto-code-part-query',  'menu-mes-md-auto-code-part', '查询MES 编码规则组成', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_part:query',  1, NOW(), NOW()),
('menu-mes-md-auto-code-part-create', 'menu-mes-md-auto-code-part', '新增MES 编码规则组成', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_part:create', 2, NOW(), NOW()),
('menu-mes-md-auto-code-part-update', 'menu-mes-md-auto-code-part', '修改MES 编码规则组成', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_part:update', 3, NOW(), NOW()),
('menu-mes-md-auto-code-part-delete', 'menu-mes-md-auto-code-part', '删除MES 编码规则组成', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_part:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-auto-code-part'),
('1', 'menu-mes-md-auto-code-part-query'),
('1', 'menu-mes-md-auto-code-part-create'),
('1', 'menu-mes-md-auto-code-part-update'),
('1', 'menu-mes-md-auto-code-part-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-auto-code-part'),
('1', 'menu-mes-md-auto-code-part-query'),
('1', 'menu-mes-md-auto-code-part-create'),
('1', 'menu-mes-md-auto-code-part-update'),
('1', 'menu-mes-md-auto-code-part-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-auto-code-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 编码生成记录 (MesMdAutoCodeRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-auto-code-record',
  'mes-dir',
  'MES 编码生成记录管理',
  '/admin/mes/mes-md-auto-code-record',
  'mes/mes-md-auto-code-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_auto_code_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-auto-code-record-query',  'menu-mes-md-auto-code-record', '查询MES 编码生成记录', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_record:query',  1, NOW(), NOW()),
('menu-mes-md-auto-code-record-create', 'menu-mes-md-auto-code-record', '新增MES 编码生成记录', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_record:create', 2, NOW(), NOW()),
('menu-mes-md-auto-code-record-update', 'menu-mes-md-auto-code-record', '修改MES 编码生成记录', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_record:update', 3, NOW(), NOW()),
('menu-mes-md-auto-code-record-delete', 'menu-mes-md-auto-code-record', '删除MES 编码生成记录', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-auto-code-record'),
('1', 'menu-mes-md-auto-code-record-query'),
('1', 'menu-mes-md-auto-code-record-create'),
('1', 'menu-mes-md-auto-code-record-update'),
('1', 'menu-mes-md-auto-code-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-auto-code-record'),
('1', 'menu-mes-md-auto-code-record-query'),
('1', 'menu-mes-md-auto-code-record-create'),
('1', 'menu-mes-md-auto-code-record-update'),
('1', 'menu-mes-md-auto-code-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-auto-code-rule.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 编码规则 (MesMdAutoCodeRule)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-auto-code-rule',
  'mes-dir',
  'MES 编码规则管理',
  '/admin/mes/mes-md-auto-code-rule',
  'mes/mes-md-auto-code-rule/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_auto_code_rule:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-auto-code-rule-query',  'menu-mes-md-auto-code-rule', '查询MES 编码规则', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_rule:query',  1, NOW(), NOW()),
('menu-mes-md-auto-code-rule-create', 'menu-mes-md-auto-code-rule', '新增MES 编码规则', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_rule:create', 2, NOW(), NOW()),
('menu-mes-md-auto-code-rule-update', 'menu-mes-md-auto-code-rule', '修改MES 编码规则', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_rule:update', 3, NOW(), NOW()),
('menu-mes-md-auto-code-rule-delete', 'menu-mes-md-auto-code-rule', '删除MES 编码规则', 'BUTTON', 'ACTIVE', 'mes:mes_md_auto_code_rule:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-auto-code-rule'),
('1', 'menu-mes-md-auto-code-rule-query'),
('1', 'menu-mes-md-auto-code-rule-create'),
('1', 'menu-mes-md-auto-code-rule-update'),
('1', 'menu-mes-md-auto-code-rule-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-auto-code-rule'),
('1', 'menu-mes-md-auto-code-rule-query'),
('1', 'menu-mes-md-auto-code-rule-create'),
('1', 'menu-mes-md-auto-code-rule-update'),
('1', 'menu-mes-md-auto-code-rule-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-client.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 客户 (MesMdClient)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-client',
  'mes-dir',
  'MES 客户管理',
  '/admin/mes/mes-md-client',
  'mes/mes-md-client/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_client:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-client-query',  'menu-mes-md-client', '查询MES 客户', 'BUTTON', 'ACTIVE', 'mes:mes_md_client:query',  1, NOW(), NOW()),
('menu-mes-md-client-create', 'menu-mes-md-client', '新增MES 客户', 'BUTTON', 'ACTIVE', 'mes:mes_md_client:create', 2, NOW(), NOW()),
('menu-mes-md-client-update', 'menu-mes-md-client', '修改MES 客户', 'BUTTON', 'ACTIVE', 'mes:mes_md_client:update', 3, NOW(), NOW()),
('menu-mes-md-client-delete', 'menu-mes-md-client', '删除MES 客户', 'BUTTON', 'ACTIVE', 'mes:mes_md_client:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-client'),
('1', 'menu-mes-md-client-query'),
('1', 'menu-mes-md-client-create'),
('1', 'menu-mes-md-client-update'),
('1', 'menu-mes-md-client-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-client'),
('1', 'menu-mes-md-client-query'),
('1', 'menu-mes-md-client-create'),
('1', 'menu-mes-md-client-update'),
('1', 'menu-mes-md-client-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-item-batch-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 物料批次属性配置 (MesMdItemBatchConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-item-batch-config',
  'mes-dir',
  'MES 物料批次属性配置管理',
  '/admin/mes/mes-md-item-batch-config',
  'mes/mes-md-item-batch-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_item_batch_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-item-batch-config-query',  'menu-mes-md-item-batch-config', '查询MES 物料批次属性配置', 'BUTTON', 'ACTIVE', 'mes:mes_md_item_batch_config:query',  1, NOW(), NOW()),
('menu-mes-md-item-batch-config-create', 'menu-mes-md-item-batch-config', '新增MES 物料批次属性配置', 'BUTTON', 'ACTIVE', 'mes:mes_md_item_batch_config:create', 2, NOW(), NOW()),
('menu-mes-md-item-batch-config-update', 'menu-mes-md-item-batch-config', '修改MES 物料批次属性配置', 'BUTTON', 'ACTIVE', 'mes:mes_md_item_batch_config:update', 3, NOW(), NOW()),
('menu-mes-md-item-batch-config-delete', 'menu-mes-md-item-batch-config', '删除MES 物料批次属性配置', 'BUTTON', 'ACTIVE', 'mes:mes_md_item_batch_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-item-batch-config'),
('1', 'menu-mes-md-item-batch-config-query'),
('1', 'menu-mes-md-item-batch-config-create'),
('1', 'menu-mes-md-item-batch-config-update'),
('1', 'menu-mes-md-item-batch-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-item-batch-config'),
('1', 'menu-mes-md-item-batch-config-query'),
('1', 'menu-mes-md-item-batch-config-create'),
('1', 'menu-mes-md-item-batch-config-update'),
('1', 'menu-mes-md-item-batch-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-item-type.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 物料产品分类 (MesMdItemType)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-item-type',
  'mes-dir',
  'MES 物料产品分类管理',
  '/admin/mes/mes-md-item-type',
  'mes/mes-md-item-type/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_item_type:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-item-type-query',  'menu-mes-md-item-type', '查询MES 物料产品分类', 'BUTTON', 'ACTIVE', 'mes:mes_md_item_type:query',  1, NOW(), NOW()),
('menu-mes-md-item-type-create', 'menu-mes-md-item-type', '新增MES 物料产品分类', 'BUTTON', 'ACTIVE', 'mes:mes_md_item_type:create', 2, NOW(), NOW()),
('menu-mes-md-item-type-update', 'menu-mes-md-item-type', '修改MES 物料产品分类', 'BUTTON', 'ACTIVE', 'mes:mes_md_item_type:update', 3, NOW(), NOW()),
('menu-mes-md-item-type-delete', 'menu-mes-md-item-type', '删除MES 物料产品分类', 'BUTTON', 'ACTIVE', 'mes:mes_md_item_type:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-item-type'),
('1', 'menu-mes-md-item-type-query'),
('1', 'menu-mes-md-item-type-create'),
('1', 'menu-mes-md-item-type-update'),
('1', 'menu-mes-md-item-type-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-item-type'),
('1', 'menu-mes-md-item-type-query'),
('1', 'menu-mes-md-item-type-create'),
('1', 'menu-mes-md-item-type-update'),
('1', 'menu-mes-md-item-type-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 物料产品 (MesMdItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-item',
  'mes-dir',
  'MES 物料产品管理',
  '/admin/mes/mes-md-item',
  'mes/mes-md-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-item-query',  'menu-mes-md-item', '查询MES 物料产品', 'BUTTON', 'ACTIVE', 'mes:mes_md_item:query',  1, NOW(), NOW()),
('menu-mes-md-item-create', 'menu-mes-md-item', '新增MES 物料产品', 'BUTTON', 'ACTIVE', 'mes:mes_md_item:create', 2, NOW(), NOW()),
('menu-mes-md-item-update', 'menu-mes-md-item', '修改MES 物料产品', 'BUTTON', 'ACTIVE', 'mes:mes_md_item:update', 3, NOW(), NOW()),
('menu-mes-md-item-delete', 'menu-mes-md-item', '删除MES 物料产品', 'BUTTON', 'ACTIVE', 'mes:mes_md_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-item'),
('1', 'menu-mes-md-item-query'),
('1', 'menu-mes-md-item-create'),
('1', 'menu-mes-md-item-update'),
('1', 'menu-mes-md-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-item'),
('1', 'menu-mes-md-item-query'),
('1', 'menu-mes-md-item-create'),
('1', 'menu-mes-md-item-update'),
('1', 'menu-mes-md-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-product-bom.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 产品 BOM (MesMdProductBom)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-product-bom',
  'mes-dir',
  'MES 产品 BOM管理',
  '/admin/mes/mes-md-product-bom',
  'mes/mes-md-product-bom/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_product_bom:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-product-bom-query',  'menu-mes-md-product-bom', '查询MES 产品 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_bom:query',  1, NOW(), NOW()),
('menu-mes-md-product-bom-create', 'menu-mes-md-product-bom', '新增MES 产品 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_bom:create', 2, NOW(), NOW()),
('menu-mes-md-product-bom-update', 'menu-mes-md-product-bom', '修改MES 产品 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_bom:update', 3, NOW(), NOW()),
('menu-mes-md-product-bom-delete', 'menu-mes-md-product-bom', '删除MES 产品 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_bom:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-product-bom'),
('1', 'menu-mes-md-product-bom-query'),
('1', 'menu-mes-md-product-bom-create'),
('1', 'menu-mes-md-product-bom-update'),
('1', 'menu-mes-md-product-bom-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-product-bom'),
('1', 'menu-mes-md-product-bom-query'),
('1', 'menu-mes-md-product-bom-create'),
('1', 'menu-mes-md-product-bom-update'),
('1', 'menu-mes-md-product-bom-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-product-sip.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 产品SIP (MesMdProductSip)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-product-sip',
  'mes-dir',
  'MES 产品SIP管理',
  '/admin/mes/mes-md-product-sip',
  'mes/mes-md-product-sip/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_product_sip:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-product-sip-query',  'menu-mes-md-product-sip', '查询MES 产品SIP', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_sip:query',  1, NOW(), NOW()),
('menu-mes-md-product-sip-create', 'menu-mes-md-product-sip', '新增MES 产品SIP', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_sip:create', 2, NOW(), NOW()),
('menu-mes-md-product-sip-update', 'menu-mes-md-product-sip', '修改MES 产品SIP', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_sip:update', 3, NOW(), NOW()),
('menu-mes-md-product-sip-delete', 'menu-mes-md-product-sip', '删除MES 产品SIP', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_sip:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-product-sip'),
('1', 'menu-mes-md-product-sip-query'),
('1', 'menu-mes-md-product-sip-create'),
('1', 'menu-mes-md-product-sip-update'),
('1', 'menu-mes-md-product-sip-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-product-sip'),
('1', 'menu-mes-md-product-sip-query'),
('1', 'menu-mes-md-product-sip-create'),
('1', 'menu-mes-md-product-sip-update'),
('1', 'menu-mes-md-product-sip-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-product-sop.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 产品SOP (MesMdProductSop)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-product-sop',
  'mes-dir',
  'MES 产品SOP管理',
  '/admin/mes/mes-md-product-sop',
  'mes/mes-md-product-sop/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_product_sop:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-product-sop-query',  'menu-mes-md-product-sop', '查询MES 产品SOP', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_sop:query',  1, NOW(), NOW()),
('menu-mes-md-product-sop-create', 'menu-mes-md-product-sop', '新增MES 产品SOP', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_sop:create', 2, NOW(), NOW()),
('menu-mes-md-product-sop-update', 'menu-mes-md-product-sop', '修改MES 产品SOP', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_sop:update', 3, NOW(), NOW()),
('menu-mes-md-product-sop-delete', 'menu-mes-md-product-sop', '删除MES 产品SOP', 'BUTTON', 'ACTIVE', 'mes:mes_md_product_sop:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-product-sop'),
('1', 'menu-mes-md-product-sop-query'),
('1', 'menu-mes-md-product-sop-create'),
('1', 'menu-mes-md-product-sop-update'),
('1', 'menu-mes-md-product-sop-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-product-sop'),
('1', 'menu-mes-md-product-sop-query'),
('1', 'menu-mes-md-product-sop-create'),
('1', 'menu-mes-md-product-sop-update'),
('1', 'menu-mes-md-product-sop-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-unit-measure.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 计量单位 (MesMdUnitMeasure)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-unit-measure',
  'mes-dir',
  'MES 计量单位管理',
  '/admin/mes/mes-md-unit-measure',
  'mes/mes-md-unit-measure/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_unit_measure:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-unit-measure-query',  'menu-mes-md-unit-measure', '查询MES 计量单位', 'BUTTON', 'ACTIVE', 'mes:mes_md_unit_measure:query',  1, NOW(), NOW()),
('menu-mes-md-unit-measure-create', 'menu-mes-md-unit-measure', '新增MES 计量单位', 'BUTTON', 'ACTIVE', 'mes:mes_md_unit_measure:create', 2, NOW(), NOW()),
('menu-mes-md-unit-measure-update', 'menu-mes-md-unit-measure', '修改MES 计量单位', 'BUTTON', 'ACTIVE', 'mes:mes_md_unit_measure:update', 3, NOW(), NOW()),
('menu-mes-md-unit-measure-delete', 'menu-mes-md-unit-measure', '删除MES 计量单位', 'BUTTON', 'ACTIVE', 'mes:mes_md_unit_measure:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-unit-measure'),
('1', 'menu-mes-md-unit-measure-query'),
('1', 'menu-mes-md-unit-measure-create'),
('1', 'menu-mes-md-unit-measure-update'),
('1', 'menu-mes-md-unit-measure-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-unit-measure'),
('1', 'menu-mes-md-unit-measure-query'),
('1', 'menu-mes-md-unit-measure-create'),
('1', 'menu-mes-md-unit-measure-update'),
('1', 'menu-mes-md-unit-measure-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-vendor.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 供应商 (MesMdVendor)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-vendor',
  'mes-dir',
  'MES 供应商管理',
  '/admin/mes/mes-md-vendor',
  'mes/mes-md-vendor/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_vendor:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-vendor-query',  'menu-mes-md-vendor', '查询MES 供应商', 'BUTTON', 'ACTIVE', 'mes:mes_md_vendor:query',  1, NOW(), NOW()),
('menu-mes-md-vendor-create', 'menu-mes-md-vendor', '新增MES 供应商', 'BUTTON', 'ACTIVE', 'mes:mes_md_vendor:create', 2, NOW(), NOW()),
('menu-mes-md-vendor-update', 'menu-mes-md-vendor', '修改MES 供应商', 'BUTTON', 'ACTIVE', 'mes:mes_md_vendor:update', 3, NOW(), NOW()),
('menu-mes-md-vendor-delete', 'menu-mes-md-vendor', '删除MES 供应商', 'BUTTON', 'ACTIVE', 'mes:mes_md_vendor:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-vendor'),
('1', 'menu-mes-md-vendor-query'),
('1', 'menu-mes-md-vendor-create'),
('1', 'menu-mes-md-vendor-update'),
('1', 'menu-mes-md-vendor-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-vendor'),
('1', 'menu-mes-md-vendor-query'),
('1', 'menu-mes-md-vendor-create'),
('1', 'menu-mes-md-vendor-update'),
('1', 'menu-mes-md-vendor-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-workshop.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 车间 (MesMdWorkshop)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-workshop',
  'mes-dir',
  'MES 车间管理',
  '/admin/mes/mes-md-workshop',
  'mes/mes-md-workshop/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_workshop:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-workshop-query',  'menu-mes-md-workshop', '查询MES 车间', 'BUTTON', 'ACTIVE', 'mes:mes_md_workshop:query',  1, NOW(), NOW()),
('menu-mes-md-workshop-create', 'menu-mes-md-workshop', '新增MES 车间', 'BUTTON', 'ACTIVE', 'mes:mes_md_workshop:create', 2, NOW(), NOW()),
('menu-mes-md-workshop-update', 'menu-mes-md-workshop', '修改MES 车间', 'BUTTON', 'ACTIVE', 'mes:mes_md_workshop:update', 3, NOW(), NOW()),
('menu-mes-md-workshop-delete', 'menu-mes-md-workshop', '删除MES 车间', 'BUTTON', 'ACTIVE', 'mes:mes_md_workshop:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workshop'),
('1', 'menu-mes-md-workshop-query'),
('1', 'menu-mes-md-workshop-create'),
('1', 'menu-mes-md-workshop-update'),
('1', 'menu-mes-md-workshop-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workshop'),
('1', 'menu-mes-md-workshop-query'),
('1', 'menu-mes-md-workshop-create'),
('1', 'menu-mes-md-workshop-update'),
('1', 'menu-mes-md-workshop-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-workstation-machine.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 设备资源 (MesMdWorkstationMachine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-workstation-machine',
  'mes-dir',
  'MES 设备资源管理',
  '/admin/mes/mes-md-workstation-machine',
  'mes/mes-md-workstation-machine/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_workstation_machine:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-workstation-machine-query',  'menu-mes-md-workstation-machine', '查询MES 设备资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_machine:query',  1, NOW(), NOW()),
('menu-mes-md-workstation-machine-create', 'menu-mes-md-workstation-machine', '新增MES 设备资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_machine:create', 2, NOW(), NOW()),
('menu-mes-md-workstation-machine-update', 'menu-mes-md-workstation-machine', '修改MES 设备资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_machine:update', 3, NOW(), NOW()),
('menu-mes-md-workstation-machine-delete', 'menu-mes-md-workstation-machine', '删除MES 设备资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_machine:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workstation-machine'),
('1', 'menu-mes-md-workstation-machine-query'),
('1', 'menu-mes-md-workstation-machine-create'),
('1', 'menu-mes-md-workstation-machine-update'),
('1', 'menu-mes-md-workstation-machine-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workstation-machine'),
('1', 'menu-mes-md-workstation-machine-query'),
('1', 'menu-mes-md-workstation-machine-create'),
('1', 'menu-mes-md-workstation-machine-update'),
('1', 'menu-mes-md-workstation-machine-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-workstation-tool.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 工装夹具资源 (MesMdWorkstationTool)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-workstation-tool',
  'mes-dir',
  'MES 工装夹具资源管理',
  '/admin/mes/mes-md-workstation-tool',
  'mes/mes-md-workstation-tool/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_workstation_tool:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-workstation-tool-query',  'menu-mes-md-workstation-tool', '查询MES 工装夹具资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_tool:query',  1, NOW(), NOW()),
('menu-mes-md-workstation-tool-create', 'menu-mes-md-workstation-tool', '新增MES 工装夹具资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_tool:create', 2, NOW(), NOW()),
('menu-mes-md-workstation-tool-update', 'menu-mes-md-workstation-tool', '修改MES 工装夹具资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_tool:update', 3, NOW(), NOW()),
('menu-mes-md-workstation-tool-delete', 'menu-mes-md-workstation-tool', '删除MES 工装夹具资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_tool:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workstation-tool'),
('1', 'menu-mes-md-workstation-tool-query'),
('1', 'menu-mes-md-workstation-tool-create'),
('1', 'menu-mes-md-workstation-tool-update'),
('1', 'menu-mes-md-workstation-tool-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workstation-tool'),
('1', 'menu-mes-md-workstation-tool-query'),
('1', 'menu-mes-md-workstation-tool-create'),
('1', 'menu-mes-md-workstation-tool-update'),
('1', 'menu-mes-md-workstation-tool-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-workstation-worker.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 人力资源 (MesMdWorkstationWorker)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-workstation-worker',
  'mes-dir',
  'MES 人力资源管理',
  '/admin/mes/mes-md-workstation-worker',
  'mes/mes-md-workstation-worker/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_workstation_worker:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-workstation-worker-query',  'menu-mes-md-workstation-worker', '查询MES 人力资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_worker:query',  1, NOW(), NOW()),
('menu-mes-md-workstation-worker-create', 'menu-mes-md-workstation-worker', '新增MES 人力资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_worker:create', 2, NOW(), NOW()),
('menu-mes-md-workstation-worker-update', 'menu-mes-md-workstation-worker', '修改MES 人力资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_worker:update', 3, NOW(), NOW()),
('menu-mes-md-workstation-worker-delete', 'menu-mes-md-workstation-worker', '删除MES 人力资源', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation_worker:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workstation-worker'),
('1', 'menu-mes-md-workstation-worker-query'),
('1', 'menu-mes-md-workstation-worker-create'),
('1', 'menu-mes-md-workstation-worker-update'),
('1', 'menu-mes-md-workstation-worker-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workstation-worker'),
('1', 'menu-mes-md-workstation-worker-query'),
('1', 'menu-mes-md-workstation-worker-create'),
('1', 'menu-mes-md-workstation-worker-update'),
('1', 'menu-mes-md-workstation-worker-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-md-workstation.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 工作站 (MesMdWorkstation)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-md-workstation',
  'mes-dir',
  'MES 工作站管理',
  '/admin/mes/mes-md-workstation',
  'mes/mes-md-workstation/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_md_workstation:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-md-workstation-query',  'menu-mes-md-workstation', '查询MES 工作站', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation:query',  1, NOW(), NOW()),
('menu-mes-md-workstation-create', 'menu-mes-md-workstation', '新增MES 工作站', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation:create', 2, NOW(), NOW()),
('menu-mes-md-workstation-update', 'menu-mes-md-workstation', '修改MES 工作站', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation:update', 3, NOW(), NOW()),
('menu-mes-md-workstation-delete', 'menu-mes-md-workstation', '删除MES 工作站', 'BUTTON', 'ACTIVE', 'mes:mes_md_workstation:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workstation'),
('1', 'menu-mes-md-workstation-query'),
('1', 'menu-mes-md-workstation-create'),
('1', 'menu-mes-md-workstation-update'),
('1', 'menu-mes-md-workstation-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-md-workstation'),
('1', 'menu-mes-md-workstation-query'),
('1', 'menu-mes-md-workstation-create'),
('1', 'menu-mes-md-workstation-update'),
('1', 'menu-mes-md-workstation-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-andon-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 安灯呼叫配置 (MesProAndonConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-andon-config',
  'mes-dir',
  'MES 安灯呼叫配置管理',
  '/admin/mes/mes-pro-andon-config',
  'mes/mes-pro-andon-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_andon_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-andon-config-query',  'menu-mes-pro-andon-config', '查询MES 安灯呼叫配置', 'BUTTON', 'ACTIVE', 'mes:mes_pro_andon_config:query',  1, NOW(), NOW()),
('menu-mes-pro-andon-config-create', 'menu-mes-pro-andon-config', '新增MES 安灯呼叫配置', 'BUTTON', 'ACTIVE', 'mes:mes_pro_andon_config:create', 2, NOW(), NOW()),
('menu-mes-pro-andon-config-update', 'menu-mes-pro-andon-config', '修改MES 安灯呼叫配置', 'BUTTON', 'ACTIVE', 'mes:mes_pro_andon_config:update', 3, NOW(), NOW()),
('menu-mes-pro-andon-config-delete', 'menu-mes-pro-andon-config', '删除MES 安灯呼叫配置', 'BUTTON', 'ACTIVE', 'mes:mes_pro_andon_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-andon-config'),
('1', 'menu-mes-pro-andon-config-query'),
('1', 'menu-mes-pro-andon-config-create'),
('1', 'menu-mes-pro-andon-config-update'),
('1', 'menu-mes-pro-andon-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-andon-config'),
('1', 'menu-mes-pro-andon-config-query'),
('1', 'menu-mes-pro-andon-config-create'),
('1', 'menu-mes-pro-andon-config-update'),
('1', 'menu-mes-pro-andon-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-andon-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 安灯呼叫记录 (MesProAndonRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-andon-record',
  'mes-dir',
  'MES 安灯呼叫记录管理',
  '/admin/mes/mes-pro-andon-record',
  'mes/mes-pro-andon-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_andon_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-andon-record-query',  'menu-mes-pro-andon-record', '查询MES 安灯呼叫记录', 'BUTTON', 'ACTIVE', 'mes:mes_pro_andon_record:query',  1, NOW(), NOW()),
('menu-mes-pro-andon-record-create', 'menu-mes-pro-andon-record', '新增MES 安灯呼叫记录', 'BUTTON', 'ACTIVE', 'mes:mes_pro_andon_record:create', 2, NOW(), NOW()),
('menu-mes-pro-andon-record-update', 'menu-mes-pro-andon-record', '修改MES 安灯呼叫记录', 'BUTTON', 'ACTIVE', 'mes:mes_pro_andon_record:update', 3, NOW(), NOW()),
('menu-mes-pro-andon-record-delete', 'menu-mes-pro-andon-record', '删除MES 安灯呼叫记录', 'BUTTON', 'ACTIVE', 'mes:mes_pro_andon_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-andon-record'),
('1', 'menu-mes-pro-andon-record-query'),
('1', 'menu-mes-pro-andon-record-create'),
('1', 'menu-mes-pro-andon-record-update'),
('1', 'menu-mes-pro-andon-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-andon-record'),
('1', 'menu-mes-pro-andon-record-query'),
('1', 'menu-mes-pro-andon-record-create'),
('1', 'menu-mes-pro-andon-record-update'),
('1', 'menu-mes-pro-andon-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-card-process.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 流转卡工序记录 (MesProCardProcess)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-card-process',
  'mes-dir',
  'MES 流转卡工序记录管理',
  '/admin/mes/mes-pro-card-process',
  'mes/mes-pro-card-process/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_card_process:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-card-process-query',  'menu-mes-pro-card-process', '查询MES 流转卡工序记录', 'BUTTON', 'ACTIVE', 'mes:mes_pro_card_process:query',  1, NOW(), NOW()),
('menu-mes-pro-card-process-create', 'menu-mes-pro-card-process', '新增MES 流转卡工序记录', 'BUTTON', 'ACTIVE', 'mes:mes_pro_card_process:create', 2, NOW(), NOW()),
('menu-mes-pro-card-process-update', 'menu-mes-pro-card-process', '修改MES 流转卡工序记录', 'BUTTON', 'ACTIVE', 'mes:mes_pro_card_process:update', 3, NOW(), NOW()),
('menu-mes-pro-card-process-delete', 'menu-mes-pro-card-process', '删除MES 流转卡工序记录', 'BUTTON', 'ACTIVE', 'mes:mes_pro_card_process:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-card-process'),
('1', 'menu-mes-pro-card-process-query'),
('1', 'menu-mes-pro-card-process-create'),
('1', 'menu-mes-pro-card-process-update'),
('1', 'menu-mes-pro-card-process-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-card-process'),
('1', 'menu-mes-pro-card-process-query'),
('1', 'menu-mes-pro-card-process-create'),
('1', 'menu-mes-pro-card-process-update'),
('1', 'menu-mes-pro-card-process-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-card.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产流转卡 (MesProCard)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-card',
  'mes-dir',
  'MES 生产流转卡管理',
  '/admin/mes/mes-pro-card',
  'mes/mes-pro-card/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_card:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-card-query',  'menu-mes-pro-card', '查询MES 生产流转卡', 'BUTTON', 'ACTIVE', 'mes:mes_pro_card:query',  1, NOW(), NOW()),
('menu-mes-pro-card-create', 'menu-mes-pro-card', '新增MES 生产流转卡', 'BUTTON', 'ACTIVE', 'mes:mes_pro_card:create', 2, NOW(), NOW()),
('menu-mes-pro-card-update', 'menu-mes-pro-card', '修改MES 生产流转卡', 'BUTTON', 'ACTIVE', 'mes:mes_pro_card:update', 3, NOW(), NOW()),
('menu-mes-pro-card-delete', 'menu-mes-pro-card', '删除MES 生产流转卡', 'BUTTON', 'ACTIVE', 'mes:mes_pro_card:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-card'),
('1', 'menu-mes-pro-card-query'),
('1', 'menu-mes-pro-card-create'),
('1', 'menu-mes-pro-card-update'),
('1', 'menu-mes-pro-card-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-card'),
('1', 'menu-mes-pro-card-query'),
('1', 'menu-mes-pro-card-create'),
('1', 'menu-mes-pro-card-update'),
('1', 'menu-mes-pro-card-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-feedback.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产报工 (MesProFeedback)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-feedback',
  'mes-dir',
  'MES 生产报工管理',
  '/admin/mes/mes-pro-feedback',
  'mes/mes-pro-feedback/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_feedback:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-feedback-query',  'menu-mes-pro-feedback', '查询MES 生产报工', 'BUTTON', 'ACTIVE', 'mes:mes_pro_feedback:query',  1, NOW(), NOW()),
('menu-mes-pro-feedback-create', 'menu-mes-pro-feedback', '新增MES 生产报工', 'BUTTON', 'ACTIVE', 'mes:mes_pro_feedback:create', 2, NOW(), NOW()),
('menu-mes-pro-feedback-update', 'menu-mes-pro-feedback', '修改MES 生产报工', 'BUTTON', 'ACTIVE', 'mes:mes_pro_feedback:update', 3, NOW(), NOW()),
('menu-mes-pro-feedback-delete', 'menu-mes-pro-feedback', '删除MES 生产报工', 'BUTTON', 'ACTIVE', 'mes:mes_pro_feedback:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-feedback'),
('1', 'menu-mes-pro-feedback-query'),
('1', 'menu-mes-pro-feedback-create'),
('1', 'menu-mes-pro-feedback-update'),
('1', 'menu-mes-pro-feedback-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-feedback'),
('1', 'menu-mes-pro-feedback-query'),
('1', 'menu-mes-pro-feedback-create'),
('1', 'menu-mes-pro-feedback-update'),
('1', 'menu-mes-pro-feedback-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-process-content.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产工序内容 (MesProProcessContent)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-process-content',
  'mes-dir',
  'MES 生产工序内容管理',
  '/admin/mes/mes-pro-process-content',
  'mes/mes-pro-process-content/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_process_content:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-process-content-query',  'menu-mes-pro-process-content', '查询MES 生产工序内容', 'BUTTON', 'ACTIVE', 'mes:mes_pro_process_content:query',  1, NOW(), NOW()),
('menu-mes-pro-process-content-create', 'menu-mes-pro-process-content', '新增MES 生产工序内容', 'BUTTON', 'ACTIVE', 'mes:mes_pro_process_content:create', 2, NOW(), NOW()),
('menu-mes-pro-process-content-update', 'menu-mes-pro-process-content', '修改MES 生产工序内容', 'BUTTON', 'ACTIVE', 'mes:mes_pro_process_content:update', 3, NOW(), NOW()),
('menu-mes-pro-process-content-delete', 'menu-mes-pro-process-content', '删除MES 生产工序内容', 'BUTTON', 'ACTIVE', 'mes:mes_pro_process_content:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-process-content'),
('1', 'menu-mes-pro-process-content-query'),
('1', 'menu-mes-pro-process-content-create'),
('1', 'menu-mes-pro-process-content-update'),
('1', 'menu-mes-pro-process-content-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-process-content'),
('1', 'menu-mes-pro-process-content-query'),
('1', 'menu-mes-pro-process-content-create'),
('1', 'menu-mes-pro-process-content-update'),
('1', 'menu-mes-pro-process-content-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-process.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产工序 (MesProProcess)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-process',
  'mes-dir',
  'MES 生产工序管理',
  '/admin/mes/mes-pro-process',
  'mes/mes-pro-process/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_process:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-process-query',  'menu-mes-pro-process', '查询MES 生产工序', 'BUTTON', 'ACTIVE', 'mes:mes_pro_process:query',  1, NOW(), NOW()),
('menu-mes-pro-process-create', 'menu-mes-pro-process', '新增MES 生产工序', 'BUTTON', 'ACTIVE', 'mes:mes_pro_process:create', 2, NOW(), NOW()),
('menu-mes-pro-process-update', 'menu-mes-pro-process', '修改MES 生产工序', 'BUTTON', 'ACTIVE', 'mes:mes_pro_process:update', 3, NOW(), NOW()),
('menu-mes-pro-process-delete', 'menu-mes-pro-process', '删除MES 生产工序', 'BUTTON', 'ACTIVE', 'mes:mes_pro_process:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-process'),
('1', 'menu-mes-pro-process-query'),
('1', 'menu-mes-pro-process-create'),
('1', 'menu-mes-pro-process-update'),
('1', 'menu-mes-pro-process-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-process'),
('1', 'menu-mes-pro-process-query'),
('1', 'menu-mes-pro-process-create'),
('1', 'menu-mes-pro-process-update'),
('1', 'menu-mes-pro-process-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-route-process.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 工艺路线工序 (MesProRouteProcess)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-route-process',
  'mes-dir',
  'MES 工艺路线工序管理',
  '/admin/mes/mes-pro-route-process',
  'mes/mes-pro-route-process/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_route_process:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-route-process-query',  'menu-mes-pro-route-process', '查询MES 工艺路线工序', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_process:query',  1, NOW(), NOW()),
('menu-mes-pro-route-process-create', 'menu-mes-pro-route-process', '新增MES 工艺路线工序', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_process:create', 2, NOW(), NOW()),
('menu-mes-pro-route-process-update', 'menu-mes-pro-route-process', '修改MES 工艺路线工序', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_process:update', 3, NOW(), NOW()),
('menu-mes-pro-route-process-delete', 'menu-mes-pro-route-process', '删除MES 工艺路线工序', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_process:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-route-process'),
('1', 'menu-mes-pro-route-process-query'),
('1', 'menu-mes-pro-route-process-create'),
('1', 'menu-mes-pro-route-process-update'),
('1', 'menu-mes-pro-route-process-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-route-process'),
('1', 'menu-mes-pro-route-process-query'),
('1', 'menu-mes-pro-route-process-create'),
('1', 'menu-mes-pro-route-process-update'),
('1', 'menu-mes-pro-route-process-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-route-product-bom.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 工艺路线产品 BOM (MesProRouteProductBom)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-route-product-bom',
  'mes-dir',
  'MES 工艺路线产品 BOM管理',
  '/admin/mes/mes-pro-route-product-bom',
  'mes/mes-pro-route-product-bom/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_route_product_bom:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-route-product-bom-query',  'menu-mes-pro-route-product-bom', '查询MES 工艺路线产品 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_product_bom:query',  1, NOW(), NOW()),
('menu-mes-pro-route-product-bom-create', 'menu-mes-pro-route-product-bom', '新增MES 工艺路线产品 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_product_bom:create', 2, NOW(), NOW()),
('menu-mes-pro-route-product-bom-update', 'menu-mes-pro-route-product-bom', '修改MES 工艺路线产品 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_product_bom:update', 3, NOW(), NOW()),
('menu-mes-pro-route-product-bom-delete', 'menu-mes-pro-route-product-bom', '删除MES 工艺路线产品 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_product_bom:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-route-product-bom'),
('1', 'menu-mes-pro-route-product-bom-query'),
('1', 'menu-mes-pro-route-product-bom-create'),
('1', 'menu-mes-pro-route-product-bom-update'),
('1', 'menu-mes-pro-route-product-bom-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-route-product-bom'),
('1', 'menu-mes-pro-route-product-bom-query'),
('1', 'menu-mes-pro-route-product-bom-create'),
('1', 'menu-mes-pro-route-product-bom-update'),
('1', 'menu-mes-pro-route-product-bom-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-route-product.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 工艺路线产品 (MesProRouteProduct)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-route-product',
  'mes-dir',
  'MES 工艺路线产品管理',
  '/admin/mes/mes-pro-route-product',
  'mes/mes-pro-route-product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_route_product:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-route-product-query',  'menu-mes-pro-route-product', '查询MES 工艺路线产品', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_product:query',  1, NOW(), NOW()),
('menu-mes-pro-route-product-create', 'menu-mes-pro-route-product', '新增MES 工艺路线产品', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_product:create', 2, NOW(), NOW()),
('menu-mes-pro-route-product-update', 'menu-mes-pro-route-product', '修改MES 工艺路线产品', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_product:update', 3, NOW(), NOW()),
('menu-mes-pro-route-product-delete', 'menu-mes-pro-route-product', '删除MES 工艺路线产品', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route_product:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-route-product'),
('1', 'menu-mes-pro-route-product-query'),
('1', 'menu-mes-pro-route-product-create'),
('1', 'menu-mes-pro-route-product-update'),
('1', 'menu-mes-pro-route-product-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-route-product'),
('1', 'menu-mes-pro-route-product-query'),
('1', 'menu-mes-pro-route-product-create'),
('1', 'menu-mes-pro-route-product-update'),
('1', 'menu-mes-pro-route-product-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-route.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 工艺路线 (MesProRoute)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-route',
  'mes-dir',
  'MES 工艺路线管理',
  '/admin/mes/mes-pro-route',
  'mes/mes-pro-route/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_route:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-route-query',  'menu-mes-pro-route', '查询MES 工艺路线', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route:query',  1, NOW(), NOW()),
('menu-mes-pro-route-create', 'menu-mes-pro-route', '新增MES 工艺路线', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route:create', 2, NOW(), NOW()),
('menu-mes-pro-route-update', 'menu-mes-pro-route', '修改MES 工艺路线', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route:update', 3, NOW(), NOW()),
('menu-mes-pro-route-delete', 'menu-mes-pro-route', '删除MES 工艺路线', 'BUTTON', 'ACTIVE', 'mes:mes_pro_route:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-route'),
('1', 'menu-mes-pro-route-query'),
('1', 'menu-mes-pro-route-create'),
('1', 'menu-mes-pro-route-update'),
('1', 'menu-mes-pro-route-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-route'),
('1', 'menu-mes-pro-route-query'),
('1', 'menu-mes-pro-route-create'),
('1', 'menu-mes-pro-route-update'),
('1', 'menu-mes-pro-route-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-task-issue.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产任务投料 (MesProTaskIssue)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-task-issue',
  'mes-dir',
  'MES 生产任务投料管理',
  '/admin/mes/mes-pro-task-issue',
  'mes/mes-pro-task-issue/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_task_issue:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-task-issue-query',  'menu-mes-pro-task-issue', '查询MES 生产任务投料', 'BUTTON', 'ACTIVE', 'mes:mes_pro_task_issue:query',  1, NOW(), NOW()),
('menu-mes-pro-task-issue-create', 'menu-mes-pro-task-issue', '新增MES 生产任务投料', 'BUTTON', 'ACTIVE', 'mes:mes_pro_task_issue:create', 2, NOW(), NOW()),
('menu-mes-pro-task-issue-update', 'menu-mes-pro-task-issue', '修改MES 生产任务投料', 'BUTTON', 'ACTIVE', 'mes:mes_pro_task_issue:update', 3, NOW(), NOW()),
('menu-mes-pro-task-issue-delete', 'menu-mes-pro-task-issue', '删除MES 生产任务投料', 'BUTTON', 'ACTIVE', 'mes:mes_pro_task_issue:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-task-issue'),
('1', 'menu-mes-pro-task-issue-query'),
('1', 'menu-mes-pro-task-issue-create'),
('1', 'menu-mes-pro-task-issue-update'),
('1', 'menu-mes-pro-task-issue-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-task-issue'),
('1', 'menu-mes-pro-task-issue-query'),
('1', 'menu-mes-pro-task-issue-create'),
('1', 'menu-mes-pro-task-issue-update'),
('1', 'menu-mes-pro-task-issue-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-task.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产任务 (MesProTask)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-task',
  'mes-dir',
  'MES 生产任务管理',
  '/admin/mes/mes-pro-task',
  'mes/mes-pro-task/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_task:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-task-query',  'menu-mes-pro-task', '查询MES 生产任务', 'BUTTON', 'ACTIVE', 'mes:mes_pro_task:query',  1, NOW(), NOW()),
('menu-mes-pro-task-create', 'menu-mes-pro-task', '新增MES 生产任务', 'BUTTON', 'ACTIVE', 'mes:mes_pro_task:create', 2, NOW(), NOW()),
('menu-mes-pro-task-update', 'menu-mes-pro-task', '修改MES 生产任务', 'BUTTON', 'ACTIVE', 'mes:mes_pro_task:update', 3, NOW(), NOW()),
('menu-mes-pro-task-delete', 'menu-mes-pro-task', '删除MES 生产任务', 'BUTTON', 'ACTIVE', 'mes:mes_pro_task:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-task'),
('1', 'menu-mes-pro-task-query'),
('1', 'menu-mes-pro-task-create'),
('1', 'menu-mes-pro-task-update'),
('1', 'menu-mes-pro-task-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-task'),
('1', 'menu-mes-pro-task-query'),
('1', 'menu-mes-pro-task-create'),
('1', 'menu-mes-pro-task-update'),
('1', 'menu-mes-pro-task-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-work-order-bom.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产工单 BOM (MesProWorkOrderBom)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-work-order-bom',
  'mes-dir',
  'MES 生产工单 BOM管理',
  '/admin/mes/mes-pro-work-order-bom',
  'mes/mes-pro-work-order-bom/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_work_order_bom:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-work-order-bom-query',  'menu-mes-pro-work-order-bom', '查询MES 生产工单 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_order_bom:query',  1, NOW(), NOW()),
('menu-mes-pro-work-order-bom-create', 'menu-mes-pro-work-order-bom', '新增MES 生产工单 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_order_bom:create', 2, NOW(), NOW()),
('menu-mes-pro-work-order-bom-update', 'menu-mes-pro-work-order-bom', '修改MES 生产工单 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_order_bom:update', 3, NOW(), NOW()),
('menu-mes-pro-work-order-bom-delete', 'menu-mes-pro-work-order-bom', '删除MES 生产工单 BOM', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_order_bom:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-work-order-bom'),
('1', 'menu-mes-pro-work-order-bom-query'),
('1', 'menu-mes-pro-work-order-bom-create'),
('1', 'menu-mes-pro-work-order-bom-update'),
('1', 'menu-mes-pro-work-order-bom-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-work-order-bom'),
('1', 'menu-mes-pro-work-order-bom-query'),
('1', 'menu-mes-pro-work-order-bom-create'),
('1', 'menu-mes-pro-work-order-bom-update'),
('1', 'menu-mes-pro-work-order-bom-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-work-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产工单 (MesProWorkOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-work-order',
  'mes-dir',
  'MES 生产工单管理',
  '/admin/mes/mes-pro-work-order',
  'mes/mes-pro-work-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_work_order:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-work-order-query',  'menu-mes-pro-work-order', '查询MES 生产工单', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_order:query',  1, NOW(), NOW()),
('menu-mes-pro-work-order-create', 'menu-mes-pro-work-order', '新增MES 生产工单', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_order:create', 2, NOW(), NOW()),
('menu-mes-pro-work-order-update', 'menu-mes-pro-work-order', '修改MES 生产工单', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_order:update', 3, NOW(), NOW()),
('menu-mes-pro-work-order-delete', 'menu-mes-pro-work-order', '删除MES 生产工单', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_order:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-work-order'),
('1', 'menu-mes-pro-work-order-query'),
('1', 'menu-mes-pro-work-order-create'),
('1', 'menu-mes-pro-work-order-update'),
('1', 'menu-mes-pro-work-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-work-order'),
('1', 'menu-mes-pro-work-order-query'),
('1', 'menu-mes-pro-work-order-create'),
('1', 'menu-mes-pro-work-order-update'),
('1', 'menu-mes-pro-work-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-work-record-log.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 上下工记录流水 (MesProWorkRecordLog)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-work-record-log',
  'mes-dir',
  'MES 上下工记录流水管理',
  '/admin/mes/mes-pro-work-record-log',
  'mes/mes-pro-work-record-log/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_work_record_log:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-work-record-log-query',  'menu-mes-pro-work-record-log', '查询MES 上下工记录流水', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_record_log:query',  1, NOW(), NOW()),
('menu-mes-pro-work-record-log-create', 'menu-mes-pro-work-record-log', '新增MES 上下工记录流水', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_record_log:create', 2, NOW(), NOW()),
('menu-mes-pro-work-record-log-update', 'menu-mes-pro-work-record-log', '修改MES 上下工记录流水', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_record_log:update', 3, NOW(), NOW()),
('menu-mes-pro-work-record-log-delete', 'menu-mes-pro-work-record-log', '删除MES 上下工记录流水', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_record_log:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-work-record-log'),
('1', 'menu-mes-pro-work-record-log-query'),
('1', 'menu-mes-pro-work-record-log-create'),
('1', 'menu-mes-pro-work-record-log-update'),
('1', 'menu-mes-pro-work-record-log-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-work-record-log'),
('1', 'menu-mes-pro-work-record-log-query'),
('1', 'menu-mes-pro-work-record-log-create'),
('1', 'menu-mes-pro-work-record-log-update'),
('1', 'menu-mes-pro-work-record-log-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-pro-work-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 用户工作站绑定关系（当前快照） (MesProWorkRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-pro-work-record',
  'mes-dir',
  'MES 用户工作站绑定关系（当前快照）管理',
  '/admin/mes/mes-pro-work-record',
  'mes/mes-pro-work-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_pro_work_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-pro-work-record-query',  'menu-mes-pro-work-record', '查询MES 用户工作站绑定关系（当前快照）', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_record:query',  1, NOW(), NOW()),
('menu-mes-pro-work-record-create', 'menu-mes-pro-work-record', '新增MES 用户工作站绑定关系（当前快照）', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_record:create', 2, NOW(), NOW()),
('menu-mes-pro-work-record-update', 'menu-mes-pro-work-record', '修改MES 用户工作站绑定关系（当前快照）', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_record:update', 3, NOW(), NOW()),
('menu-mes-pro-work-record-delete', 'menu-mes-pro-work-record', '删除MES 用户工作站绑定关系（当前快照）', 'BUTTON', 'ACTIVE', 'mes:mes_pro_work_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-work-record'),
('1', 'menu-mes-pro-work-record-query'),
('1', 'menu-mes-pro-work-record-create'),
('1', 'menu-mes-pro-work-record-update'),
('1', 'menu-mes-pro-work-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-pro-work-record'),
('1', 'menu-mes-pro-work-record-query'),
('1', 'menu-mes-pro-work-record-create'),
('1', 'menu-mes-pro-work-record-update'),
('1', 'menu-mes-pro-work-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-defect-record.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、 (MesQcDefectRecord)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-defect-record',
  'mes-dir',
  'MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、管理',
  '/admin/mes/mes-qc-defect-record',
  'mes/mes-qc-defect-record/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_defect_record:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-defect-record-query',  'menu-mes-qc-defect-record', '查询MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、', 'BUTTON', 'ACTIVE', 'mes:mes_qc_defect_record:query',  1, NOW(), NOW()),
('menu-mes-qc-defect-record-create', 'menu-mes-qc-defect-record', '新增MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、', 'BUTTON', 'ACTIVE', 'mes:mes_qc_defect_record:create', 2, NOW(), NOW()),
('menu-mes-qc-defect-record-update', 'menu-mes-qc-defect-record', '修改MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、', 'BUTTON', 'ACTIVE', 'mes:mes_qc_defect_record:update', 3, NOW(), NOW()),
('menu-mes-qc-defect-record-delete', 'menu-mes-qc-defect-record', '删除MES 质检缺陷记录 DO通用缺陷记录表，通过 区分检验类型（IQC、IPQC、', 'BUTTON', 'ACTIVE', 'mes:mes_qc_defect_record:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-defect-record'),
('1', 'menu-mes-qc-defect-record-query'),
('1', 'menu-mes-qc-defect-record-create'),
('1', 'menu-mes-qc-defect-record-update'),
('1', 'menu-mes-qc-defect-record-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-defect-record'),
('1', 'menu-mes-qc-defect-record-query'),
('1', 'menu-mes-qc-defect-record-create'),
('1', 'menu-mes-qc-defect-record-update'),
('1', 'menu-mes-qc-defect-record-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-defect.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 缺陷类型 (MesQcDefect)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-defect',
  'mes-dir',
  'MES 缺陷类型管理',
  '/admin/mes/mes-qc-defect',
  'mes/mes-qc-defect/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_defect:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-defect-query',  'menu-mes-qc-defect', '查询MES 缺陷类型', 'BUTTON', 'ACTIVE', 'mes:mes_qc_defect:query',  1, NOW(), NOW()),
('menu-mes-qc-defect-create', 'menu-mes-qc-defect', '新增MES 缺陷类型', 'BUTTON', 'ACTIVE', 'mes:mes_qc_defect:create', 2, NOW(), NOW()),
('menu-mes-qc-defect-update', 'menu-mes-qc-defect', '修改MES 缺陷类型', 'BUTTON', 'ACTIVE', 'mes:mes_qc_defect:update', 3, NOW(), NOW()),
('menu-mes-qc-defect-delete', 'menu-mes-qc-defect', '删除MES 缺陷类型', 'BUTTON', 'ACTIVE', 'mes:mes_qc_defect:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-defect'),
('1', 'menu-mes-qc-defect-query'),
('1', 'menu-mes-qc-defect-create'),
('1', 'menu-mes-qc-defect-update'),
('1', 'menu-mes-qc-defect-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-defect'),
('1', 'menu-mes-qc-defect-query'),
('1', 'menu-mes-qc-defect-create'),
('1', 'menu-mes-qc-defect-update'),
('1', 'menu-mes-qc-defect-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-indicator-result-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 检验结果明细记录 (MesQcIndicatorResultDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-indicator-result-detail',
  'mes-dir',
  'MES 检验结果明细记录管理',
  '/admin/mes/mes-qc-indicator-result-detail',
  'mes/mes-qc-indicator-result-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_indicator_result_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-indicator-result-detail-query',  'menu-mes-qc-indicator-result-detail', '查询MES 检验结果明细记录', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator_result_detail:query',  1, NOW(), NOW()),
('menu-mes-qc-indicator-result-detail-create', 'menu-mes-qc-indicator-result-detail', '新增MES 检验结果明细记录', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator_result_detail:create', 2, NOW(), NOW()),
('menu-mes-qc-indicator-result-detail-update', 'menu-mes-qc-indicator-result-detail', '修改MES 检验结果明细记录', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator_result_detail:update', 3, NOW(), NOW()),
('menu-mes-qc-indicator-result-detail-delete', 'menu-mes-qc-indicator-result-detail', '删除MES 检验结果明细记录', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator_result_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-indicator-result-detail'),
('1', 'menu-mes-qc-indicator-result-detail-query'),
('1', 'menu-mes-qc-indicator-result-detail-create'),
('1', 'menu-mes-qc-indicator-result-detail-update'),
('1', 'menu-mes-qc-indicator-result-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-indicator-result-detail'),
('1', 'menu-mes-qc-indicator-result-detail-query'),
('1', 'menu-mes-qc-indicator-result-detail-create'),
('1', 'menu-mes-qc-indicator-result-detail-update'),
('1', 'menu-mes-qc-indicator-result-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-indicator-result.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 检验结果记录 (MesQcIndicatorResult)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-indicator-result',
  'mes-dir',
  'MES 检验结果记录管理',
  '/admin/mes/mes-qc-indicator-result',
  'mes/mes-qc-indicator-result/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_indicator_result:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-indicator-result-query',  'menu-mes-qc-indicator-result', '查询MES 检验结果记录', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator_result:query',  1, NOW(), NOW()),
('menu-mes-qc-indicator-result-create', 'menu-mes-qc-indicator-result', '新增MES 检验结果记录', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator_result:create', 2, NOW(), NOW()),
('menu-mes-qc-indicator-result-update', 'menu-mes-qc-indicator-result', '修改MES 检验结果记录', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator_result:update', 3, NOW(), NOW()),
('menu-mes-qc-indicator-result-delete', 'menu-mes-qc-indicator-result', '删除MES 检验结果记录', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator_result:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-indicator-result'),
('1', 'menu-mes-qc-indicator-result-query'),
('1', 'menu-mes-qc-indicator-result-create'),
('1', 'menu-mes-qc-indicator-result-update'),
('1', 'menu-mes-qc-indicator-result-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-indicator-result'),
('1', 'menu-mes-qc-indicator-result-query'),
('1', 'menu-mes-qc-indicator-result-create'),
('1', 'menu-mes-qc-indicator-result-update'),
('1', 'menu-mes-qc-indicator-result-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-indicator.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 质检指标 (MesQcIndicator)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-indicator',
  'mes-dir',
  'MES 质检指标管理',
  '/admin/mes/mes-qc-indicator',
  'mes/mes-qc-indicator/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_indicator:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-indicator-query',  'menu-mes-qc-indicator', '查询MES 质检指标', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator:query',  1, NOW(), NOW()),
('menu-mes-qc-indicator-create', 'menu-mes-qc-indicator', '新增MES 质检指标', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator:create', 2, NOW(), NOW()),
('menu-mes-qc-indicator-update', 'menu-mes-qc-indicator', '修改MES 质检指标', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator:update', 3, NOW(), NOW()),
('menu-mes-qc-indicator-delete', 'menu-mes-qc-indicator', '删除MES 质检指标', 'BUTTON', 'ACTIVE', 'mes:mes_qc_indicator:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-indicator'),
('1', 'menu-mes-qc-indicator-query'),
('1', 'menu-mes-qc-indicator-create'),
('1', 'menu-mes-qc-indicator-update'),
('1', 'menu-mes-qc-indicator-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-indicator'),
('1', 'menu-mes-qc-indicator-query'),
('1', 'menu-mes-qc-indicator-create'),
('1', 'menu-mes-qc-indicator-update'),
('1', 'menu-mes-qc-indicator-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-ipqc-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 过程检验单行 (MesQcIpqcLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-ipqc-line',
  'mes-dir',
  'MES 过程检验单行管理',
  '/admin/mes/mes-qc-ipqc-line',
  'mes/mes-qc-ipqc-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_ipqc_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-ipqc-line-query',  'menu-mes-qc-ipqc-line', '查询MES 过程检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_ipqc_line:query',  1, NOW(), NOW()),
('menu-mes-qc-ipqc-line-create', 'menu-mes-qc-ipqc-line', '新增MES 过程检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_ipqc_line:create', 2, NOW(), NOW()),
('menu-mes-qc-ipqc-line-update', 'menu-mes-qc-ipqc-line', '修改MES 过程检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_ipqc_line:update', 3, NOW(), NOW()),
('menu-mes-qc-ipqc-line-delete', 'menu-mes-qc-ipqc-line', '删除MES 过程检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_ipqc_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-ipqc-line'),
('1', 'menu-mes-qc-ipqc-line-query'),
('1', 'menu-mes-qc-ipqc-line-create'),
('1', 'menu-mes-qc-ipqc-line-update'),
('1', 'menu-mes-qc-ipqc-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-ipqc-line'),
('1', 'menu-mes-qc-ipqc-line-query'),
('1', 'menu-mes-qc-ipqc-line-create'),
('1', 'menu-mes-qc-ipqc-line-update'),
('1', 'menu-mes-qc-ipqc-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-ipqc.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 过程检验单（IPQC, In-Process Quality Contr (MesQcIpqc)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-ipqc',
  'mes-dir',
  'MES 过程检验单（IPQC, In-Process Quality Contr管理',
  '/admin/mes/mes-qc-ipqc',
  'mes/mes-qc-ipqc/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_ipqc:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-ipqc-query',  'menu-mes-qc-ipqc', '查询MES 过程检验单（IPQC, In-Process Quality Contr', 'BUTTON', 'ACTIVE', 'mes:mes_qc_ipqc:query',  1, NOW(), NOW()),
('menu-mes-qc-ipqc-create', 'menu-mes-qc-ipqc', '新增MES 过程检验单（IPQC, In-Process Quality Contr', 'BUTTON', 'ACTIVE', 'mes:mes_qc_ipqc:create', 2, NOW(), NOW()),
('menu-mes-qc-ipqc-update', 'menu-mes-qc-ipqc', '修改MES 过程检验单（IPQC, In-Process Quality Contr', 'BUTTON', 'ACTIVE', 'mes:mes_qc_ipqc:update', 3, NOW(), NOW()),
('menu-mes-qc-ipqc-delete', 'menu-mes-qc-ipqc', '删除MES 过程检验单（IPQC, In-Process Quality Contr', 'BUTTON', 'ACTIVE', 'mes:mes_qc_ipqc:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-ipqc'),
('1', 'menu-mes-qc-ipqc-query'),
('1', 'menu-mes-qc-ipqc-create'),
('1', 'menu-mes-qc-ipqc-update'),
('1', 'menu-mes-qc-ipqc-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-ipqc'),
('1', 'menu-mes-qc-ipqc-query'),
('1', 'menu-mes-qc-ipqc-create'),
('1', 'menu-mes-qc-ipqc-update'),
('1', 'menu-mes-qc-ipqc-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-iqc-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 来料检验单行 (MesQcIqcLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-iqc-line',
  'mes-dir',
  'MES 来料检验单行管理',
  '/admin/mes/mes-qc-iqc-line',
  'mes/mes-qc-iqc-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_iqc_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-iqc-line-query',  'menu-mes-qc-iqc-line', '查询MES 来料检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_iqc_line:query',  1, NOW(), NOW()),
('menu-mes-qc-iqc-line-create', 'menu-mes-qc-iqc-line', '新增MES 来料检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_iqc_line:create', 2, NOW(), NOW()),
('menu-mes-qc-iqc-line-update', 'menu-mes-qc-iqc-line', '修改MES 来料检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_iqc_line:update', 3, NOW(), NOW()),
('menu-mes-qc-iqc-line-delete', 'menu-mes-qc-iqc-line', '删除MES 来料检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_iqc_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-iqc-line'),
('1', 'menu-mes-qc-iqc-line-query'),
('1', 'menu-mes-qc-iqc-line-create'),
('1', 'menu-mes-qc-iqc-line-update'),
('1', 'menu-mes-qc-iqc-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-iqc-line'),
('1', 'menu-mes-qc-iqc-line-query'),
('1', 'menu-mes-qc-iqc-line-create'),
('1', 'menu-mes-qc-iqc-line-update'),
('1', 'menu-mes-qc-iqc-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-iqc.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 来料检验单（IQC, Incoming Quality Control） (MesQcIqc)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-iqc',
  'mes-dir',
  'MES 来料检验单（IQC, Incoming Quality Control）管理',
  '/admin/mes/mes-qc-iqc',
  'mes/mes-qc-iqc/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_iqc:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-iqc-query',  'menu-mes-qc-iqc', '查询MES 来料检验单（IQC, Incoming Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_iqc:query',  1, NOW(), NOW()),
('menu-mes-qc-iqc-create', 'menu-mes-qc-iqc', '新增MES 来料检验单（IQC, Incoming Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_iqc:create', 2, NOW(), NOW()),
('menu-mes-qc-iqc-update', 'menu-mes-qc-iqc', '修改MES 来料检验单（IQC, Incoming Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_iqc:update', 3, NOW(), NOW()),
('menu-mes-qc-iqc-delete', 'menu-mes-qc-iqc', '删除MES 来料检验单（IQC, Incoming Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_iqc:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-iqc'),
('1', 'menu-mes-qc-iqc-query'),
('1', 'menu-mes-qc-iqc-create'),
('1', 'menu-mes-qc-iqc-update'),
('1', 'menu-mes-qc-iqc-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-iqc'),
('1', 'menu-mes-qc-iqc-query'),
('1', 'menu-mes-qc-iqc-create'),
('1', 'menu-mes-qc-iqc-update'),
('1', 'menu-mes-qc-iqc-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-oqc-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 出货检验单行 (MesQcOqcLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-oqc-line',
  'mes-dir',
  'MES 出货检验单行管理',
  '/admin/mes/mes-qc-oqc-line',
  'mes/mes-qc-oqc-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_oqc_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-oqc-line-query',  'menu-mes-qc-oqc-line', '查询MES 出货检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_oqc_line:query',  1, NOW(), NOW()),
('menu-mes-qc-oqc-line-create', 'menu-mes-qc-oqc-line', '新增MES 出货检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_oqc_line:create', 2, NOW(), NOW()),
('menu-mes-qc-oqc-line-update', 'menu-mes-qc-oqc-line', '修改MES 出货检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_oqc_line:update', 3, NOW(), NOW()),
('menu-mes-qc-oqc-line-delete', 'menu-mes-qc-oqc-line', '删除MES 出货检验单行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_oqc_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-oqc-line'),
('1', 'menu-mes-qc-oqc-line-query'),
('1', 'menu-mes-qc-oqc-line-create'),
('1', 'menu-mes-qc-oqc-line-update'),
('1', 'menu-mes-qc-oqc-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-oqc-line'),
('1', 'menu-mes-qc-oqc-line-query'),
('1', 'menu-mes-qc-oqc-line-create'),
('1', 'menu-mes-qc-oqc-line-update'),
('1', 'menu-mes-qc-oqc-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-oqc.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 出货检验单（OQC, Outgoing Quality Control） (MesQcOqc)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-oqc',
  'mes-dir',
  'MES 出货检验单（OQC, Outgoing Quality Control）管理',
  '/admin/mes/mes-qc-oqc',
  'mes/mes-qc-oqc/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_oqc:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-oqc-query',  'menu-mes-qc-oqc', '查询MES 出货检验单（OQC, Outgoing Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_oqc:query',  1, NOW(), NOW()),
('menu-mes-qc-oqc-create', 'menu-mes-qc-oqc', '新增MES 出货检验单（OQC, Outgoing Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_oqc:create', 2, NOW(), NOW()),
('menu-mes-qc-oqc-update', 'menu-mes-qc-oqc', '修改MES 出货检验单（OQC, Outgoing Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_oqc:update', 3, NOW(), NOW()),
('menu-mes-qc-oqc-delete', 'menu-mes-qc-oqc', '删除MES 出货检验单（OQC, Outgoing Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_oqc:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-oqc'),
('1', 'menu-mes-qc-oqc-query'),
('1', 'menu-mes-qc-oqc-create'),
('1', 'menu-mes-qc-oqc-update'),
('1', 'menu-mes-qc-oqc-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-oqc'),
('1', 'menu-mes-qc-oqc-query'),
('1', 'menu-mes-qc-oqc-create'),
('1', 'menu-mes-qc-oqc-update'),
('1', 'menu-mes-qc-oqc-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-rqc-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 退货检验行 (MesQcRqcLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-rqc-line',
  'mes-dir',
  'MES 退货检验行管理',
  '/admin/mes/mes-qc-rqc-line',
  'mes/mes-qc-rqc-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_rqc_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-rqc-line-query',  'menu-mes-qc-rqc-line', '查询MES 退货检验行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_rqc_line:query',  1, NOW(), NOW()),
('menu-mes-qc-rqc-line-create', 'menu-mes-qc-rqc-line', '新增MES 退货检验行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_rqc_line:create', 2, NOW(), NOW()),
('menu-mes-qc-rqc-line-update', 'menu-mes-qc-rqc-line', '修改MES 退货检验行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_rqc_line:update', 3, NOW(), NOW()),
('menu-mes-qc-rqc-line-delete', 'menu-mes-qc-rqc-line', '删除MES 退货检验行', 'BUTTON', 'ACTIVE', 'mes:mes_qc_rqc_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-rqc-line'),
('1', 'menu-mes-qc-rqc-line-query'),
('1', 'menu-mes-qc-rqc-line-create'),
('1', 'menu-mes-qc-rqc-line-update'),
('1', 'menu-mes-qc-rqc-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-rqc-line'),
('1', 'menu-mes-qc-rqc-line-query'),
('1', 'menu-mes-qc-rqc-line-create'),
('1', 'menu-mes-qc-rqc-line-update'),
('1', 'menu-mes-qc-rqc-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-rqc.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 退货检验单（RQC, Return Quality Control） (MesQcRqc)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-rqc',
  'mes-dir',
  'MES 退货检验单（RQC, Return Quality Control）管理',
  '/admin/mes/mes-qc-rqc',
  'mes/mes-qc-rqc/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_rqc:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-rqc-query',  'menu-mes-qc-rqc', '查询MES 退货检验单（RQC, Return Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_rqc:query',  1, NOW(), NOW()),
('menu-mes-qc-rqc-create', 'menu-mes-qc-rqc', '新增MES 退货检验单（RQC, Return Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_rqc:create', 2, NOW(), NOW()),
('menu-mes-qc-rqc-update', 'menu-mes-qc-rqc', '修改MES 退货检验单（RQC, Return Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_rqc:update', 3, NOW(), NOW()),
('menu-mes-qc-rqc-delete', 'menu-mes-qc-rqc', '删除MES 退货检验单（RQC, Return Quality Control）', 'BUTTON', 'ACTIVE', 'mes:mes_qc_rqc:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-rqc'),
('1', 'menu-mes-qc-rqc-query'),
('1', 'menu-mes-qc-rqc-create'),
('1', 'menu-mes-qc-rqc-update'),
('1', 'menu-mes-qc-rqc-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-rqc'),
('1', 'menu-mes-qc-rqc-query'),
('1', 'menu-mes-qc-rqc-create'),
('1', 'menu-mes-qc-rqc-update'),
('1', 'menu-mes-qc-rqc-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-template-indicator.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 质检方案-检测指标项 (MesQcTemplateIndicator)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-template-indicator',
  'mes-dir',
  'MES 质检方案-检测指标项管理',
  '/admin/mes/mes-qc-template-indicator',
  'mes/mes-qc-template-indicator/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_template_indicator:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-template-indicator-query',  'menu-mes-qc-template-indicator', '查询MES 质检方案-检测指标项', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template_indicator:query',  1, NOW(), NOW()),
('menu-mes-qc-template-indicator-create', 'menu-mes-qc-template-indicator', '新增MES 质检方案-检测指标项', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template_indicator:create', 2, NOW(), NOW()),
('menu-mes-qc-template-indicator-update', 'menu-mes-qc-template-indicator', '修改MES 质检方案-检测指标项', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template_indicator:update', 3, NOW(), NOW()),
('menu-mes-qc-template-indicator-delete', 'menu-mes-qc-template-indicator', '删除MES 质检方案-检测指标项', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template_indicator:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-template-indicator'),
('1', 'menu-mes-qc-template-indicator-query'),
('1', 'menu-mes-qc-template-indicator-create'),
('1', 'menu-mes-qc-template-indicator-update'),
('1', 'menu-mes-qc-template-indicator-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-template-indicator'),
('1', 'menu-mes-qc-template-indicator-query'),
('1', 'menu-mes-qc-template-indicator-create'),
('1', 'menu-mes-qc-template-indicator-update'),
('1', 'menu-mes-qc-template-indicator-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-template-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 质检方案-产品关联 (MesQcTemplateItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-template-item',
  'mes-dir',
  'MES 质检方案-产品关联管理',
  '/admin/mes/mes-qc-template-item',
  'mes/mes-qc-template-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_template_item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-template-item-query',  'menu-mes-qc-template-item', '查询MES 质检方案-产品关联', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template_item:query',  1, NOW(), NOW()),
('menu-mes-qc-template-item-create', 'menu-mes-qc-template-item', '新增MES 质检方案-产品关联', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template_item:create', 2, NOW(), NOW()),
('menu-mes-qc-template-item-update', 'menu-mes-qc-template-item', '修改MES 质检方案-产品关联', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template_item:update', 3, NOW(), NOW()),
('menu-mes-qc-template-item-delete', 'menu-mes-qc-template-item', '删除MES 质检方案-产品关联', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template_item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-template-item'),
('1', 'menu-mes-qc-template-item-query'),
('1', 'menu-mes-qc-template-item-create'),
('1', 'menu-mes-qc-template-item-update'),
('1', 'menu-mes-qc-template-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-template-item'),
('1', 'menu-mes-qc-template-item-query'),
('1', 'menu-mes-qc-template-item-create'),
('1', 'menu-mes-qc-template-item-update'),
('1', 'menu-mes-qc-template-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-qc-template.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 质检方案 (MesQcTemplate)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-qc-template',
  'mes-dir',
  'MES 质检方案管理',
  '/admin/mes/mes-qc-template',
  'mes/mes-qc-template/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_qc_template:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-qc-template-query',  'menu-mes-qc-template', '查询MES 质检方案', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template:query',  1, NOW(), NOW()),
('menu-mes-qc-template-create', 'menu-mes-qc-template', '新增MES 质检方案', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template:create', 2, NOW(), NOW()),
('menu-mes-qc-template-update', 'menu-mes-qc-template', '修改MES 质检方案', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template:update', 3, NOW(), NOW()),
('menu-mes-qc-template-delete', 'menu-mes-qc-template', '删除MES 质检方案', 'BUTTON', 'ACTIVE', 'mes:mes_qc_template:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-template'),
('1', 'menu-mes-qc-template-query'),
('1', 'menu-mes-qc-template-create'),
('1', 'menu-mes-qc-template-update'),
('1', 'menu-mes-qc-template-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-qc-template'),
('1', 'menu-mes-qc-template-query'),
('1', 'menu-mes-qc-template-create'),
('1', 'menu-mes-qc-template-update'),
('1', 'menu-mes-qc-template-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-tm-tool-type.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 工具类型 (MesTmToolType)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-tm-tool-type',
  'mes-dir',
  'MES 工具类型管理',
  '/admin/mes/mes-tm-tool-type',
  'mes/mes-tm-tool-type/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_tm_tool_type:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-tm-tool-type-query',  'menu-mes-tm-tool-type', '查询MES 工具类型', 'BUTTON', 'ACTIVE', 'mes:mes_tm_tool_type:query',  1, NOW(), NOW()),
('menu-mes-tm-tool-type-create', 'menu-mes-tm-tool-type', '新增MES 工具类型', 'BUTTON', 'ACTIVE', 'mes:mes_tm_tool_type:create', 2, NOW(), NOW()),
('menu-mes-tm-tool-type-update', 'menu-mes-tm-tool-type', '修改MES 工具类型', 'BUTTON', 'ACTIVE', 'mes:mes_tm_tool_type:update', 3, NOW(), NOW()),
('menu-mes-tm-tool-type-delete', 'menu-mes-tm-tool-type', '删除MES 工具类型', 'BUTTON', 'ACTIVE', 'mes:mes_tm_tool_type:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-tm-tool-type'),
('1', 'menu-mes-tm-tool-type-query'),
('1', 'menu-mes-tm-tool-type-create'),
('1', 'menu-mes-tm-tool-type-update'),
('1', 'menu-mes-tm-tool-type-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-tm-tool-type'),
('1', 'menu-mes-tm-tool-type-query'),
('1', 'menu-mes-tm-tool-type-create'),
('1', 'menu-mes-tm-tool-type-update'),
('1', 'menu-mes-tm-tool-type-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-tm-tool.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 工具台账 (MesTmTool)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-tm-tool',
  'mes-dir',
  'MES 工具台账管理',
  '/admin/mes/mes-tm-tool',
  'mes/mes-tm-tool/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_tm_tool:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-tm-tool-query',  'menu-mes-tm-tool', '查询MES 工具台账', 'BUTTON', 'ACTIVE', 'mes:mes_tm_tool:query',  1, NOW(), NOW()),
('menu-mes-tm-tool-create', 'menu-mes-tm-tool', '新增MES 工具台账', 'BUTTON', 'ACTIVE', 'mes:mes_tm_tool:create', 2, NOW(), NOW()),
('menu-mes-tm-tool-update', 'menu-mes-tm-tool', '修改MES 工具台账', 'BUTTON', 'ACTIVE', 'mes:mes_tm_tool:update', 3, NOW(), NOW()),
('menu-mes-tm-tool-delete', 'menu-mes-tm-tool', '删除MES 工具台账', 'BUTTON', 'ACTIVE', 'mes:mes_tm_tool:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-tm-tool'),
('1', 'menu-mes-tm-tool-query'),
('1', 'menu-mes-tm-tool-create'),
('1', 'menu-mes-tm-tool-update'),
('1', 'menu-mes-tm-tool-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-tm-tool'),
('1', 'menu-mes-tm-tool-query'),
('1', 'menu-mes-tm-tool-create'),
('1', 'menu-mes-tm-tool-update'),
('1', 'menu-mes-tm-tool-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-arrival-notice-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 到货通知单行 (MesWmArrivalNoticeLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-arrival-notice-line',
  'mes-dir',
  'MES 到货通知单行管理',
  '/admin/mes/mes-wm-arrival-notice-line',
  'mes/mes-wm-arrival-notice-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_arrival_notice_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-arrival-notice-line-query',  'menu-mes-wm-arrival-notice-line', '查询MES 到货通知单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_arrival_notice_line:query',  1, NOW(), NOW()),
('menu-mes-wm-arrival-notice-line-create', 'menu-mes-wm-arrival-notice-line', '新增MES 到货通知单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_arrival_notice_line:create', 2, NOW(), NOW()),
('menu-mes-wm-arrival-notice-line-update', 'menu-mes-wm-arrival-notice-line', '修改MES 到货通知单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_arrival_notice_line:update', 3, NOW(), NOW()),
('menu-mes-wm-arrival-notice-line-delete', 'menu-mes-wm-arrival-notice-line', '删除MES 到货通知单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_arrival_notice_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-arrival-notice-line'),
('1', 'menu-mes-wm-arrival-notice-line-query'),
('1', 'menu-mes-wm-arrival-notice-line-create'),
('1', 'menu-mes-wm-arrival-notice-line-update'),
('1', 'menu-mes-wm-arrival-notice-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-arrival-notice-line'),
('1', 'menu-mes-wm-arrival-notice-line-query'),
('1', 'menu-mes-wm-arrival-notice-line-create'),
('1', 'menu-mes-wm-arrival-notice-line-update'),
('1', 'menu-mes-wm-arrival-notice-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-arrival-notice.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 到货通知单 (MesWmArrivalNotice)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-arrival-notice',
  'mes-dir',
  'MES 到货通知单管理',
  '/admin/mes/mes-wm-arrival-notice',
  'mes/mes-wm-arrival-notice/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_arrival_notice:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-arrival-notice-query',  'menu-mes-wm-arrival-notice', '查询MES 到货通知单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_arrival_notice:query',  1, NOW(), NOW()),
('menu-mes-wm-arrival-notice-create', 'menu-mes-wm-arrival-notice', '新增MES 到货通知单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_arrival_notice:create', 2, NOW(), NOW()),
('menu-mes-wm-arrival-notice-update', 'menu-mes-wm-arrival-notice', '修改MES 到货通知单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_arrival_notice:update', 3, NOW(), NOW()),
('menu-mes-wm-arrival-notice-delete', 'menu-mes-wm-arrival-notice', '删除MES 到货通知单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_arrival_notice:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-arrival-notice'),
('1', 'menu-mes-wm-arrival-notice-query'),
('1', 'menu-mes-wm-arrival-notice-create'),
('1', 'menu-mes-wm-arrival-notice-update'),
('1', 'menu-mes-wm-arrival-notice-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-arrival-notice'),
('1', 'menu-mes-wm-arrival-notice-query'),
('1', 'menu-mes-wm-arrival-notice-create'),
('1', 'menu-mes-wm-arrival-notice-update'),
('1', 'menu-mes-wm-arrival-notice-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-barcode-config.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 条码配置 (MesWmBarcodeConfig)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-barcode-config',
  'mes-dir',
  'MES 条码配置管理',
  '/admin/mes/mes-wm-barcode-config',
  'mes/mes-wm-barcode-config/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_barcode_config:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-barcode-config-query',  'menu-mes-wm-barcode-config', '查询MES 条码配置', 'BUTTON', 'ACTIVE', 'mes:mes_wm_barcode_config:query',  1, NOW(), NOW()),
('menu-mes-wm-barcode-config-create', 'menu-mes-wm-barcode-config', '新增MES 条码配置', 'BUTTON', 'ACTIVE', 'mes:mes_wm_barcode_config:create', 2, NOW(), NOW()),
('menu-mes-wm-barcode-config-update', 'menu-mes-wm-barcode-config', '修改MES 条码配置', 'BUTTON', 'ACTIVE', 'mes:mes_wm_barcode_config:update', 3, NOW(), NOW()),
('menu-mes-wm-barcode-config-delete', 'menu-mes-wm-barcode-config', '删除MES 条码配置', 'BUTTON', 'ACTIVE', 'mes:mes_wm_barcode_config:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-barcode-config'),
('1', 'menu-mes-wm-barcode-config-query'),
('1', 'menu-mes-wm-barcode-config-create'),
('1', 'menu-mes-wm-barcode-config-update'),
('1', 'menu-mes-wm-barcode-config-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-barcode-config'),
('1', 'menu-mes-wm-barcode-config-query'),
('1', 'menu-mes-wm-barcode-config-create'),
('1', 'menu-mes-wm-barcode-config-update'),
('1', 'menu-mes-wm-barcode-config-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-barcode.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 条码清单 (MesWmBarcode)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-barcode',
  'mes-dir',
  'MES 条码清单管理',
  '/admin/mes/mes-wm-barcode',
  'mes/mes-wm-barcode/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_barcode:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-barcode-query',  'menu-mes-wm-barcode', '查询MES 条码清单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_barcode:query',  1, NOW(), NOW()),
('menu-mes-wm-barcode-create', 'menu-mes-wm-barcode', '新增MES 条码清单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_barcode:create', 2, NOW(), NOW()),
('menu-mes-wm-barcode-update', 'menu-mes-wm-barcode', '修改MES 条码清单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_barcode:update', 3, NOW(), NOW()),
('menu-mes-wm-barcode-delete', 'menu-mes-wm-barcode', '删除MES 条码清单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_barcode:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-barcode'),
('1', 'menu-mes-wm-barcode-query'),
('1', 'menu-mes-wm-barcode-create'),
('1', 'menu-mes-wm-barcode-update'),
('1', 'menu-mes-wm-barcode-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-barcode'),
('1', 'menu-mes-wm-barcode-query'),
('1', 'menu-mes-wm-barcode-create'),
('1', 'menu-mes-wm-barcode-update'),
('1', 'menu-mes-wm-barcode-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-batch.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 批次管理 (MesWmBatch)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-batch',
  'mes-dir',
  '批次管理管理',
  '/admin/mes/mes-wm-batch',
  'mes/mes-wm-batch/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_batch:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-batch-query',  'menu-mes-wm-batch', '查询批次管理', 'BUTTON', 'ACTIVE', 'mes:mes_wm_batch:query',  1, NOW(), NOW()),
('menu-mes-wm-batch-create', 'menu-mes-wm-batch', '新增批次管理', 'BUTTON', 'ACTIVE', 'mes:mes_wm_batch:create', 2, NOW(), NOW()),
('menu-mes-wm-batch-update', 'menu-mes-wm-batch', '修改批次管理', 'BUTTON', 'ACTIVE', 'mes:mes_wm_batch:update', 3, NOW(), NOW()),
('menu-mes-wm-batch-delete', 'menu-mes-wm-batch', '删除批次管理', 'BUTTON', 'ACTIVE', 'mes:mes_wm_batch:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-batch'),
('1', 'menu-mes-wm-batch-query'),
('1', 'menu-mes-wm-batch-create'),
('1', 'menu-mes-wm-batch-update'),
('1', 'menu-mes-wm-batch-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-batch'),
('1', 'menu-mes-wm-batch-query'),
('1', 'menu-mes-wm-batch-create'),
('1', 'menu-mes-wm-batch-update'),
('1', 'menu-mes-wm-batch-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-item-consume-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配 (MesWmItemConsumeDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-item-consume-detail',
  'mes-dir',
  'MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配管理',
  '/admin/mes/mes-wm-item-consume-detail',
  'mes/mes-wm-item-consume-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_item_consume_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-item-consume-detail-query',  'menu-mes-wm-item-consume-detail', '查询MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-item-consume-detail-create', 'menu-mes-wm-item-consume-detail', '新增MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-item-consume-detail-update', 'menu-mes-wm-item-consume-detail', '修改MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-item-consume-detail-delete', 'menu-mes-wm-item-consume-detail', '删除MES 物料消耗记录明细 DO记录 line 级别的消耗按线边库 FIFO 分配', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-consume-detail'),
('1', 'menu-mes-wm-item-consume-detail-query'),
('1', 'menu-mes-wm-item-consume-detail-create'),
('1', 'menu-mes-wm-item-consume-detail-update'),
('1', 'menu-mes-wm-item-consume-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-consume-detail'),
('1', 'menu-mes-wm-item-consume-detail-query'),
('1', 'menu-mes-wm-item-consume-detail-create'),
('1', 'menu-mes-wm-item-consume-detail-update'),
('1', 'menu-mes-wm-item-consume-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-item-consume-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 物料消耗记录行 (MesWmItemConsumeLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-item-consume-line',
  'mes-dir',
  'MES 物料消耗记录行管理',
  '/admin/mes/mes-wm-item-consume-line',
  'mes/mes-wm-item-consume-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_item_consume_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-item-consume-line-query',  'menu-mes-wm-item-consume-line', '查询MES 物料消耗记录行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume_line:query',  1, NOW(), NOW()),
('menu-mes-wm-item-consume-line-create', 'menu-mes-wm-item-consume-line', '新增MES 物料消耗记录行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume_line:create', 2, NOW(), NOW()),
('menu-mes-wm-item-consume-line-update', 'menu-mes-wm-item-consume-line', '修改MES 物料消耗记录行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume_line:update', 3, NOW(), NOW()),
('menu-mes-wm-item-consume-line-delete', 'menu-mes-wm-item-consume-line', '删除MES 物料消耗记录行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-consume-line'),
('1', 'menu-mes-wm-item-consume-line-query'),
('1', 'menu-mes-wm-item-consume-line-create'),
('1', 'menu-mes-wm-item-consume-line-update'),
('1', 'menu-mes-wm-item-consume-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-consume-line'),
('1', 'menu-mes-wm-item-consume-line-query'),
('1', 'menu-mes-wm-item-consume-line-create'),
('1', 'menu-mes-wm-item-consume-line-update'),
('1', 'menu-mes-wm-item-consume-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-item-consume.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 物料消耗记录 (MesWmItemConsume)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-item-consume',
  'mes-dir',
  'MES 物料消耗记录管理',
  '/admin/mes/mes-wm-item-consume',
  'mes/mes-wm-item-consume/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_item_consume:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-item-consume-query',  'menu-mes-wm-item-consume', '查询MES 物料消耗记录', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume:query',  1, NOW(), NOW()),
('menu-mes-wm-item-consume-create', 'menu-mes-wm-item-consume', '新增MES 物料消耗记录', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume:create', 2, NOW(), NOW()),
('menu-mes-wm-item-consume-update', 'menu-mes-wm-item-consume', '修改MES 物料消耗记录', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume:update', 3, NOW(), NOW()),
('menu-mes-wm-item-consume-delete', 'menu-mes-wm-item-consume', '删除MES 物料消耗记录', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_consume:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-consume'),
('1', 'menu-mes-wm-item-consume-query'),
('1', 'menu-mes-wm-item-consume-create'),
('1', 'menu-mes-wm-item-consume-update'),
('1', 'menu-mes-wm-item-consume-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-consume'),
('1', 'menu-mes-wm-item-consume-query'),
('1', 'menu-mes-wm-item-consume-create'),
('1', 'menu-mes-wm-item-consume-update'),
('1', 'menu-mes-wm-item-consume-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-item-receipt-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 采购入库明细 (MesWmItemReceiptDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-item-receipt-detail',
  'mes-dir',
  'MES 采购入库明细管理',
  '/admin/mes/mes-wm-item-receipt-detail',
  'mes/mes-wm-item-receipt-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_item_receipt_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-item-receipt-detail-query',  'menu-mes-wm-item-receipt-detail', '查询MES 采购入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-item-receipt-detail-create', 'menu-mes-wm-item-receipt-detail', '新增MES 采购入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-item-receipt-detail-update', 'menu-mes-wm-item-receipt-detail', '修改MES 采购入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-item-receipt-detail-delete', 'menu-mes-wm-item-receipt-detail', '删除MES 采购入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-receipt-detail'),
('1', 'menu-mes-wm-item-receipt-detail-query'),
('1', 'menu-mes-wm-item-receipt-detail-create'),
('1', 'menu-mes-wm-item-receipt-detail-update'),
('1', 'menu-mes-wm-item-receipt-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-receipt-detail'),
('1', 'menu-mes-wm-item-receipt-detail-query'),
('1', 'menu-mes-wm-item-receipt-detail-create'),
('1', 'menu-mes-wm-item-receipt-detail-update'),
('1', 'menu-mes-wm-item-receipt-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-item-receipt-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 采购入库单行 (MesWmItemReceiptLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-item-receipt-line',
  'mes-dir',
  'MES 采购入库单行管理',
  '/admin/mes/mes-wm-item-receipt-line',
  'mes/mes-wm-item-receipt-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_item_receipt_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-item-receipt-line-query',  'menu-mes-wm-item-receipt-line', '查询MES 采购入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt_line:query',  1, NOW(), NOW()),
('menu-mes-wm-item-receipt-line-create', 'menu-mes-wm-item-receipt-line', '新增MES 采购入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt_line:create', 2, NOW(), NOW()),
('menu-mes-wm-item-receipt-line-update', 'menu-mes-wm-item-receipt-line', '修改MES 采购入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt_line:update', 3, NOW(), NOW()),
('menu-mes-wm-item-receipt-line-delete', 'menu-mes-wm-item-receipt-line', '删除MES 采购入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-receipt-line'),
('1', 'menu-mes-wm-item-receipt-line-query'),
('1', 'menu-mes-wm-item-receipt-line-create'),
('1', 'menu-mes-wm-item-receipt-line-update'),
('1', 'menu-mes-wm-item-receipt-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-receipt-line'),
('1', 'menu-mes-wm-item-receipt-line-query'),
('1', 'menu-mes-wm-item-receipt-line-create'),
('1', 'menu-mes-wm-item-receipt-line-update'),
('1', 'menu-mes-wm-item-receipt-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-item-receipt.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 采购入库单 (MesWmItemReceipt)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-item-receipt',
  'mes-dir',
  'MES 采购入库单管理',
  '/admin/mes/mes-wm-item-receipt',
  'mes/mes-wm-item-receipt/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_item_receipt:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-item-receipt-query',  'menu-mes-wm-item-receipt', '查询MES 采购入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt:query',  1, NOW(), NOW()),
('menu-mes-wm-item-receipt-create', 'menu-mes-wm-item-receipt', '新增MES 采购入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt:create', 2, NOW(), NOW()),
('menu-mes-wm-item-receipt-update', 'menu-mes-wm-item-receipt', '修改MES 采购入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt:update', 3, NOW(), NOW()),
('menu-mes-wm-item-receipt-delete', 'menu-mes-wm-item-receipt', '删除MES 采购入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_item_receipt:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-receipt'),
('1', 'menu-mes-wm-item-receipt-query'),
('1', 'menu-mes-wm-item-receipt-create'),
('1', 'menu-mes-wm-item-receipt-update'),
('1', 'menu-mes-wm-item-receipt-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-item-receipt'),
('1', 'menu-mes-wm-item-receipt-query'),
('1', 'menu-mes-wm-item-receipt-create'),
('1', 'menu-mes-wm-item-receipt-update'),
('1', 'menu-mes-wm-item-receipt-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-material-stock.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 库存台账（仓库现有量） (MesWmMaterialStock)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-material-stock',
  'mes-dir',
  'MES 库存台账（仓库现有量）管理',
  '/admin/mes/mes-wm-material-stock',
  'mes/mes-wm-material-stock/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_material_stock:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-material-stock-query',  'menu-mes-wm-material-stock', '查询MES 库存台账（仓库现有量）', 'BUTTON', 'ACTIVE', 'mes:mes_wm_material_stock:query',  1, NOW(), NOW()),
('menu-mes-wm-material-stock-create', 'menu-mes-wm-material-stock', '新增MES 库存台账（仓库现有量）', 'BUTTON', 'ACTIVE', 'mes:mes_wm_material_stock:create', 2, NOW(), NOW()),
('menu-mes-wm-material-stock-update', 'menu-mes-wm-material-stock', '修改MES 库存台账（仓库现有量）', 'BUTTON', 'ACTIVE', 'mes:mes_wm_material_stock:update', 3, NOW(), NOW()),
('menu-mes-wm-material-stock-delete', 'menu-mes-wm-material-stock', '删除MES 库存台账（仓库现有量）', 'BUTTON', 'ACTIVE', 'mes:mes_wm_material_stock:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-material-stock'),
('1', 'menu-mes-wm-material-stock-query'),
('1', 'menu-mes-wm-material-stock-create'),
('1', 'menu-mes-wm-material-stock-update'),
('1', 'menu-mes-wm-material-stock-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-material-stock'),
('1', 'menu-mes-wm-material-stock-query'),
('1', 'menu-mes-wm-material-stock-create'),
('1', 'menu-mes-wm-material-stock-update'),
('1', 'menu-mes-wm-material-stock-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-misc-issue-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 杂项出库明细 (MesWmMiscIssueDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-misc-issue-detail',
  'mes-dir',
  'MES 杂项出库明细管理',
  '/admin/mes/mes-wm-misc-issue-detail',
  'mes/mes-wm-misc-issue-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_misc_issue_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-misc-issue-detail-query',  'menu-mes-wm-misc-issue-detail', '查询MES 杂项出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-misc-issue-detail-create', 'menu-mes-wm-misc-issue-detail', '新增MES 杂项出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-misc-issue-detail-update', 'menu-mes-wm-misc-issue-detail', '修改MES 杂项出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-misc-issue-detail-delete', 'menu-mes-wm-misc-issue-detail', '删除MES 杂项出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-issue-detail'),
('1', 'menu-mes-wm-misc-issue-detail-query'),
('1', 'menu-mes-wm-misc-issue-detail-create'),
('1', 'menu-mes-wm-misc-issue-detail-update'),
('1', 'menu-mes-wm-misc-issue-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-issue-detail'),
('1', 'menu-mes-wm-misc-issue-detail-query'),
('1', 'menu-mes-wm-misc-issue-detail-create'),
('1', 'menu-mes-wm-misc-issue-detail-update'),
('1', 'menu-mes-wm-misc-issue-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-misc-issue-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 杂项出库单行 (MesWmMiscIssueLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-misc-issue-line',
  'mes-dir',
  'MES 杂项出库单行管理',
  '/admin/mes/mes-wm-misc-issue-line',
  'mes/mes-wm-misc-issue-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_misc_issue_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-misc-issue-line-query',  'menu-mes-wm-misc-issue-line', '查询MES 杂项出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue_line:query',  1, NOW(), NOW()),
('menu-mes-wm-misc-issue-line-create', 'menu-mes-wm-misc-issue-line', '新增MES 杂项出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue_line:create', 2, NOW(), NOW()),
('menu-mes-wm-misc-issue-line-update', 'menu-mes-wm-misc-issue-line', '修改MES 杂项出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue_line:update', 3, NOW(), NOW()),
('menu-mes-wm-misc-issue-line-delete', 'menu-mes-wm-misc-issue-line', '删除MES 杂项出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-issue-line'),
('1', 'menu-mes-wm-misc-issue-line-query'),
('1', 'menu-mes-wm-misc-issue-line-create'),
('1', 'menu-mes-wm-misc-issue-line-update'),
('1', 'menu-mes-wm-misc-issue-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-issue-line'),
('1', 'menu-mes-wm-misc-issue-line-query'),
('1', 'menu-mes-wm-misc-issue-line-create'),
('1', 'menu-mes-wm-misc-issue-line-update'),
('1', 'menu-mes-wm-misc-issue-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-misc-issue.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 杂项出库单 (MesWmMiscIssue)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-misc-issue',
  'mes-dir',
  'MES 杂项出库单管理',
  '/admin/mes/mes-wm-misc-issue',
  'mes/mes-wm-misc-issue/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_misc_issue:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-misc-issue-query',  'menu-mes-wm-misc-issue', '查询MES 杂项出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue:query',  1, NOW(), NOW()),
('menu-mes-wm-misc-issue-create', 'menu-mes-wm-misc-issue', '新增MES 杂项出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue:create', 2, NOW(), NOW()),
('menu-mes-wm-misc-issue-update', 'menu-mes-wm-misc-issue', '修改MES 杂项出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue:update', 3, NOW(), NOW()),
('menu-mes-wm-misc-issue-delete', 'menu-mes-wm-misc-issue', '删除MES 杂项出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_issue:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-issue'),
('1', 'menu-mes-wm-misc-issue-query'),
('1', 'menu-mes-wm-misc-issue-create'),
('1', 'menu-mes-wm-misc-issue-update'),
('1', 'menu-mes-wm-misc-issue-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-issue'),
('1', 'menu-mes-wm-misc-issue-query'),
('1', 'menu-mes-wm-misc-issue-create'),
('1', 'menu-mes-wm-misc-issue-update'),
('1', 'menu-mes-wm-misc-issue-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-misc-receipt-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 杂项入库明细 (MesWmMiscReceiptDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-misc-receipt-detail',
  'mes-dir',
  'MES 杂项入库明细管理',
  '/admin/mes/mes-wm-misc-receipt-detail',
  'mes/mes-wm-misc-receipt-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_misc_receipt_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-misc-receipt-detail-query',  'menu-mes-wm-misc-receipt-detail', '查询MES 杂项入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-misc-receipt-detail-create', 'menu-mes-wm-misc-receipt-detail', '新增MES 杂项入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-misc-receipt-detail-update', 'menu-mes-wm-misc-receipt-detail', '修改MES 杂项入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-misc-receipt-detail-delete', 'menu-mes-wm-misc-receipt-detail', '删除MES 杂项入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-receipt-detail'),
('1', 'menu-mes-wm-misc-receipt-detail-query'),
('1', 'menu-mes-wm-misc-receipt-detail-create'),
('1', 'menu-mes-wm-misc-receipt-detail-update'),
('1', 'menu-mes-wm-misc-receipt-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-receipt-detail'),
('1', 'menu-mes-wm-misc-receipt-detail-query'),
('1', 'menu-mes-wm-misc-receipt-detail-create'),
('1', 'menu-mes-wm-misc-receipt-detail-update'),
('1', 'menu-mes-wm-misc-receipt-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-misc-receipt-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 杂项入库单行 (MesWmMiscReceiptLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-misc-receipt-line',
  'mes-dir',
  'MES 杂项入库单行管理',
  '/admin/mes/mes-wm-misc-receipt-line',
  'mes/mes-wm-misc-receipt-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_misc_receipt_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-misc-receipt-line-query',  'menu-mes-wm-misc-receipt-line', '查询MES 杂项入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt_line:query',  1, NOW(), NOW()),
('menu-mes-wm-misc-receipt-line-create', 'menu-mes-wm-misc-receipt-line', '新增MES 杂项入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt_line:create', 2, NOW(), NOW()),
('menu-mes-wm-misc-receipt-line-update', 'menu-mes-wm-misc-receipt-line', '修改MES 杂项入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt_line:update', 3, NOW(), NOW()),
('menu-mes-wm-misc-receipt-line-delete', 'menu-mes-wm-misc-receipt-line', '删除MES 杂项入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-receipt-line'),
('1', 'menu-mes-wm-misc-receipt-line-query'),
('1', 'menu-mes-wm-misc-receipt-line-create'),
('1', 'menu-mes-wm-misc-receipt-line-update'),
('1', 'menu-mes-wm-misc-receipt-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-receipt-line'),
('1', 'menu-mes-wm-misc-receipt-line-query'),
('1', 'menu-mes-wm-misc-receipt-line-create'),
('1', 'menu-mes-wm-misc-receipt-line-update'),
('1', 'menu-mes-wm-misc-receipt-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-misc-receipt.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 杂项入库单 (MesWmMiscReceipt)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-misc-receipt',
  'mes-dir',
  'MES 杂项入库单管理',
  '/admin/mes/mes-wm-misc-receipt',
  'mes/mes-wm-misc-receipt/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_misc_receipt:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-misc-receipt-query',  'menu-mes-wm-misc-receipt', '查询MES 杂项入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt:query',  1, NOW(), NOW()),
('menu-mes-wm-misc-receipt-create', 'menu-mes-wm-misc-receipt', '新增MES 杂项入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt:create', 2, NOW(), NOW()),
('menu-mes-wm-misc-receipt-update', 'menu-mes-wm-misc-receipt', '修改MES 杂项入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt:update', 3, NOW(), NOW()),
('menu-mes-wm-misc-receipt-delete', 'menu-mes-wm-misc-receipt', '删除MES 杂项入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_misc_receipt:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-receipt'),
('1', 'menu-mes-wm-misc-receipt-query'),
('1', 'menu-mes-wm-misc-receipt-create'),
('1', 'menu-mes-wm-misc-receipt-update'),
('1', 'menu-mes-wm-misc-receipt-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-misc-receipt'),
('1', 'menu-mes-wm-misc-receipt-query'),
('1', 'menu-mes-wm-misc-receipt-create'),
('1', 'menu-mes-wm-misc-receipt-update'),
('1', 'menu-mes-wm-misc-receipt-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-outsource-issue-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 外协发料单明细 (MesWmOutsourceIssueDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-outsource-issue-detail',
  'mes-dir',
  'MES 外协发料单明细管理',
  '/admin/mes/mes-wm-outsource-issue-detail',
  'mes/mes-wm-outsource-issue-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_outsource_issue_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-outsource-issue-detail-query',  'menu-mes-wm-outsource-issue-detail', '查询MES 外协发料单明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-outsource-issue-detail-create', 'menu-mes-wm-outsource-issue-detail', '新增MES 外协发料单明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-outsource-issue-detail-update', 'menu-mes-wm-outsource-issue-detail', '修改MES 外协发料单明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-outsource-issue-detail-delete', 'menu-mes-wm-outsource-issue-detail', '删除MES 外协发料单明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-issue-detail'),
('1', 'menu-mes-wm-outsource-issue-detail-query'),
('1', 'menu-mes-wm-outsource-issue-detail-create'),
('1', 'menu-mes-wm-outsource-issue-detail-update'),
('1', 'menu-mes-wm-outsource-issue-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-issue-detail'),
('1', 'menu-mes-wm-outsource-issue-detail-query'),
('1', 'menu-mes-wm-outsource-issue-detail-create'),
('1', 'menu-mes-wm-outsource-issue-detail-update'),
('1', 'menu-mes-wm-outsource-issue-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-outsource-issue-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 外协发料单行 (MesWmOutsourceIssueLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-outsource-issue-line',
  'mes-dir',
  'MES 外协发料单行管理',
  '/admin/mes/mes-wm-outsource-issue-line',
  'mes/mes-wm-outsource-issue-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_outsource_issue_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-outsource-issue-line-query',  'menu-mes-wm-outsource-issue-line', '查询MES 外协发料单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue_line:query',  1, NOW(), NOW()),
('menu-mes-wm-outsource-issue-line-create', 'menu-mes-wm-outsource-issue-line', '新增MES 外协发料单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue_line:create', 2, NOW(), NOW()),
('menu-mes-wm-outsource-issue-line-update', 'menu-mes-wm-outsource-issue-line', '修改MES 外协发料单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue_line:update', 3, NOW(), NOW()),
('menu-mes-wm-outsource-issue-line-delete', 'menu-mes-wm-outsource-issue-line', '删除MES 外协发料单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-issue-line'),
('1', 'menu-mes-wm-outsource-issue-line-query'),
('1', 'menu-mes-wm-outsource-issue-line-create'),
('1', 'menu-mes-wm-outsource-issue-line-update'),
('1', 'menu-mes-wm-outsource-issue-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-issue-line'),
('1', 'menu-mes-wm-outsource-issue-line-query'),
('1', 'menu-mes-wm-outsource-issue-line-create'),
('1', 'menu-mes-wm-outsource-issue-line-update'),
('1', 'menu-mes-wm-outsource-issue-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-outsource-issue.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 外协发料单 (MesWmOutsourceIssue)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-outsource-issue',
  'mes-dir',
  'MES 外协发料单管理',
  '/admin/mes/mes-wm-outsource-issue',
  'mes/mes-wm-outsource-issue/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_outsource_issue:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-outsource-issue-query',  'menu-mes-wm-outsource-issue', '查询MES 外协发料单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue:query',  1, NOW(), NOW()),
('menu-mes-wm-outsource-issue-create', 'menu-mes-wm-outsource-issue', '新增MES 外协发料单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue:create', 2, NOW(), NOW()),
('menu-mes-wm-outsource-issue-update', 'menu-mes-wm-outsource-issue', '修改MES 外协发料单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue:update', 3, NOW(), NOW()),
('menu-mes-wm-outsource-issue-delete', 'menu-mes-wm-outsource-issue', '删除MES 外协发料单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_issue:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-issue'),
('1', 'menu-mes-wm-outsource-issue-query'),
('1', 'menu-mes-wm-outsource-issue-create'),
('1', 'menu-mes-wm-outsource-issue-update'),
('1', 'menu-mes-wm-outsource-issue-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-issue'),
('1', 'menu-mes-wm-outsource-issue-query'),
('1', 'menu-mes-wm-outsource-issue-create'),
('1', 'menu-mes-wm-outsource-issue-update'),
('1', 'menu-mes-wm-outsource-issue-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-outsource-receipt-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 外协入库明细 (MesWmOutsourceReceiptDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-outsource-receipt-detail',
  'mes-dir',
  'MES 外协入库明细管理',
  '/admin/mes/mes-wm-outsource-receipt-detail',
  'mes/mes-wm-outsource-receipt-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_outsource_receipt_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-outsource-receipt-detail-query',  'menu-mes-wm-outsource-receipt-detail', '查询MES 外协入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-detail-create', 'menu-mes-wm-outsource-receipt-detail', '新增MES 外协入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-detail-update', 'menu-mes-wm-outsource-receipt-detail', '修改MES 外协入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-detail-delete', 'menu-mes-wm-outsource-receipt-detail', '删除MES 外协入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-receipt-detail'),
('1', 'menu-mes-wm-outsource-receipt-detail-query'),
('1', 'menu-mes-wm-outsource-receipt-detail-create'),
('1', 'menu-mes-wm-outsource-receipt-detail-update'),
('1', 'menu-mes-wm-outsource-receipt-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-receipt-detail'),
('1', 'menu-mes-wm-outsource-receipt-detail-query'),
('1', 'menu-mes-wm-outsource-receipt-detail-create'),
('1', 'menu-mes-wm-outsource-receipt-detail-update'),
('1', 'menu-mes-wm-outsource-receipt-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-outsource-receipt-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 外协入库单行 (MesWmOutsourceReceiptLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-outsource-receipt-line',
  'mes-dir',
  'MES 外协入库单行管理',
  '/admin/mes/mes-wm-outsource-receipt-line',
  'mes/mes-wm-outsource-receipt-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_outsource_receipt_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-outsource-receipt-line-query',  'menu-mes-wm-outsource-receipt-line', '查询MES 外协入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt_line:query',  1, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-line-create', 'menu-mes-wm-outsource-receipt-line', '新增MES 外协入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt_line:create', 2, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-line-update', 'menu-mes-wm-outsource-receipt-line', '修改MES 外协入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt_line:update', 3, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-line-delete', 'menu-mes-wm-outsource-receipt-line', '删除MES 外协入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-receipt-line'),
('1', 'menu-mes-wm-outsource-receipt-line-query'),
('1', 'menu-mes-wm-outsource-receipt-line-create'),
('1', 'menu-mes-wm-outsource-receipt-line-update'),
('1', 'menu-mes-wm-outsource-receipt-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-receipt-line'),
('1', 'menu-mes-wm-outsource-receipt-line-query'),
('1', 'menu-mes-wm-outsource-receipt-line-create'),
('1', 'menu-mes-wm-outsource-receipt-line-update'),
('1', 'menu-mes-wm-outsource-receipt-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-outsource-receipt.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 外协入库单 (MesWmOutsourceReceipt)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-outsource-receipt',
  'mes-dir',
  'MES 外协入库单管理',
  '/admin/mes/mes-wm-outsource-receipt',
  'mes/mes-wm-outsource-receipt/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_outsource_receipt:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-outsource-receipt-query',  'menu-mes-wm-outsource-receipt', '查询MES 外协入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt:query',  1, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-create', 'menu-mes-wm-outsource-receipt', '新增MES 外协入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt:create', 2, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-update', 'menu-mes-wm-outsource-receipt', '修改MES 外协入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt:update', 3, NOW(), NOW()),
('menu-mes-wm-outsource-receipt-delete', 'menu-mes-wm-outsource-receipt', '删除MES 外协入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_outsource_receipt:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-receipt'),
('1', 'menu-mes-wm-outsource-receipt-query'),
('1', 'menu-mes-wm-outsource-receipt-create'),
('1', 'menu-mes-wm-outsource-receipt-update'),
('1', 'menu-mes-wm-outsource-receipt-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-outsource-receipt'),
('1', 'menu-mes-wm-outsource-receipt-query'),
('1', 'menu-mes-wm-outsource-receipt-create'),
('1', 'menu-mes-wm-outsource-receipt-update'),
('1', 'menu-mes-wm-outsource-receipt-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-package-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 装箱明细 (MesWmPackageLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-package-line',
  'mes-dir',
  'MES 装箱明细管理',
  '/admin/mes/mes-wm-package-line',
  'mes/mes-wm-package-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_package_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-package-line-query',  'menu-mes-wm-package-line', '查询MES 装箱明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_package_line:query',  1, NOW(), NOW()),
('menu-mes-wm-package-line-create', 'menu-mes-wm-package-line', '新增MES 装箱明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_package_line:create', 2, NOW(), NOW()),
('menu-mes-wm-package-line-update', 'menu-mes-wm-package-line', '修改MES 装箱明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_package_line:update', 3, NOW(), NOW()),
('menu-mes-wm-package-line-delete', 'menu-mes-wm-package-line', '删除MES 装箱明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_package_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-package-line'),
('1', 'menu-mes-wm-package-line-query'),
('1', 'menu-mes-wm-package-line-create'),
('1', 'menu-mes-wm-package-line-update'),
('1', 'menu-mes-wm-package-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-package-line'),
('1', 'menu-mes-wm-package-line-query'),
('1', 'menu-mes-wm-package-line-create'),
('1', 'menu-mes-wm-package-line-update'),
('1', 'menu-mes-wm-package-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-package.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 装箱单 (MesWmPackage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-package',
  'mes-dir',
  'MES 装箱单管理',
  '/admin/mes/mes-wm-package',
  'mes/mes-wm-package/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_package:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-package-query',  'menu-mes-wm-package', '查询MES 装箱单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_package:query',  1, NOW(), NOW()),
('menu-mes-wm-package-create', 'menu-mes-wm-package', '新增MES 装箱单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_package:create', 2, NOW(), NOW()),
('menu-mes-wm-package-update', 'menu-mes-wm-package', '修改MES 装箱单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_package:update', 3, NOW(), NOW()),
('menu-mes-wm-package-delete', 'menu-mes-wm-package', '删除MES 装箱单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_package:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-package'),
('1', 'menu-mes-wm-package-query'),
('1', 'menu-mes-wm-package-create'),
('1', 'menu-mes-wm-package-update'),
('1', 'menu-mes-wm-package-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-package'),
('1', 'menu-mes-wm-package-query'),
('1', 'menu-mes-wm-package-create'),
('1', 'menu-mes-wm-package-update'),
('1', 'menu-mes-wm-package-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-issue-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 领料出库明细 (MesWmProductIssueDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-issue-detail',
  'mes-dir',
  'MES 领料出库明细管理',
  '/admin/mes/mes-wm-product-issue-detail',
  'mes/mes-wm-product-issue-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_issue_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-issue-detail-query',  'menu-mes-wm-product-issue-detail', '查询MES 领料出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-product-issue-detail-create', 'menu-mes-wm-product-issue-detail', '新增MES 领料出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-product-issue-detail-update', 'menu-mes-wm-product-issue-detail', '修改MES 领料出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-product-issue-detail-delete', 'menu-mes-wm-product-issue-detail', '删除MES 领料出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-issue-detail'),
('1', 'menu-mes-wm-product-issue-detail-query'),
('1', 'menu-mes-wm-product-issue-detail-create'),
('1', 'menu-mes-wm-product-issue-detail-update'),
('1', 'menu-mes-wm-product-issue-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-issue-detail'),
('1', 'menu-mes-wm-product-issue-detail-query'),
('1', 'menu-mes-wm-product-issue-detail-create'),
('1', 'menu-mes-wm-product-issue-detail-update'),
('1', 'menu-mes-wm-product-issue-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-issue-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 领料出库单行 (MesWmProductIssueLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-issue-line',
  'mes-dir',
  'MES 领料出库单行管理',
  '/admin/mes/mes-wm-product-issue-line',
  'mes/mes-wm-product-issue-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_issue_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-issue-line-query',  'menu-mes-wm-product-issue-line', '查询MES 领料出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue_line:query',  1, NOW(), NOW()),
('menu-mes-wm-product-issue-line-create', 'menu-mes-wm-product-issue-line', '新增MES 领料出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue_line:create', 2, NOW(), NOW()),
('menu-mes-wm-product-issue-line-update', 'menu-mes-wm-product-issue-line', '修改MES 领料出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue_line:update', 3, NOW(), NOW()),
('menu-mes-wm-product-issue-line-delete', 'menu-mes-wm-product-issue-line', '删除MES 领料出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-issue-line'),
('1', 'menu-mes-wm-product-issue-line-query'),
('1', 'menu-mes-wm-product-issue-line-create'),
('1', 'menu-mes-wm-product-issue-line-update'),
('1', 'menu-mes-wm-product-issue-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-issue-line'),
('1', 'menu-mes-wm-product-issue-line-query'),
('1', 'menu-mes-wm-product-issue-line-create'),
('1', 'menu-mes-wm-product-issue-line-update'),
('1', 'menu-mes-wm-product-issue-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-issue.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 领料出库单 (MesWmProductIssue)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-issue',
  'mes-dir',
  'MES 领料出库单管理',
  '/admin/mes/mes-wm-product-issue',
  'mes/mes-wm-product-issue/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_issue:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-issue-query',  'menu-mes-wm-product-issue', '查询MES 领料出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue:query',  1, NOW(), NOW()),
('menu-mes-wm-product-issue-create', 'menu-mes-wm-product-issue', '新增MES 领料出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue:create', 2, NOW(), NOW()),
('menu-mes-wm-product-issue-update', 'menu-mes-wm-product-issue', '修改MES 领料出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue:update', 3, NOW(), NOW()),
('menu-mes-wm-product-issue-delete', 'menu-mes-wm-product-issue', '删除MES 领料出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_issue:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-issue'),
('1', 'menu-mes-wm-product-issue-query'),
('1', 'menu-mes-wm-product-issue-create'),
('1', 'menu-mes-wm-product-issue-update'),
('1', 'menu-mes-wm-product-issue-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-issue'),
('1', 'menu-mes-wm-product-issue-query'),
('1', 'menu-mes-wm-product-issue-create'),
('1', 'menu-mes-wm-product-issue-update'),
('1', 'menu-mes-wm-product-issue-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-produce-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产入库明细 (MesWmProductProduceDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-produce-detail',
  'mes-dir',
  'MES 生产入库明细管理',
  '/admin/mes/mes-wm-product-produce-detail',
  'mes/mes-wm-product-produce-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_produce_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-produce-detail-query',  'menu-mes-wm-product-produce-detail', '查询MES 生产入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-product-produce-detail-create', 'menu-mes-wm-product-produce-detail', '新增MES 生产入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-product-produce-detail-update', 'menu-mes-wm-product-produce-detail', '修改MES 生产入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-product-produce-detail-delete', 'menu-mes-wm-product-produce-detail', '删除MES 生产入库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-produce-detail'),
('1', 'menu-mes-wm-product-produce-detail-query'),
('1', 'menu-mes-wm-product-produce-detail-create'),
('1', 'menu-mes-wm-product-produce-detail-update'),
('1', 'menu-mes-wm-product-produce-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-produce-detail'),
('1', 'menu-mes-wm-product-produce-detail-query'),
('1', 'menu-mes-wm-product-produce-detail-create'),
('1', 'menu-mes-wm-product-produce-detail-update'),
('1', 'menu-mes-wm-product-produce-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-produce-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产入库单行 (MesWmProductProduceLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-produce-line',
  'mes-dir',
  'MES 生产入库单行管理',
  '/admin/mes/mes-wm-product-produce-line',
  'mes/mes-wm-product-produce-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_produce_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-produce-line-query',  'menu-mes-wm-product-produce-line', '查询MES 生产入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce_line:query',  1, NOW(), NOW()),
('menu-mes-wm-product-produce-line-create', 'menu-mes-wm-product-produce-line', '新增MES 生产入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce_line:create', 2, NOW(), NOW()),
('menu-mes-wm-product-produce-line-update', 'menu-mes-wm-product-produce-line', '修改MES 生产入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce_line:update', 3, NOW(), NOW()),
('menu-mes-wm-product-produce-line-delete', 'menu-mes-wm-product-produce-line', '删除MES 生产入库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-produce-line'),
('1', 'menu-mes-wm-product-produce-line-query'),
('1', 'menu-mes-wm-product-produce-line-create'),
('1', 'menu-mes-wm-product-produce-line-update'),
('1', 'menu-mes-wm-product-produce-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-produce-line'),
('1', 'menu-mes-wm-product-produce-line-query'),
('1', 'menu-mes-wm-product-produce-line-create'),
('1', 'menu-mes-wm-product-produce-line-update'),
('1', 'menu-mes-wm-product-produce-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-produce.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产入库单 (MesWmProductProduce)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-produce',
  'mes-dir',
  'MES 生产入库单管理',
  '/admin/mes/mes-wm-product-produce',
  'mes/mes-wm-product-produce/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_produce:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-produce-query',  'menu-mes-wm-product-produce', '查询MES 生产入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce:query',  1, NOW(), NOW()),
('menu-mes-wm-product-produce-create', 'menu-mes-wm-product-produce', '新增MES 生产入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce:create', 2, NOW(), NOW()),
('menu-mes-wm-product-produce-update', 'menu-mes-wm-product-produce', '修改MES 生产入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce:update', 3, NOW(), NOW()),
('menu-mes-wm-product-produce-delete', 'menu-mes-wm-product-produce', '删除MES 生产入库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_produce:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-produce'),
('1', 'menu-mes-wm-product-produce-query'),
('1', 'menu-mes-wm-product-produce-create'),
('1', 'menu-mes-wm-product-produce-update'),
('1', 'menu-mes-wm-product-produce-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-produce'),
('1', 'menu-mes-wm-product-produce-query'),
('1', 'menu-mes-wm-product-produce-create'),
('1', 'menu-mes-wm-product-produce-update'),
('1', 'menu-mes-wm-product-produce-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-receipt-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 产品收货（入库）单明细 (MesWmProductReceiptDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-receipt-detail',
  'mes-dir',
  'MES 产品收货（入库）单明细管理',
  '/admin/mes/mes-wm-product-receipt-detail',
  'mes/mes-wm-product-receipt-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_receipt_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-receipt-detail-query',  'menu-mes-wm-product-receipt-detail', '查询MES 产品收货（入库）单明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-product-receipt-detail-create', 'menu-mes-wm-product-receipt-detail', '新增MES 产品收货（入库）单明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-product-receipt-detail-update', 'menu-mes-wm-product-receipt-detail', '修改MES 产品收货（入库）单明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-product-receipt-detail-delete', 'menu-mes-wm-product-receipt-detail', '删除MES 产品收货（入库）单明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-receipt-detail'),
('1', 'menu-mes-wm-product-receipt-detail-query'),
('1', 'menu-mes-wm-product-receipt-detail-create'),
('1', 'menu-mes-wm-product-receipt-detail-update'),
('1', 'menu-mes-wm-product-receipt-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-receipt-detail'),
('1', 'menu-mes-wm-product-receipt-detail-query'),
('1', 'menu-mes-wm-product-receipt-detail-create'),
('1', 'menu-mes-wm-product-receipt-detail-update'),
('1', 'menu-mes-wm-product-receipt-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-receipt-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 产品收货（入库）单行 (MesWmProductReceiptLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-receipt-line',
  'mes-dir',
  'MES 产品收货（入库）单行管理',
  '/admin/mes/mes-wm-product-receipt-line',
  'mes/mes-wm-product-receipt-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_receipt_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-receipt-line-query',  'menu-mes-wm-product-receipt-line', '查询MES 产品收货（入库）单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt_line:query',  1, NOW(), NOW()),
('menu-mes-wm-product-receipt-line-create', 'menu-mes-wm-product-receipt-line', '新增MES 产品收货（入库）单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt_line:create', 2, NOW(), NOW()),
('menu-mes-wm-product-receipt-line-update', 'menu-mes-wm-product-receipt-line', '修改MES 产品收货（入库）单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt_line:update', 3, NOW(), NOW()),
('menu-mes-wm-product-receipt-line-delete', 'menu-mes-wm-product-receipt-line', '删除MES 产品收货（入库）单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-receipt-line'),
('1', 'menu-mes-wm-product-receipt-line-query'),
('1', 'menu-mes-wm-product-receipt-line-create'),
('1', 'menu-mes-wm-product-receipt-line-update'),
('1', 'menu-mes-wm-product-receipt-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-receipt-line'),
('1', 'menu-mes-wm-product-receipt-line-query'),
('1', 'menu-mes-wm-product-receipt-line-create'),
('1', 'menu-mes-wm-product-receipt-line-update'),
('1', 'menu-mes-wm-product-receipt-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-receipt.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 产品收货（入库）单 (MesWmProductReceipt)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-receipt',
  'mes-dir',
  'MES 产品收货（入库）单管理',
  '/admin/mes/mes-wm-product-receipt',
  'mes/mes-wm-product-receipt/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_receipt:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-receipt-query',  'menu-mes-wm-product-receipt', '查询MES 产品收货（入库）单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt:query',  1, NOW(), NOW()),
('menu-mes-wm-product-receipt-create', 'menu-mes-wm-product-receipt', '新增MES 产品收货（入库）单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt:create', 2, NOW(), NOW()),
('menu-mes-wm-product-receipt-update', 'menu-mes-wm-product-receipt', '修改MES 产品收货（入库）单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt:update', 3, NOW(), NOW()),
('menu-mes-wm-product-receipt-delete', 'menu-mes-wm-product-receipt', '删除MES 产品收货（入库）单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_receipt:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-receipt'),
('1', 'menu-mes-wm-product-receipt-query'),
('1', 'menu-mes-wm-product-receipt-create'),
('1', 'menu-mes-wm-product-receipt-update'),
('1', 'menu-mes-wm-product-receipt-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-receipt'),
('1', 'menu-mes-wm-product-receipt-query'),
('1', 'menu-mes-wm-product-receipt-create'),
('1', 'menu-mes-wm-product-receipt-update'),
('1', 'menu-mes-wm-product-receipt-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-sales-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 销售出库明细 (MesWmProductSalesDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-sales-detail',
  'mes-dir',
  'MES 销售出库明细管理',
  '/admin/mes/mes-wm-product-sales-detail',
  'mes/mes-wm-product-sales-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_sales_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-sales-detail-query',  'menu-mes-wm-product-sales-detail', '查询MES 销售出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-product-sales-detail-create', 'menu-mes-wm-product-sales-detail', '新增MES 销售出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-product-sales-detail-update', 'menu-mes-wm-product-sales-detail', '修改MES 销售出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-product-sales-detail-delete', 'menu-mes-wm-product-sales-detail', '删除MES 销售出库明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-sales-detail'),
('1', 'menu-mes-wm-product-sales-detail-query'),
('1', 'menu-mes-wm-product-sales-detail-create'),
('1', 'menu-mes-wm-product-sales-detail-update'),
('1', 'menu-mes-wm-product-sales-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-sales-detail'),
('1', 'menu-mes-wm-product-sales-detail-query'),
('1', 'menu-mes-wm-product-sales-detail-create'),
('1', 'menu-mes-wm-product-sales-detail-update'),
('1', 'menu-mes-wm-product-sales-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-sales-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 销售出库单行 (MesWmProductSalesLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-sales-line',
  'mes-dir',
  'MES 销售出库单行管理',
  '/admin/mes/mes-wm-product-sales-line',
  'mes/mes-wm-product-sales-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_sales_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-sales-line-query',  'menu-mes-wm-product-sales-line', '查询MES 销售出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales_line:query',  1, NOW(), NOW()),
('menu-mes-wm-product-sales-line-create', 'menu-mes-wm-product-sales-line', '新增MES 销售出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales_line:create', 2, NOW(), NOW()),
('menu-mes-wm-product-sales-line-update', 'menu-mes-wm-product-sales-line', '修改MES 销售出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales_line:update', 3, NOW(), NOW()),
('menu-mes-wm-product-sales-line-delete', 'menu-mes-wm-product-sales-line', '删除MES 销售出库单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-sales-line'),
('1', 'menu-mes-wm-product-sales-line-query'),
('1', 'menu-mes-wm-product-sales-line-create'),
('1', 'menu-mes-wm-product-sales-line-update'),
('1', 'menu-mes-wm-product-sales-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-sales-line'),
('1', 'menu-mes-wm-product-sales-line-query'),
('1', 'menu-mes-wm-product-sales-line-create'),
('1', 'menu-mes-wm-product-sales-line-update'),
('1', 'menu-mes-wm-product-sales-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-product-sales.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 销售出库单 (MesWmProductSales)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-product-sales',
  'mes-dir',
  'MES 销售出库单管理',
  '/admin/mes/mes-wm-product-sales',
  'mes/mes-wm-product-sales/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_product_sales:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-product-sales-query',  'menu-mes-wm-product-sales', '查询MES 销售出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales:query',  1, NOW(), NOW()),
('menu-mes-wm-product-sales-create', 'menu-mes-wm-product-sales', '新增MES 销售出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales:create', 2, NOW(), NOW()),
('menu-mes-wm-product-sales-update', 'menu-mes-wm-product-sales', '修改MES 销售出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales:update', 3, NOW(), NOW()),
('menu-mes-wm-product-sales-delete', 'menu-mes-wm-product-sales', '删除MES 销售出库单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_product_sales:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-sales'),
('1', 'menu-mes-wm-product-sales-query'),
('1', 'menu-mes-wm-product-sales-create'),
('1', 'menu-mes-wm-product-sales-update'),
('1', 'menu-mes-wm-product-sales-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-product-sales'),
('1', 'menu-mes-wm-product-sales-query'),
('1', 'menu-mes-wm-product-sales-create'),
('1', 'menu-mes-wm-product-sales-update'),
('1', 'menu-mes-wm-product-sales-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-issue-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产退料明细 (MesWmReturnIssueDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-issue-detail',
  'mes-dir',
  'MES 生产退料明细管理',
  '/admin/mes/mes-wm-return-issue-detail',
  'mes/mes-wm-return-issue-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_issue_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-issue-detail-query',  'menu-mes-wm-return-issue-detail', '查询MES 生产退料明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-return-issue-detail-create', 'menu-mes-wm-return-issue-detail', '新增MES 生产退料明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-return-issue-detail-update', 'menu-mes-wm-return-issue-detail', '修改MES 生产退料明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-return-issue-detail-delete', 'menu-mes-wm-return-issue-detail', '删除MES 生产退料明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-issue-detail'),
('1', 'menu-mes-wm-return-issue-detail-query'),
('1', 'menu-mes-wm-return-issue-detail-create'),
('1', 'menu-mes-wm-return-issue-detail-update'),
('1', 'menu-mes-wm-return-issue-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-issue-detail'),
('1', 'menu-mes-wm-return-issue-detail-query'),
('1', 'menu-mes-wm-return-issue-detail-create'),
('1', 'menu-mes-wm-return-issue-detail-update'),
('1', 'menu-mes-wm-return-issue-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-issue-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产退料单行 (MesWmReturnIssueLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-issue-line',
  'mes-dir',
  'MES 生产退料单行管理',
  '/admin/mes/mes-wm-return-issue-line',
  'mes/mes-wm-return-issue-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_issue_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-issue-line-query',  'menu-mes-wm-return-issue-line', '查询MES 生产退料单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue_line:query',  1, NOW(), NOW()),
('menu-mes-wm-return-issue-line-create', 'menu-mes-wm-return-issue-line', '新增MES 生产退料单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue_line:create', 2, NOW(), NOW()),
('menu-mes-wm-return-issue-line-update', 'menu-mes-wm-return-issue-line', '修改MES 生产退料单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue_line:update', 3, NOW(), NOW()),
('menu-mes-wm-return-issue-line-delete', 'menu-mes-wm-return-issue-line', '删除MES 生产退料单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-issue-line'),
('1', 'menu-mes-wm-return-issue-line-query'),
('1', 'menu-mes-wm-return-issue-line-create'),
('1', 'menu-mes-wm-return-issue-line-update'),
('1', 'menu-mes-wm-return-issue-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-issue-line'),
('1', 'menu-mes-wm-return-issue-line-query'),
('1', 'menu-mes-wm-return-issue-line-create'),
('1', 'menu-mes-wm-return-issue-line-update'),
('1', 'menu-mes-wm-return-issue-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-issue.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 生产退料单 (MesWmReturnIssue)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-issue',
  'mes-dir',
  'MES 生产退料单管理',
  '/admin/mes/mes-wm-return-issue',
  'mes/mes-wm-return-issue/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_issue:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-issue-query',  'menu-mes-wm-return-issue', '查询MES 生产退料单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue:query',  1, NOW(), NOW()),
('menu-mes-wm-return-issue-create', 'menu-mes-wm-return-issue', '新增MES 生产退料单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue:create', 2, NOW(), NOW()),
('menu-mes-wm-return-issue-update', 'menu-mes-wm-return-issue', '修改MES 生产退料单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue:update', 3, NOW(), NOW()),
('menu-mes-wm-return-issue-delete', 'menu-mes-wm-return-issue', '删除MES 生产退料单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_issue:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-issue'),
('1', 'menu-mes-wm-return-issue-query'),
('1', 'menu-mes-wm-return-issue-create'),
('1', 'menu-mes-wm-return-issue-update'),
('1', 'menu-mes-wm-return-issue-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-issue'),
('1', 'menu-mes-wm-return-issue-query'),
('1', 'menu-mes-wm-return-issue-create'),
('1', 'menu-mes-wm-return-issue-update'),
('1', 'menu-mes-wm-return-issue-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-sales-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 销售退货明细 (MesWmReturnSalesDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-sales-detail',
  'mes-dir',
  'MES 销售退货明细管理',
  '/admin/mes/mes-wm-return-sales-detail',
  'mes/mes-wm-return-sales-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_sales_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-sales-detail-query',  'menu-mes-wm-return-sales-detail', '查询MES 销售退货明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-return-sales-detail-create', 'menu-mes-wm-return-sales-detail', '新增MES 销售退货明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-return-sales-detail-update', 'menu-mes-wm-return-sales-detail', '修改MES 销售退货明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-return-sales-detail-delete', 'menu-mes-wm-return-sales-detail', '删除MES 销售退货明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-sales-detail'),
('1', 'menu-mes-wm-return-sales-detail-query'),
('1', 'menu-mes-wm-return-sales-detail-create'),
('1', 'menu-mes-wm-return-sales-detail-update'),
('1', 'menu-mes-wm-return-sales-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-sales-detail'),
('1', 'menu-mes-wm-return-sales-detail-query'),
('1', 'menu-mes-wm-return-sales-detail-create'),
('1', 'menu-mes-wm-return-sales-detail-update'),
('1', 'menu-mes-wm-return-sales-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-sales-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 销售退货单行 (MesWmReturnSalesLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-sales-line',
  'mes-dir',
  'MES 销售退货单行管理',
  '/admin/mes/mes-wm-return-sales-line',
  'mes/mes-wm-return-sales-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_sales_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-sales-line-query',  'menu-mes-wm-return-sales-line', '查询MES 销售退货单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales_line:query',  1, NOW(), NOW()),
('menu-mes-wm-return-sales-line-create', 'menu-mes-wm-return-sales-line', '新增MES 销售退货单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales_line:create', 2, NOW(), NOW()),
('menu-mes-wm-return-sales-line-update', 'menu-mes-wm-return-sales-line', '修改MES 销售退货单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales_line:update', 3, NOW(), NOW()),
('menu-mes-wm-return-sales-line-delete', 'menu-mes-wm-return-sales-line', '删除MES 销售退货单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-sales-line'),
('1', 'menu-mes-wm-return-sales-line-query'),
('1', 'menu-mes-wm-return-sales-line-create'),
('1', 'menu-mes-wm-return-sales-line-update'),
('1', 'menu-mes-wm-return-sales-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-sales-line'),
('1', 'menu-mes-wm-return-sales-line-query'),
('1', 'menu-mes-wm-return-sales-line-create'),
('1', 'menu-mes-wm-return-sales-line-update'),
('1', 'menu-mes-wm-return-sales-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-sales.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 销售退货单 (MesWmReturnSales)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-sales',
  'mes-dir',
  'MES 销售退货单管理',
  '/admin/mes/mes-wm-return-sales',
  'mes/mes-wm-return-sales/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_sales:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-sales-query',  'menu-mes-wm-return-sales', '查询MES 销售退货单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales:query',  1, NOW(), NOW()),
('menu-mes-wm-return-sales-create', 'menu-mes-wm-return-sales', '新增MES 销售退货单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales:create', 2, NOW(), NOW()),
('menu-mes-wm-return-sales-update', 'menu-mes-wm-return-sales', '修改MES 销售退货单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales:update', 3, NOW(), NOW()),
('menu-mes-wm-return-sales-delete', 'menu-mes-wm-return-sales', '删除MES 销售退货单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_sales:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-sales'),
('1', 'menu-mes-wm-return-sales-query'),
('1', 'menu-mes-wm-return-sales-create'),
('1', 'menu-mes-wm-return-sales-update'),
('1', 'menu-mes-wm-return-sales-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-sales'),
('1', 'menu-mes-wm-return-sales-query'),
('1', 'menu-mes-wm-return-sales-create'),
('1', 'menu-mes-wm-return-sales-update'),
('1', 'menu-mes-wm-return-sales-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-vendor-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 供应商退货明细 (MesWmReturnVendorDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-vendor-detail',
  'mes-dir',
  'MES 供应商退货明细管理',
  '/admin/mes/mes-wm-return-vendor-detail',
  'mes/mes-wm-return-vendor-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_vendor_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-vendor-detail-query',  'menu-mes-wm-return-vendor-detail', '查询MES 供应商退货明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-return-vendor-detail-create', 'menu-mes-wm-return-vendor-detail', '新增MES 供应商退货明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-return-vendor-detail-update', 'menu-mes-wm-return-vendor-detail', '修改MES 供应商退货明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-return-vendor-detail-delete', 'menu-mes-wm-return-vendor-detail', '删除MES 供应商退货明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-vendor-detail'),
('1', 'menu-mes-wm-return-vendor-detail-query'),
('1', 'menu-mes-wm-return-vendor-detail-create'),
('1', 'menu-mes-wm-return-vendor-detail-update'),
('1', 'menu-mes-wm-return-vendor-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-vendor-detail'),
('1', 'menu-mes-wm-return-vendor-detail-query'),
('1', 'menu-mes-wm-return-vendor-detail-create'),
('1', 'menu-mes-wm-return-vendor-detail-update'),
('1', 'menu-mes-wm-return-vendor-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-vendor-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 供应商退货单行 (MesWmReturnVendorLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-vendor-line',
  'mes-dir',
  'MES 供应商退货单行管理',
  '/admin/mes/mes-wm-return-vendor-line',
  'mes/mes-wm-return-vendor-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_vendor_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-vendor-line-query',  'menu-mes-wm-return-vendor-line', '查询MES 供应商退货单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor_line:query',  1, NOW(), NOW()),
('menu-mes-wm-return-vendor-line-create', 'menu-mes-wm-return-vendor-line', '新增MES 供应商退货单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor_line:create', 2, NOW(), NOW()),
('menu-mes-wm-return-vendor-line-update', 'menu-mes-wm-return-vendor-line', '修改MES 供应商退货单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor_line:update', 3, NOW(), NOW()),
('menu-mes-wm-return-vendor-line-delete', 'menu-mes-wm-return-vendor-line', '删除MES 供应商退货单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-vendor-line'),
('1', 'menu-mes-wm-return-vendor-line-query'),
('1', 'menu-mes-wm-return-vendor-line-create'),
('1', 'menu-mes-wm-return-vendor-line-update'),
('1', 'menu-mes-wm-return-vendor-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-vendor-line'),
('1', 'menu-mes-wm-return-vendor-line-query'),
('1', 'menu-mes-wm-return-vendor-line-create'),
('1', 'menu-mes-wm-return-vendor-line-update'),
('1', 'menu-mes-wm-return-vendor-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-return-vendor.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 供应商退货单 (MesWmReturnVendor)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-return-vendor',
  'mes-dir',
  'MES 供应商退货单管理',
  '/admin/mes/mes-wm-return-vendor',
  'mes/mes-wm-return-vendor/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_return_vendor:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-return-vendor-query',  'menu-mes-wm-return-vendor', '查询MES 供应商退货单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor:query',  1, NOW(), NOW()),
('menu-mes-wm-return-vendor-create', 'menu-mes-wm-return-vendor', '新增MES 供应商退货单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor:create', 2, NOW(), NOW()),
('menu-mes-wm-return-vendor-update', 'menu-mes-wm-return-vendor', '修改MES 供应商退货单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor:update', 3, NOW(), NOW()),
('menu-mes-wm-return-vendor-delete', 'menu-mes-wm-return-vendor', '删除MES 供应商退货单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_return_vendor:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-vendor'),
('1', 'menu-mes-wm-return-vendor-query'),
('1', 'menu-mes-wm-return-vendor-create'),
('1', 'menu-mes-wm-return-vendor-update'),
('1', 'menu-mes-wm-return-vendor-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-return-vendor'),
('1', 'menu-mes-wm-return-vendor-query'),
('1', 'menu-mes-wm-return-vendor-create'),
('1', 'menu-mes-wm-return-vendor-update'),
('1', 'menu-mes-wm-return-vendor-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-sales-notice-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 发货通知单行 (MesWmSalesNoticeLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-sales-notice-line',
  'mes-dir',
  'MES 发货通知单行管理',
  '/admin/mes/mes-wm-sales-notice-line',
  'mes/mes-wm-sales-notice-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_sales_notice_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-sales-notice-line-query',  'menu-mes-wm-sales-notice-line', '查询MES 发货通知单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sales_notice_line:query',  1, NOW(), NOW()),
('menu-mes-wm-sales-notice-line-create', 'menu-mes-wm-sales-notice-line', '新增MES 发货通知单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sales_notice_line:create', 2, NOW(), NOW()),
('menu-mes-wm-sales-notice-line-update', 'menu-mes-wm-sales-notice-line', '修改MES 发货通知单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sales_notice_line:update', 3, NOW(), NOW()),
('menu-mes-wm-sales-notice-line-delete', 'menu-mes-wm-sales-notice-line', '删除MES 发货通知单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sales_notice_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-sales-notice-line'),
('1', 'menu-mes-wm-sales-notice-line-query'),
('1', 'menu-mes-wm-sales-notice-line-create'),
('1', 'menu-mes-wm-sales-notice-line-update'),
('1', 'menu-mes-wm-sales-notice-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-sales-notice-line'),
('1', 'menu-mes-wm-sales-notice-line-query'),
('1', 'menu-mes-wm-sales-notice-line-create'),
('1', 'menu-mes-wm-sales-notice-line-update'),
('1', 'menu-mes-wm-sales-notice-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-sales-notice.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 发货通知单 (MesWmSalesNotice)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-sales-notice',
  'mes-dir',
  'MES 发货通知单管理',
  '/admin/mes/mes-wm-sales-notice',
  'mes/mes-wm-sales-notice/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_sales_notice:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-sales-notice-query',  'menu-mes-wm-sales-notice', '查询MES 发货通知单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sales_notice:query',  1, NOW(), NOW()),
('menu-mes-wm-sales-notice-create', 'menu-mes-wm-sales-notice', '新增MES 发货通知单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sales_notice:create', 2, NOW(), NOW()),
('menu-mes-wm-sales-notice-update', 'menu-mes-wm-sales-notice', '修改MES 发货通知单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sales_notice:update', 3, NOW(), NOW()),
('menu-mes-wm-sales-notice-delete', 'menu-mes-wm-sales-notice', '删除MES 发货通知单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sales_notice:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-sales-notice'),
('1', 'menu-mes-wm-sales-notice-query'),
('1', 'menu-mes-wm-sales-notice-create'),
('1', 'menu-mes-wm-sales-notice-update'),
('1', 'menu-mes-wm-sales-notice-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-sales-notice'),
('1', 'menu-mes-wm-sales-notice-query'),
('1', 'menu-mes-wm-sales-notice-create'),
('1', 'menu-mes-wm-sales-notice-update'),
('1', 'menu-mes-wm-sales-notice-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-sn.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES SN 码 (MesWmSn)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-sn',
  'mes-dir',
  'MES SN 码管理',
  '/admin/mes/mes-wm-sn',
  'mes/mes-wm-sn/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_sn:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-sn-query',  'menu-mes-wm-sn', '查询MES SN 码', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sn:query',  1, NOW(), NOW()),
('menu-mes-wm-sn-create', 'menu-mes-wm-sn', '新增MES SN 码', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sn:create', 2, NOW(), NOW()),
('menu-mes-wm-sn-update', 'menu-mes-wm-sn', '修改MES SN 码', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sn:update', 3, NOW(), NOW()),
('menu-mes-wm-sn-delete', 'menu-mes-wm-sn', '删除MES SN 码', 'BUTTON', 'ACTIVE', 'mes:mes_wm_sn:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-sn'),
('1', 'menu-mes-wm-sn-query'),
('1', 'menu-mes-wm-sn-create'),
('1', 'menu-mes-wm-sn-update'),
('1', 'menu-mes-wm-sn-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-sn'),
('1', 'menu-mes-wm-sn-query'),
('1', 'menu-mes-wm-sn-create'),
('1', 'menu-mes-wm-sn-update'),
('1', 'menu-mes-wm-sn-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-stock-taking-plan-param.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 盘点方案参数 (MesWmStockTakingPlanParam)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-stock-taking-plan-param',
  'mes-dir',
  'MES 盘点方案参数管理',
  '/admin/mes/mes-wm-stock-taking-plan-param',
  'mes/mes-wm-stock-taking-plan-param/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_stock_taking_plan_param:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-stock-taking-plan-param-query',  'menu-mes-wm-stock-taking-plan-param', '查询MES 盘点方案参数', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_plan_param:query',  1, NOW(), NOW()),
('menu-mes-wm-stock-taking-plan-param-create', 'menu-mes-wm-stock-taking-plan-param', '新增MES 盘点方案参数', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_plan_param:create', 2, NOW(), NOW()),
('menu-mes-wm-stock-taking-plan-param-update', 'menu-mes-wm-stock-taking-plan-param', '修改MES 盘点方案参数', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_plan_param:update', 3, NOW(), NOW()),
('menu-mes-wm-stock-taking-plan-param-delete', 'menu-mes-wm-stock-taking-plan-param', '删除MES 盘点方案参数', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_plan_param:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-plan-param'),
('1', 'menu-mes-wm-stock-taking-plan-param-query'),
('1', 'menu-mes-wm-stock-taking-plan-param-create'),
('1', 'menu-mes-wm-stock-taking-plan-param-update'),
('1', 'menu-mes-wm-stock-taking-plan-param-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-plan-param'),
('1', 'menu-mes-wm-stock-taking-plan-param-query'),
('1', 'menu-mes-wm-stock-taking-plan-param-create'),
('1', 'menu-mes-wm-stock-taking-plan-param-update'),
('1', 'menu-mes-wm-stock-taking-plan-param-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-stock-taking-plan.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 盘点方案 (MesWmStockTakingPlan)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-stock-taking-plan',
  'mes-dir',
  'MES 盘点方案管理',
  '/admin/mes/mes-wm-stock-taking-plan',
  'mes/mes-wm-stock-taking-plan/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_stock_taking_plan:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-stock-taking-plan-query',  'menu-mes-wm-stock-taking-plan', '查询MES 盘点方案', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_plan:query',  1, NOW(), NOW()),
('menu-mes-wm-stock-taking-plan-create', 'menu-mes-wm-stock-taking-plan', '新增MES 盘点方案', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_plan:create', 2, NOW(), NOW()),
('menu-mes-wm-stock-taking-plan-update', 'menu-mes-wm-stock-taking-plan', '修改MES 盘点方案', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_plan:update', 3, NOW(), NOW()),
('menu-mes-wm-stock-taking-plan-delete', 'menu-mes-wm-stock-taking-plan', '删除MES 盘点方案', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_plan:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-plan'),
('1', 'menu-mes-wm-stock-taking-plan-query'),
('1', 'menu-mes-wm-stock-taking-plan-create'),
('1', 'menu-mes-wm-stock-taking-plan-update'),
('1', 'menu-mes-wm-stock-taking-plan-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-plan'),
('1', 'menu-mes-wm-stock-taking-plan-query'),
('1', 'menu-mes-wm-stock-taking-plan-create'),
('1', 'menu-mes-wm-stock-taking-plan-update'),
('1', 'menu-mes-wm-stock-taking-plan-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-stock-taking-task-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 盘点任务行 (MesWmStockTakingTaskLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-stock-taking-task-line',
  'mes-dir',
  'MES 盘点任务行管理',
  '/admin/mes/mes-wm-stock-taking-task-line',
  'mes/mes-wm-stock-taking-task-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_stock_taking_task_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-stock-taking-task-line-query',  'menu-mes-wm-stock-taking-task-line', '查询MES 盘点任务行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task_line:query',  1, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-line-create', 'menu-mes-wm-stock-taking-task-line', '新增MES 盘点任务行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task_line:create', 2, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-line-update', 'menu-mes-wm-stock-taking-task-line', '修改MES 盘点任务行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task_line:update', 3, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-line-delete', 'menu-mes-wm-stock-taking-task-line', '删除MES 盘点任务行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-task-line'),
('1', 'menu-mes-wm-stock-taking-task-line-query'),
('1', 'menu-mes-wm-stock-taking-task-line-create'),
('1', 'menu-mes-wm-stock-taking-task-line-update'),
('1', 'menu-mes-wm-stock-taking-task-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-task-line'),
('1', 'menu-mes-wm-stock-taking-task-line-query'),
('1', 'menu-mes-wm-stock-taking-task-line-create'),
('1', 'menu-mes-wm-stock-taking-task-line-update'),
('1', 'menu-mes-wm-stock-taking-task-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-stock-taking-task-result.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 盘点结果 (MesWmStockTakingTaskResult)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-stock-taking-task-result',
  'mes-dir',
  'MES 盘点结果管理',
  '/admin/mes/mes-wm-stock-taking-task-result',
  'mes/mes-wm-stock-taking-task-result/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_stock_taking_task_result:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-stock-taking-task-result-query',  'menu-mes-wm-stock-taking-task-result', '查询MES 盘点结果', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task_result:query',  1, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-result-create', 'menu-mes-wm-stock-taking-task-result', '新增MES 盘点结果', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task_result:create', 2, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-result-update', 'menu-mes-wm-stock-taking-task-result', '修改MES 盘点结果', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task_result:update', 3, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-result-delete', 'menu-mes-wm-stock-taking-task-result', '删除MES 盘点结果', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task_result:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-task-result'),
('1', 'menu-mes-wm-stock-taking-task-result-query'),
('1', 'menu-mes-wm-stock-taking-task-result-create'),
('1', 'menu-mes-wm-stock-taking-task-result-update'),
('1', 'menu-mes-wm-stock-taking-task-result-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-task-result'),
('1', 'menu-mes-wm-stock-taking-task-result-query'),
('1', 'menu-mes-wm-stock-taking-task-result-create'),
('1', 'menu-mes-wm-stock-taking-task-result-update'),
('1', 'menu-mes-wm-stock-taking-task-result-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-stock-taking-task.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 盘点任务 (MesWmStockTakingTask)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-stock-taking-task',
  'mes-dir',
  'MES 盘点任务管理',
  '/admin/mes/mes-wm-stock-taking-task',
  'mes/mes-wm-stock-taking-task/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_stock_taking_task:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-stock-taking-task-query',  'menu-mes-wm-stock-taking-task', '查询MES 盘点任务', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task:query',  1, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-create', 'menu-mes-wm-stock-taking-task', '新增MES 盘点任务', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task:create', 2, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-update', 'menu-mes-wm-stock-taking-task', '修改MES 盘点任务', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task:update', 3, NOW(), NOW()),
('menu-mes-wm-stock-taking-task-delete', 'menu-mes-wm-stock-taking-task', '删除MES 盘点任务', 'BUTTON', 'ACTIVE', 'mes:mes_wm_stock_taking_task:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-task'),
('1', 'menu-mes-wm-stock-taking-task-query'),
('1', 'menu-mes-wm-stock-taking-task-create'),
('1', 'menu-mes-wm-stock-taking-task-update'),
('1', 'menu-mes-wm-stock-taking-task-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-stock-taking-task'),
('1', 'menu-mes-wm-stock-taking-task-query'),
('1', 'menu-mes-wm-stock-taking-task-create'),
('1', 'menu-mes-wm-stock-taking-task-update'),
('1', 'menu-mes-wm-stock-taking-task-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-transaction.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许 (MesWmTransaction)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-transaction',
  'mes-dir',
  'MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许管理',
  '/admin/mes/mes-wm-transaction',
  'mes/mes-wm-transaction/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_transaction:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-transaction-query',  'menu-mes-wm-transaction', '查询MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transaction:query',  1, NOW(), NOW()),
('menu-mes-wm-transaction-create', 'menu-mes-wm-transaction', '新增MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transaction:create', 2, NOW(), NOW()),
('menu-mes-wm-transaction-update', 'menu-mes-wm-transaction', '修改MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transaction:update', 3, NOW(), NOW()),
('menu-mes-wm-transaction-delete', 'menu-mes-wm-transaction', '删除MES 库存事务流水 DO记录每一笔库存增减事件，系统自动生成，只读查询，不允许', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transaction:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-transaction'),
('1', 'menu-mes-wm-transaction-query'),
('1', 'menu-mes-wm-transaction-create'),
('1', 'menu-mes-wm-transaction-update'),
('1', 'menu-mes-wm-transaction-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-transaction'),
('1', 'menu-mes-wm-transaction-query'),
('1', 'menu-mes-wm-transaction-create'),
('1', 'menu-mes-wm-transaction-update'),
('1', 'menu-mes-wm-transaction-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-transfer-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 调拨明细 (MesWmTransferDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-transfer-detail',
  'mes-dir',
  'MES 调拨明细管理',
  '/admin/mes/mes-wm-transfer-detail',
  'mes/mes-wm-transfer-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_transfer_detail:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-transfer-detail-query',  'menu-mes-wm-transfer-detail', '查询MES 调拨明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer_detail:query',  1, NOW(), NOW()),
('menu-mes-wm-transfer-detail-create', 'menu-mes-wm-transfer-detail', '新增MES 调拨明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer_detail:create', 2, NOW(), NOW()),
('menu-mes-wm-transfer-detail-update', 'menu-mes-wm-transfer-detail', '修改MES 调拨明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer_detail:update', 3, NOW(), NOW()),
('menu-mes-wm-transfer-detail-delete', 'menu-mes-wm-transfer-detail', '删除MES 调拨明细', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer_detail:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-transfer-detail'),
('1', 'menu-mes-wm-transfer-detail-query'),
('1', 'menu-mes-wm-transfer-detail-create'),
('1', 'menu-mes-wm-transfer-detail-update'),
('1', 'menu-mes-wm-transfer-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-transfer-detail'),
('1', 'menu-mes-wm-transfer-detail-query'),
('1', 'menu-mes-wm-transfer-detail-create'),
('1', 'menu-mes-wm-transfer-detail-update'),
('1', 'menu-mes-wm-transfer-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-transfer-line.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 转移单行 (MesWmTransferLine)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-transfer-line',
  'mes-dir',
  'MES 转移单行管理',
  '/admin/mes/mes-wm-transfer-line',
  'mes/mes-wm-transfer-line/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_transfer_line:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-transfer-line-query',  'menu-mes-wm-transfer-line', '查询MES 转移单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer_line:query',  1, NOW(), NOW()),
('menu-mes-wm-transfer-line-create', 'menu-mes-wm-transfer-line', '新增MES 转移单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer_line:create', 2, NOW(), NOW()),
('menu-mes-wm-transfer-line-update', 'menu-mes-wm-transfer-line', '修改MES 转移单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer_line:update', 3, NOW(), NOW()),
('menu-mes-wm-transfer-line-delete', 'menu-mes-wm-transfer-line', '删除MES 转移单行', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer_line:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-transfer-line'),
('1', 'menu-mes-wm-transfer-line-query'),
('1', 'menu-mes-wm-transfer-line-create'),
('1', 'menu-mes-wm-transfer-line-update'),
('1', 'menu-mes-wm-transfer-line-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-transfer-line'),
('1', 'menu-mes-wm-transfer-line-query'),
('1', 'menu-mes-wm-transfer-line-create'),
('1', 'menu-mes-wm-transfer-line-update'),
('1', 'menu-mes-wm-transfer-line-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-transfer.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 转移单 (MesWmTransfer)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-transfer',
  'mes-dir',
  'MES 转移单管理',
  '/admin/mes/mes-wm-transfer',
  'mes/mes-wm-transfer/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_transfer:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-transfer-query',  'menu-mes-wm-transfer', '查询MES 转移单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer:query',  1, NOW(), NOW()),
('menu-mes-wm-transfer-create', 'menu-mes-wm-transfer', '新增MES 转移单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer:create', 2, NOW(), NOW()),
('menu-mes-wm-transfer-update', 'menu-mes-wm-transfer', '修改MES 转移单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer:update', 3, NOW(), NOW()),
('menu-mes-wm-transfer-delete', 'menu-mes-wm-transfer', '删除MES 转移单', 'BUTTON', 'ACTIVE', 'mes:mes_wm_transfer:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-transfer'),
('1', 'menu-mes-wm-transfer-query'),
('1', 'menu-mes-wm-transfer-create'),
('1', 'menu-mes-wm-transfer-update'),
('1', 'menu-mes-wm-transfer-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-transfer'),
('1', 'menu-mes-wm-transfer-query'),
('1', 'menu-mes-wm-transfer-create'),
('1', 'menu-mes-wm-transfer-update'),
('1', 'menu-mes-wm-transfer-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-warehouse-area.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 库位 (MesWmWarehouseArea)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-warehouse-area',
  'mes-dir',
  'MES 库位管理',
  '/admin/mes/mes-wm-warehouse-area',
  'mes/mes-wm-warehouse-area/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_warehouse_area:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-warehouse-area-query',  'menu-mes-wm-warehouse-area', '查询MES 库位', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse_area:query',  1, NOW(), NOW()),
('menu-mes-wm-warehouse-area-create', 'menu-mes-wm-warehouse-area', '新增MES 库位', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse_area:create', 2, NOW(), NOW()),
('menu-mes-wm-warehouse-area-update', 'menu-mes-wm-warehouse-area', '修改MES 库位', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse_area:update', 3, NOW(), NOW()),
('menu-mes-wm-warehouse-area-delete', 'menu-mes-wm-warehouse-area', '删除MES 库位', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse_area:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-warehouse-area'),
('1', 'menu-mes-wm-warehouse-area-query'),
('1', 'menu-mes-wm-warehouse-area-create'),
('1', 'menu-mes-wm-warehouse-area-update'),
('1', 'menu-mes-wm-warehouse-area-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-warehouse-area'),
('1', 'menu-mes-wm-warehouse-area-query'),
('1', 'menu-mes-wm-warehouse-area-create'),
('1', 'menu-mes-wm-warehouse-area-update'),
('1', 'menu-mes-wm-warehouse-area-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-warehouse-location.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 库区 (MesWmWarehouseLocation)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-warehouse-location',
  'mes-dir',
  'MES 库区管理',
  '/admin/mes/mes-wm-warehouse-location',
  'mes/mes-wm-warehouse-location/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_warehouse_location:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-warehouse-location-query',  'menu-mes-wm-warehouse-location', '查询MES 库区', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse_location:query',  1, NOW(), NOW()),
('menu-mes-wm-warehouse-location-create', 'menu-mes-wm-warehouse-location', '新增MES 库区', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse_location:create', 2, NOW(), NOW()),
('menu-mes-wm-warehouse-location-update', 'menu-mes-wm-warehouse-location', '修改MES 库区', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse_location:update', 3, NOW(), NOW()),
('menu-mes-wm-warehouse-location-delete', 'menu-mes-wm-warehouse-location', '删除MES 库区', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse_location:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-warehouse-location'),
('1', 'menu-mes-wm-warehouse-location-query'),
('1', 'menu-mes-wm-warehouse-location-create'),
('1', 'menu-mes-wm-warehouse-location-update'),
('1', 'menu-mes-wm-warehouse-location-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-warehouse-location'),
('1', 'menu-mes-wm-warehouse-location-query'),
('1', 'menu-mes-wm-warehouse-location-create'),
('1', 'menu-mes-wm-warehouse-location-update'),
('1', 'menu-mes-wm-warehouse-location-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mes/contract/mes-wm-warehouse.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for MES 仓库 (MesWmWarehouse)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mes-wm-warehouse',
  'mes-dir',
  'MES 仓库管理',
  '/admin/mes/mes-wm-warehouse',
  'mes/mes-wm-warehouse/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mes:mes_wm_warehouse:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mes-wm-warehouse-query',  'menu-mes-wm-warehouse', '查询MES 仓库', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse:query',  1, NOW(), NOW()),
('menu-mes-wm-warehouse-create', 'menu-mes-wm-warehouse', '新增MES 仓库', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse:create', 2, NOW(), NOW()),
('menu-mes-wm-warehouse-update', 'menu-mes-wm-warehouse', '修改MES 仓库', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse:update', 3, NOW(), NOW()),
('menu-mes-wm-warehouse-delete', 'menu-mes-wm-warehouse', '删除MES 仓库', 'BUTTON', 'ACTIVE', 'mes:mes_wm_warehouse:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-warehouse'),
('1', 'menu-mes-wm-warehouse-query'),
('1', 'menu-mes-wm-warehouse-create'),
('1', 'menu-mes-wm-warehouse-update'),
('1', 'menu-mes-wm-warehouse-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mes-wm-warehouse'),
('1', 'menu-mes-wm-warehouse-query'),
('1', 'menu-mes-wm-warehouse-create'),
('1', 'menu-mes-wm-warehouse-update'),
('1', 'menu-mes-wm-warehouse-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mp/contract/mp-account.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 公众号账号 (MpAccount)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mp-account',
  'mp-dir',
  '公众号账号管理',
  '/admin/mp/mp-account',
  'mp/mp-account/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mp:mp_account:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mp-account-query',  'menu-mp-account', '查询公众号账号', 'BUTTON', 'ACTIVE', 'mp:mp_account:query',  1, NOW(), NOW()),
('menu-mp-account-create', 'menu-mp-account', '新增公众号账号', 'BUTTON', 'ACTIVE', 'mp:mp_account:create', 2, NOW(), NOW()),
('menu-mp-account-update', 'menu-mp-account', '修改公众号账号', 'BUTTON', 'ACTIVE', 'mp:mp_account:update', 3, NOW(), NOW()),
('menu-mp-account-delete', 'menu-mp-account', '删除公众号账号', 'BUTTON', 'ACTIVE', 'mp:mp_account:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mp-account'),
('1', 'menu-mp-account-query'),
('1', 'menu-mp-account-create'),
('1', 'menu-mp-account-update'),
('1', 'menu-mp-account-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mp-account'),
('1', 'menu-mp-account-query'),
('1', 'menu-mp-account-create'),
('1', 'menu-mp-account-update'),
('1', 'menu-mp-account-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mp/contract/mp-auto-reply.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 公众号消息自动回复 (MpAutoReply)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mp-auto-reply',
  'mp-dir',
  '公众号消息自动回复管理',
  '/admin/mp/mp-auto-reply',
  'mp/mp-auto-reply/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mp:mp_auto_reply:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mp-auto-reply-query',  'menu-mp-auto-reply', '查询公众号消息自动回复', 'BUTTON', 'ACTIVE', 'mp:mp_auto_reply:query',  1, NOW(), NOW()),
('menu-mp-auto-reply-create', 'menu-mp-auto-reply', '新增公众号消息自动回复', 'BUTTON', 'ACTIVE', 'mp:mp_auto_reply:create', 2, NOW(), NOW()),
('menu-mp-auto-reply-update', 'menu-mp-auto-reply', '修改公众号消息自动回复', 'BUTTON', 'ACTIVE', 'mp:mp_auto_reply:update', 3, NOW(), NOW()),
('menu-mp-auto-reply-delete', 'menu-mp-auto-reply', '删除公众号消息自动回复', 'BUTTON', 'ACTIVE', 'mp:mp_auto_reply:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mp-auto-reply'),
('1', 'menu-mp-auto-reply-query'),
('1', 'menu-mp-auto-reply-create'),
('1', 'menu-mp-auto-reply-update'),
('1', 'menu-mp-auto-reply-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mp-auto-reply'),
('1', 'menu-mp-auto-reply-query'),
('1', 'menu-mp-auto-reply-create'),
('1', 'menu-mp-auto-reply-update'),
('1', 'menu-mp-auto-reply-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mp/contract/mp-material.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 公众号素材 DO1. a href=https://developers.wei (MpMaterial)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mp-material',
  'mp-dir',
  '公众号素材 DO1. a href=https://developers.wei管理',
  '/admin/mp/mp-material',
  'mp/mp-material/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mp:mp_material:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mp-material-query',  'menu-mp-material', '查询公众号素材 DO1. a href=https://developers.wei', 'BUTTON', 'ACTIVE', 'mp:mp_material:query',  1, NOW(), NOW()),
('menu-mp-material-create', 'menu-mp-material', '新增公众号素材 DO1. a href=https://developers.wei', 'BUTTON', 'ACTIVE', 'mp:mp_material:create', 2, NOW(), NOW()),
('menu-mp-material-update', 'menu-mp-material', '修改公众号素材 DO1. a href=https://developers.wei', 'BUTTON', 'ACTIVE', 'mp:mp_material:update', 3, NOW(), NOW()),
('menu-mp-material-delete', 'menu-mp-material', '删除公众号素材 DO1. a href=https://developers.wei', 'BUTTON', 'ACTIVE', 'mp:mp_material:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mp-material'),
('1', 'menu-mp-material-query'),
('1', 'menu-mp-material-create'),
('1', 'menu-mp-material-update'),
('1', 'menu-mp-material-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mp-material'),
('1', 'menu-mp-material-query'),
('1', 'menu-mp-material-create'),
('1', 'menu-mp-material-update'),
('1', 'menu-mp-material-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mp/contract/mp-menu.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 公众号菜单 (MpMenu)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mp-menu',
  'mp-dir',
  '公众号菜单管理',
  '/admin/mp/mp-menu',
  'mp/mp-menu/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mp:mp_menu:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mp-menu-query',  'menu-mp-menu', '查询公众号菜单', 'BUTTON', 'ACTIVE', 'mp:mp_menu:query',  1, NOW(), NOW()),
('menu-mp-menu-create', 'menu-mp-menu', '新增公众号菜单', 'BUTTON', 'ACTIVE', 'mp:mp_menu:create', 2, NOW(), NOW()),
('menu-mp-menu-update', 'menu-mp-menu', '修改公众号菜单', 'BUTTON', 'ACTIVE', 'mp:mp_menu:update', 3, NOW(), NOW()),
('menu-mp-menu-delete', 'menu-mp-menu', '删除公众号菜单', 'BUTTON', 'ACTIVE', 'mp:mp_menu:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mp-menu'),
('1', 'menu-mp-menu-query'),
('1', 'menu-mp-menu-create'),
('1', 'menu-mp-menu-update'),
('1', 'menu-mp-menu-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mp-menu'),
('1', 'menu-mp-menu-query'),
('1', 'menu-mp-menu-create'),
('1', 'menu-mp-menu-update'),
('1', 'menu-mp-menu-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mp/contract/mp-message-template.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 公众号模版消息 (MpMessageTemplate)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mp-message-template',
  'mp-dir',
  '公众号模版消息管理',
  '/admin/mp/mp-message-template',
  'mp/mp-message-template/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mp:mp_message_template:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mp-message-template-query',  'menu-mp-message-template', '查询公众号模版消息', 'BUTTON', 'ACTIVE', 'mp:mp_message_template:query',  1, NOW(), NOW()),
('menu-mp-message-template-create', 'menu-mp-message-template', '新增公众号模版消息', 'BUTTON', 'ACTIVE', 'mp:mp_message_template:create', 2, NOW(), NOW()),
('menu-mp-message-template-update', 'menu-mp-message-template', '修改公众号模版消息', 'BUTTON', 'ACTIVE', 'mp:mp_message_template:update', 3, NOW(), NOW()),
('menu-mp-message-template-delete', 'menu-mp-message-template', '删除公众号模版消息', 'BUTTON', 'ACTIVE', 'mp:mp_message_template:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mp-message-template'),
('1', 'menu-mp-message-template-query'),
('1', 'menu-mp-message-template-create'),
('1', 'menu-mp-message-template-update'),
('1', 'menu-mp-message-template-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mp-message-template'),
('1', 'menu-mp-message-template-query'),
('1', 'menu-mp-message-template-create'),
('1', 'menu-mp-message-template-update'),
('1', 'menu-mp-message-template-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mp/contract/mp-message.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 公众号消息 (MpMessage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mp-message',
  'mp-dir',
  '公众号消息管理',
  '/admin/mp/mp-message',
  'mp/mp-message/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mp:mp_message:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mp-message-query',  'menu-mp-message', '查询公众号消息', 'BUTTON', 'ACTIVE', 'mp:mp_message:query',  1, NOW(), NOW()),
('menu-mp-message-create', 'menu-mp-message', '新增公众号消息', 'BUTTON', 'ACTIVE', 'mp:mp_message:create', 2, NOW(), NOW()),
('menu-mp-message-update', 'menu-mp-message', '修改公众号消息', 'BUTTON', 'ACTIVE', 'mp:mp_message:update', 3, NOW(), NOW()),
('menu-mp-message-delete', 'menu-mp-message', '删除公众号消息', 'BUTTON', 'ACTIVE', 'mp:mp_message:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mp-message'),
('1', 'menu-mp-message-query'),
('1', 'menu-mp-message-create'),
('1', 'menu-mp-message-update'),
('1', 'menu-mp-message-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mp-message'),
('1', 'menu-mp-message-query'),
('1', 'menu-mp-message-create'),
('1', 'menu-mp-message-update'),
('1', 'menu-mp-message-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mp/contract/mp-tag.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 公众号标签 (MpTag)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mp-tag',
  'mp-dir',
  '公众号标签管理',
  '/admin/mp/mp-tag',
  'mp/mp-tag/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mp:mp_tag:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mp-tag-query',  'menu-mp-tag', '查询公众号标签', 'BUTTON', 'ACTIVE', 'mp:mp_tag:query',  1, NOW(), NOW()),
('menu-mp-tag-create', 'menu-mp-tag', '新增公众号标签', 'BUTTON', 'ACTIVE', 'mp:mp_tag:create', 2, NOW(), NOW()),
('menu-mp-tag-update', 'menu-mp-tag', '修改公众号标签', 'BUTTON', 'ACTIVE', 'mp:mp_tag:update', 3, NOW(), NOW()),
('menu-mp-tag-delete', 'menu-mp-tag', '删除公众号标签', 'BUTTON', 'ACTIVE', 'mp:mp_tag:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mp-tag'),
('1', 'menu-mp-tag-query'),
('1', 'menu-mp-tag-create'),
('1', 'menu-mp-tag-update'),
('1', 'menu-mp-tag-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mp-tag'),
('1', 'menu-mp-tag-query'),
('1', 'menu-mp-tag-create'),
('1', 'menu-mp-tag-update'),
('1', 'menu-mp-tag-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-mp/contract/mp-user.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 微信公众号粉丝 (MpUser)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-mp-user',
  'mp-dir',
  '微信公众号粉丝管理',
  '/admin/mp/mp-user',
  'mp/mp-user/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'mp:mp_user:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-mp-user-query',  'menu-mp-user', '查询微信公众号粉丝', 'BUTTON', 'ACTIVE', 'mp:mp_user:query',  1, NOW(), NOW()),
('menu-mp-user-create', 'menu-mp-user', '新增微信公众号粉丝', 'BUTTON', 'ACTIVE', 'mp:mp_user:create', 2, NOW(), NOW()),
('menu-mp-user-update', 'menu-mp-user', '修改微信公众号粉丝', 'BUTTON', 'ACTIVE', 'mp:mp_user:update', 3, NOW(), NOW()),
('menu-mp-user-delete', 'menu-mp-user', '删除微信公众号粉丝', 'BUTTON', 'ACTIVE', 'mp:mp_user:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-mp-user'),
('1', 'menu-mp-user-query'),
('1', 'menu-mp-user-create'),
('1', 'menu-mp-user-update'),
('1', 'menu-mp-user-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-mp-user'),
('1', 'menu-mp-user-query'),
('1', 'menu-mp-user-create'),
('1', 'menu-mp-user-update'),
('1', 'menu-mp-user-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-oa/contract/oa-attendance.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 考勤打卡 (OaAttendance)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-oa-attendance',
  'oa-dir',
  '考勤打卡管理',
  '/admin/oa/oa-attendance',
  'oa/oa-attendance/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'oa:attendance:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-oa-attendance-query',  'menu-oa-attendance', '查询考勤打卡', 'BUTTON', 'ACTIVE', 'oa:attendance:query',  1, NOW(), NOW()),
('menu-oa-attendance-create', 'menu-oa-attendance', '新增考勤打卡', 'BUTTON', 'ACTIVE', 'oa:attendance:create', 2, NOW(), NOW()),
('menu-oa-attendance-update', 'menu-oa-attendance', '修改考勤打卡', 'BUTTON', 'ACTIVE', 'oa:attendance:update', 3, NOW(), NOW()),
('menu-oa-attendance-delete', 'menu-oa-attendance', '删除考勤打卡', 'BUTTON', 'ACTIVE', 'oa:attendance:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-oa-attendance'),
('1', 'menu-oa-attendance-query'),
('1', 'menu-oa-attendance-create'),
('1', 'menu-oa-attendance-update'),
('1', 'menu-oa-attendance-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-oa-attendance'),
('1', 'menu-oa-attendance-query'),
('1', 'menu-oa-attendance-create'),
('1', 'menu-oa-attendance-update'),
('1', 'menu-oa-attendance-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-oa/contract/oa-leave-apply.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 请假用印 (OaLeaveApply)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-oa-leave-apply',
  'oa-dir',
  '请假用印管理',
  '/admin/oa/oa-leave-apply',
  'oa/oa-leave-apply/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'oa:leave-apply:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-oa-leave-apply-query',  'menu-oa-leave-apply', '查询请假用印', 'BUTTON', 'ACTIVE', 'oa:leave-apply:query',  1, NOW(), NOW()),
('menu-oa-leave-apply-create', 'menu-oa-leave-apply', '新增请假用印', 'BUTTON', 'ACTIVE', 'oa:leave-apply:create', 2, NOW(), NOW()),
('menu-oa-leave-apply-update', 'menu-oa-leave-apply', '修改请假用印', 'BUTTON', 'ACTIVE', 'oa:leave-apply:update', 3, NOW(), NOW()),
('menu-oa-leave-apply-delete', 'menu-oa-leave-apply', '删除请假用印', 'BUTTON', 'ACTIVE', 'oa:leave-apply:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-oa-leave-apply'),
('1', 'menu-oa-leave-apply-query'),
('1', 'menu-oa-leave-apply-create'),
('1', 'menu-oa-leave-apply-update'),
('1', 'menu-oa-leave-apply-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-oa-leave-apply'),
('1', 'menu-oa-leave-apply-query'),
('1', 'menu-oa-leave-apply-create'),
('1', 'menu-oa-leave-apply-update'),
('1', 'menu-oa-leave-apply-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-oa/contract/oa-notice.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 通知公告 (OaNotice)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-oa-notice',
  'oa-dir',
  '通知公告管理',
  '/admin/oa/oa-notice',
  'oa/oa-notice/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'oa:notice:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-oa-notice-query',  'menu-oa-notice', '查询通知公告', 'BUTTON', 'ACTIVE', 'oa:notice:query',  1, NOW(), NOW()),
('menu-oa-notice-create', 'menu-oa-notice', '新增通知公告', 'BUTTON', 'ACTIVE', 'oa:notice:create', 2, NOW(), NOW()),
('menu-oa-notice-update', 'menu-oa-notice', '修改通知公告', 'BUTTON', 'ACTIVE', 'oa:notice:update', 3, NOW(), NOW()),
('menu-oa-notice-delete', 'menu-oa-notice', '删除通知公告', 'BUTTON', 'ACTIVE', 'oa:notice:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-oa-notice'),
('1', 'menu-oa-notice-query'),
('1', 'menu-oa-notice-create'),
('1', 'menu-oa-notice-update'),
('1', 'menu-oa-notice-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-oa-notice'),
('1', 'menu-oa-notice-query'),
('1', 'menu-oa-notice-create'),
('1', 'menu-oa-notice-update'),
('1', 'menu-oa-notice-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-app.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家 (PayApp)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-app',
  'pay-dir',
  '支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家管理',
  '/admin/pay/pay-app',
  'pay/pay-app/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_app:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-app-query',  'menu-pay-app', '查询支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家', 'BUTTON', 'ACTIVE', 'pay:pay_app:query',  1, NOW(), NOW()),
('menu-pay-app-create', 'menu-pay-app', '新增支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家', 'BUTTON', 'ACTIVE', 'pay:pay_app:create', 2, NOW(), NOW()),
('menu-pay-app-update', 'menu-pay-app', '修改支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家', 'BUTTON', 'ACTIVE', 'pay:pay_app:update', 3, NOW(), NOW()),
('menu-pay-app-delete', 'menu-pay-app', '删除支付应用 DO一个商户下，可能会有多个支付应用。例如说，京东有京东商城、京东到家', 'BUTTON', 'ACTIVE', 'pay:pay_app:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-app'),
('1', 'menu-pay-app-query'),
('1', 'menu-pay-app-create'),
('1', 'menu-pay-app-update'),
('1', 'menu-pay-app-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-app'),
('1', 'menu-pay-app-query'),
('1', 'menu-pay-app-create'),
('1', 'menu-pay-app-update'),
('1', 'menu-pay-app-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-channel.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P (PayChannel)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-channel',
  'pay-dir',
  '支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P管理',
  '/admin/pay/pay-channel',
  'pay/pay-channel/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_channel:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-channel-query',  'menu-pay-channel', '查询支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P', 'BUTTON', 'ACTIVE', 'pay:pay_channel:query',  1, NOW(), NOW()),
('menu-pay-channel-create', 'menu-pay-channel', '新增支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P', 'BUTTON', 'ACTIVE', 'pay:pay_channel:create', 2, NOW(), NOW()),
('menu-pay-channel-update', 'menu-pay-channel', '修改支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P', 'BUTTON', 'ACTIVE', 'pay:pay_channel:update', 3, NOW(), NOW()),
('menu-pay-channel-delete', 'menu-pay-channel', '删除支付渠道 DO一个应用下，会有多种支付渠道，例如说微信支付、支付宝支付等等即 P', 'BUTTON', 'ACTIVE', 'pay:pay_channel:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-channel'),
('1', 'menu-pay-channel-query'),
('1', 'menu-pay-channel-create'),
('1', 'menu-pay-channel-update'),
('1', 'menu-pay-channel-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-channel'),
('1', 'menu-pay-channel-query'),
('1', 'menu-pay-channel-create'),
('1', 'menu-pay-channel-update'),
('1', 'menu-pay-channel-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-demo-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款 (PayDemoOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-demo-order',
  'pay-dir',
  '示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款管理',
  '/admin/pay/pay-demo-order',
  'pay/pay-demo-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_demo_order:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-demo-order-query',  'menu-pay-demo-order', '查询示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款', 'BUTTON', 'ACTIVE', 'pay:pay_demo_order:query',  1, NOW(), NOW()),
('menu-pay-demo-order-create', 'menu-pay-demo-order', '新增示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款', 'BUTTON', 'ACTIVE', 'pay:pay_demo_order:create', 2, NOW(), NOW()),
('menu-pay-demo-order-update', 'menu-pay-demo-order', '修改示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款', 'BUTTON', 'ACTIVE', 'pay:pay_demo_order:update', 3, NOW(), NOW()),
('menu-pay-demo-order-delete', 'menu-pay-demo-order', '删除示例订单演示业务系统的订单，如何接入 pay 系统的支付与退款', 'BUTTON', 'ACTIVE', 'pay:pay_demo_order:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-demo-order'),
('1', 'menu-pay-demo-order-query'),
('1', 'menu-pay-demo-order-create'),
('1', 'menu-pay-demo-order-update'),
('1', 'menu-pay-demo-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-demo-order'),
('1', 'menu-pay-demo-order-query'),
('1', 'menu-pay-demo-order-create'),
('1', 'menu-pay-demo-order-update'),
('1', 'menu-pay-demo-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-demo-withdraw.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 示例提现订单演示业务系统的转账业务 (PayDemoWithdraw)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-demo-withdraw',
  'pay-dir',
  '示例提现订单演示业务系统的转账业务管理',
  '/admin/pay/pay-demo-withdraw',
  'pay/pay-demo-withdraw/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_demo_withdraw:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-demo-withdraw-query',  'menu-pay-demo-withdraw', '查询示例提现订单演示业务系统的转账业务', 'BUTTON', 'ACTIVE', 'pay:pay_demo_withdraw:query',  1, NOW(), NOW()),
('menu-pay-demo-withdraw-create', 'menu-pay-demo-withdraw', '新增示例提现订单演示业务系统的转账业务', 'BUTTON', 'ACTIVE', 'pay:pay_demo_withdraw:create', 2, NOW(), NOW()),
('menu-pay-demo-withdraw-update', 'menu-pay-demo-withdraw', '修改示例提现订单演示业务系统的转账业务', 'BUTTON', 'ACTIVE', 'pay:pay_demo_withdraw:update', 3, NOW(), NOW()),
('menu-pay-demo-withdraw-delete', 'menu-pay-demo-withdraw', '删除示例提现订单演示业务系统的转账业务', 'BUTTON', 'ACTIVE', 'pay:pay_demo_withdraw:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-demo-withdraw'),
('1', 'menu-pay-demo-withdraw-query'),
('1', 'menu-pay-demo-withdraw-create'),
('1', 'menu-pay-demo-withdraw-update'),
('1', 'menu-pay-demo-withdraw-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-demo-withdraw'),
('1', 'menu-pay-demo-withdraw-query'),
('1', 'menu-pay-demo-withdraw-create'),
('1', 'menu-pay-demo-withdraw-update'),
('1', 'menu-pay-demo-withdraw-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-notify-log.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排 (PayNotifyLog)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-notify-log',
  'pay-dir',
  '商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排管理',
  '/admin/pay/pay-notify-log',
  'pay/pay-notify-log/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_notify_log:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-notify-log-query',  'menu-pay-notify-log', '查询商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排', 'BUTTON', 'ACTIVE', 'pay:pay_notify_log:query',  1, NOW(), NOW()),
('menu-pay-notify-log-create', 'menu-pay-notify-log', '新增商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排', 'BUTTON', 'ACTIVE', 'pay:pay_notify_log:create', 2, NOW(), NOW()),
('menu-pay-notify-log-update', 'menu-pay-notify-log', '修改商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排', 'BUTTON', 'ACTIVE', 'pay:pay_notify_log:update', 3, NOW(), NOW()),
('menu-pay-notify-log-delete', 'menu-pay-notify-log', '删除商户支付、退款等的通知 Log每次通知时，都会在该表中，记录一次 Log，方便排', 'BUTTON', 'ACTIVE', 'pay:pay_notify_log:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-notify-log'),
('1', 'menu-pay-notify-log-query'),
('1', 'menu-pay-notify-log-create'),
('1', 'menu-pay-notify-log-update'),
('1', 'menu-pay-notify-log-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-notify-log'),
('1', 'menu-pay-notify-log-query'),
('1', 'menu-pay-notify-log-create'),
('1', 'menu-pay-notify-log-update'),
('1', 'menu-pay-notify-log-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-notify-task.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直 (PayNotifyTask)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-notify-task',
  'pay-dir',
  '支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直管理',
  '/admin/pay/pay-notify-task',
  'pay/pay-notify-task/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_notify_task:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-notify-task-query',  'menu-pay-notify-task', '查询支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直', 'BUTTON', 'ACTIVE', 'pay:pay_notify_task:query',  1, NOW(), NOW()),
('menu-pay-notify-task-create', 'menu-pay-notify-task', '新增支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直', 'BUTTON', 'ACTIVE', 'pay:pay_notify_task:create', 2, NOW(), NOW()),
('menu-pay-notify-task-update', 'menu-pay-notify-task', '修改支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直', 'BUTTON', 'ACTIVE', 'pay:pay_notify_task:update', 3, NOW(), NOW()),
('menu-pay-notify-task-delete', 'menu-pay-notify-task', '删除支付通知在支付系统收到支付渠道的支付、退款的结果后，需要不断的通知到业务系统，直', 'BUTTON', 'ACTIVE', 'pay:pay_notify_task:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-notify-task'),
('1', 'menu-pay-notify-task-query'),
('1', 'menu-pay-notify-task-create'),
('1', 'menu-pay-notify-task-update'),
('1', 'menu-pay-notify-task-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-notify-task'),
('1', 'menu-pay-notify-task-query'),
('1', 'menu-pay-notify-task-create'),
('1', 'menu-pay-notify-task-update'),
('1', 'menu-pay-notify-task-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-order-extension.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录 (PayOrderExtension)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-order-extension',
  'pay-dir',
  '支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录管理',
  '/admin/pay/pay-order-extension',
  'pay/pay-order-extension/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_order_extension:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-order-extension-query',  'menu-pay-order-extension', '查询支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录', 'BUTTON', 'ACTIVE', 'pay:pay_order_extension:query',  1, NOW(), NOW()),
('menu-pay-order-extension-create', 'menu-pay-order-extension', '新增支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录', 'BUTTON', 'ACTIVE', 'pay:pay_order_extension:create', 2, NOW(), NOW()),
('menu-pay-order-extension-update', 'menu-pay-order-extension', '修改支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录', 'BUTTON', 'ACTIVE', 'pay:pay_order_extension:update', 3, NOW(), NOW()),
('menu-pay-order-extension-delete', 'menu-pay-order-extension', '删除支付订单拓展 DO每次调用支付渠道，都会生成一条对应记录', 'BUTTON', 'ACTIVE', 'pay:pay_order_extension:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-order-extension'),
('1', 'menu-pay-order-extension-query'),
('1', 'menu-pay-order-extension-create'),
('1', 'menu-pay-order-extension-update'),
('1', 'menu-pay-order-extension-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-order-extension'),
('1', 'menu-pay-order-extension-query'),
('1', 'menu-pay-order-extension-create'),
('1', 'menu-pay-order-extension-update'),
('1', 'menu-pay-order-extension-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 支付订单 (PayOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-order',
  'pay-dir',
  '支付订单管理',
  '/admin/pay/pay-order',
  'pay/pay-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_order:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-order-query',  'menu-pay-order', '查询支付订单', 'BUTTON', 'ACTIVE', 'pay:pay_order:query',  1, NOW(), NOW()),
('menu-pay-order-create', 'menu-pay-order', '新增支付订单', 'BUTTON', 'ACTIVE', 'pay:pay_order:create', 2, NOW(), NOW()),
('menu-pay-order-update', 'menu-pay-order', '修改支付订单', 'BUTTON', 'ACTIVE', 'pay:pay_order:update', 3, NOW(), NOW()),
('menu-pay-order-delete', 'menu-pay-order', '删除支付订单', 'BUTTON', 'ACTIVE', 'pay:pay_order:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-order'),
('1', 'menu-pay-order-query'),
('1', 'menu-pay-order-create'),
('1', 'menu-pay-order-update'),
('1', 'menu-pay-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-order'),
('1', 'menu-pay-order-query'),
('1', 'menu-pay-order-create'),
('1', 'menu-pay-order-update'),
('1', 'menu-pay-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-refund.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO : (PayRefund)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-refund',
  'pay-dir',
  '支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO :管理',
  '/admin/pay/pay-refund',
  'pay/pay-refund/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_refund:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-refund-query',  'menu-pay-refund', '查询支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO :', 'BUTTON', 'ACTIVE', 'pay:pay_refund:query',  1, NOW(), NOW()),
('menu-pay-refund-create', 'menu-pay-refund', '新增支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO :', 'BUTTON', 'ACTIVE', 'pay:pay_refund:create', 2, NOW(), NOW()),
('menu-pay-refund-update', 'menu-pay-refund', '修改支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO :', 'BUTTON', 'ACTIVE', 'pay:pay_refund:update', 3, NOW(), NOW()),
('menu-pay-refund-delete', 'menu-pay-refund', '删除支付退款单 DO一个支付订单，可以拥有多个支付退款单即 PayOrderDO :', 'BUTTON', 'ACTIVE', 'pay:pay_refund:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-refund'),
('1', 'menu-pay-refund-query'),
('1', 'menu-pay-refund-create'),
('1', 'menu-pay-refund-update'),
('1', 'menu-pay-refund-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-refund'),
('1', 'menu-pay-refund-query'),
('1', 'menu-pay-refund-create'),
('1', 'menu-pay-refund-update'),
('1', 'menu-pay-refund-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-transfer.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 转账单 (PayTransfer)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-transfer',
  'pay-dir',
  '转账单管理',
  '/admin/pay/pay-transfer',
  'pay/pay-transfer/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_transfer:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-transfer-query',  'menu-pay-transfer', '查询转账单', 'BUTTON', 'ACTIVE', 'pay:pay_transfer:query',  1, NOW(), NOW()),
('menu-pay-transfer-create', 'menu-pay-transfer', '新增转账单', 'BUTTON', 'ACTIVE', 'pay:pay_transfer:create', 2, NOW(), NOW()),
('menu-pay-transfer-update', 'menu-pay-transfer', '修改转账单', 'BUTTON', 'ACTIVE', 'pay:pay_transfer:update', 3, NOW(), NOW()),
('menu-pay-transfer-delete', 'menu-pay-transfer', '删除转账单', 'BUTTON', 'ACTIVE', 'pay:pay_transfer:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-transfer'),
('1', 'menu-pay-transfer-query'),
('1', 'menu-pay-transfer-create'),
('1', 'menu-pay-transfer-update'),
('1', 'menu-pay-transfer-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-transfer'),
('1', 'menu-pay-transfer-query'),
('1', 'menu-pay-transfer-create'),
('1', 'menu-pay-transfer-update'),
('1', 'menu-pay-transfer-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-wallet-recharge-package.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额； (PayWalletRechargePackage)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-wallet-recharge-package',
  'pay-dir',
  '会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额；管理',
  '/admin/pay/pay-wallet-recharge-package',
  'pay/pay-wallet-recharge-package/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_wallet_recharge_package:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-wallet-recharge-package-query',  'menu-pay-wallet-recharge-package', '查询会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额；', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_recharge_package:query',  1, NOW(), NOW()),
('menu-pay-wallet-recharge-package-create', 'menu-pay-wallet-recharge-package', '新增会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额；', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_recharge_package:create', 2, NOW(), NOW()),
('menu-pay-wallet-recharge-package-update', 'menu-pay-wallet-recharge-package', '修改会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额；', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_recharge_package:update', 3, NOW(), NOW()),
('menu-pay-wallet-recharge-package-delete', 'menu-pay-wallet-recharge-package', '删除会员钱包充值套餐 DO通过充值套餐时，可以赠送一定金额；', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_recharge_package:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-wallet-recharge-package'),
('1', 'menu-pay-wallet-recharge-package-query'),
('1', 'menu-pay-wallet-recharge-package-create'),
('1', 'menu-pay-wallet-recharge-package-update'),
('1', 'menu-pay-wallet-recharge-package-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-wallet-recharge-package'),
('1', 'menu-pay-wallet-recharge-package-query'),
('1', 'menu-pay-wallet-recharge-package-create'),
('1', 'menu-pay-wallet-recharge-package-update'),
('1', 'menu-pay-wallet-recharge-package-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-wallet-recharge.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员钱包充值 (PayWalletRecharge)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-wallet-recharge',
  'pay-dir',
  '会员钱包充值管理',
  '/admin/pay/pay-wallet-recharge',
  'pay/pay-wallet-recharge/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_wallet_recharge:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-wallet-recharge-query',  'menu-pay-wallet-recharge', '查询会员钱包充值', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_recharge:query',  1, NOW(), NOW()),
('menu-pay-wallet-recharge-create', 'menu-pay-wallet-recharge', '新增会员钱包充值', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_recharge:create', 2, NOW(), NOW()),
('menu-pay-wallet-recharge-update', 'menu-pay-wallet-recharge', '修改会员钱包充值', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_recharge:update', 3, NOW(), NOW()),
('menu-pay-wallet-recharge-delete', 'menu-pay-wallet-recharge', '删除会员钱包充值', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_recharge:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-wallet-recharge'),
('1', 'menu-pay-wallet-recharge-query'),
('1', 'menu-pay-wallet-recharge-create'),
('1', 'menu-pay-wallet-recharge-update'),
('1', 'menu-pay-wallet-recharge-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-wallet-recharge'),
('1', 'menu-pay-wallet-recharge-query'),
('1', 'menu-pay-wallet-recharge-create'),
('1', 'menu-pay-wallet-recharge-update'),
('1', 'menu-pay-wallet-recharge-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-wallet-transaction.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员钱包流水 (PayWalletTransaction)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-wallet-transaction',
  'pay-dir',
  '会员钱包流水管理',
  '/admin/pay/pay-wallet-transaction',
  'pay/pay-wallet-transaction/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_wallet_transaction:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-wallet-transaction-query',  'menu-pay-wallet-transaction', '查询会员钱包流水', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_transaction:query',  1, NOW(), NOW()),
('menu-pay-wallet-transaction-create', 'menu-pay-wallet-transaction', '新增会员钱包流水', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_transaction:create', 2, NOW(), NOW()),
('menu-pay-wallet-transaction-update', 'menu-pay-wallet-transaction', '修改会员钱包流水', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_transaction:update', 3, NOW(), NOW()),
('menu-pay-wallet-transaction-delete', 'menu-pay-wallet-transaction', '删除会员钱包流水', 'BUTTON', 'ACTIVE', 'pay:pay_wallet_transaction:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-wallet-transaction'),
('1', 'menu-pay-wallet-transaction-query'),
('1', 'menu-pay-wallet-transaction-create'),
('1', 'menu-pay-wallet-transaction-update'),
('1', 'menu-pay-wallet-transaction-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-wallet-transaction'),
('1', 'menu-pay-wallet-transaction-query'),
('1', 'menu-pay-wallet-transaction-create'),
('1', 'menu-pay-wallet-transaction-update'),
('1', 'menu-pay-wallet-transaction-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pay/contract/pay-wallet.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 会员钱包 (PayWallet)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pay-wallet',
  'pay-dir',
  '会员钱包管理',
  '/admin/pay/pay-wallet',
  'pay/pay-wallet/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pay:pay_wallet:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pay-wallet-query',  'menu-pay-wallet', '查询会员钱包', 'BUTTON', 'ACTIVE', 'pay:pay_wallet:query',  1, NOW(), NOW()),
('menu-pay-wallet-create', 'menu-pay-wallet', '新增会员钱包', 'BUTTON', 'ACTIVE', 'pay:pay_wallet:create', 2, NOW(), NOW()),
('menu-pay-wallet-update', 'menu-pay-wallet', '修改会员钱包', 'BUTTON', 'ACTIVE', 'pay:pay_wallet:update', 3, NOW(), NOW()),
('menu-pay-wallet-delete', 'menu-pay-wallet', '删除会员钱包', 'BUTTON', 'ACTIVE', 'pay:pay_wallet:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pay-wallet'),
('1', 'menu-pay-wallet-query'),
('1', 'menu-pay-wallet-create'),
('1', 'menu-pay-wallet-update'),
('1', 'menu-pay-wallet-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pay-wallet'),
('1', 'menu-pay-wallet-query'),
('1', 'menu-pay-wallet-create'),
('1', 'menu-pay-wallet-update'),
('1', 'menu-pay-wallet-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pms/contract/pms-milestone.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 里程碑 (PmsMilestone)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pms-milestone',
  'pms-dir',
  '里程碑管理',
  '/admin/pms/pms-milestone',
  'pms/pms-milestone/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pms:milestone:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pms-milestone-query',  'menu-pms-milestone', '查询里程碑', 'BUTTON', 'ACTIVE', 'pms:milestone:query',  1, NOW(), NOW()),
('menu-pms-milestone-create', 'menu-pms-milestone', '新增里程碑', 'BUTTON', 'ACTIVE', 'pms:milestone:create', 2, NOW(), NOW()),
('menu-pms-milestone-update', 'menu-pms-milestone', '修改里程碑', 'BUTTON', 'ACTIVE', 'pms:milestone:update', 3, NOW(), NOW()),
('menu-pms-milestone-delete', 'menu-pms-milestone', '删除里程碑', 'BUTTON', 'ACTIVE', 'pms:milestone:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pms-milestone'),
('1', 'menu-pms-milestone-query'),
('1', 'menu-pms-milestone-create'),
('1', 'menu-pms-milestone-update'),
('1', 'menu-pms-milestone-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pms-milestone'),
('1', 'menu-pms-milestone-query'),
('1', 'menu-pms-milestone-create'),
('1', 'menu-pms-milestone-update'),
('1', 'menu-pms-milestone-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pms/contract/pms-project.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 项目台账 (PmsProject)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pms-project',
  'pms-dir',
  '项目台账管理',
  '/admin/pms/pms-project',
  'pms/pms-project/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pms:project:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pms-project-query',  'menu-pms-project', '查询项目台账', 'BUTTON', 'ACTIVE', 'pms:project:query',  1, NOW(), NOW()),
('menu-pms-project-create', 'menu-pms-project', '新增项目台账', 'BUTTON', 'ACTIVE', 'pms:project:create', 2, NOW(), NOW()),
('menu-pms-project-update', 'menu-pms-project', '修改项目台账', 'BUTTON', 'ACTIVE', 'pms:project:update', 3, NOW(), NOW()),
('menu-pms-project-delete', 'menu-pms-project', '删除项目台账', 'BUTTON', 'ACTIVE', 'pms:project:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pms-project'),
('1', 'menu-pms-project-query'),
('1', 'menu-pms-project-create'),
('1', 'menu-pms-project-update'),
('1', 'menu-pms-project-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pms-project'),
('1', 'menu-pms-project-query'),
('1', 'menu-pms-project-create'),
('1', 'menu-pms-project-update'),
('1', 'menu-pms-project-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-pms/contract/pms-timesheet.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 任务工时 (PmsTimesheet)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-pms-timesheet',
  'pms-dir',
  '任务工时管理',
  '/admin/pms/pms-timesheet',
  'pms/pms-timesheet/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'pms:timesheet:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-pms-timesheet-query',  'menu-pms-timesheet', '查询任务工时', 'BUTTON', 'ACTIVE', 'pms:timesheet:query',  1, NOW(), NOW()),
('menu-pms-timesheet-create', 'menu-pms-timesheet', '新增任务工时', 'BUTTON', 'ACTIVE', 'pms:timesheet:create', 2, NOW(), NOW()),
('menu-pms-timesheet-update', 'menu-pms-timesheet', '修改任务工时', 'BUTTON', 'ACTIVE', 'pms:timesheet:update', 3, NOW(), NOW()),
('menu-pms-timesheet-delete', 'menu-pms-timesheet', '删除任务工时', 'BUTTON', 'ACTIVE', 'pms:timesheet:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-pms-timesheet'),
('1', 'menu-pms-timesheet-query'),
('1', 'menu-pms-timesheet-create'),
('1', 'menu-pms-timesheet-update'),
('1', 'menu-pms-timesheet-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-pms-timesheet'),
('1', 'menu-pms-timesheet-query'),
('1', 'menu-pms-timesheet-create'),
('1', 'menu-pms-timesheet-update'),
('1', 'menu-pms-timesheet-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-report/contract/go-view-project.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for GoView 项目表每个大屏图标，对应一个项目 (GoViewProject)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-go-view-project',
  'report-dir',
  'GoView 项目表每个大屏图标，对应一个项目管理',
  '/admin/report/go-view-project',
  'report/go-view-project/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'report:go_view_project:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-go-view-project-query',  'menu-go-view-project', '查询GoView 项目表每个大屏图标，对应一个项目', 'BUTTON', 'ACTIVE', 'report:go_view_project:query',  1, NOW(), NOW()),
('menu-go-view-project-create', 'menu-go-view-project', '新增GoView 项目表每个大屏图标，对应一个项目', 'BUTTON', 'ACTIVE', 'report:go_view_project:create', 2, NOW(), NOW()),
('menu-go-view-project-update', 'menu-go-view-project', '修改GoView 项目表每个大屏图标，对应一个项目', 'BUTTON', 'ACTIVE', 'report:go_view_project:update', 3, NOW(), NOW()),
('menu-go-view-project-delete', 'menu-go-view-project', '删除GoView 项目表每个大屏图标，对应一个项目', 'BUTTON', 'ACTIVE', 'report:go_view_project:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-go-view-project'),
('1', 'menu-go-view-project-query'),
('1', 'menu-go-view-project-create'),
('1', 'menu-go-view-project-update'),
('1', 'menu-go-view-project-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-go-view-project'),
('1', 'menu-go-view-project-query'),
('1', 'menu-go-view-project-create'),
('1', 'menu-go-view-project-update'),
('1', 'menu-go-view-project-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-check-order-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 盘点明细 (WmsCheckOrderDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-check-order-detail',
  'wms-dir',
  '盘点明细管理',
  '/admin/wms/wms-check-order-detail',
  'wms/wms-check-order-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:check:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-check-order-detail-query',  'menu-wms-check-order-detail', '查询盘点明细', 'BUTTON', 'ACTIVE', 'wms:check:query',  1, NOW(), NOW()),
('menu-wms-check-order-detail-create', 'menu-wms-check-order-detail', '新增盘点明细', 'BUTTON', 'ACTIVE', 'wms:check:create', 2, NOW(), NOW()),
('menu-wms-check-order-detail-update', 'menu-wms-check-order-detail', '修改盘点明细', 'BUTTON', 'ACTIVE', 'wms:check:update', 3, NOW(), NOW()),
('menu-wms-check-order-detail-delete', 'menu-wms-check-order-detail', '删除盘点明细', 'BUTTON', 'ACTIVE', 'wms:check:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-check-order-detail'),
('1', 'menu-wms-check-order-detail-query'),
('1', 'menu-wms-check-order-detail-create'),
('1', 'menu-wms-check-order-detail-update'),
('1', 'menu-wms-check-order-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-check-order-detail'),
('1', 'menu-wms-check-order-detail-query'),
('1', 'menu-wms-check-order-detail-create'),
('1', 'menu-wms-check-order-detail-update'),
('1', 'menu-wms-check-order-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-check-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 盘点单 (WmsCheckOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-check-order',
  'wms-dir',
  '盘点单管理',
  '/admin/wms/wms-check-order',
  'wms/wms-check-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:check:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-check-order-query',  'menu-wms-check-order', '查询盘点单', 'BUTTON', 'ACTIVE', 'wms:check:query',  1, NOW(), NOW()),
('menu-wms-check-order-create', 'menu-wms-check-order', '新增盘点单', 'BUTTON', 'ACTIVE', 'wms:check:create', 2, NOW(), NOW()),
('menu-wms-check-order-update', 'menu-wms-check-order', '修改盘点单', 'BUTTON', 'ACTIVE', 'wms:check:update', 3, NOW(), NOW()),
('menu-wms-check-order-delete', 'menu-wms-check-order', '删除盘点单', 'BUTTON', 'ACTIVE', 'wms:check:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-check-order'),
('1', 'menu-wms-check-order-query'),
('1', 'menu-wms-check-order-create'),
('1', 'menu-wms-check-order-update'),
('1', 'menu-wms-check-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-check-order'),
('1', 'menu-wms-check-order-query'),
('1', 'menu-wms-check-order-create'),
('1', 'menu-wms-check-order-update'),
('1', 'menu-wms-check-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-inventory-history.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 库存流水 (WmsInventoryHistory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-inventory-history',
  'wms-dir',
  '库存流水管理',
  '/admin/wms/wms-inventory-history',
  'wms/wms-inventory-history/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:inventory-history:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-inventory-history-query',  'menu-wms-inventory-history', '查询库存流水', 'BUTTON', 'ACTIVE', 'wms:inventory-history:query',  1, NOW(), NOW()),
('menu-wms-inventory-history-create', 'menu-wms-inventory-history', '新增库存流水', 'BUTTON', 'ACTIVE', 'wms:inventory-history:create', 2, NOW(), NOW()),
('menu-wms-inventory-history-update', 'menu-wms-inventory-history', '修改库存流水', 'BUTTON', 'ACTIVE', 'wms:inventory-history:update', 3, NOW(), NOW()),
('menu-wms-inventory-history-delete', 'menu-wms-inventory-history', '删除库存流水', 'BUTTON', 'ACTIVE', 'wms:inventory-history:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-inventory-history'),
('1', 'menu-wms-inventory-history-query'),
('1', 'menu-wms-inventory-history-create'),
('1', 'menu-wms-inventory-history-update'),
('1', 'menu-wms-inventory-history-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-inventory-history'),
('1', 'menu-wms-inventory-history-query'),
('1', 'menu-wms-inventory-history-create'),
('1', 'menu-wms-inventory-history-update'),
('1', 'menu-wms-inventory-history-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-inventory.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 实时库存 (WmsInventory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-inventory',
  'wms-dir',
  '实时库存管理',
  '/admin/wms/wms-inventory',
  'wms/wms-inventory/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:inventory:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-inventory-query',  'menu-wms-inventory', '查询实时库存', 'BUTTON', 'ACTIVE', 'wms:inventory:query',  1, NOW(), NOW()),
('menu-wms-inventory-create', 'menu-wms-inventory', '新增实时库存', 'BUTTON', 'ACTIVE', 'wms:inventory:create', 2, NOW(), NOW()),
('menu-wms-inventory-update', 'menu-wms-inventory', '修改实时库存', 'BUTTON', 'ACTIVE', 'wms:inventory:update', 3, NOW(), NOW()),
('menu-wms-inventory-delete', 'menu-wms-inventory', '删除实时库存', 'BUTTON', 'ACTIVE', 'wms:inventory:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-inventory'),
('1', 'menu-wms-inventory-query'),
('1', 'menu-wms-inventory-create'),
('1', 'menu-wms-inventory-update'),
('1', 'menu-wms-inventory-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-inventory'),
('1', 'menu-wms-inventory-query'),
('1', 'menu-wms-inventory-create'),
('1', 'menu-wms-inventory-update'),
('1', 'menu-wms-inventory-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-item-brand.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 物料品牌 (WmsItemBrand)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-item-brand',
  'wms-dir',
  '物料品牌管理',
  '/admin/wms/wms-item-brand',
  'wms/wms-item-brand/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:brand:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-item-brand-query',  'menu-wms-item-brand', '查询物料品牌', 'BUTTON', 'ACTIVE', 'wms:brand:query',  1, NOW(), NOW()),
('menu-wms-item-brand-create', 'menu-wms-item-brand', '新增物料品牌', 'BUTTON', 'ACTIVE', 'wms:brand:create', 2, NOW(), NOW()),
('menu-wms-item-brand-update', 'menu-wms-item-brand', '修改物料品牌', 'BUTTON', 'ACTIVE', 'wms:brand:update', 3, NOW(), NOW()),
('menu-wms-item-brand-delete', 'menu-wms-item-brand', '删除物料品牌', 'BUTTON', 'ACTIVE', 'wms:brand:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-item-brand'),
('1', 'menu-wms-item-brand-query'),
('1', 'menu-wms-item-brand-create'),
('1', 'menu-wms-item-brand-update'),
('1', 'menu-wms-item-brand-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-item-brand'),
('1', 'menu-wms-item-brand-query'),
('1', 'menu-wms-item-brand-create'),
('1', 'menu-wms-item-brand-update'),
('1', 'menu-wms-item-brand-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-item-category.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 物料分类 (WmsItemCategory)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-item-category',
  'wms-dir',
  '物料分类管理',
  '/admin/wms/wms-item-category',
  'wms/wms-item-category/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:category:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-item-category-query',  'menu-wms-item-category', '查询物料分类', 'BUTTON', 'ACTIVE', 'wms:category:query',  1, NOW(), NOW()),
('menu-wms-item-category-create', 'menu-wms-item-category', '新增物料分类', 'BUTTON', 'ACTIVE', 'wms:category:create', 2, NOW(), NOW()),
('menu-wms-item-category-update', 'menu-wms-item-category', '修改物料分类', 'BUTTON', 'ACTIVE', 'wms:category:update', 3, NOW(), NOW()),
('menu-wms-item-category-delete', 'menu-wms-item-category', '删除物料分类', 'BUTTON', 'ACTIVE', 'wms:category:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-item-category'),
('1', 'menu-wms-item-category-query'),
('1', 'menu-wms-item-category-create'),
('1', 'menu-wms-item-category-update'),
('1', 'menu-wms-item-category-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-item-category'),
('1', 'menu-wms-item-category-query'),
('1', 'menu-wms-item-category-create'),
('1', 'menu-wms-item-category-update'),
('1', 'menu-wms-item-category-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-item-sku.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 物料SKU (WmsItemSku)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-item-sku',
  'wms-dir',
  '物料SKU管理',
  '/admin/wms/wms-item-sku',
  'wms/wms-item-sku/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-item-sku-query',  'menu-wms-item-sku', '查询物料SKU', 'BUTTON', 'ACTIVE', 'wms:item:query',  1, NOW(), NOW()),
('menu-wms-item-sku-create', 'menu-wms-item-sku', '新增物料SKU', 'BUTTON', 'ACTIVE', 'wms:item:create', 2, NOW(), NOW()),
('menu-wms-item-sku-update', 'menu-wms-item-sku', '修改物料SKU', 'BUTTON', 'ACTIVE', 'wms:item:update', 3, NOW(), NOW()),
('menu-wms-item-sku-delete', 'menu-wms-item-sku', '删除物料SKU', 'BUTTON', 'ACTIVE', 'wms:item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-item-sku'),
('1', 'menu-wms-item-sku-query'),
('1', 'menu-wms-item-sku-create'),
('1', 'menu-wms-item-sku-update'),
('1', 'menu-wms-item-sku-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-item-sku'),
('1', 'menu-wms-item-sku-query'),
('1', 'menu-wms-item-sku-create'),
('1', 'menu-wms-item-sku-update'),
('1', 'menu-wms-item-sku-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-item.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 物料主数据 (WmsItem)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-item',
  'wms-dir',
  '物料主数据管理',
  '/admin/wms/wms-item',
  'wms/wms-item/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:item:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-item-query',  'menu-wms-item', '查询物料主数据', 'BUTTON', 'ACTIVE', 'wms:item:query',  1, NOW(), NOW()),
('menu-wms-item-create', 'menu-wms-item', '新增物料主数据', 'BUTTON', 'ACTIVE', 'wms:item:create', 2, NOW(), NOW()),
('menu-wms-item-update', 'menu-wms-item', '修改物料主数据', 'BUTTON', 'ACTIVE', 'wms:item:update', 3, NOW(), NOW()),
('menu-wms-item-delete', 'menu-wms-item', '删除物料主数据', 'BUTTON', 'ACTIVE', 'wms:item:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-item'),
('1', 'menu-wms-item-query'),
('1', 'menu-wms-item-create'),
('1', 'menu-wms-item-update'),
('1', 'menu-wms-item-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-item'),
('1', 'menu-wms-item-query'),
('1', 'menu-wms-item-create'),
('1', 'menu-wms-item-update'),
('1', 'menu-wms-item-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-merchant.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 货主管理 (WmsMerchant)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-merchant',
  'wms-dir',
  '货主管理管理',
  '/admin/wms/wms-merchant',
  'wms/wms-merchant/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:merchant:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-merchant-query',  'menu-wms-merchant', '查询货主管理', 'BUTTON', 'ACTIVE', 'wms:merchant:query',  1, NOW(), NOW()),
('menu-wms-merchant-create', 'menu-wms-merchant', '新增货主管理', 'BUTTON', 'ACTIVE', 'wms:merchant:create', 2, NOW(), NOW()),
('menu-wms-merchant-update', 'menu-wms-merchant', '修改货主管理', 'BUTTON', 'ACTIVE', 'wms:merchant:update', 3, NOW(), NOW()),
('menu-wms-merchant-delete', 'menu-wms-merchant', '删除货主管理', 'BUTTON', 'ACTIVE', 'wms:merchant:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-merchant'),
('1', 'menu-wms-merchant-query'),
('1', 'menu-wms-merchant-create'),
('1', 'menu-wms-merchant-update'),
('1', 'menu-wms-merchant-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-merchant'),
('1', 'menu-wms-merchant-query'),
('1', 'menu-wms-merchant-create'),
('1', 'menu-wms-merchant-update'),
('1', 'menu-wms-merchant-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-movement-order-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 移库明细 (WmsMovementOrderDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-movement-order-detail',
  'wms-dir',
  '移库明细管理',
  '/admin/wms/wms-movement-order-detail',
  'wms/wms-movement-order-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:movement:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-movement-order-detail-query',  'menu-wms-movement-order-detail', '查询移库明细', 'BUTTON', 'ACTIVE', 'wms:movement:query',  1, NOW(), NOW()),
('menu-wms-movement-order-detail-create', 'menu-wms-movement-order-detail', '新增移库明细', 'BUTTON', 'ACTIVE', 'wms:movement:create', 2, NOW(), NOW()),
('menu-wms-movement-order-detail-update', 'menu-wms-movement-order-detail', '修改移库明细', 'BUTTON', 'ACTIVE', 'wms:movement:update', 3, NOW(), NOW()),
('menu-wms-movement-order-detail-delete', 'menu-wms-movement-order-detail', '删除移库明细', 'BUTTON', 'ACTIVE', 'wms:movement:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-movement-order-detail'),
('1', 'menu-wms-movement-order-detail-query'),
('1', 'menu-wms-movement-order-detail-create'),
('1', 'menu-wms-movement-order-detail-update'),
('1', 'menu-wms-movement-order-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-movement-order-detail'),
('1', 'menu-wms-movement-order-detail-query'),
('1', 'menu-wms-movement-order-detail-create'),
('1', 'menu-wms-movement-order-detail-update'),
('1', 'menu-wms-movement-order-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-movement-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 移库单 (WmsMovementOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-movement-order',
  'wms-dir',
  '移库单管理',
  '/admin/wms/wms-movement-order',
  'wms/wms-movement-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:movement:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-movement-order-query',  'menu-wms-movement-order', '查询移库单', 'BUTTON', 'ACTIVE', 'wms:movement:query',  1, NOW(), NOW()),
('menu-wms-movement-order-create', 'menu-wms-movement-order', '新增移库单', 'BUTTON', 'ACTIVE', 'wms:movement:create', 2, NOW(), NOW()),
('menu-wms-movement-order-update', 'menu-wms-movement-order', '修改移库单', 'BUTTON', 'ACTIVE', 'wms:movement:update', 3, NOW(), NOW()),
('menu-wms-movement-order-delete', 'menu-wms-movement-order', '删除移库单', 'BUTTON', 'ACTIVE', 'wms:movement:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-movement-order'),
('1', 'menu-wms-movement-order-query'),
('1', 'menu-wms-movement-order-create'),
('1', 'menu-wms-movement-order-update'),
('1', 'menu-wms-movement-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-movement-order'),
('1', 'menu-wms-movement-order-query'),
('1', 'menu-wms-movement-order-create'),
('1', 'menu-wms-movement-order-update'),
('1', 'menu-wms-movement-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-receipt-order-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 入库明细 (WmsReceiptOrderDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-receipt-order-detail',
  'wms-dir',
  '入库明细管理',
  '/admin/wms/wms-receipt-order-detail',
  'wms/wms-receipt-order-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:receipt:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-receipt-order-detail-query',  'menu-wms-receipt-order-detail', '查询入库明细', 'BUTTON', 'ACTIVE', 'wms:receipt:query',  1, NOW(), NOW()),
('menu-wms-receipt-order-detail-create', 'menu-wms-receipt-order-detail', '新增入库明细', 'BUTTON', 'ACTIVE', 'wms:receipt:create', 2, NOW(), NOW()),
('menu-wms-receipt-order-detail-update', 'menu-wms-receipt-order-detail', '修改入库明细', 'BUTTON', 'ACTIVE', 'wms:receipt:update', 3, NOW(), NOW()),
('menu-wms-receipt-order-detail-delete', 'menu-wms-receipt-order-detail', '删除入库明细', 'BUTTON', 'ACTIVE', 'wms:receipt:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-receipt-order-detail'),
('1', 'menu-wms-receipt-order-detail-query'),
('1', 'menu-wms-receipt-order-detail-create'),
('1', 'menu-wms-receipt-order-detail-update'),
('1', 'menu-wms-receipt-order-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-receipt-order-detail'),
('1', 'menu-wms-receipt-order-detail-query'),
('1', 'menu-wms-receipt-order-detail-create'),
('1', 'menu-wms-receipt-order-detail-update'),
('1', 'menu-wms-receipt-order-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-receipt-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 入库单 (WmsReceiptOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-receipt-order',
  'wms-dir',
  '入库单管理',
  '/admin/wms/wms-receipt-order',
  'wms/wms-receipt-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:receipt:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-receipt-order-query',  'menu-wms-receipt-order', '查询入库单', 'BUTTON', 'ACTIVE', 'wms:receipt:query',  1, NOW(), NOW()),
('menu-wms-receipt-order-create', 'menu-wms-receipt-order', '新增入库单', 'BUTTON', 'ACTIVE', 'wms:receipt:create', 2, NOW(), NOW()),
('menu-wms-receipt-order-update', 'menu-wms-receipt-order', '修改入库单', 'BUTTON', 'ACTIVE', 'wms:receipt:update', 3, NOW(), NOW()),
('menu-wms-receipt-order-delete', 'menu-wms-receipt-order', '删除入库单', 'BUTTON', 'ACTIVE', 'wms:receipt:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-receipt-order'),
('1', 'menu-wms-receipt-order-query'),
('1', 'menu-wms-receipt-order-create'),
('1', 'menu-wms-receipt-order-update'),
('1', 'menu-wms-receipt-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-receipt-order'),
('1', 'menu-wms-receipt-order-query'),
('1', 'menu-wms-receipt-order-create'),
('1', 'menu-wms-receipt-order-update'),
('1', 'menu-wms-receipt-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-shipment-order-detail.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 出库明细 (WmsShipmentOrderDetail)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-shipment-order-detail',
  'wms-dir',
  '出库明细管理',
  '/admin/wms/wms-shipment-order-detail',
  'wms/wms-shipment-order-detail/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:shipment:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-shipment-order-detail-query',  'menu-wms-shipment-order-detail', '查询出库明细', 'BUTTON', 'ACTIVE', 'wms:shipment:query',  1, NOW(), NOW()),
('menu-wms-shipment-order-detail-create', 'menu-wms-shipment-order-detail', '新增出库明细', 'BUTTON', 'ACTIVE', 'wms:shipment:create', 2, NOW(), NOW()),
('menu-wms-shipment-order-detail-update', 'menu-wms-shipment-order-detail', '修改出库明细', 'BUTTON', 'ACTIVE', 'wms:shipment:update', 3, NOW(), NOW()),
('menu-wms-shipment-order-detail-delete', 'menu-wms-shipment-order-detail', '删除出库明细', 'BUTTON', 'ACTIVE', 'wms:shipment:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-shipment-order-detail'),
('1', 'menu-wms-shipment-order-detail-query'),
('1', 'menu-wms-shipment-order-detail-create'),
('1', 'menu-wms-shipment-order-detail-update'),
('1', 'menu-wms-shipment-order-detail-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-shipment-order-detail'),
('1', 'menu-wms-shipment-order-detail-query'),
('1', 'menu-wms-shipment-order-detail-create'),
('1', 'menu-wms-shipment-order-detail-update'),
('1', 'menu-wms-shipment-order-detail-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-shipment-order.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 出库单 (WmsShipmentOrder)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-shipment-order',
  'wms-dir',
  '出库单管理',
  '/admin/wms/wms-shipment-order',
  'wms/wms-shipment-order/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:shipment:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-shipment-order-query',  'menu-wms-shipment-order', '查询出库单', 'BUTTON', 'ACTIVE', 'wms:shipment:query',  1, NOW(), NOW()),
('menu-wms-shipment-order-create', 'menu-wms-shipment-order', '新增出库单', 'BUTTON', 'ACTIVE', 'wms:shipment:create', 2, NOW(), NOW()),
('menu-wms-shipment-order-update', 'menu-wms-shipment-order', '修改出库单', 'BUTTON', 'ACTIVE', 'wms:shipment:update', 3, NOW(), NOW()),
('menu-wms-shipment-order-delete', 'menu-wms-shipment-order', '删除出库单', 'BUTTON', 'ACTIVE', 'wms:shipment:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-shipment-order'),
('1', 'menu-wms-shipment-order-query'),
('1', 'menu-wms-shipment-order-create'),
('1', 'menu-wms-shipment-order-update'),
('1', 'menu-wms-shipment-order-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-shipment-order'),
('1', 'menu-wms-shipment-order-query'),
('1', 'menu-wms-shipment-order-create'),
('1', 'menu-wms-shipment-order-update'),
('1', 'menu-wms-shipment-order-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;

-- >>> packages/plugins/plugin-wms/contract/wms-warehouse.rbac.sql
-- ============================================================
-- Auto-generated RBAC & Menu Migration for 智能仓库 (WmsWarehouse)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-wms-warehouse',
  'wms-dir',
  '智能仓库管理',
  '/admin/wms/wms-warehouse',
  'wms/wms-warehouse/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'wms:warehouse:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-wms-warehouse-query',  'menu-wms-warehouse', '查询智能仓库', 'BUTTON', 'ACTIVE', 'wms:warehouse:query',  1, NOW(), NOW()),
('menu-wms-warehouse-create', 'menu-wms-warehouse', '新增智能仓库', 'BUTTON', 'ACTIVE', 'wms:warehouse:create', 2, NOW(), NOW()),
('menu-wms-warehouse-update', 'menu-wms-warehouse', '修改智能仓库', 'BUTTON', 'ACTIVE', 'wms:warehouse:update', 3, NOW(), NOW()),
('menu-wms-warehouse-delete', 'menu-wms-warehouse', '删除智能仓库', 'BUTTON', 'ACTIVE', 'wms:warehouse:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
WITH v(role_id, menu_id) AS (VALUES
('1', 'menu-wms-warehouse'),
('1', 'menu-wms-warehouse-query'),
('1', 'menu-wms-warehouse-create'),
('1', 'menu-wms-warehouse-update'),
('1', 'menu-wms-warehouse-delete')
)
INSERT INTO system_role_menu (id, role_id, menu_id)
SELECT 'rm-' || v.role_id || '-' || v.menu_id, v.role_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_role g WHERE g.id = v.role_id)
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
WITH v(package_id, menu_id) AS (VALUES
('1', 'menu-wms-warehouse'),
('1', 'menu-wms-warehouse-query'),
('1', 'menu-wms-warehouse-create'),
('1', 'menu-wms-warehouse-update'),
('1', 'menu-wms-warehouse-delete')
)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
SELECT 'pm-' || v.package_id || '-' || v.menu_id, v.package_id, v.menu_id FROM v
WHERE EXISTS (SELECT 1 FROM system_tenant_package g WHERE g.id = v.package_id)
ON CONFLICT DO NOTHING;
