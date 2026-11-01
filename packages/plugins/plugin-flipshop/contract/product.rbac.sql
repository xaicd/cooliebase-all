-- ============================================================
-- 翻牌小店 (flipshop) · 商品 (FlipProduct) RBAC & 菜单迁移
-- 权限码与 OpenAPI / route.manifest.yaml / module.manifest.json 保持一一对应。
-- ============================================================

-- 1. 商品菜单目录节点
INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at)
VALUES (
  'menu-flipshop-product',
  NULL,
  '商品管理',
  '/admin/flipshop/products',
  'flipshop/product/index',
  'table',
  10,
  'MENU',
  'ACTIVE',
  'flipshop:product:query',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. 本期 2 个动词按钮权限（详情复用 query；编辑/删除本期不做）
INSERT INTO system_menu (id, parent_id, name, type, status, permission, sort, created_at, updated_at) VALUES
('menu-flipshop-product-query',  'menu-flipshop-product', '查询商品', 'BUTTON', 'ACTIVE', 'flipshop:product:query',  1, NOW(), NOW()),
('menu-flipshop-product-create', 'menu-flipshop-product', '新增商品', 'BUTTON', 'ACTIVE', 'flipshop:product:create', 2, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. 关联管理员角色 (system_role_menu)
INSERT INTO system_role_menu (id, role_id, menu_id) VALUES
('menu-flipshop-product-rm',        '1', 'menu-flipshop-product'),
('menu-flipshop-product-rm-query',  '1', 'menu-flipshop-product-query'),
('menu-flipshop-product-rm-create', '1', 'menu-flipshop-product-create')
ON CONFLICT DO NOTHING;

-- 4. 挂载系统租户套餐 (system_tenant_package_menu，实现租户开户默认立即可见)
INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES
('menu-flipshop-product-pm',        '1', 'menu-flipshop-product'),
('menu-flipshop-product-pm-query',  '1', 'menu-flipshop-product-query'),
('menu-flipshop-product-pm-create', '1', 'menu-flipshop-product-create')
ON CONFLICT DO NOTHING;
