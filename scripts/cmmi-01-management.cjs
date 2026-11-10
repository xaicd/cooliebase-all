#!/usr/bin/env node
/**
 * CMMI-01: 立项策划与零污染沙箱孵化 (01_management)
 * --------------------------------------------------------------------------
 * 对齐文档目录: docs/01_management/
 * 统一跨底座命令:
 *   node scripts/cmmi-01-management.cjs init --name <slug> --title "<项目名>" --target /tmp/<slug>-sandbox
 *   node scripts/cmmi-01-management.cjs render --name "<系统名>" --domain <域> --entities "a:实体A,b:实体B" --out <file>
 *   pnpm run cmmi:01 -- init ...
 *   pnpm harness 01 init ...
 *
 * 核心职责:
 *   1. 零污染外部沙箱孵化 (默认隔离到 /tmp/<slug>-sandbox，绝不污染底座 Git 工作区)
 *   2. 立项蓝图草案渲染 (生成 Blueprint v1 JSON)
 *   3. 立项章程、DAR 决策矩阵与风险台账管理
 */

"use strict";

const { spawnSync } = require("node:child_process");
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

const rawArgs = process.argv.slice(2);
const parsed = parseArgs(rawArgs);
const sub = parsed._[0] || (parsed.name || parsed.target ? "init" : "help");

if (sub === "init" || sub === "hatch" || sub === "sandbox") {
  const forward = rawArgs[0] === sub ? rawArgs.slice(1) : rawArgs;
  if (!parsed.target && !parsed["in-place"]) {
    const slug = String(parsed.name || "app")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    forward.push("--target", `/tmp/${slug}-sandbox`);
  }
  console.log("═══ [CMMI-01] 立项策划与零污染沙箱孵化 (01_management) ═══");
  process.exit(runNode("scripts/project-init.cjs", forward));
}

if (sub === "render" || sub === "blueprint") {
  const forward = rawArgs[0] === sub ? rawArgs.slice(1) : rawArgs;
  console.log("═══ [CMMI-01] 渲染立项蓝图契约 (Blueprint v1) ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", ["render", ...forward]));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法:
  node scripts/cmmi-01-management.cjs init --name <slug> --title "<项目名>" [--target /tmp/<slug>-sandbox]
  node scripts/cmmi-01-management.cjs render --name "<系统名>" --domain <域> --entities "a:实体A" --out <blueprint.json>`);
  process.exit(0);
}

console.error(`[CMMI-01] 未知子命令: ${sub}`);
process.exit(2);
