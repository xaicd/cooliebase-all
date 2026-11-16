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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-pms-timesheet-rm',        '1', 'menu-pms-timesheet'),
('menu-pms-timesheet-rm-query',  '1', 'menu-pms-timesheet-query'),
('menu-pms-timesheet-rm-create', '1', 'menu-pms-timesheet-create'),
('menu-pms-timesheet-rm-update', '1', 'menu-pms-timesheet-update'),
('menu-pms-timesheet-rm-delete', '1', 'menu-pms-timesheet-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-pms-timesheet-pm',        '1', 'menu-pms-timesheet'),
('menu-pms-timesheet-pm-query',  '1', 'menu-pms-timesheet-query'),
('menu-pms-timesheet-pm-create', '1', 'menu-pms-timesheet-create'),
('menu-pms-timesheet-pm-update', '1', 'menu-pms-timesheet-update'),
('menu-pms-timesheet-pm-delete', '1', 'menu-pms-timesheet-delete')
ON CONFLICT DO NOTHING;
