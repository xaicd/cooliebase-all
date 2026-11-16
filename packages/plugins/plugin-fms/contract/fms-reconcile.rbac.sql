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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-fms-reconcile-rm',        '1', 'menu-fms-reconcile'),
('menu-fms-reconcile-rm-query',  '1', 'menu-fms-reconcile-query'),
('menu-fms-reconcile-rm-create', '1', 'menu-fms-reconcile-create'),
('menu-fms-reconcile-rm-update', '1', 'menu-fms-reconcile-update'),
('menu-fms-reconcile-rm-delete', '1', 'menu-fms-reconcile-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-fms-reconcile-pm',        '1', 'menu-fms-reconcile'),
('menu-fms-reconcile-pm-query',  '1', 'menu-fms-reconcile-query'),
('menu-fms-reconcile-pm-create', '1', 'menu-fms-reconcile-create'),
('menu-fms-reconcile-pm-update', '1', 'menu-fms-reconcile-update'),
('menu-fms-reconcile-pm-delete', '1', 'menu-fms-reconcile-delete')
ON CONFLICT DO NOTHING;
