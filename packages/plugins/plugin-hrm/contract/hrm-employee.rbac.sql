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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-hrm-employee-rm',        '1', 'menu-hrm-employee'),
('menu-hrm-employee-rm-query',  '1', 'menu-hrm-employee-query'),
('menu-hrm-employee-rm-create', '1', 'menu-hrm-employee-create'),
('menu-hrm-employee-rm-update', '1', 'menu-hrm-employee-update'),
('menu-hrm-employee-rm-delete', '1', 'menu-hrm-employee-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-hrm-employee-pm',        '1', 'menu-hrm-employee'),
('menu-hrm-employee-pm-query',  '1', 'menu-hrm-employee-query'),
('menu-hrm-employee-pm-create', '1', 'menu-hrm-employee-create'),
('menu-hrm-employee-pm-update', '1', 'menu-hrm-employee-update'),
('menu-hrm-employee-pm-delete', '1', 'menu-hrm-employee-delete')
ON CONFLICT DO NOTHING;
