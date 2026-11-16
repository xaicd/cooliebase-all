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
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-oa-attendance-rm',        '1', 'menu-oa-attendance'),
('menu-oa-attendance-rm-query',  '1', 'menu-oa-attendance-query'),
('menu-oa-attendance-rm-create', '1', 'menu-oa-attendance-create'),
('menu-oa-attendance-rm-update', '1', 'menu-oa-attendance-update'),
('menu-oa-attendance-rm-delete', '1', 'menu-oa-attendance-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-oa-attendance-pm',        '1', 'menu-oa-attendance'),
('menu-oa-attendance-pm-query',  '1', 'menu-oa-attendance-query'),
('menu-oa-attendance-pm-create', '1', 'menu-oa-attendance-create'),
('menu-oa-attendance-pm-update', '1', 'menu-oa-attendance-update'),
('menu-oa-attendance-pm-delete', '1', 'menu-oa-attendance-delete')
ON CONFLICT DO NOTHING;
