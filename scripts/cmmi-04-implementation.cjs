#!/usr/bin/env node
/**
 * CMMI-04: 全栈代码生成与防假实现 (04_implementation)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/04_implementation/
 * 统一跨底座命令:
 *   node scripts/cmmi-04-implementation.cjs deliver --file <blueprint.json> [--verify-e2e]
 *   node scripts/cmmi-04-implementation.cjs codegen --module <domain> --table <table> --name <cn> --fields '<json>'
 *   pnpm run cmmi:04 -- deliver --file <blueprint.json>
 *   pnpm harness 04 deliver --file <blueprint.json>
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

if (sub === "deliver" || sub === "compile") {
  console.log("═══ [CMMI-04] 蓝图全栈交付编译 (Blueprint Deliver) ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", [sub, ...rawArgs.slice(1)]));
}

if (sub === "codegen" || sub === "module") {
  console.log("═══ [CMMI-04] 领域模块全栈代码生成 (Codegen Module) ═══");
  process.exit(runNode("scripts/codegen-module.cjs", rawArgs.slice(1)));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-04-implementation.cjs deliver --file <blueprint.json> [--verify-e2e]
  node scripts/cmmi-04-implementation.cjs compile --file <blueprint.json>
  node scripts/cmmi-04-implementation.cjs codegen --module <domain> --table <table> --name <中文名> --fields '<JSON>'`);
  process.exit(0);
}

console.error(`[CMMI-04] 未知子命令: ${sub}`);
process.exit(2);
