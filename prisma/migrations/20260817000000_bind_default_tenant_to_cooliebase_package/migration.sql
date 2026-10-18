-- Tenant-local seeded roles (including tenant_admin) need an explicit package
-- boundary. Use the official CoolieBase normal package, not a local draft package.
UPDATE "system_tenant"
SET "package_id" = '111', "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = '1' AND "deleted" = false;
