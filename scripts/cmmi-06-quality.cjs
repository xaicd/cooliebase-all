#!/usr/bin/env node
/**
 * CMMI-06 (Spec-Kit 扩展): 质量核对单 Checklist、PPQA/FCA/PCA 审计报告与质量门禁 (06_quality_assurance)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-06-quality.cjs` 属于 `speckit` 在 CMMI-06 质量保证环节的审计文档与门禁扩展
 * 关联文档:
 *   - 宏观过程文档: docs/06_quality_assurance/audit/*, spc-process-capability-baseline.md, car-root-cause-*.md
 *   - 特性规格文档: docs/specs/<domain>/<name>/checklist.md
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 06 [docs|check|asset|tasks|controls]
 *   node scripts/cmmi-06-quality.cjs [docs|check|asset|tasks|controls]
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
tryHandleDocSubcommand("06", rawArgs);

const sub = rawArgs[0] && !rawArgs[0].startsWith("--") ? rawArgs[0] : "check";
const rest = rawArgs[0] && !rawArgs[0].startsWith("--") ? rawArgs.slice(1) : rawArgs;

if (sub === "check" || sub === "gate") {
  console.log("═══ [Spec-Kit × CMMI-06] 质量核对单 (checklist.md) 与 PPQA/FCA/PCA 门禁审计 ═══");
  const d6 = checkStageDocs("06");
  if (d6 !== 0) process.exit(d6);
  process.exit(runNode("scripts/gate-check.cjs", rest));
}

if (sub === "tasks") {
  console.log("═══ [Spec-Kit × CMMI-06] 原子任务与 Git 提交追溯核验 ═══");
  process.exit(runSpeckit(["tasks", ...rest]));
}

if (sub === "controls") {
  console.log("═══ [Spec-Kit × CMMI-06] 工程控制矩阵校验 ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/check-engineering-standards.cjs"))) {
    process.exit(runNode("scripts/check-engineering-standards.cjs", rest));
  }
  process.exit(runNode("scripts/gate-check.cjs", rest));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-06 质量保证与配置审计扩展):
  node scripts/cmmi-06-quality.cjs docs [--spec <名>]                    列出 PPQA/FCA/PCA 审计报告与各规格 checklist.md
  node scripts/cmmi-06-quality.cjs check [--tier fast|full]              校验 checklist.md 并执行质量门禁与配置审计
  node scripts/cmmi-06-quality.cjs asset --type <audit|spc|car> --title  创建 CMMI-06 标准质量审计或 CAR 根因文档
  node scripts/cmmi-06-quality.cjs tasks --spec <name>                   Git 原子任务追溯审计
  node scripts/cmmi-06-quality.cjs controls                              工程控制矩阵审计`);
  process.exit(0);
}

console.error(`[CMMI-06] 未知子命令: ${sub}`);
process.exit(2);
