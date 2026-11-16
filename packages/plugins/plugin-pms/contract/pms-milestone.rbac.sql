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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-pms-milestone-rm',        '1', 'menu-pms-milestone'),
('menu-pms-milestone-rm-query',  '1', 'menu-pms-milestone-query'),
('menu-pms-milestone-rm-create', '1', 'menu-pms-milestone-create'),
('menu-pms-milestone-rm-update', '1', 'menu-pms-milestone-update'),
('menu-pms-milestone-rm-delete', '1', 'menu-pms-milestone-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-pms-milestone-pm',        '1', 'menu-pms-milestone'),
('menu-pms-milestone-pm-query',  '1', 'menu-pms-milestone-query'),
('menu-pms-milestone-pm-create', '1', 'menu-pms-milestone-create'),
('menu-pms-milestone-pm-update', '1', 'menu-pms-milestone-update'),
('menu-pms-milestone-pm-delete', '1', 'menu-pms-milestone-delete')
ON CONFLICT DO NOTHING;
