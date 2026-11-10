#!/usr/bin/env node
/**
 * CMMI-09: 持续运营、造数体检与规格防污染归档 (09_operations)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/09_operations/
 * 统一跨底座命令:
 *   node scripts/cmmi-09-operations.cjs archive --name <spec> [--domain <dom>]
 *   node scripts/cmmi-09-operations.cjs ops [target] [action]
 *   node scripts/cmmi-09-operations.cjs check --spec <spec>
 *   pnpm run cmmi:09
 *   pnpm harness 09
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
const sub = rawArgs[0] || "ops";

if (sub === "archive") {
  console.log("═══ [CMMI-09] 规格防污染归档 (Spec Archive) ═══");
  process.exit(runNode("scripts/speckit.cjs", ["archive", ...rawArgs.slice(1)]));
}

if (sub === "check") {
  console.log("═══ [CMMI-09] 运营态规格闭环核验 ═══");
  process.exit(runNode("scripts/speckit.cjs", ["check", ...rawArgs.slice(1)]));
}

if (sub === "ops" || sub === "health") {
  const forward = rawArgs.slice(1);
  if (forward.length > 0) {
    console.log("═══ [CMMI-09] 无头持续运营 (Agent Ops) ═══");
    process.exit(runNode("scripts/agent-ops.cjs", forward));
  }
  console.log("═══ [CMMI-09] 持续运营巡检与蓝图医生体检 ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", ["check"]));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-09-operations.cjs ops [<domain>.<entity> health|seed-sample|purge-sample]
  node scripts/cmmi-09-operations.cjs archive --name <spec>           规格防污染归档至 docs/specs/archive/
  node scripts/cmmi-09-operations.cjs check --spec <spec>             运营态规格闭环核验`);
  process.exit(0);
}

console.error(`[CMMI-09] 未知子命令: ${sub}`);
process.exit(2);
