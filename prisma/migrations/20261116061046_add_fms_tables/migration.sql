-- 由 scripts/generate-table-migration.ts 生成，请勿手改。
-- 来源: scripts/data/fms-tables.ts#FMS_TABLES
-- 背景: 这些表的定义来自低代码 CodegenConfig；此前只生成代码、不生成建表 SQL，
--       导致"仓储在查但无处创建"。本迁移补齐 DDL。
-- 企业资金结算账户表
CREATE TABLE IF NOT EXISTS "fms_account" (
    "id" TEXT NOT NULL,
    "account_no" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "bank_name" VARCHAR(100),
    "currency" VARCHAR(255) NOT NULL,
    "balance" DECIMAL(18,4) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fms_account_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fms_account" ADD COLUMN IF NOT EXISTS "account_no" VARCHAR(255) NOT NULL;
ALTER TABLE "fms_account" ADD COLUMN IF NOT EXISTS "name" VARCHAR(100) NOT NULL;
ALTER TABLE "fms_account" ADD COLUMN IF NOT EXISTS "bank_name" VARCHAR(100);
ALTER TABLE "fms_account" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(255) NOT NULL;
ALTER TABLE "fms_account" ADD COLUMN IF NOT EXISTS "balance" DECIMAL(18,4) NOT NULL;
ALTER TABLE "fms_account" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "fms_account" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "fms_account" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "fms_account" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "fms_account_tenant_id_idx" ON "fms_account"("tenant_id");

-- 财务收支记账凭证表
CREATE TABLE IF NOT EXISTS "fms_voucher" (
    "id" TEXT NOT NULL,
    "voucher_no" VARCHAR(255) NOT NULL,
    "account_id" TEXT NOT NULL,
    "direction" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "voucher_time" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fms_voucher_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "voucher_no" VARCHAR(255) NOT NULL;
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "account_id" TEXT NOT NULL;
ALTER TABLE "fms_voucher" ALTER COLUMN "account_id" TYPE TEXT USING "account_id"::TEXT;
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "direction" VARCHAR(255) NOT NULL;
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "summary" VARCHAR(500) NOT NULL;
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "voucher_time" TIMESTAMP(3) NOT NULL;
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "fms_voucher" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "fms_voucher" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "fms_voucher_tenant_id_idx" ON "fms_voucher"("tenant_id");

-- 财务账实核对结算单表
CREATE TABLE IF NOT EXISTS "fms_reconcile" (
    "id" TEXT NOT NULL,
    "reconcile_no" VARCHAR(255) NOT NULL,
    "account_id" TEXT NOT NULL,
    "statement_period" VARCHAR(255) NOT NULL,
    "book_amount" DECIMAL(18,4) NOT NULL,
    "bank_amount" DECIMAL(18,4) NOT NULL,
    "diff_amount" DECIMAL(18,4) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fms_reconcile_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "reconcile_no" VARCHAR(255) NOT NULL;
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "account_id" TEXT NOT NULL;
ALTER TABLE "fms_reconcile" ALTER COLUMN "account_id" TYPE TEXT USING "account_id"::TEXT;
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "statement_period" VARCHAR(255) NOT NULL;
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "book_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "bank_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "diff_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "fms_reconcile" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "fms_reconcile" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "fms_reconcile_tenant_id_idx" ON "fms_reconcile"("tenant_id");
