-- CoolieBase-style platform datasource configuration table.
-- Passwords are stored only as application-layer AES ciphertext in encrypted_password.
CREATE TABLE "infra_data_source_config" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "driver" VARCHAR(30) NOT NULL,
  "url" VARCHAR(1024) NOT NULL,
  "username" VARCHAR(255) NOT NULL,
  "encrypted_password" VARCHAR(2048) NOT NULL,
  "remark" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "infra_data_source_config_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "infra_data_source_config_name_idx" ON "infra_data_source_config"("name");
CREATE INDEX "infra_data_source_config_deleted_idx" ON "infra_data_source_config"("deleted");
