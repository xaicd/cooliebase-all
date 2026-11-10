#!/usr/bin/env node
/**
 * CMMI-03 (Spec-Kit 扩展): 概要设计 HLD、架构决策 ADR、原型与蓝图自愈 (03_design)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-03-design.cjs` 属于 `speckit` 在 CMMI-03 架构与设计环节的文档与契约扩展
 * 关联文档:
 *   - 宏观过程文档: docs/03_design/{database-design-erd.md, adr/*, diagrams/*}, docs/architecture/*
 *   - 特性规格文档: docs/specs/<domain>/<name>/{design.md, prototype.md}
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 03 [docs|check|asset|doctor|compile-domain]
 *   node scripts/cmmi-03-design.cjs [docs|check|asset|doctor|compile-domain]
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { tryHandleDocSubcommand, checkStageDocs } = require("./lib/speckit-cmmi-docs.cjs");

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
tryHandleDocSubcommand("03", rawArgs);

const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "check";
const rest = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs.slice(1) : rawArgs;

if (sub === "doctor") {
  console.log("═══ [Spec-Kit × CMMI-03] 蓝图架构自愈诊断 (Blueprint Doctor) ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", ["doctor", ...rest]));
}

if (sub === "check") {
  console.log("═══ [Spec-Kit × CMMI-03] 架构设计文档与蓝图契约校验 (03_design) ═══");
  const d3 = checkStageDocs("03");
  if (d3 !== 0) process.exit(d3);
  process.exit(runNode("scripts/blueprint-engine.cjs", ["check", ...rest]));
}

if (sub === "compile-domain" || sub === "contract") {
  console.log("═══ [Spec-Kit × CMMI-03] 领域契约与 Facade 编译 ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/compile-domain.cjs"))) {
    process.exit(runNode("scripts/compile-domain.cjs", rest));
  }
  process.exit(runNode("scripts/blueprint-engine.cjs", ["compile-domain", ...rest]));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-03 架构与设计扩展):
  node scripts/cmmi-03-design.cjs docs [--spec <名>]                       列出 ADR/ERD 架构文档与各规格 design.md/prototype.md
  node scripts/cmmi-03-design.cjs check [--spec <名>]                      校验 CMMI-03 设计文档与存量蓝图架构契约
  node scripts/cmmi-03-design.cjs asset --type <adr|erd|archify> --title . 创建 CMMI-03 标准 ADR 或架构图文档
  node scripts/cmmi-03-design.cjs doctor --file <blueprint.json> [--write] 蓝图字段/状态机/权限码自愈修复
  node scripts/cmmi-03-design.cjs compile-domain <domain> [--write]        编译领域契约与 Facade`);
  process.exit(0);
}

console.error(`[CMMI-03] 未知子命令: ${sub}`);
process.exit(2);
