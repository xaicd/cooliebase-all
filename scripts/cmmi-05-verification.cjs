#!/usr/bin/env node
/**
 * CMMI-05: 测试验证与 6 阶段真 PostgreSQL E2E (05_verification_and_testing)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/05_verification_and_testing/
 * 统一跨底座命令:
 *   node scripts/cmmi-05-verification.cjs e2e [--file <blueprint.json>|--module <mod>]
 *   node scripts/cmmi-05-verification.cjs unit [--module <mod>]
 *   node scripts/cmmi-05-verification.cjs mutation
 *   pnpm run cmmi:05 -- e2e
 *   pnpm harness 05 e2e
 */

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

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

function findSpecE2eTests(moduleFilter) {
  const dir = path.join(ROOT, "tests/e2e");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".spec.e2e.test.ts"))
    .filter((f) => (!moduleFilter ? true : f.includes(moduleFilter)))
    .map((f) => path.join("tests/e2e", f));
}

const rawArgs = process.argv.slice(2);
const parsed = parseArgs(rawArgs);
const sub = parsed._[0] || "e2e";

if (sub === "e2e" || sub === "verify") {
  console.log("═══ [CMMI-05] 测试验证: 嵌入式真 PostgreSQL 18.4 (ephemeral-pg.cjs) 6 阶段 Spec E2E ═══");
  const bpFile = parsed.file || parsed.blueprint;
  if (bpFile) {
    process.exit(runNode("scripts/blueprint-engine.cjs", ["deliver", "--file", String(bpFile), "--verify-e2e"]));
  }
  const tests = findSpecE2eTests(parsed.module ? String(parsed.module) : "");
  if (tests.length > 0) {
    const res = spawnSync("pnpm", ["exec", "vitest", "run", ...tests], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    process.exit(res.status ?? 1);
  }
  console.log("[CMMI-05] 执行平台真 PostgreSQL 冒烟验证 (smoke-login.cjs)...");
  process.exit(runNode("scripts/smoke-login.cjs", rawArgs.slice(1)));
}

if (sub === "unit" || sub === "test") {
  console.log("═══ [CMMI-05] 单元测试套件验证 ═══");
  const res = spawnSync("pnpm", ["run", "test", ...rawArgs.slice(1)], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(res.status ?? 1);
}

if (sub === "mutation") {
  console.log("═══ [CMMI-05] 变异测试与断言杀伤力验证 ═══");
  process.exit(runNode("scripts/mutation-gate.cjs", rawArgs.slice(1)));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-05-verification.cjs e2e [--file <blueprint.json>|--module <mod>]   6 阶段嵌入式真 PG E2E
  node scripts/cmmi-05-verification.cjs unit                                           单元测试套件
  node scripts/cmmi-05-verification.cjs mutation                                       变异与防空洞断言验证`);
  process.exit(0);
}

console.error(`[CMMI-05] 未知子命令: ${sub}`);
process.exit(2);
