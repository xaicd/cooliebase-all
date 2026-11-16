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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-pms-project-rm',        '1', 'menu-pms-project'),
('menu-pms-project-rm-query',  '1', 'menu-pms-project-query'),
('menu-pms-project-rm-create', '1', 'menu-pms-project-create'),
('menu-pms-project-rm-update', '1', 'menu-pms-project-update'),
('menu-pms-project-rm-delete', '1', 'menu-pms-project-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-pms-project-pm',        '1', 'menu-pms-project'),
('menu-pms-project-pm-query',  '1', 'menu-pms-project-query'),
('menu-pms-project-pm-create', '1', 'menu-pms-project-create'),
('menu-pms-project-pm-update', '1', 'menu-pms-project-update'),
('menu-pms-project-pm-delete', '1', 'menu-pms-project-delete')
ON CONFLICT DO NOTHING;
