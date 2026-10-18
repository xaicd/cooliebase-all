-- CoolieBase's upstream package source is retained in generated seed files, but its
-- control-plane entries must never be persisted as tenant-package permissions.
-- Identify control roots by stable route/component/permission fields as well as
-- legacy display names, then recursively remove every descendant.
WITH RECURSIVE platform_control_menus AS (
  SELECT "id"
  FROM "system_menu"
  WHERE "deleted" = false
    AND (
      "name" IN ('租户管理', '租户套餐', '数据源配置', 'OAuth 2.0', '令牌管理', '应用管理')
      OR "permission" LIKE 'system:tenant:%'
      OR "permission" LIKE 'system:tenant-package:%'
      OR "permission" LIKE 'system:oauth2-%'
      OR "permission" LIKE 'infra:data-source-config:%'
      OR TRIM(BOTH '/' FROM COALESCE("path", '')) IN ('tenant', 'tenant-package', 'data-source-config', 'oauth2', 'oauth2/application')
      OR TRIM(BOTH '/' FROM COALESCE("component", '')) IN ('system/tenant/index', 'system/tenantPackage/index', 'infra/dataSourceConfig/index', 'system/oauth2/token/index', 'system/oauth2/client/index')
    )
  UNION
  SELECT child."id"
  FROM "system_menu" AS child
  INNER JOIN platform_control_menus AS parent ON child."parent_id" = parent."id"
  WHERE child."deleted" = false
), invalid_package_menus AS (
  SELECT package_menu."package_id", package_menu."menu_id"
  FROM "system_tenant_package_menu" AS package_menu
  LEFT JOIN "system_menu" AS menu ON menu."id" = package_menu."menu_id"
  WHERE menu."id" IS NULL
     OR menu."deleted" = true
     OR menu."status" <> 'ACTIVE'
     OR package_menu."menu_id" IN (SELECT "id" FROM platform_control_menus)
)
DELETE FROM "system_tenant_package_menu" AS package_menu
USING invalid_package_menus AS invalid
WHERE package_menu."package_id" = invalid."package_id"
  AND package_menu."menu_id" = invalid."menu_id";

-- Keep tenant-local role grants physically consistent with the effective active
-- package, including package updates made before this migration was deployed.
DELETE FROM "system_role_menu" AS role_menu
USING "system_role" AS role, "system_tenant" AS tenant
WHERE role_menu."role_id" = role."id"
  AND role."tenant_id" = tenant."id"
  AND tenant."deleted" = false
  AND (
    NOT EXISTS (
      SELECT 1
      FROM "system_tenant_package_menu" AS package_menu
      WHERE package_menu."package_id" = tenant."package_id"
        AND package_menu."menu_id" = role_menu."menu_id"
    )
    OR NOT EXISTS (
      SELECT 1
      FROM "system_menu" AS menu
      WHERE menu."id" = role_menu."menu_id"
        AND menu."deleted" = false
        AND menu."status" = 'ACTIVE'
    )
  );
