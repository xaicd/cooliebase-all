#!/usr/bin/env node
/**
 * CMMI-02: 需求分诊与 EARS 规格立项 (02_requirements)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/02_requirements/ & docs/specs/<domain>/<name>/
 * 统一跨底座命令:
 *   node scripts/cmmi-02-requirements.cjs route "<用户原始需求>"
 *   node scripts/cmmi-02-requirements.cjs new --name <spec> --domain <域> --title "<标题>"
 *   node scripts/cmmi-02-requirements.cjs build --name <spec>
 *   node scripts/cmmi-02-requirements.cjs check --spec <spec>
 *   pnpm run cmmi:02 -- new ...
 *   pnpm harness 02 new ...
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
const sub = rawArgs[0] || "help";

if (sub === "route" || sub === "triage") {
  console.log("═══ [CMMI-02] 需求确定性分诊 (Spec Necessity Route) ═══");
  process.exit(runNode("scripts/agent-route.cjs", rawArgs.slice(1)));
}

if (["new", "build", "check", "tasks", "archive"].includes(sub)) {
  console.log(`═══ [CMMI-02] 需求规格工程 (Spec-Kit: ${sub}) ═══`);
  process.exit(runNode("scripts/speckit.cjs", rawArgs));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-02-requirements.cjs route "<用户原始需求>"
  node scripts/cmmi-02-requirements.cjs new --name <spec> --domain <域> --title "<标题>"
  node scripts/cmmi-02-requirements.cjs build --name <spec>
  node scripts/cmmi-02-requirements.cjs check --spec <spec>`);
  process.exit(0);
}

console.error(`[CMMI-02] 未知子命令: ${sub}`);
process.exit(2);
