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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-hrm-position-rm',        '1', 'menu-hrm-position'),
('menu-hrm-position-rm-query',  '1', 'menu-hrm-position-query'),
('menu-hrm-position-rm-create', '1', 'menu-hrm-position-create'),
('menu-hrm-position-rm-update', '1', 'menu-hrm-position-update'),
('menu-hrm-position-rm-delete', '1', 'menu-hrm-position-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-hrm-position-pm',        '1', 'menu-hrm-position'),
('menu-hrm-position-pm-query',  '1', 'menu-hrm-position-query'),
('menu-hrm-position-pm-create', '1', 'menu-hrm-position-create'),
('menu-hrm-position-pm-update', '1', 'menu-hrm-position-update'),
('menu-hrm-position-pm-delete', '1', 'menu-hrm-position-delete')
ON CONFLICT DO NOTHING;
