-- CoolieBase's normal package source includes several platform control-plane menus.
-- Tenant-local roles must never receive those menus or any descendants.
WITH RECURSIVE platform_control_menus AS (
  SELECT "id"
  FROM "system_menu"
  WHERE "deleted" = false
    AND (
      "name" IN ('租户管理', '租户套餐', '数据源配置', 'OAuth 2.0', '令牌管理')
      OR "permission" LIKE 'system:tenant%'
      OR "permission" LIKE 'system:oauth2%'
      OR "permission" LIKE 'infra:data-source-config%'
    )
  UNION
  SELECT child."id"
  FROM "system_menu" AS child
  INNER JOIN platform_control_menus AS parent ON child."parent_id" = parent."id"
  WHERE child."deleted" = false
)
DELETE FROM "system_role_menu" AS role_menu
USING "system_role" AS role
WHERE role_menu."role_id" = role."id"
  AND role."tenant_id" IS NOT NULL
  AND role_menu."menu_id" IN (SELECT "id" FROM platform_control_menus);
