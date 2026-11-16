-- 由 scripts/generate-table-migration.ts 生成，请勿手改。
-- 来源: scripts/data/pms-tables.ts#PMS_TABLES
-- 背景: 这些表的定义来自低代码 CodegenConfig；此前只生成代码、不生成建表 SQL，
--       导致"仓储在查但无处创建"。本迁移补齐 DDL。
-- 研发与交付项目主台账表
CREATE TABLE IF NOT EXISTS "pms_project" (
    "id" TEXT NOT NULL,
    "project_code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "manager_id" TEXT NOT NULL,
    "budget_amount" DECIMAL(18,4) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pms_project_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "project_code" VARCHAR(64) NOT NULL;
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "name" VARCHAR(100) NOT NULL;
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "manager_id" TEXT NOT NULL;
ALTER TABLE "pms_project" ALTER COLUMN "manager_id" TYPE TEXT USING "manager_id"::TEXT;
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "budget_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMP(3) NOT NULL;
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "end_time" TIMESTAMP(3);
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "pms_project" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "pms_project" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "pms_project_tenant_id_idx" ON "pms_project"("tenant_id");

-- 项目里程碑节点表
CREATE TABLE IF NOT EXISTS "pms_milestone" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "due_time" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pms_milestone_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "pms_milestone" ADD COLUMN IF NOT EXISTS "project_id" TEXT NOT NULL;
ALTER TABLE "pms_milestone" ALTER COLUMN "project_id" TYPE TEXT USING "project_id"::TEXT;
ALTER TABLE "pms_milestone" ADD COLUMN IF NOT EXISTS "name" VARCHAR(100) NOT NULL;
ALTER TABLE "pms_milestone" ADD COLUMN IF NOT EXISTS "owner_id" TEXT NOT NULL;
ALTER TABLE "pms_milestone" ALTER COLUMN "owner_id" TYPE TEXT USING "owner_id"::TEXT;
ALTER TABLE "pms_milestone" ADD COLUMN IF NOT EXISTS "due_time" TIMESTAMP(3) NOT NULL;
ALTER TABLE "pms_milestone" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "pms_milestone" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "pms_milestone" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "pms_milestone" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "pms_milestone_tenant_id_idx" ON "pms_milestone"("tenant_id");

-- 项目任务工时填报单表
CREATE TABLE IF NOT EXISTS "pms_timesheet" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "work_date" VARCHAR(255) NOT NULL,
    "hours" DECIMAL(18,4) NOT NULL,
    "cost_amount" DECIMAL(18,4) NOT NULL,
    "remark" VARCHAR(500),
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pms_timesheet_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "project_id" TEXT NOT NULL;
ALTER TABLE "pms_timesheet" ALTER COLUMN "project_id" TYPE TEXT USING "project_id"::TEXT;
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "member_id" TEXT NOT NULL;
ALTER TABLE "pms_timesheet" ALTER COLUMN "member_id" TYPE TEXT USING "member_id"::TEXT;
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "work_date" VARCHAR(255) NOT NULL;
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "hours" DECIMAL(18,4) NOT NULL;
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "cost_amount" DECIMAL(18,4) NOT NULL;
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "remark" VARCHAR(500);
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "pms_timesheet" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "pms_timesheet" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "pms_timesheet_tenant_id_idx" ON "pms_timesheet"("tenant_id");
