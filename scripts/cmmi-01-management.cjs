#!/usr/bin/env node
/**
 * CMMI-01 (Spec-Kit 扩展): 立项章程、DAR 决策文档与零污染沙箱孵化 (01_management)
 * --------------------------------------------------------------------------
 * 架构定位:
 *   - `harness.cjs` 定工作流程总规范
 *   - `cmmi-01-management.cjs` 属于 `speckit` 在 CMMI-01 立项策划环节的文档与孵化扩展
 * 关联文档:
 *   - 宏观过程文档: docs/01_management/{project-charter.md, project-plan.md, risk-register.md, dar-decision-records/*}
 *   - 特性规格文档: docs/specs/<domain>/<name>/{selection.md, research.md}
 *
 * 统一跨底座命令:
 *   pnpm run speckit -- cmmi 01 [docs|check|asset|init|render]
 *   node scripts/cmmi-01-management.cjs [docs|check|asset|init|render]
 */

"use strict";

const { spawnSync } = require("node:child_process");
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
tryHandleDocSubcommand("01", rawArgs);

const parsed = parseArgs(rawArgs);
const sub = parsed._[0] || (parsed.name || parsed.target ? "init" : "check");

if (sub === "check") {
  process.exit(checkStageDocs("01", { spec: parsed.spec, strict: Boolean(parsed.strict) }));
}

if (sub === "init" || sub === "hatch" || sub === "sandbox") {
  const forward = rawArgs[0] === sub ? rawArgs.slice(1) : rawArgs;
  if (!parsed.target && !parsed["in-place"]) {
    const slug = String(parsed.name || "app")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    forward.push("--target", `/tmp/${slug}-sandbox`);
  }
  console.log("═══ [Spec-Kit × CMMI-01] 立项策划与零污染沙箱孵化 (01_management) ═══");
  process.exit(runNode("scripts/project-init.cjs", forward));
}

if (sub === "render" || sub === "blueprint") {
  const forward = rawArgs[0] === sub ? rawArgs.slice(1) : rawArgs;
  console.log("═══ [Spec-Kit × CMMI-01] 渲染立项蓝图契约 (Blueprint v1) ═══");
  process.exit(runNode("scripts/blueprint-engine.cjs", ["render", ...forward]));
}

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(`用法 (Spec-Kit × CMMI-01 立项策划扩展):
  node scripts/cmmi-01-management.cjs docs [--spec <名>]                        列出立项章程/风险/DAR 与规格选型文档 (selection.md, research.md)
  node scripts/cmmi-01-management.cjs check [--spec <名>]                       校验 CMMI-01 立项与选型文档完备度
  node scripts/cmmi-01-management.cjs asset --type <charter|plan|risk|dar> ...  创建 CMMI-01 标准立项文档
  node scripts/cmmi-01-management.cjs init --name <slug> --title "<项目名>"     零污染外部沙箱孵化 (/tmp/<slug>-sandbox)
  node scripts/cmmi-01-management.cjs render --name "<系统名>" --domain <域> ... 渲染 Blueprint v1 立项蓝图`);
  process.exit(0);
}

console.error(`[CMMI-01] 未知子命令: ${sub}`);
process.exit(2);
