-- 由 scripts/generate-table-migration.ts 生成，请勿手改。
-- 来源: scripts/data/hrm-tables.ts#HRM_TABLES
-- 背景: 这些表的定义来自低代码 CodegenConfig；此前只生成代码、不生成建表 SQL，
--       导致"仓储在查但无处创建"。本迁移补齐 DDL。
-- 人力资源员工档案表
CREATE TABLE IF NOT EXISTS "hrm_employee" (
    "id" TEXT NOT NULL,
    "emp_no" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "dept_id" TEXT NOT NULL,
    "position_id" TEXT,
    "mobile" VARCHAR(255),
    "entry_time" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hrm_employee_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "emp_no" VARCHAR(255) NOT NULL;
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "name" VARCHAR(100) NOT NULL;
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "dept_id" TEXT NOT NULL;
ALTER TABLE "hrm_employee" ALTER COLUMN "dept_id" TYPE TEXT USING "dept_id"::TEXT;
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "position_id" TEXT;
ALTER TABLE "hrm_employee" ALTER COLUMN "position_id" TYPE TEXT USING "position_id"::TEXT;
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "mobile" VARCHAR(255);
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "entry_time" TIMESTAMP(3) NOT NULL;
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "hrm_employee" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "hrm_employee" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "hrm_employee_tenant_id_idx" ON "hrm_employee"("tenant_id");

-- 岗位与编制管理表
CREATE TABLE IF NOT EXISTS "hrm_position" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "dept_id" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL,
    "grade" VARCHAR(255),
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hrm_position_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "hrm_position" ADD COLUMN IF NOT EXISTS "code" VARCHAR(64) NOT NULL;
ALTER TABLE "hrm_position" ADD COLUMN IF NOT EXISTS "name" VARCHAR(100) NOT NULL;
ALTER TABLE "hrm_position" ADD COLUMN IF NOT EXISTS "dept_id" TEXT NOT NULL;
ALTER TABLE "hrm_position" ALTER COLUMN "dept_id" TYPE TEXT USING "dept_id"::TEXT;
ALTER TABLE "hrm_position" ADD COLUMN IF NOT EXISTS "headcount" INTEGER NOT NULL;
ALTER TABLE "hrm_position" ADD COLUMN IF NOT EXISTS "grade" VARCHAR(255);
ALTER TABLE "hrm_position" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "hrm_position" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "hrm_position" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "hrm_position" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "hrm_position_tenant_id_idx" ON "hrm_position"("tenant_id");

-- 月度薪资核算单表
CREATE TABLE IF NOT EXISTS "hrm_payroll" (
    "id" TEXT NOT NULL,
    "payroll_no" VARCHAR(255) NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period" VARCHAR(255) NOT NULL,
    "base_amount" DECIMAL(18,4) NOT NULL,
    "bonus_amount" DECIMAL(18,4) NOT NULL,
    "deduct_amount" DECIMAL(18,4) NOT NULL,
    "net_amount" DECIMAL(18,4) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hrm_payroll_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "payroll_no" VARCHAR(255) NOT NULL;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "employee_id" TEXT NOT NULL;
ALTER TABLE "hrm_payroll" ALTER COLUMN "employee_id" TYPE TEXT USING "employee_id"::TEXT;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "period" VARCHAR(255) NOT NULL;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "base_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "bonus_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "deduct_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "net_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "hrm_payroll" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "hrm_payroll" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "hrm_payroll_tenant_id_idx" ON "hrm_payroll"("tenant_id");
