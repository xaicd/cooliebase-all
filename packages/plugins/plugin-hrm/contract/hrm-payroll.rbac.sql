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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-hrm-payroll-rm',        '1', 'menu-hrm-payroll'),
('menu-hrm-payroll-rm-query',  '1', 'menu-hrm-payroll-query'),
('menu-hrm-payroll-rm-create', '1', 'menu-hrm-payroll-create'),
('menu-hrm-payroll-rm-update', '1', 'menu-hrm-payroll-update'),
('menu-hrm-payroll-rm-delete', '1', 'menu-hrm-payroll-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-hrm-payroll-pm',        '1', 'menu-hrm-payroll'),
('menu-hrm-payroll-pm-query',  '1', 'menu-hrm-payroll-query'),
('menu-hrm-payroll-pm-create', '1', 'menu-hrm-payroll-create'),
('menu-hrm-payroll-pm-update', '1', 'menu-hrm-payroll-update'),
('menu-hrm-payroll-pm-delete', '1', 'menu-hrm-payroll-delete')
ON CONFLICT DO NOTHING;
