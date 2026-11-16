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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-oa-notice-rm',        '1', 'menu-oa-notice'),
('menu-oa-notice-rm-query',  '1', 'menu-oa-notice-query'),
('menu-oa-notice-rm-create', '1', 'menu-oa-notice-create'),
('menu-oa-notice-rm-update', '1', 'menu-oa-notice-update'),
('menu-oa-notice-rm-delete', '1', 'menu-oa-notice-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-oa-notice-pm',        '1', 'menu-oa-notice'),
('menu-oa-notice-pm-query',  '1', 'menu-oa-notice-query'),
('menu-oa-notice-pm-create', '1', 'menu-oa-notice-create'),
('menu-oa-notice-pm-update', '1', 'menu-oa-notice-update'),
('menu-oa-notice-pm-delete', '1', 'menu-oa-notice-delete')
ON CONFLICT DO NOTHING;
