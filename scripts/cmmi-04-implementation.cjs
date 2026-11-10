#!/usr/bin/env node
/**
 * CMMI-04 (Spec-Kit 扩展): 研发计划 Plan、WBS 任务矩阵 Tasks 与全栈代码生成 (04_implementation)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-04-implementation.cjs` 属于 `speckit` 在 CMMI-04 编码实现环节的文档与生成器扩展
 * 关联文档:
 *   - 宏观过程文档: docs/04_implementation/{coding-standards-and-guidelines.md, code-review-*}
 *   - 特性规格文档: docs/specs/<domain>/<name>/{plan.md, tasks.md}
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 04 [docs|check|asset|tasks|deliver|codegen]
 *   node scripts/cmmi-04-implementation.cjs [docs|check|asset|tasks|deliver|codegen]
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
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
tryHandleDocSubcommand("04", rawArgs);

const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "check";
const rest = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs.slice(1) : rawArgs;

if (sub === "check") {
  console.log("═══ [Spec-Kit × CMMI-04] 实施计划 (plan.md) 与任务矩阵 (tasks.md) 校验 ═══");
  process.exit(checkStageDocs("04"));
}

if (sub === "tasks" || sub === "task") {
  console.log("═══ [Spec-Kit × CMMI-04] WBS 任务矩阵与 Git 原子提交核验 ═══");
  process.exit(runSpeckit(["tasks", ...rest]));
}

if (sub === "deliver" || sub === "compile") {
  console.log("═══ [Spec-Kit × CMMI-04] 蓝图全栈交付编译 (Blueprint Deliver) ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", [sub, ...rest]));
}

if (sub === "codegen" || sub === "module") {
  console.log("═══ [Spec-Kit × CMMI-04] 领域模块全栈代码生成 (Codegen Module) ═══");
  process.exit(runNode("scripts/codegen-module.cjs", rest));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-04 研发计划与代码实现扩展):
  node scripts/cmmi-04-implementation.cjs docs [--spec <名>]                          列出编码规范文档与各规格 plan.md/tasks.md
  node scripts/cmmi-04-implementation.cjs check [--spec <名>]                         校验 CMMI-04 研发计划与任务文档完备度
  node scripts/cmmi-04-implementation.cjs asset --type code-review --title "..."      创建 CMMI-04 代码走查报告文档
  node scripts/cmmi-04-implementation.cjs tasks --spec <名> [--task T1]               查看任务矩阵与核验 1 Task = 1 Commit
  node scripts/cmmi-04-implementation.cjs deliver --file <blueprint.json>             蓝图全栈交付编译
  node scripts/cmmi-04-implementation.cjs codegen --module <域> --table <表> ...      单表全栈代码生成`);
  process.exit(0);
}

console.error(`[CMMI-04] 未知子命令: ${sub}`);
process.exit(2);
