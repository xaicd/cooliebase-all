#!/usr/bin/env node
/**
 * CMMI-07: 制品构建、四端网关渲染与不可变投产 (07_release_and_deployment)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/07_release_and_deployment/
 * 统一跨底座命令:
 *   node scripts/cmmi-07-release.cjs build
 *   node scripts/cmmi-07-release.cjs gateway
 *   node scripts/cmmi-07-release.cjs fingerprint [--verify]
 *   node scripts/cmmi-07-release.cjs runbook [--feature <name> --check]
 *   pnpm run cmmi:07
 *   pnpm harness 07
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
const sub = rawArgs[0] || "gateway";

if (sub === "gateway" || sub === "render-gateway") {
  console.log("═══ [CMMI-07] 渲染四端网关与部署配置 ═══");
  process.exit(runNode("scripts/render-gateway-conf.mjs", rawArgs.slice(1)));
}

if (sub === "build") {
  console.log("═══ [CMMI-07] 生产制品构建与不可变指纹签发 ═══");
  const res = spawnSync("pnpm", ["run", "build", ...rawArgs.slice(1)], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if ((res.status ?? 1) !== 0) process.exit(res.status ?? 1);
  process.exit(runNode("scripts/release-fingerprint.cjs"));
}

if (sub === "fingerprint") {
  const verify = rawArgs.includes("--verify") || rawArgs.includes("verify");
  process.exit(runNode("scripts/release-fingerprint.cjs", verify ? ["--verify"] : []));
}

if (sub === "runbook") {
  console.log("═══ [CMMI-07] 生产割接与回滚 Runbook 执行器 ═══");
  process.exit(runNode("scripts/runbook-exec.cjs", rawArgs.slice(1)));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-07-release.cjs gateway                  渲染四端统一网关配置
  node scripts/cmmi-07-release.cjs build                    构建生产制品并签发不可变指纹
  node scripts/cmmi-07-release.cjs fingerprint [--verify]   生成或核验制品 SHA-256 指纹
  node scripts/cmmi-07-release.cjs runbook                  生产割接 Runbook 执行与预检`);
  process.exit(0);
}

console.error(`[CMMI-07] 未知子命令: ${sub}`);
process.exit(2);
