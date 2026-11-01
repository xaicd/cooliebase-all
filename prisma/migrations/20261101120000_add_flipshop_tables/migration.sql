-- 翻牌小店 (flipshop) · 商品表 flip_product
-- 8 大底座列 + (tenant_id, sku_code) 租户内唯一（软删可复用）+ tenant_id 前导索引。
-- 金额单位「分」(INTEGER)，杜绝浮点误差。

CREATE TABLE IF NOT EXISTS "flip_product" (
  "id" VARCHAR(64) NOT NULL,
  "tenant_id" VARCHAR(64) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "sku_code" VARCHAR(64) NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(16) NOT NULL DEFAULT 'off_shelf',
  "cover_url" VARCHAR(500),
  "description" VARCHAR(2000),
  "created_by" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" VARCHAR(64) NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "flip_product_pkey" PRIMARY KEY ("id")
);

-- 前导列为 tenant_id，保证列表/详情查询走租户隔离索引
CREATE INDEX IF NOT EXISTS "idx_flip_product_tenant_status_active"
  ON "flip_product" ("tenant_id", "status", "deleted_at");

-- 部分唯一索引：仅约束未软删记录，使 SKU 在软删后可复用（INV-PRODUCT-02）
CREATE UNIQUE INDEX IF NOT EXISTS "uk_flip_product_tenant_sku_active"
  ON "flip_product" ("tenant_id", "sku_code") WHERE "deleted_at" IS NULL;
