#!/usr/bin/env node
/**
 * CMMI-00: 规范与元契约治理 (00_meta_standards)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/00_meta_standards/
 * 统一跨底座命令:
 *   node scripts/cmmi-00-meta.cjs [check|schema|sync]
 *   pnpm run cmmi:00
 *   pnpm harness 00
 *
 * 核心职责:
 *   1. 校验 Agent Harness 兼容清单 (compat-manifest.json & compat-check.cjs)
 *   2. 校验 Blueprint v1 元 Schema 与存量蓝图合法性 (blueprint-engine.cjs check)
 *   3. 同步 OpenWiki 与 Agent 表面契约 (sync-agent-surface.cjs)
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

const args = process.argv.slice(2);
const sub = args[0] || "check";

if (sub === "check") {
  console.log("═══ [CMMI-00] 规范与元契约校验 (00_meta_standards) ═══");
  const c1 = runNode("scripts/compat-check.cjs");
  if (c1 !== 0) process.exit(c1);
  const c2 = runNode("scripts/blueprint-engine.cjs", ["check"]);
  process.exit(c2);
}

if (sub === "schema") {
  process.exit(runNode("scripts/blueprint-engine.cjs", ["schema", ...args.slice(1)]));
}

if (sub === "sync") {
  console.log("═══ [CMMI-00] 同步 Agent 表面契约与 OpenWiki ═══");
  process.exit(runNode("scripts/sync-agent-surface.cjs", args.slice(1)));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-00-meta.cjs [check]   校验 compat-manifest 与 Blueprint v1 元契约
  node scripts/cmmi-00-meta.cjs schema    输出 Blueprint v1 JSON Schema
  node scripts/cmmi-00-meta.cjs sync      同步 Agent 表面契约与 OpenWiki`);
  process.exit(0);
}

console.error(`[CMMI-00] 未知子命令: ${sub}`);
process.exit(2);
