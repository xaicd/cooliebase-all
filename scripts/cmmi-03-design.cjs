#!/usr/bin/env node
/**
 * CMMI-03: 蓝图自愈诊断与架构契约设计 (03_architecture_and_design)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/03_architecture_and_design/
 * 统一跨底座命令:
 *   node scripts/cmmi-03-design.cjs doctor --file <blueprint.json> [--write]
 *   node scripts/cmmi-03-design.cjs compile-domain <domain> [--write]
 *   node scripts/cmmi-03-design.cjs check
 *   pnpm run cmmi:03 -- doctor --file <blueprint.json> --write
 *   pnpm harness 03 doctor --file <blueprint.json> --write
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
const sub = rawArgs[0] || "check";

if (sub === "doctor") {
  console.log("═══ [CMMI-03] 蓝图架构自愈诊断 (Blueprint Doctor) ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", ["doctor", ...rawArgs.slice(1)]));
}

if (sub === "check") {
  console.log("═══ [CMMI-03] 架构与蓝图契约校验 ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", ["check", ...rawArgs.slice(1)]));
}

if (sub === "compile-domain" || sub === "contract") {
  console.log("═══ [CMMI-03] 领域契约与 Facade 编译 ═══");
  process.exit(runNode("scripts/compile-domain.cjs", rawArgs.slice(1)));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-03-design.cjs doctor --file <blueprint.json> [--write]   蓝图字段/状态机/权限码自愈修复
  node scripts/cmmi-03-design.cjs check                                      校验存量蓝图与架构契约
  node scripts/cmmi-03-design.cjs compile-domain <domain> [--write]          编译领域契约与 Facade`);
  process.exit(0);
}

console.error(`[CMMI-03] 未知子命令: ${sub}`);
process.exit(2);
