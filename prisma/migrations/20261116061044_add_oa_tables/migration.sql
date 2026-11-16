-- 由 scripts/generate-table-migration.ts 生成，请勿手改。
-- 来源: scripts/data/oa-tables.ts#OA_TABLES
-- 背景: 这些表的定义来自低代码 CodegenConfig；此前只生成代码、不生成建表 SQL，
--       导致"仓储在查但无处创建"。本迁移补齐 DDL。
-- 企业协同通知公告表
CREATE TABLE IF NOT EXISTS "oa_notice" (
    "id" TEXT NOT NULL,
    "notice_no" VARCHAR(255) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "notice_type" VARCHAR(64) NOT NULL,
    "content" TEXT,
    "status" VARCHAR(64) NOT NULL,
    "publish_time" TIMESTAMP(3),
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "oa_notice_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "oa_notice" ADD COLUMN IF NOT EXISTS "notice_no" VARCHAR(255) NOT NULL;
ALTER TABLE "oa_notice" ADD COLUMN IF NOT EXISTS "title" VARCHAR(100) NOT NULL;
ALTER TABLE "oa_notice" ADD COLUMN IF NOT EXISTS "notice_type" VARCHAR(64) NOT NULL;
ALTER TABLE "oa_notice" ADD COLUMN IF NOT EXISTS "content" TEXT;
ALTER TABLE "oa_notice" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "oa_notice" ADD COLUMN IF NOT EXISTS "publish_time" TIMESTAMP(3);
ALTER TABLE "oa_notice" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "oa_notice" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "oa_notice" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "oa_notice_tenant_id_idx" ON "oa_notice"("tenant_id");

-- 员工考勤打卡记录表
CREATE TABLE IF NOT EXISTS "oa_attendance" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "employee_name" VARCHAR(100) NOT NULL,
    "work_date" VARCHAR(255) NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "oa_attendance_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "oa_attendance" ADD COLUMN IF NOT EXISTS "employee_id" TEXT NOT NULL;
ALTER TABLE "oa_attendance" ALTER COLUMN "employee_id" TYPE TEXT USING "employee_id"::TEXT;
ALTER TABLE "oa_attendance" ADD COLUMN IF NOT EXISTS "employee_name" VARCHAR(100) NOT NULL;
ALTER TABLE "oa_attendance" ADD COLUMN IF NOT EXISTS "work_date" VARCHAR(255) NOT NULL;
ALTER TABLE "oa_attendance" ADD COLUMN IF NOT EXISTS "check_in_time" TIMESTAMP(3);
ALTER TABLE "oa_attendance" ADD COLUMN IF NOT EXISTS "check_out_time" TIMESTAMP(3);
ALTER TABLE "oa_attendance" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "oa_attendance" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "oa_attendance" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "oa_attendance" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "oa_attendance_tenant_id_idx" ON "oa_attendance"("tenant_id");

-- 请假与用印审批单表
CREATE TABLE IF NOT EXISTS "oa_leave_apply" (
    "id" TEXT NOT NULL,
    "apply_no" VARCHAR(255) NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "apply_type" VARCHAR(64) NOT NULL,
    "days" DECIMAL(18,4) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "reason" VARCHAR(255),
    "status" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "create_time" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "oa_leave_apply_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "apply_no" VARCHAR(255) NOT NULL;
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "applicant_id" TEXT NOT NULL;
ALTER TABLE "oa_leave_apply" ALTER COLUMN "applicant_id" TYPE TEXT USING "applicant_id"::TEXT;
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "apply_type" VARCHAR(64) NOT NULL;
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "days" DECIMAL(18,4) NOT NULL;
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMP(3) NOT NULL;
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "end_time" TIMESTAMP(3) NOT NULL;
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "reason" VARCHAR(255);
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "status" VARCHAR(64) NOT NULL;
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL;
ALTER TABLE "oa_leave_apply" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::TEXT;
ALTER TABLE "oa_leave_apply" ADD COLUMN IF NOT EXISTS "create_time" TIMESTAMP(3) NOT NULL;
CREATE INDEX IF NOT EXISTS "oa_leave_apply_tenant_id_idx" ON "oa_leave_apply"("tenant_id");
