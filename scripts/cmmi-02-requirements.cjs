#!/usr/bin/env node
/**
 * CMMI-02 (Spec-Kit 扩展): 需求分诊、8 要素 Brief 与 EARS 需求规格说明书 (02_requirements)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-02-requirements.cjs` 属于 `speckit` 在 CMMI-02 需求工程环节的文档与规格扩展
 * 关联文档:
 *   - 宏观过程文档: docs/02_requirements/{rtm-traceability-matrix.md, non-functional-reqs.md}, docs/features/sprint-prod/*
 *   - 特性规格文档: docs/specs/<domain>/<name>/{brief.json, requirements.md, spec.md}
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 02 [docs|check|asset|route|new|build]
 *   node scripts/cmmi-02-requirements.cjs [docs|check|asset|route|new|build]
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { tryHandleDocSubcommand, checkStageDocs, runSpeckit } = require(
  fs.existsSync(path.join(__dirname, "lib/speckit-cmmi-docs.cjs")) ? "./lib/speckit-cmmi-docs.cjs" : "./cmmi-spec-docs.cjs"
);

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
tryHandleDocSubcommand("02", rawArgs);

const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "check";

if (sub === "route" || sub === "triage") {
  console.log("═══ [Spec-Kit × CMMI-02] 需求确定性分诊 (Spec Necessity Route) ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/agent-route.cjs"))) {
    process.exit(runNode("scripts/agent-route.cjs", rawArgs.slice(1)));
  }
  process.exit(runSpeckit(["list"]));
}

if (sub === "check" && !rawArgs.includes("--spec") && !rawArgs.includes("--name")) {
  process.exit(checkStageDocs("02", { strict: rawArgs.includes("--strict") }));
}

if (["new", "build", "check", "tasks", "archive", "list"].includes(sub)) {
  console.log(`═══ [Spec-Kit × CMMI-02] 需求规格工程 (Spec-Kit: ${sub}) ═══`);
  process.exit(runSpeckit(rawArgs));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-02 需求工程扩展):
  node scripts/cmmi-02-requirements.cjs docs [--spec <名>]                  列出 CMMI-02 宏观需求文档与各规格 brief.json/requirements.md
  node scripts/cmmi-02-requirements.cjs check [--spec <名>]                 校验 CMMI-02 需求规格文档完备度
  node scripts/cmmi-02-requirements.cjs asset --type <srs|rtm|nfr> ...      创建 CMMI-02 标准需求与 RTM 追溯文档
  node scripts/cmmi-02-requirements.cjs route "<用户原始需求>"              执行确定性需求分诊
  node scripts/cmmi-02-requirements.cjs new --name <spec> --domain <域> ... 创建新特性规格骨架 (brief.json)
  node scripts/cmmi-02-requirements.cjs build --name <spec>                 从 brief.json 展开生成全套规格文档`);
  process.exit(0);
}

console.error(`[CMMI-02] 未知子命令: ${sub}`);
process.exit(2);
