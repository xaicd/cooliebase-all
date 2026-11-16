-- ============================================================
-- Auto-generated RBAC & Menu Migration for 请假用印 (OaLeaveApply)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-oa-leave-apply',
  'oa-dir',
  '请假用印管理',
  '/admin/oa/oa-leave-apply',
  'oa/oa-leave-apply/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'oa:leave-apply:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-oa-leave-apply-query',  'menu-oa-leave-apply', '查询请假用印', 'BUTTON', 'ACTIVE', 'oa:leave-apply:query',  1, NOW(), NOW()),
('menu-oa-leave-apply-create', 'menu-oa-leave-apply', '新增请假用印', 'BUTTON', 'ACTIVE', 'oa:leave-apply:create', 2, NOW(), NOW()),
('menu-oa-leave-apply-update', 'menu-oa-leave-apply', '修改请假用印', 'BUTTON', 'ACTIVE', 'oa:leave-apply:update', 3, NOW(), NOW()),
('menu-oa-leave-apply-delete', 'menu-oa-leave-apply', '删除请假用印', 'BUTTON', 'ACTIVE', 'oa:leave-apply:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-oa-leave-apply-rm',        '1', 'menu-oa-leave-apply'),
('menu-oa-leave-apply-rm-query',  '1', 'menu-oa-leave-apply-query'),
('menu-oa-leave-apply-rm-create', '1', 'menu-oa-leave-apply-create'),
('menu-oa-leave-apply-rm-update', '1', 'menu-oa-leave-apply-update'),
('menu-oa-leave-apply-rm-delete', '1', 'menu-oa-leave-apply-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-oa-leave-apply-pm',        '1', 'menu-oa-leave-apply'),
('menu-oa-leave-apply-pm-query',  '1', 'menu-oa-leave-apply-query'),
('menu-oa-leave-apply-pm-create', '1', 'menu-oa-leave-apply-create'),
('menu-oa-leave-apply-pm-update', '1', 'menu-oa-leave-apply-update'),
('menu-oa-leave-apply-pm-delete', '1', 'menu-oa-leave-apply-delete')
ON CONFLICT DO NOTHING;
