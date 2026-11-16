-- ============================================================
-- Auto-generated RBAC & Menu Migration for 收支凭证 (FmsVoucher)
-- ============================================================

-- 1. 插入菜单目录/页面节点 (system_menu)
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-fms-voucher',
  'fms-dir',
  '收支凭证管理',
  '/admin/fms/fms-voucher',
  'fms/fms-voucher/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'fms:voucher:view',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 插入 4 大动词按钮权限
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-fms-voucher-query',  'menu-fms-voucher', '查询收支凭证', 'BUTTON', 'ACTIVE', 'fms:voucher:query',  1, NOW(), NOW()),
('menu-fms-voucher-create', 'menu-fms-voucher', '新增收支凭证', 'BUTTON', 'ACTIVE', 'fms:voucher:create', 2, NOW(), NOW()),
('menu-fms-voucher-update', 'menu-fms-voucher', '修改收支凭证', 'BUTTON', 'ACTIVE', 'fms:voucher:update', 3, NOW(), NOW()),
('menu-fms-voucher-delete', 'menu-fms-voucher', '删除收支凭证', 'BUTTON', 'ACTIVE', 'fms:voucher:delete', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-fms-voucher-rm',        '1', 'menu-fms-voucher'),
('menu-fms-voucher-rm-query',  '1', 'menu-fms-voucher-query'),
('menu-fms-voucher-rm-create', '1', 'menu-fms-voucher-create'),
('menu-fms-voucher-rm-update', '1', 'menu-fms-voucher-update'),
('menu-fms-voucher-rm-delete', '1', 'menu-fms-voucher-delete')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-fms-voucher-pm',        '1', 'menu-fms-voucher'),
('menu-fms-voucher-pm-query',  '1', 'menu-fms-voucher-query'),
('menu-fms-voucher-pm-create', '1', 'menu-fms-voucher-create'),
('menu-fms-voucher-pm-update', '1', 'menu-fms-voucher-update'),
('menu-fms-voucher-pm-delete', '1', 'menu-fms-voucher-delete')
ON CONFLICT DO NOTHING;
