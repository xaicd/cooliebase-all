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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-fms-account-rm',        '1', 'menu-fms-account'),
('menu-fms-account-rm-query',  '1', 'menu-fms-account-query'),
('menu-fms-account-rm-create', '1', 'menu-fms-account-create'),
('menu-fms-account-rm-update', '1', 'menu-fms-account-update'),
('menu-fms-account-rm-delete', '1', 'menu-fms-account-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-fms-account-pm',        '1', 'menu-fms-account'),
('menu-fms-account-pm-query',  '1', 'menu-fms-account-query'),
('menu-fms-account-pm-create', '1', 'menu-fms-account-create'),
('menu-fms-account-pm-update', '1', 'menu-fms-account-update'),
('menu-fms-account-pm-delete', '1', 'menu-fms-account-delete')
ON CONFLICT DO NOTHING;
