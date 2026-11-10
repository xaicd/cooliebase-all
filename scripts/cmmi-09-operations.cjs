#!/usr/bin/env node
/**
 * CMMI-09 (Spec-Kit 扩展): 持续运营手册、财务平账单与历史规格防污染归档 (09_operations)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-09-operations.cjs` 属于 `speckit` 在 CMMI-09 持续运营与规格归档环节的扩展
 * 关联文档:
 *   - 宏观过程文档: docs/09_operations/{tenant-governance.md, 01_financial_reconciliation/*}, docs/specs/archive/*
 *   - 特性规格文档: docs/specs/<domain>/<name>/operations.md -> 归档至 docs/specs/archive/<YYYY-Qx>/<domain>/<name>/
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 09 [docs|check|asset|archive|ops]
 *   node scripts/cmmi-09-operations.cjs [docs|check|asset|archive|ops]
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { tryHandleDocSubcommand, checkStageDocs, runSpeckit } = require("./lib/speckit-cmmi-docs.cjs");

const ROOT = path.resolve(__dirname, "..");

function runNode(scriptRel, extraArgs = []) {
  const res = spawnSync(process.execPath, [path.join(ROOT, scriptRel), ...extraArgs], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  return res.status ?? 1;
}

const rawArgs = process.argv.slice(2);
tryHandleDocSubcommand("09", rawArgs);

const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "check";
const rest = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs.slice(1) : rawArgs;

if (sub === "archive") {
  console.log("═══ [Spec-Kit × CMMI-09] 规格防污染归档 (Spec Archive) ═══");
  process.exit(runSpeckit(["archive", ...rest]));
}

if (sub === "check") {
  console.log("═══ [Spec-Kit × CMMI-09] 持续运营文档与规格闭环核验 ═══");
  const d9 = checkStageDocs("09");
  if (d9 !== 0) process.exit(d9);
  if (rawArgs.includes("--spec") || rawArgs.includes("--name")) {
    process.exit(runSpeckit(["check", ...rest]));
  }
  process.exit(0);
}

if (sub === "ops" || sub === "health") {
  if (rest.length > 0) {
    console.log("═══ [Spec-Kit × CMMI-09] 无头持续运营 (Agent Ops) ═══");
    if (fs.existsSync(path.join(ROOT, "scripts/agent/run-ops.cjs"))) {
      process.exit(runNode("scripts/agent/run-ops.cjs", rest));
    }
    if (fs.existsSync(path.join(ROOT, "scripts/agent-ops.cjs"))) {
      process.exit(runNode("scripts/agent-ops.cjs", rest));
    }
  }
  console.log("═══ [Spec-Kit × CMMI-09] 持续运营巡检与蓝图医生体检 ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", ["check"]));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-09 持续运营与防污染归档扩展):
  node scripts/cmmi-09-operations.cjs docs [--spec <名>]                          列出运营对账单/归档区与各规格 operations.md
  node scripts/cmmi-09-operations.cjs check [--spec <名>]                         校验 CMMI-09 持续运营文档与规格闭环
  node scripts/cmmi-09-operations.cjs asset --type <reconciliation|ops-ledger>    创建 CMMI-09 标准财务平账单或运营台账文档
  node scripts/cmmi-09-operations.cjs archive --name <spec>                       规格防污染归档至 docs/specs/archive/
  node scripts/cmmi-09-operations.cjs ops [<domain>.<entity> health|seed-sample]  无头持续运营巡检与造数`);
  process.exit(0);
}

console.error(`[CMMI-09] 未知子命令: ${sub}`);
process.exit(2);
