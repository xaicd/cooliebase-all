#!/usr/bin/env node
/**
 * CMMI-07 (Spec-Kit 扩展): 部署 SOP、回滚预案 Runbook 与不可变发布指纹 (07_release)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-07-release.cjs` 属于 `speckit` 在 CMMI-07 发布割接环节的文档与不可变指纹扩展
 * 关联文档:
 *   - 宏观过程文档: docs/07_release/{system-deployment-sop.md, rollback-emergency-plan.md}
 *   - 特性规格文档: docs/specs/<domain>/<name>/{deployment.md, runbook.json}
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 07 [docs|check|asset|gateway|build|fingerprint|runbook]
 *   node scripts/cmmi-07-release.cjs [docs|check|asset|gateway|build|fingerprint|runbook]
 */

"use strict";

const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
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

function fallbackFingerprint(verifyOnly = false) {
  if (fs.existsSync(path.join(ROOT, "scripts/release-fingerprint.cjs"))) {
    return runNode("scripts/release-fingerprint.cjs", verifyOnly ? ["--verify"] : []);
  }
  const targetFiles = ["package.json", "compat-manifest.json", "HARNESS.md", "AGENTS.md"];
  const hashes = {};
  for (const rel of targetFiles) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      hashes[rel] = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
    }
  }
  const fpPath = path.join(ROOT, "docs/07_release_and_deployment/release-fingerprint.json");
  fs.mkdirSync(path.dirname(fpPath), { recursive: true });
  if (verifyOnly && fs.existsSync(fpPath)) {
    const saved = JSON.parse(fs.readFileSync(fpPath, "utf8"));
    for (const [k, v] of Object.entries(hashes)) {
      if (saved.hashes && saved.hashes[k] && saved.hashes[k] !== v) {
        console.error(`✗ [CMMI-07] 指纹不匹配: ${k}`);
        return 1;
      }
    }
    console.log("✓ [CMMI-07] 制品指纹校验通过");
    return 0;
  }
  fs.writeFileSync(
    fpPath,
    JSON.stringify({ schemaVersion: "1.0.0", generatedAt: new Date().toISOString(), hashes }, null, 2) + "\n",
    "utf8"
  );
  console.log(`✓ [CMMI-07] 已生成发布指纹 -> ${fpPath}`);
  return 0;
}

const rawArgs = process.argv.slice(2);
tryHandleDocSubcommand("07", rawArgs);

const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "gateway";
const rest = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs.slice(1) : rawArgs;

if (sub === "check") {
  console.log("═══ [Spec-Kit × CMMI-07] 部署方案 (deployment.md) 与回滚预案 (runbook.json) 校验 ═══");
  process.exit(checkStageDocs("07"));
}

if (sub === "gateway" || sub === "render-gateway") {
  console.log("═══ [Spec-Kit × CMMI-07] 渲染四端网关与部署配置 ═══");
  process.exit(runNode("scripts/render-gateway-conf.mjs", rest));
}

if (sub === "build") {
  console.log("═══ [Spec-Kit × CMMI-07] 生产制品构建与不可变指纹签发 ═══");
  const code = runNode("scripts/render-gateway-conf.mjs");
  if (code !== 0) process.exit(code);
  process.exit(fallbackFingerprint(false));
}

if (sub === "fingerprint") {
  const verify = rawArgs.includes("--verify") || rawArgs.includes("verify");
  process.exit(fallbackFingerprint(verify));
}

if (sub === "runbook") {
  console.log("═══ [Spec-Kit × CMMI-07] 生产割接与回滚 Runbook 执行器 ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/runbook-exec.cjs"))) {
    process.exit(runNode("scripts/runbook-exec.cjs", rest));
  }
  process.exit(fallbackFingerprint(false));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-07 发布与割接扩展):
  node scripts/cmmi-07-release.cjs docs [--spec <名>]                                     列出部署 SOP 与各规格 deployment.md/runbook.json
  node scripts/cmmi-07-release.cjs check [--spec <名>]                                    校验 CMMI-07 部署与回滚预案文档
  node scripts/cmmi-07-release.cjs asset --type <deployment-sop|rollback-runbook|...>     创建 CMMI-07 标准发布 SOP 文档
  node scripts/cmmi-07-release.cjs gateway                                                渲染四端统一网关配置
  node scripts/cmmi-07-release.cjs fingerprint [--verify]                                 生成或核验制品 SHA-256 指纹
  node scripts/cmmi-07-release.cjs runbook                                                生产割接 Runbook 执行与预检`);
  process.exit(0);
}

console.error(`[CMMI-07] 未知子命令: ${sub}`);
process.exit(2);
