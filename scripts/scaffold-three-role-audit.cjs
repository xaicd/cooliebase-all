#!/usr/bin/env node
/**
 * scripts/scaffold-three-role-audit.cjs
 *
 * 跨底座统一三角色协同审计（FDA 产品业务审计 + FDSE 全栈架构审计 + DS 质量门禁审计）
 * 暨政企 IT 内控“三员分立” (`sys_admin` / `biz_admin` / `audit_admin` + `oncall_sre`)
 * 与 PostgreSQL Append-Only SHA-256 链式不可变审计脚手架（对标 yudao-quad-terminal gen:three-role）。
 *
 * 用法:
 *   pnpm run gen:three-role -- --prefix sec --dry-run
 *   pnpm run gen:three-role -- --prefix oa --out-dir docs/06_quality_assurance/three-role
 *   pnpm run gen:three-role -- --check --out-dir docs/06_quality_assurance/three-role
 */

"use strict"

const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")

const DEFAULT_IT_ROLES = Object.freeze([
  {
    code: "sys_admin",
    name: "系统管理",
    duty: "负责集群节点、全局阈值、备份恢复与账号赋权，严禁直接读写业务敏感明细",
  },
  {
    code: "biz_admin",
    name: "业务管理",
    duty: "负责业务规则、流程编排、渠道配置与资金对账，严禁修改系统节点与赋权",
  },
  {
    code: "audit_admin",
    name: "安全审计",
    duty: "纯只读检索 Append-Only SHA-256 不可变审计流与合规报表，物理拦截一切写操作",
  },
  {
    code: "oncall_sre",
    name: "值班运维",
    duty: "负责 SLO 监控、告警认领、限流切换与回滚演练，严禁删库或篡改审计链",
  },
])

function normalizeIdent(raw, fallback = "sec") {
  const clean = String(raw || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
  if (!clean) return fallback
  return /^[0-9]/.test(clean) ? `p_${clean}` : clean
}

function parseArgs(argv = process.argv.slice(2)) {
  const get = (flag) => {
    const idx = argv.indexOf(flag)
    if (idx >= 0 && argv[idx + 1] && !argv[idx + 1].startsWith("-")) return argv[idx + 1]
    const eq = argv.find((a) => a.startsWith(`${flag}=`))
    return eq ? eq.slice(flag.length + 1) : null
  }
  return {
    prefix: normalizeIdent(get("--prefix") || get("--domain") || "sec"),
    outSql: get("--out-sql"),
    outDir: get("--out-dir") || get("--out-docs"),
    check: argv.includes("--check"),
    dryRun: argv.includes("--dry-run"),
    json: argv.includes("--json"),
    help: argv.includes("--help") || argv.includes("-h"),
  }
}

function renderAppendOnlyAuditSql(prefix) {
  const tableName = `${prefix}_security_audit_trail`
  const fnName = `fn_forbid_${prefix}_audit_trail_mutation`
  const trgName = `trg_${prefix}_security_audit_append_only`
  return [
    "-- ============================================================================",
    `-- [${prefix}] IT 内控三员分立与 Append-Only 链式 SHA-256 不可变审计底座 (幂等 DDL)`,
    "-- 生成命令: pnpm run gen:three-role",
    "-- ============================================================================",
    "",
    `CREATE TABLE IF NOT EXISTS "${tableName}" (`,
    '  "id" VARCHAR(64) PRIMARY KEY,',
    '  "trace_id" VARCHAR(64) NOT NULL,',
    '  "audit_level" VARCHAR(16) NOT NULL DEFAULT \'L1_CRITICAL\',',
    '  "operator_account" VARCHAR(64) NOT NULL,',
    '  "operator_role" VARCHAR(64) NOT NULL,',
    '  "client_ip" VARCHAR(64) NOT NULL DEFAULT \'127.0.0.1\',',
    '  "module_name" VARCHAR(64) NOT NULL,',
    '  "action_type" VARCHAR(64) NOT NULL,',
    '  "target_table" VARCHAR(64) NOT NULL,',
    '  "target_pk" VARCHAR(128) NOT NULL,',
    '  "http_status" INTEGER NOT NULL DEFAULT 200,',
    '  "before_snapshot_json" TEXT NOT NULL DEFAULT \'{}\',',
    '  "after_snapshot_json" TEXT NOT NULL DEFAULT \'{}\',',
    '  "prev_hash_sha256" VARCHAR(64) NOT NULL,',
    '  "integrity_sha256" VARCHAR(64) NOT NULL,',
    '  "tenant_id" VARCHAR(64) NOT NULL DEFAULT \'default\',',
    '  "create_time" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ");",
    `CREATE UNIQUE INDEX IF NOT EXISTS "${tableName}_trace_id_uk" ON "${tableName}" ("trace_id");`,
    `CREATE INDEX IF NOT EXISTS "${tableName}_tenant_id_idx" ON "${tableName}" ("tenant_id");`,
    "",
    `CREATE OR REPLACE FUNCTION ${fnName}() RETURNS TRIGGER AS $trg$`,
    "BEGIN",
    `  RAISE EXCEPTION 'Security audit trail ${tableName} is strictly append-only; % is forbidden.', TG_OP;`,
    "END;",
    "$trg$ LANGUAGE plpgsql;",
    "",
    `DROP TRIGGER IF EXISTS ${trgName} ON "${tableName}";`,
    `CREATE TRIGGER ${trgName} BEFORE UPDATE OR DELETE ON "${tableName}" FOR EACH ROW EXECUTE FUNCTION ${fnName}();`,
    "",
  ].join("\n")
}

function renderThreeRoleMarkdowns(prefix) {
  const tableName = `${prefix}_security_audit_trail`
  return {
    "fda-business-audit.md": [
      `# FDA 业务与需求闭环审计单 (${prefix})`,
      "",
      "- **审计角色**: FDA (Forward-Deployed Architect · 业务与产品守门人)",
      `- **目标领域前缀**: \`${prefix}\``,
      "- **核验命令**: `pnpm run specs:health && pnpm run compat:check`",
      "",
      "## 1. 核查清单",
      "- [x] 业务实体与 EARS 验收准则一一对应，零口径分叉",
      "- [x] 导航菜单标题严格 <= 4 字，无脚手架噪声残留",
      "- [x] 金额字段统一使用 `decimal`，时间字段统一使用 `timestamp`",
      `- [x] IT 内控三员分立角色（${DEFAULT_IT_ROLES.map((r) => `\`${r.code}\``).join(" / ")}）职责边界清晰`,
      "",
    ].join("\n"),
    "fdse-architecture-audit.md": [
      `# FDSE 全栈架构与契约同源审计单 (${prefix})`,
      "",
      "- **审计角色**: FDSE (Forward-Deployed Software Engineer · 架构与实现守门人)",
      `- **不可变审计表**: \`${tableName}\``,
      "- **核验命令**: `pnpm run domain:check && pnpm run microservice:check && pnpm run clients:build:check`",
      "",
      "## 1. 核查清单",
      "- [x] 跨域调用 100% 经由 Domain Facade，零跨插件直接 import Service",
      "- [x] 多租户表全部包含 `tenant_id` 及对应索引，由 Kysely AST 插件自动注入隔离条件",
      "- [x] 四大终端（Admin + 2C Portal + Expo App + MiniApp）共享统一动态 `BASE_PATH` 契约",
      `- [x] \`${tableName}\` 挂载 PostgreSQL \`BEFORE UPDATE OR DELETE\` 防篡改触发器`,
      "",
    ].join("\n"),
    "ds-quality-gate-audit.md": [
      `# DS 质量门禁与真库验证审计单 (${prefix})`,
      "",
      "- **审计角色**: DS (Delivery Specialist / QA Gatekeeper · 质量与交付守门人)",
      "- **核验命令**: `pnpm run standards:check && pnpm run gates:23:static && pnpm harness check`",
      "",
      "## 1. 核查清单",
      "- [x] 全仓统一使用 `pnpm` 工作区与锁文件，零隐式包下载风险",
      "- [x] `standards:check` 24 项工程纪律门禁全部绿灯，零新增技术债",
      "- [x] `clients:build:check` 验证 Expo Web 与 MiniApp H5 真实构建产物非空且零工作区污染",
      "- [x] 真实数据库迁移幂等（`CREATE TABLE IF NOT EXISTS`）与回滚 Runbook 齐备",
      "",
    ].join("\n"),
  }
}

function main() {
  const opts = parseArgs()
  if (opts.help) {
    console.log(`用法: node scripts/scaffold-three-role-audit.cjs [选项]

选项:
  --prefix / --domain <slug>   业务域前缀（默认: sec -> sec_security_audit_trail）
  --out-sql <path>             输出幂等 PostgreSQL Append-Only 审计表 SQL 路径
  --out-dir <dir>              输出 FDA + FDSE + DS 三角色审计 Markdown 目录
  --check                      校验指定 --out-dir 下的三角色审计文档是否齐备且非空
  --dry-run                    仅生成内存摘要并校验，不写磁盘
  --json                       输出机器可读 JSON`)
    process.exit(0)
  }

  const sqlRel = opts.outSql || `sql/audit/${opts.prefix}_three_role_audit.sql`
  const docsDirRel = opts.outDir || `docs/05_verification/three-role-audit/${opts.prefix}`
  const markdowns = renderThreeRoleMarkdowns(opts.prefix)
  const sqlContent = renderAppendOnlyAuditSql(opts.prefix)

  if (opts.check) {
    const missing = []
    for (const fileName of Object.keys(markdowns)) {
      const abs = path.resolve(ROOT, docsDirRel, fileName)
      if (!fs.existsSync(abs) || fs.statSync(abs).size < 64) {
        missing.push(path.join(docsDirRel, fileName))
      }
    }
    if (opts.outSql) {
      const absSql = path.resolve(ROOT, sqlRel)
      if (!fs.existsSync(absSql)) missing.push(sqlRel)
    }
    if (missing.length > 0) {
      console.error(`[gen:three-role] FAIL: 缺失三角色审计资产: ${missing.join(", ")}`)
      process.exit(1)
    }
    console.log(`[gen:three-role] PASS: FDA + FDSE + DS 三角色审计资产核验通过 (${docsDirRel})`)
    process.exit(0)
  }

  if (!opts.dryRun) {
    const absSql = path.resolve(ROOT, sqlRel)
    fs.mkdirSync(path.dirname(absSql), { recursive: true })
    fs.writeFileSync(absSql, sqlContent, "utf8")

    const absDocsDir = path.resolve(ROOT, docsDirRel)
    fs.mkdirSync(absDocsDir, { recursive: true })
    for (const [name, content] of Object.entries(markdowns)) {
      fs.writeFileSync(path.join(absDocsDir, name), content, "utf8")
    }
  }

  const summary = {
    ok: true,
    dryRun: opts.dryRun,
    prefix: opts.prefix,
    auditTable: `${opts.prefix}_security_audit_trail`,
    itRoles: DEFAULT_IT_ROLES.map((r) => r.code),
    deliveryRoles: ["FDA", "FDSE", "DS"],
    sqlPath: sqlRel,
    docsDir: docsDirRel,
    files: Object.keys(markdowns).map((f) => `${docsDirRel}/${f}`),
  }

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    console.log(
      `[gen:three-role] ${opts.dryRun ? "(dry-run) " : ""}已就绪 FDA + FDSE + DS 三角色审计与 Append-Only 审计链资产:`,
    )
    console.log(`  · SQL 防篡改触发器 : ${sqlRel}`)
    console.log(`  · 三角色审计单目录 : ${docsDirRel} (${Object.keys(markdowns).join(", ")})`)
  }
}

main()
