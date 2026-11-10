#!/usr/bin/env node
/**
 * CMMI-00 (Spec-Kit 扩展): 规范、项目宪法与元契约治理 (00_meta_standards)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-00-meta.cjs` 属于 `speckit` 在 CMMI-00 环节的文档与元契约扩展
 * 关联文档:
 *   - 宏观过程文档: docs/00_meta_standards/*, .specify/memory/constitution.md, AGENTS.md, HARNESS.md, wiki/index.md
 *   - 特性规格文档: docs/specs/<domain>/<name>/spec.json
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 00 [docs|check|constitution|schema|sync]
 *   node scripts/cmmi-00-meta.cjs [docs|check|constitution|schema|sync]
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
tryHandleDocSubcommand("00", rawArgs);

const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "check";
const rest = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs.slice(1) : rawArgs;

if (sub === "constitution") {
  process.exit(runSpeckit(["constitution", ...rest]));
}

if (sub === "check") {
  console.log("═══ [Spec-Kit × CMMI-00] 规范文档与元契约校验 (00_meta_standards) ═══");
  const d0 = checkStageDocs("00");
  if (d0 !== 0) process.exit(d0);
  const c1 = runNode("scripts/compat-check.cjs", rest);
  if (c1 !== 0) process.exit(c1);
  const c2 = runNode("scripts/blueprint-engine.cjs", ["check"]);
  process.exit(c2);
}

if (sub === "schema") {
  process.exit(runNode("scripts/blueprint-engine.cjs", ["schema", ...rest]));
}

if (sub === "sync") {
  console.log("═══ [Spec-Kit × CMMI-00] 同步 Agent 表面契约与 OpenWiki ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/sync-agent-surface.cjs"))) {
    process.exit(runNode("scripts/sync-agent-surface.cjs", rest));
  }
  if (fs.existsSync(path.join(ROOT, "scripts/sync-openwiki.mjs"))) {
    const code = runNode("scripts/sync-openwiki.mjs", rest);
    if (code !== 0) process.exit(code);
  }
  process.exit(runNode("scripts/compat-check.cjs"));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-00 规范与元契约扩展):
  node scripts/cmmi-00-meta.cjs docs           列出 CMMI-00 宏观规范文档与各规格 spec.json 状态
  node scripts/cmmi-00-meta.cjs check          校验 CMMI-00 文档、compat-manifest 与 Blueprint v1 元契约
  node scripts/cmmi-00-meta.cjs constitution   输出项目工程宪法 (.specify/memory/constitution.md)
  node scripts/cmmi-00-meta.cjs schema         输出 Blueprint v1 JSON Schema
  node scripts/cmmi-00-meta.cjs sync           同步 Agent 表面契约与 OpenWiki`);
  process.exit(0);
}

console.error(`[CMMI-00] 未知子命令: ${sub}`);
process.exit(2);
