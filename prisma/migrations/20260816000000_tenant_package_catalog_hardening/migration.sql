-- Never rewrite an applied migration. This corrective migration completes the
-- CoolieBase-derived catalog transition without deleting historical package rows.
CREATE INDEX IF NOT EXISTS "system_tenant_package_menu_menu_id_idx"
  ON "system_tenant_package_menu"("menu_id");

-- Package 1 was introduced only by the initial compatibility migration. It is
-- retained for audit but hidden from the active catalog once no tenant uses it.
UPDATE "system_tenant_package"
SET "deleted" = true, "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = '1'
  AND NOT EXISTS (
    SELECT 1 FROM "system_tenant"
    WHERE "system_tenant"."package_id" = "system_tenant_package"."id"
      AND "system_tenant"."deleted" = false
  );
