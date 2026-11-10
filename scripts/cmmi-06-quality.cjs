#!/usr/bin/env node
/**
 * CMMI-06: 质量门禁与 PPQA/FCA/PCA 配置审计 (06_quality_and_audit)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/06_quality_and_audit/
 * 统一跨底座命令:
 *   node scripts/cmmi-06-quality.cjs [check|--tier fast|full]
 *   node scripts/cmmi-06-quality.cjs tasks --spec <name>
 *   node scripts/cmmi-06-quality.cjs controls
 *   pnpm run cmmi:06
 *   pnpm harness 06
 */

"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

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
const sub = rawArgs[0] && !rawArgs[0].startsWith("--") ? rawArgs[0] : "check";
const rest = rawArgs[0] && !rawArgs[0].startsWith("--") ? rawArgs.slice(1) : rawArgs;

if (sub === "check" || sub === "gate") {
  console.log("═══ [CMMI-06] 质量门禁与合规审计 (Gate Check & PPQA/FCA/PCA) ═══");
  process.exit(runNode("scripts/gate-check.cjs", rest));
}

if (sub === "tasks") {
  console.log("═══ [CMMI-06] 原子任务与 Git 提交追溯核验 ═══");
  process.exit(runNode("scripts/speckit.cjs", ["tasks", ...rest]));
}

if (sub === "controls") {
  console.log("═══ [CMMI-06] 工程控制矩阵校验 ═══");
  process.exit(runNode("scripts/check-engineering-standards.cjs", rest));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-06-quality.cjs [check] [--tier fast|full]   执行质量门禁与配置审计
  node scripts/cmmi-06-quality.cjs tasks --spec <name>          Git 原子任务追溯审计
  node scripts/cmmi-06-quality.cjs controls                     工程控制矩阵审计`);
  process.exit(0);
}

console.error(`[CMMI-06] 未知子命令: ${sub}`);
process.exit(2);
