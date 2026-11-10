#!/usr/bin/env node
/**
 * scripts/lib/speckit-cmmi-docs.cjs
 *
 * Spec-Kit × CMMI 00~09 全生命周期文档资产扩展内核 (双底座 100% 同构)
 * --------------------------------------------------------------------------
 * 核心设计原则：
 *   1. `harness.cjs` (HARNESS.md) 定【工作流程总规范】(install/check/build/start/health/status/stop/e2e/deliver)
 *   2. `speckit.cjs` + `cmmi-00`~`cmmi-09` 定【每个 CMMI 环节的文档与过程资产扩展】：
 *      每个 CMMI 环节都同时绑定两类文档资产：
 *        (A) 宏观过程文档 (`docs/00_meta_standards/` ~ `docs/09_operations/`)
 *        (B) 特性规格文档 (`docs/specs/<domain>/<name>/` 下属于该环节的文档产物)
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");

/**
 * CMMI 00~09 十个环节与 Spec-Kit 文档资产的权威映射表
 */
const CMMI_SPEC_STAGES = {
  "00": {
    code: "00",
    script: "scripts/cmmi-00-meta.cjs",
    name: "00_meta_standards",
    title: "CMMI-00 元规范、项目宪法与知识库契约 (Meta Standards & Constitution)",
    macroDirs: ["docs/00_meta_standards", ".specify/memory", "wiki"],
    macroDocs: [
      ".specify/memory/constitution.md",
      "AGENTS.md",
      "HARNESS.md",
      "compat-manifest.json",
      "wiki/index.md",
    ],
    specDocs: ["spec.json"],
    assetTypes: ["constitution", "meta-standard", "openwiki"],
  },
  "01": {
    code: "01",
    script: "scripts/cmmi-01-management.cjs",
    name: "01_management",
    title: "CMMI-01 立项章程、DAR 决策分析与风险台账 (Project Charter, DAR & Risk)",
    macroDirs: ["docs/01_management", "docs/01_management/dar-decision-records"],
    macroDocs: [
      "docs/01_management/project-charter.md",
      "docs/01_management/project-plan.md",
      "docs/01_management/risk-register.md",
    ],
    specDocs: ["selection.md", "research.md"],
    assetTypes: ["charter", "plan", "risk", "dar"],
  },
  "02": {
    code: "02",
    script: "scripts/cmmi-02-requirements.cjs",
    name: "02_requirements",
    title: "CMMI-02 需求分诊、8 要素 Brief 与 EARS 需求规格说明书 (SRS & RTM)",
    macroDirs: ["docs/02_requirements", "docs/features/sprint-prod"],
    macroDocs: [
      "docs/02_requirements/rtm-traceability-matrix.md",
      "docs/02_requirements/non-functional-reqs.md",
    ],
    specDocs: ["brief.json", "requirements.md", "spec.md"],
    assetTypes: ["srs", "rtm", "nfr"],
  },
  "03": {
    code: "03",
    script: "scripts/cmmi-03-design.cjs",
    name: "03_design",
    title: "CMMI-03 概要设计 HLD、架构决策记录 ADR 与数据库 ERD (Architecture & Design)",
    macroDirs: ["docs/03_design", "docs/03_design/adr", "docs/03_design/diagrams", "docs/architecture"],
    macroDocs: ["docs/03_design/database-design-erd.md"],
    specDocs: ["design.md", "prototype.md"],
    assetTypes: ["adr", "erd", "archify", "hld"],
  },
  "04": {
    code: "04",
    script: "scripts/cmmi-04-implementation.cjs",
    name: "04_implementation",
    title: "CMMI-04 研发计划 Plan、WBS 任务矩阵 Tasks 与低代码实现规范 (Implementation & WBS)",
    macroDirs: ["docs/04_implementation"],
    macroDocs: ["docs/04_implementation/coding-standards-and-guidelines.md"],
    specDocs: ["plan.md", "tasks.md"],
    assetTypes: ["code-review", "coding-standard"],
  },
  "05": {
    code: "05",
    script: "scripts/cmmi-05-verification.cjs",
    name: "05_verification",
    title: "CMMI-05 测试计划、真 PG 6 阶段 E2E 证据、变异报告与 UAT 终验单 (Verification & E2E Docs)",
    macroDirs: ["docs/05_verification"],
    macroDocs: [
      "docs/05_verification/test-plan.md",
      "docs/05_verification/test-summary-report.md",
      "docs/05_verification/mutation-report.md",
      "docs/05_verification/uat-acceptance-certificate.md",
    ],
    specDocs: ["testing.md", "evidence.json", "bugs.md"],
    assetTypes: ["test-summary", "mutation-report", "uat"],
  },
  "06": {
    code: "06",
    script: "scripts/cmmi-06-quality.cjs",
    name: "06_quality_assurance",
    title: "CMMI-06 质量核对单 Checklist、PPQA/FCA/PCA 审计报告与 CAR 根因分析 (Quality & Audit Docs)",
    macroDirs: ["docs/06_quality_assurance", "docs/06_quality_assurance/audit"],
    macroDocs: [],
    specDocs: ["checklist.md"],
    assetTypes: ["audit", "spc", "car"],
  },
  "07": {
    code: "07",
    script: "scripts/cmmi-07-release.cjs",
    name: "07_release",
    title: "CMMI-07 部署 SOP、回滚预案 Runbook 与不可变发布指纹文档 (Release & Deployment Docs)",
    macroDirs: ["docs/07_release", "docs/07_release_and_deployment"],
    macroDocs: [
      "docs/07_release/system-deployment-sop.md",
      "docs/07_release/rollback-emergency-plan.md",
    ],
    specDocs: ["deployment.md", "runbook.json"],
    assetTypes: ["deployment-sop", "rollback-runbook", "release-notes"],
  },
  "08": {
    code: "08",
    script: "scripts/cmmi-08-sre.cjs",
    name: "08_sre",
    title: "CMMI-08 SRE SLO/SLI 错误预算矩阵、灾备预案与免责事故复盘文档 (SRE & Postmortem Docs)",
    macroDirs: ["docs/08_sre", "docs/08_sre/01_slo_sli_metrics", "docs/08_sre/06_incidents_postmortem"],
    macroDocs: ["docs/08_sre/01_slo_sli_metrics/SLO-SLI-ERROR-BUDGET-MATRIX.md"],
    specDocs: ["operations.md"],
    assetTypes: ["slo-matrix", "postmortem", "dr-plan"],
  },
  "09": {
    code: "09",
    script: "scripts/cmmi-09-operations.cjs",
    name: "09_operations",
    title: "CMMI-09 持续运营手册、财务平账单与历史规格防污染归档 (Operations & Spec Archive Docs)",
    macroDirs: ["docs/09_operations", "docs/09_operations/01_financial_reconciliation", "docs/specs/archive"],
    macroDocs: ["docs/09_operations/tenant-governance.md"],
    specDocs: ["operations.md"],
    assetTypes: ["reconciliation", "ops-ledger"],
  },
};

function scanFiles(dirAbs) {
  const out = [];
  if (!fs.existsSync(dirAbs)) return out;
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) out.push(...scanFiles(full));
    else if (/\.(md|json|yaml|yml|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function findActiveSpecDirs(specFilter) {
  const specsRoot = path.join(ROOT, "docs/specs");
  const out = [];
  if (!fs.existsSync(specsRoot)) return out;
  for (const domEntry of fs.readdirSync(specsRoot, { withFileTypes: true })) {
    if (!domEntry.isDirectory() || domEntry.name === "archive") continue;
    const domDir = path.join(specsRoot, domEntry.name);
    for (const specEntry of fs.readdirSync(domDir, { withFileTypes: true })) {
      if (!specEntry.isDirectory()) continue;
      if (specFilter && specEntry.name !== specFilter) continue;
      out.push({
        domain: domEntry.name,
        name: specEntry.name,
        dir: path.join(domDir, specEntry.name),
      });
    }
  }
  return out;
}

function inspectDocFile(absPath) {
  if (!fs.existsSync(absPath)) {
    return { exists: false, rel: path.relative(ROOT, absPath), placeholders: 0 };
  }
  const text = fs.readFileSync(absPath, "utf8");
  const matches = text.match(/<!--\s*(?:TODO|待填)[^>]*-->/gi) || [];
  return {
    exists: true,
    rel: path.relative(ROOT, absPath),
    placeholders: matches.length,
    bytes: Buffer.byteLength(text, "utf8"),
  };
}

/**
 * 列出某个 CMMI 阶段的宏观过程文档与 Spec 规格文档状态
 */
function listStageDocs(phaseCode, opts = {}) {
  const stage = CMMI_SPEC_STAGES[phaseCode];
  if (!stage) throw new Error(`Unknown CMMI phase: ${phaseCode}`);

  console.log(`═══ [Spec-Kit × ${stage.title}] 文档资产清单 ═══`);
  console.log(`所属阶段: CMMI-${stage.code} (${stage.name}) | 扩展入口: pnpm run speckit -- cmmi ${stage.code}`);

  // 1. 宏观过程资产目录扫描
  const macroFiles = new Set();
  for (const rel of stage.macroDocs) {
    if (fs.existsSync(path.join(ROOT, rel))) macroFiles.add(path.join(ROOT, rel));
  }
  for (const dRel of stage.macroDirs) {
    for (const f of scanFiles(path.join(ROOT, dRel))) macroFiles.add(f);
  }

  console.log(`\n📚 [1] 宏观工程过程文档 (${stage.macroDirs[0] || ""}): 共 ${macroFiles.size} 份`);
  for (const abs of [...macroFiles].sort().slice(0, 25)) {
    const info = inspectDocFile(abs);
    const badge = info.placeholders > 0 ? `⚠️ 含 ${info.placeholders} 处待填` : "✅ 完备";
    console.log(`  - [${badge}] ${info.rel} (${info.bytes} B)`);
  }
  if (macroFiles.size > 25) {
    console.log(`  ... 另有 ${macroFiles.size - 25} 份文档`);
  }

  // 2. 活跃 Spec 规格包内对应本阶段的文档
  const specs = findActiveSpecDirs(opts.spec);
  console.log(`\n📐 [2] 特性规格包阶段文档 (docs/specs/<domain>/<name>/{${stage.specDocs.join(",")}}): 扫描 ${specs.length} 个规格`);
  for (const s of specs.slice(0, 20)) {
    const statuses = stage.specDocs.map((docName) => {
      const info = inspectDocFile(path.join(s.dir, docName));
      if (!info.exists) return `${docName}:❌缺失`;
      if (info.placeholders > 0) return `${docName}:⚠️${info.placeholders}待填`;
      return `${docName}:✅`;
    });
    console.log(`  - [${s.domain}/${s.name}] ${statuses.join(" · ")}`);
  }
  return 0;
}

/**
 * 校验某个 CMMI 阶段关联的 Spec 文档与宏观过程文档
 */
function checkStageDocs(phaseCode, opts = {}) {
  const stage = CMMI_SPEC_STAGES[phaseCode];
  if (!stage) throw new Error(`Unknown CMMI phase: ${phaseCode}`);

  console.log(`═══ [Spec-Kit × ${stage.title}] 文档资产合规校验 ═══`);
  const problems = [];
  const specs = findActiveSpecDirs(opts.spec);

  for (const s of specs) {
    for (const docName of stage.specDocs) {
      // bugs.md 仅在 bugfix 或存在时检查；selection.md/research.md/prototype.md/deployment.md/operations.md 在已展开的规格中检查
      const docAbs = path.join(s.dir, docName);
      if (!fs.existsSync(docAbs)) continue;
      const info = inspectDocFile(docAbs);
      if (opts.strict && info.placeholders > 0) {
        problems.push(`${info.rel} 仍含 ${info.placeholders} 处未填占位符`);
      }
    }
  }

  if (problems.length > 0) {
    console.error(`❌ [CMMI-${phaseCode}] 发现 ${problems.length} 处文档问题:`);
    for (const p of problems) console.error(`  - ${p}`);
    return 1;
  }
  console.log(`✅ [CMMI-${phaseCode}] Spec-Kit 阶段文档校验通过（活跃规格 ${specs.length} 个，阶段关联文档: ${stage.specDocs.join(", ")}）`);
  return 0;
}

/**
 * 调用 cmmi-asset-scaffold.cjs 创建该阶段的标准过程资产文档
 */
function createStageAsset(phaseCode, rawArgs = []) {
  const scaffoldPath = path.join(ROOT, "scripts/cmmi-asset-scaffold.cjs");
  const forward = ["new", "--phase", phaseCode, ...rawArgs];
  const res = spawnSync(process.execPath, [scaffoldPath, ...forward], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  return res.status ?? 1;
}

/**
 * 跨底座统一调用 Spec-Kit 引擎 (`pnpm run speckit -- ...`)
 */
function runSpeckit(extraArgs = []) {
  const res = spawnSync("pnpm", ["run", "--silent", "speckit", "--", ...extraArgs], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  return res.status ?? 1;
}

function getFlagValue(argv, flag) {
  const idx = argv.indexOf(flag);
  return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : undefined;
}

/**
 * 统一拦截每个 CMMI 阶段脚本的 Spec-Kit 文档子命令 (docs | list | asset | check-docs)
 * 若已处理则直接 process.exit(...)；若不属于纯文档子命令则返回 false 交由阶段脚本继续处理。
 */
function tryHandleDocSubcommand(phaseCode, rawArgs = []) {
  const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "";
  const rest = sub ? rawArgs.slice(1) : rawArgs;
  const spec = getFlagValue(rawArgs, "--spec") || getFlagValue(rawArgs, "--name");
  const strict = rawArgs.includes("--strict");

  if (sub === "docs" || sub === "list" || sub === "ls") {
    process.exit(listStageDocs(phaseCode, { spec }));
  }
  if (sub === "check-docs" || sub === "doc-check") {
    process.exit(checkStageDocs(phaseCode, { spec, strict }));
  }
  if (sub === "asset" || sub === "new-doc" || (sub === "new" && phaseCode !== "02")) {
    process.exit(createStageAsset(phaseCode, rest));
  }
  if (sub === "new" && phaseCode === "02") {
    const typeVal = getFlagValue(rawArgs, "--type");
    if (typeVal && ["srs", "rtm", "nfr"].includes(typeVal)) {
      process.exit(createStageAsset(phaseCode, rest));
    }
  }
  return false;
}

/**
 * 打印全部 CMMI 00~09 阶段作为 Spec-Kit 文档扩展的全景矩阵
 */
function printCmmiSpecMatrix() {
  console.log("\n═══ 📐 Spec-Kit × CMMI 00~09 全生命周期文档扩展矩阵 ═══");
  console.log("架构定位: harness 定工作流程总规范 | 每个 CMMI 00~09 环节均属于 speckit 的文档与过程资产扩展\n");
  console.log("| 阶段 | Spec-Kit 扩展入口 | 宏观工程文档目录 (Layer A) | 特性规格包文档 (Layer B: docs/specs/<域>/<名>/) |");
  console.log("|---|---|---|---|");
  for (const code of Object.keys(CMMI_SPEC_STAGES).sort()) {
    const st = CMMI_SPEC_STAGES[code];
    console.log(
      `| **CMMI-${code}** | \`pnpm run speckit -- cmmi ${code}\` (\`${path.basename(st.script)}\`) | \`${st.macroDirs[0]}\` | \`${st.specDocs.join("`, `")}\` |`
    );
  }
  console.log("\n通用阶段文档子命令 (00~09 全部支持):");
  console.log("  pnpm run speckit -- cmmi <00..09> docs [--spec <规格名>]          列出该阶段宏观文档与规格包阶段文档");
  console.log("  pnpm run speckit -- cmmi <00..09> check [--spec <规格名>]         校验该阶段文档齐备度与阶段契约门禁");
  console.log("  pnpm run speckit -- cmmi <01..09> asset --type <类型> --title ... 创建该阶段 CMMI 标准过程文档\n");
}

module.exports = {
  CMMI_SPEC_STAGES,
  listStageDocs,
  checkStageDocs,
  createStageAsset,
  runSpeckit,
  tryHandleDocSubcommand,
  printCmmiSpecMatrix,
  findActiveSpecDirs,
  inspectDocFile,
};
