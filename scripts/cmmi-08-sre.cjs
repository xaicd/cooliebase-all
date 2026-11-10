#!/usr/bin/env node
/**
 * CMMI-08 (Spec-Kit 扩展): SRE SLO/SLI 错误预算矩阵、灾备预案与免责复盘 (08_sre)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-08-sre.cjs` 属于 `speckit` 在 CMMI-08 SRE 稳定性环节的文档与探针扩展
 * 关联文档:
 *   - 宏观过程文档: docs/08_sre/{01_slo_sli_metrics/SLO-SLI-ERROR-BUDGET-MATRIX.md, 06_incidents_postmortem/*}
 *   - 特性规格文档: docs/specs/<domain>/<name>/operations.md
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 08 [docs|check|asset|status|health|security|load]
 *   node scripts/cmmi-08-sre.cjs [docs|check|asset|status|health|security|load]
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { tryHandleDocSubcommand, checkStageDocs } = require(
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
tryHandleDocSubcommand("08", rawArgs);

const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "check";
const rest = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs.slice(1) : rawArgs;

if (sub === "check") {
  console.log("═══ [Spec-Kit × CMMI-08] SRE SLO/SLI 矩阵与运维预案文档校验 ═══");
  process.exit(checkStageDocs("08"));
}

if (["start", "stop", "restart", "status", "health", "logs"].includes(sub)) {
  console.log(`═══ [Spec-Kit × CMMI-08] SRE 服务生命周期管理: ${sub} ═══`);
  process.exit(runNode("scripts/harness.cjs", [sub, ...rest]));
}

if (sub === "security" || sub === "scan") {
  console.log("═══ [Spec-Kit × CMMI-08] SRE 安全基线与红队渗透扫描 ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/security-scan.cjs"))) {
    process.exit(runNode("scripts/security-scan.cjs", rest));
  }
  process.exit(runNode("scripts/gate-check.cjs", rest));
}

if (sub === "load" || sub === "slo") {
  console.log("═══ [Spec-Kit × CMMI-08] SRE 容量护栏与压测 ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/load-test.cjs"))) {
    process.exit(runNode("scripts/load-test.cjs", rest));
  }
  process.exit(checkStageDocs("08"));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-08 SRE 稳定性与复盘文档扩展):
  node scripts/cmmi-08-sre.cjs docs [--spec <名>]                             列出 SLO/SLI 矩阵、免责复盘文档与各规格 operations.md
  node scripts/cmmi-08-sre.cjs check [--spec <名>]                            校验 CMMI-08 SRE 稳定性文档
  node scripts/cmmi-08-sre.cjs asset --type <slo-matrix|postmortem|dr-plan>   创建 CMMI-08 标准 SLO 矩阵或事故复盘文档
  node scripts/cmmi-08-sre.cjs <start|stop|restart|status|health|logs>        服务生命周期与健康探针
  node scripts/cmmi-08-sre.cjs security                                       安全红队渗透扫描
  node scripts/cmmi-08-sre.cjs load                                           SRE 容量护栏压测`);
  process.exit(0);
}

console.error(`[CMMI-08] 未知子命令: ${sub}`);
process.exit(2);
