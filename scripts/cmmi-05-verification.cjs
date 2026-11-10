#!/usr/bin/env node
/**
 * CMMI-05 (Spec-Kit 扩展): 测试方案、真 PostgreSQL E2E 证据账本与 UAT 终验单 (05_verification)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-05-verification.cjs` 属于 `speckit` 在 CMMI-05 测试验证环节的文档与真 PG E2E 扩展
 * 关联文档:
 *   - 宏观过程文档: docs/05_verification/{test-plan.md, test-summary-report.md, mutation-report.md, uat-acceptance-certificate.md}
 *   - 特性规格文档: docs/specs/<domain>/<name>/{testing.md, evidence.json, bugs.md}
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 05 [docs|check|asset|e2e|unit|mutation]
 *   node scripts/cmmi-05-verification.cjs [docs|check|asset|e2e|unit|mutation]
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { tryHandleDocSubcommand, checkStageDocs } = require("./lib/speckit-cmmi-docs.cjs");

const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const eq = token.indexOf("=");
      if (eq !== -1) {
        out[token.slice(2, eq)] = token.slice(eq + 1);
      } else {
        const key = token.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) {
          out[key] = next;
          i += 1;
        } else {
          out[key] = true;
        }
      }
    } else {
      out._.push(token);
    }
  }
  return out;
}

function runNode(scriptRel, extraArgs = []) {
  const res = spawnSync(process.execPath, [path.join(ROOT, scriptRel), ...extraArgs], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  return res.status ?? 1;
}

const rawArgs = process.argv.slice(2);
tryHandleDocSubcommand("05", rawArgs);

const parsed = parseArgs(rawArgs);
const sub = parsed._[0] || "e2e";

if (sub === "check") {
  console.log("═══ [Spec-Kit × CMMI-05] 测试方案 (testing.md) 与证据账本 (evidence.json) 校验 ═══");
  process.exit(checkStageDocs("05", { spec: parsed.spec, strict: Boolean(parsed.strict) }));
}

if (sub === "e2e" || sub === "verify") {
  console.log("═══ [Spec-Kit × CMMI-05] 测试验证: 嵌入式真 PostgreSQL 18.4 (ephemeral-pg.cjs) 6 阶段 Spec E2E ═══");
  const bpFile = parsed.file || parsed.blueprint;
  if (bpFile) {
    process.exit(runNode("scripts/blueprint-engine.cjs", ["deliver", "--file", String(bpFile), "--verify-e2e"]));
  }
  const modFilter = parsed.module ? String(parsed.module) : "";
  const tsE2eDir = path.join(ROOT, "tests/e2e");
  if (fs.existsSync(tsE2eDir)) {
    const tsTests = fs
      .readdirSync(tsE2eDir)
      .filter((f) => f.endsWith(".spec.e2e.test.ts"))
      .filter((f) => (!modFilter ? true : f.includes(modFilter)))
      .map((f) => path.join("tests/e2e", f));
    if (tsTests.length > 0) {
      const res = spawnSync("pnpm", ["exec", "vitest", "run", ...tsTests], {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env,
      });
      process.exit(res.status ?? 1);
    }
  }
  const cjsE2eDir = path.join(ROOT, "apps/admin-web/e2e");
  if (fs.existsSync(cjsE2eDir)) {
    const cjsTests = fs
      .readdirSync(cjsE2eDir)
      .filter((f) => f.endsWith(".spec.e2e.test.cjs"))
      .filter((f) => (!modFilter ? true : f.includes(modFilter)))
      .map((f) => path.join(cjsE2eDir, f));
    if (cjsTests.length > 0) {
      const res = spawnSync(process.execPath, ["--test", ...cjsTests], {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env,
      });
      process.exit(res.status ?? 1);
    }
  }
  if (fs.existsSync(path.join(ROOT, "scripts/smoke-login.cjs"))) {
    process.exit(runNode("scripts/smoke-login.cjs", rawArgs.slice(1)));
  }
  process.exit(runNode("scripts/verify-business-e2e.mjs", rawArgs.slice(1)));
}

if (sub === "unit" || sub === "test") {
  console.log("═══ [Spec-Kit × CMMI-05] 单元测试套件验证 ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/verify-business-e2e.mjs"))) {
    process.exit(runNode("scripts/verify-business-e2e.mjs", rawArgs.slice(1)));
  }
  const res = spawnSync("pnpm", ["run", "test", ...rawArgs.slice(1)], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(res.status ?? 1);
}

if (sub === "mutation") {
  console.log("═══ [Spec-Kit × CMMI-05] 变异测试与断言杀伤力验证 ═══");
  if (fs.existsSync(path.join(ROOT, "scripts/mutation-gate.cjs"))) {
    process.exit(runNode("scripts/mutation-gate.cjs", rawArgs.slice(1)));
  }
  process.exit(runNode("scripts/verify-business-e2e.mjs", rawArgs.slice(1)));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-05 测试验证与真 PG E2E 扩展):
  node scripts/cmmi-05-verification.cjs docs [--spec <名>]                               列出测试报告/UAT 与各规格 testing.md/evidence.json
  node scripts/cmmi-05-verification.cjs check [--spec <名>]                              校验 CMMI-05 测试文档与证据账本
  node scripts/cmmi-05-verification.cjs asset --type <test-summary|mutation-report|uat>  创建 CMMI-05 标准测试或 UAT 证书文档
  node scripts/cmmi-05-verification.cjs e2e [--file <blueprint.json>|--module <mod>]     6 阶段嵌入式真 PostgreSQL 18.4 Spec E2E
  node scripts/cmmi-05-verification.cjs unit                                             运行单元测试套件
  node scripts/cmmi-05-verification.cjs mutation                                         运行变异测试与防空洞断言验证`);
  process.exit(0);
}

console.error(`[CMMI-05] 未知子命令: ${sub}`);
process.exit(2);
