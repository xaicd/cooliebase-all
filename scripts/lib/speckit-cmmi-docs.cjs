#!/usr/bin/env node
/**
 * scripts/lib/speckit-cmmi-docs.cjs
 *
 * Spec-Kit × CMMI 00~09 全生命周期文档资产与 PMO 总控雷达内核 (三仓同构: coolie / cooliebase-all / yudao-quad-terminal)
 * --------------------------------------------------------------------------
 * 核心设计原则：
 *   1. `harness.cjs` (HARNESS.md) 定【工作流程总规范】(install/check/build/start/health/status/stop/e2e/deliver/pmo)
 *   2. `speckit` + `cmmi-00`~`cmmi-09` 定【每个 CMMI 环节的文档与过程资产扩展】：
 *      每个 CMMI 环节都同时绑定两类文档资产：
 *        (A) 宏观过程文档 (`docs/00_meta_standards/` ~ `docs/09_operations/`)
 *        (B) 特性规格文档 (`docs/specs/<domain>/<name>/` 下属于该环节的文档产物)
 *   3. `cmmi-01-management.cjs pmo` (`pnpm run pmo`) 提供【AI Agent 进场 PMO 待办雷达】：
 *      - 在 `cooliebase-all` / `yudao-quad-terminal` 中：输出单项目 4 维 PMO 待办雷达（基线健康 + 规格任务漏斗 + 门禁技债池 + P0/P1/P2 下一步行动指令）
 *      - 在 `coolie` 工坊工厂中：输出更全面的【工坊总 PMO 四维全域全景雷达】（层A工坊自建主线 + 跨仓双底座联邦监控 + 层B客户船坞与运行实例 + 数字员工舰队与7工具池派单总表）
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.basename(__dirname) === "lib"
  ? path.resolve(__dirname, "../..")
  : path.resolve(__dirname, "..");

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
    title: "CMMI-01 PMO 待办总控、立项章程、DAR 决策分析与风险台账 (PMO, Charter, DAR & Risk)",
    macroDirs: ["docs/01_management", "docs/01_management/dar-decision-records"],
    macroDocs: [
      "docs/01_management/pmo-dashboard.md",
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
    macroDirs: ["docs/06_quality_assurance", "docs/06_quality_assurance/audit", "docs/06_cmmi_audit"],
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

function findActiveSpecDirs(specFilter, repoRoot = ROOT) {
  const specsRoot = path.join(repoRoot, "docs/specs");
  const out = [];
  if (!fs.existsSync(specsRoot)) return out;
  for (const domEntry of fs.readdirSync(specsRoot, { withFileTypes: true })) {
    if (!domEntry.isDirectory() || domEntry.name === "archive" || domEntry.name.startsWith("_")) continue;
    const domDir = path.join(specsRoot, domEntry.name);
    for (const specEntry of fs.readdirSync(domDir, { withFileTypes: true })) {
      if (!specEntry.isDirectory()) continue;
      if (specFilter && specEntry.name !== specFilter) continue;
      const specAbs = path.join(domDir, specEntry.name);
      if (
        !fs.existsSync(path.join(specAbs, "brief.json")) &&
        !fs.existsSync(path.join(specAbs, "spec.json")) &&
        !fs.existsSync(path.join(specAbs, "tasks.md"))
      ) {
        continue;
      }
      out.push({
        domain: domEntry.name,
        name: specEntry.name,
        dir: specAbs,
      });
    }
  }
  return out;
}

function inspectDocFile(absPath, repoRoot = ROOT) {
  if (!fs.existsSync(absPath)) {
    return { exists: false, rel: path.relative(repoRoot, absPath), placeholders: 0 };
  }
  const text = fs.readFileSync(absPath, "utf8");
  const matches = text.match(/<!--\s*(?:TODO|待填)[^>]*-->/gi) || [];
  return {
    exists: true,
    rel: path.relative(repoRoot, absPath),
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

// ============================================================================
// PMO 总控与待办雷达核心引擎 (PMO Radar Engine)
// ============================================================================

function globToRegExp(pattern) {
  const normalized = pattern.endsWith("/") ? `${pattern}**` : pattern;
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "\u0000")
    .replace(/\*\*/g, "\u0001")
    .replace(/\*/g, "[^/]*");
  return new RegExp("^" + escaped.replace(/\u0000/g, "(?:.*/)?").replace(/\u0001/g, ".*") + "(?:$|/)");
}

function execGitSafe(repoRoot, args) {
  try {
    const res = spawnSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    return (res.stdout || "").trim();
  } catch (err) {
    // 非 Git 仓库或 git 子进程异常时降级为空输出，保证 PMO 雷达永不崩溃: String(err)
    void err;
    return "";
  }
}

/**
 * 扫描任意仓库 (coolie / cooliebase-all / yudao-quad-terminal / 客户项目) 的 PMO 态势
 */
function analyzeRepoPmo(repoRoot, opts = {}) {
  const repoName = path.basename(repoRoot);
  let pkg = {};
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  } catch (err) {
    // package.json 不存在或非标准 JSON 时回退空对象: String(err)
    void err;
  }

  const isFoundry = repoName === "coolie" || pkg.name === "paperclip";
  const isYudao = repoName === "yudao-quad-terminal" || pkg.name === "yudao-quad-terminal";
  const isCoolieBase = repoName === "cooliebase-all" || pkg.name === "cooliebase-all";

  // 1. Git 基线信息
  const branch = execGitSafe(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]) || "main";
  const headCommit = execGitSafe(repoRoot, ["log", "-1", "--pretty=format:%h %s (%cr)"]) || "unknown";
  const statusShort = execGitSafe(repoRoot, ["status", "--short"]);
  const dirtyLines = statusShort
    ? statusShort.split("\n").filter((l) => l.trim() && !l.trim().endsWith("apps/admin") && !l.trim().endsWith("apps/backend") && !l.trim().endsWith("apps/miniapp"))
    : [];

  // 2. 一次性读取 Git 提交历史用于 3 层任务归属
  const rawLog = execGitSafe(repoRoot, [
    "log",
    "--pretty=format:%x00%H%x09%s",
    "--name-only",
    "-n",
    isFoundry ? "1200" : "5000",
  ]);
  const commits = [];
  for (const block of rawLog.split("\u0000")) {
    if (!block.trim()) continue;
    const [head, ...rest] = block.split("\n");
    const [sha, ...subjectParts] = head.split("\t");
    commits.push({
      sha,
      subject: subjectParts.join("\t"),
      files: rest.map((f) => f.trim()).filter(Boolean),
    });
  }

  // 3. 构建共享白名单文件索引
  const specs = findActiveSpecDirs(opts.spec, repoRoot);
  const sharedFiles = new Map();
  for (const s of specs) {
    const b = path.join(s.dir, "brief.json");
    if (!fs.existsSync(b)) continue;
    try {
      const specBrief = JSON.parse(fs.readFileSync(b, "utf8"));
      for (const t of specBrief.tasks || []) {
        const wl = Array.isArray(t.files) ? t.files.join(",") : t.files || t.whitelist || "";
        for (const item of String(wl).split(",")) {
          const key = item.trim().replace(/^`|`$/g, "");
          if (!key || key === "-") continue;
          if (!sharedFiles.has(key)) sharedFiles.set(key, new Set());
          sharedFiles.get(key).add(b);
        }
      }
    } catch (err) {
      // 草稿态 brief.json 解析异常时跳过共享白名单统计: String(err)
      void err;
    }
  }
  const isSharedFile = (f) => (sharedFiles.get(f)?.size || 0) > 1;
  const cellsOf = (line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  const completedSpecs = [];
  const wipSpecs = [];
  const plannedSpecs = [];
  const skeletonSpecs = [];

  for (const s of specs) {
    const tasksFile = path.join(s.dir, "tasks.md");
    if (!fs.existsSync(tasksFile)) continue;
    const txt = fs.readFileSync(tasksFile, "utf8");
    const mtimeMs = fs.statSync(tasksFile).mtimeMs;

    const checkedIds = new Set(
      (txt.match(/^- \[x\] \*\*(T\d+)\*\*/gim) || []).map((m) => m.match(/\*\*(T\d+)\*\*/i)[1].toUpperCase())
    );
    const rows = txt
      .split("\n")
      .filter((l) => l.trim().startsWith("|"))
      .filter((l) => !cellsOf(l).includes("ID"))
      .filter((l) => !cellsOf(l).every((c) => /^:?-+:?$/.test(c)))
      .map(cellsOf)
      .filter((c) => c.length >= 4 && /^T\d+$/i.test(c[0]));

    const tasks = rows.map((c) => {
      const hasGateCol = c.length >= 6;
      return {
        id: c[0].toUpperCase(),
        parent: c[1],
        title: hasGateCol ? c[3] : c[2],
        whitelist: hasGateCol ? c[4] : c[3],
        statusCol: hasGateCol ? c[5] : c[4] || "未开始",
      };
    });
    if (tasks.length === 0) continue;

    // 检查是否仍为含 <!-- 待填 --> 的草稿骨架
    const hasSkeletonPlaceholder = tasks.some((t) => /<!--\s*(?:TODO|待填)/i.test(t.title) || /<!--\s*(?:TODO|待填)/i.test(t.whitelist));
    if (hasSkeletonPlaceholder) {
      skeletonSpecs.push({
        domain: s.domain,
        name: s.name,
        total: tasks.length,
        mtimeMs,
        relDir: path.relative(repoRoot, s.dir),
      });
      continue;
    }

    const specDirRel = path.relative(repoRoot, s.dir).split(path.sep).join("/");
    const touchesSpecDir = (c) => c.files.some((f) => f === specDirRel || f.startsWith(`${specDirRel}/`));
    const mentionsSpec = (c) => c.subject.includes(s.name);
    let specMarkedDone = /^>\s*状态：`?(?:DONE|ACCEPTED|COMPLETED)`?/im.test(txt);
    const specJsonPath = path.join(s.dir, "spec.json");
    if (!specMarkedDone && fs.existsSync(specJsonPath)) {
      try {
        const sj = JSON.parse(fs.readFileSync(specJsonPath, "utf8"));
        if (/^(?:DONE|ACCEPTED|COMPLETED)$/i.test(String(sj.status || ""))) {
          specMarkedDone = true;
        }
      } catch (err) {
        // spec.json 解析失败时忽略状态回退: String(err)
        void err;
      }
    }

    let doneCount = 0;
    let landedOnDiskCount = 0;
    const pendingTasks = [];

    for (const t of tasks) {
      let isDone = specMarkedDone || checkedIds.has(t.id) || /已完成|done|passed/i.test(t.statusCol);
      const wlItems =
        t.whitelist && t.whitelist !== "-"
          ? t.whitelist
              .split(",")
              .map((i) => i.trim().replace(/^`|`$/g, ""))
              .filter(Boolean)
          : [];

      if (!isDone) {
        const taskTagRe = new RegExp(`\\[[^\\]]*\\b${t.id}\\b[^\\]]*\\]`, "i");
        const byId = commits.filter(
          (c) =>
            c.subject.includes(`[${s.name}/${t.id}]`) ||
            c.subject.includes(`[${t.id}]`) ||
            taskTagRe.test(c.subject)
        );
        let hits = byId;
        if (wlItems.length > 0) {
          const patterns = wlItems.map(globToRegExp);
          const owned = (c) => c.files.some((f) => patterns.some((re) => re.test(f)) && !isSharedFile(f));
          const attributing = (c) => owned(c) || mentionsSpec(c) || touchesSpecDir(c);
          hits = byId.filter(attributing);
        } else {
          hits = byId.filter((c) => mentionsSpec(c) || touchesSpecDir(c));
        }
        if (hits.length > 0) isDone = true;
      }

      // 物理文件落盘辅助核验：检查白名单中的具体文件路径是否已在仓库落盘
      const concreteFiles = wlItems.filter((item) => !item.includes("*") && item !== "-");
      const allConcreteExist =
        concreteFiles.length > 0 && concreteFiles.every((rel) => fs.existsSync(path.join(repoRoot, rel)));
      if (allConcreteExist) landedOnDiskCount += 1;

      if (isDone) {
        doneCount += 1;
      } else {
        pendingTasks.push({
          ...t,
          filesLandedOnDisk: allConcreteExist,
        });
      }
    }

    // 读取 evidence.json 中待推进的门禁
    let pendingGates = [];
    const evPath = path.join(s.dir, "evidence.json");
    if (fs.existsSync(evPath)) {
      try {
        const ev = JSON.parse(fs.readFileSync(evPath, "utf8"));
        pendingGates = Object.entries(ev.gates || {})
          .filter(([, v]) => v.status === "pending" || v.status === "blocked")
          .map(([k]) => k);
      } catch (err) {
        // evidence.json 尚未落盘或非标准 JSON 时忽略门禁统计: String(err)
        void err;
      }
    }

    const specItem = {
      domain: s.domain,
      name: s.name,
      relDir: specDirRel,
      total: tasks.length,
      done: doneCount,
      landedOnDiskCount,
      pendingTasks,
      pendingGates,
      mtimeMs,
    };

    if (doneCount === tasks.length) {
      completedSpecs.push(specItem);
    } else if (doneCount > 0 || landedOnDiskCount > 0) {
      wipSpecs.push(specItem);
    } else {
      plannedSpecs.push(specItem);
    }
  }

  wipSpecs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  plannedSpecs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  completedSpecs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  skeletonSpecs.sort((a, b) => b.mtimeMs - a.mtimeMs);

  // 4. 扫描工程门禁与技术债待办池
  const techDebts = [];
  if (isCoolieBase) {
    const evoPath = path.join(repoRoot, "docs/architecture/artifacts/evolution-backlog.json");
    if (fs.existsSync(evoPath)) {
      try {
        const evo = JSON.parse(fs.readFileSync(evoPath, "utf8"));
        for (const item of evo.items || []) {
          techDebts.push({
            priority: item.severity === "high" || item.severity === "blocker" ? "P0" : "P2",
            category: item.clause || "Evolution Backlog",
            summary: item.summary || item.title || JSON.stringify(item),
            cmd: "pnpm run standards:check",
          });
        }
      } catch (err) {
        // evolution-backlog.json 读取异常时跳过进化待办提取: String(err)
        void err;
      }
    }
    const roadmapPath = path.join(repoRoot, "docs/architecture/EVOLUTION-ROADMAP-2026.md");
    if (fs.existsSync(roadmapPath)) {
      const rmTxt = fs.readFileSync(roadmapPath, "utf8");
      const unchecked = rmTxt.match(/^- \[ \] \*\*([^*]+)\*\*.*$/gm) || [];
      for (const line of unchecked) {
        techDebts.push({
          priority: "P1",
          category: "EVOLUTION-ROADMAP (Ring 4)",
          summary: line.replace(/^- \[ \] /, "").trim(),
          cmd: "pnpm run domain:pack pay",
        });
      }
    }
    techDebts.push(
      {
        priority: "P2",
        category: "Agent-Native 语义选择器基线消减",
        summary: "存量 470 个管理端页面/组件待补齐 data-agent-id (基线棘轮守护中，新增 0)",
        cmd: "pnpm run agent:native:check",
      },
      {
        priority: "P2",
        category: "插件层 TypeScript 类型与权限码基线消减",
        summary: "packages/plugins 存量 190 项唯一类型键与 338 项权限码常量登记收敛",
        cmd: "pnpm run typecheck:check && pnpm run contracts:governance:check",
      }
    );
  } else if (isYudao) {
    techDebts.push(
      {
        priority: "P0",
        category: "前后端契约孤儿端点收敛 (Advisory -> 0)",
        summary: "packages/api-client 与 apps/backend Controller 存在 92 个未对齐孤儿端点，收敛后 16/16 门禁全绿无告警",
        cmd: "pnpm run check:drift",
      },
      {
        priority: "P1",
        category: "四端原生 App (apps/app) 业务页深化",
        summary: "推进 apps/app (Expo React Native) 与 apps/miniapp (UniApp) 商城/会员核心页面双端同构",
        cmd: "pnpm harness check",
      },
      {
        priority: "P2",
        category: "19 业务域声明式蓝图预设扩充",
        summary: "在 scripts/blueprint-engine.cjs 中扩充 ERP/WMS/MES/CRM 行业蓝图预设模板",
        cmd: "node scripts/cmmi-01-management.cjs render --help",
      }
    );
  } else if (isFoundry) {
    const memPath = path.join(repoRoot, "MEMORY.md");
    const memBytes = fs.existsSync(memPath) ? fs.statSync(memPath).size : 0;
    techDebts.push(
      {
        priority: "P1",
        category: "MEMORY.md 8KB 硬门禁水位监控",
        summary: `当前 MEMORY.md 体积为 ${memBytes} / 8192 B (余量 ${8192 - memBytes} B)`,
        cmd: "node scripts/check-agent-entry.mjs",
      },
      {
        priority: "P1",
        category: "层A 完结规格防污染归档",
        summary: `当前活跃目录中有 ${completedSpecs.length} 个规格已完成全部 WBS 任务，可归档至 docs/specs/archive/`,
        cmd: "node scripts/speckit.cjs list",
      }
    );
  }

  // 5. 生成该项目专属的 P0 / P1 / P2 行动指令队列
  const actionQueue = [];

  for (const w of wipSpecs.slice(0, 6)) {
    const nextTask = w.pendingTasks[0];
    if (!nextTask) continue;
    const diskHint = nextTask.filesLandedOnDisk ? " (目标文件已在磁盘，请核验并带标签提交)" : "";
    actionQueue.push({
      priority: "P0",
      scope: `${w.domain}/${w.name} (${w.done}/${w.total})`,
      title: `推进 ${nextTask.id}: ${nextTask.title.slice(0, 68)}${diskHint}`,
      whitelist: nextTask.whitelist,
      cmd: isFoundry
        ? `node scripts/speckit.cjs tasks --spec ${w.name}`
        : `node scripts/cmmi-04-implementation.cjs tasks --spec ${w.name}`,
    });
  }

  for (const p of plannedSpecs.slice(0, 4)) {
    const firstTask = p.pendingTasks[0];
    if (!firstTask) continue;
    actionQueue.push({
      priority: "P1",
      scope: `${p.domain}/${p.name} (0/${p.total})`,
      title: `启动首条任务 ${firstTask.id}: ${firstTask.title.slice(0, 65)}`,
      whitelist: firstTask.whitelist,
      cmd: isFoundry
        ? `node scripts/speckit.cjs tasks --spec ${p.name}`
        : `node scripts/cmmi-04-implementation.cjs tasks --spec ${p.name}`,
    });
  }

  for (const sk of skeletonSpecs.slice(0, 3)) {
    actionQueue.push({
      priority: "P1",
      scope: `${sk.domain}/${sk.name} (骨架待填)`,
      title: `补齐 ${sk.relDir}/brief.json 中的 <!-- 待填 --> 占位并展开规格`,
      whitelist: `${sk.relDir}/brief.json`,
      cmd: isFoundry
        ? `node scripts/speckit.cjs build --spec ${sk.name}`
        : `node scripts/cmmi-02-requirements.cjs build --name ${sk.name}`,
    });
  }

  if (completedSpecs.length > 0) {
    const sample = completedSpecs[0];
    actionQueue.push({
      priority: "P1",
      scope: `已完结规格归档池 (${completedSpecs.length} 个)`,
      title: `对已完成全部任务的规格 (如 ${sample.domain}/${sample.name}) 核销门禁证据并归档`,
      whitelist: sample.relDir,
      cmd: isFoundry
        ? `node scripts/speckit.cjs archive --name ${sample.name}`
        : `node scripts/cmmi-09-operations.cjs archive --name ${sample.name}`,
    });
  }

  for (const td of techDebts) {
    actionQueue.push({
      priority: td.priority,
      scope: td.category,
      title: td.summary,
      whitelist: "-",
      cmd: td.cmd,
    });
  }

  return {
    repoRoot,
    repoName,
    pkgName: pkg.name || repoName,
    version: pkg.version || "1.0.0",
    roleType: isFoundry ? "FOUNDRY_MASTER_PMO" : isYudao ? "YUDAO_BASE_PMO" : isCoolieBase ? "COOLIEBASE_PMO" : "PROJECT_PMO",
    branch,
    headCommit,
    dirtyCount: dirtyLines.length,
    dirtyLines: dirtyLines.slice(0, 10),
    specsSummary: {
      totalActive: specs.length,
      wipCount: wipSpecs.length,
      plannedCount: plannedSpecs.length,
      completedUnarchivedCount: completedSpecs.length,
      skeletonCount: skeletonSpecs.length,
    },
    wipSpecs,
    plannedSpecs,
    completedSpecs,
    skeletonSpecs,
    techDebts,
    actionQueue,
  };
}

/**
 * 检查单个蓝图底座的 10 项标准能力齐备度（供 Coolie 工坊总 PMO 跨仓联邦巡检）
 */
function inspectBlueprintBaseParity(baseDir) {
  if (!fs.existsSync(baseDir)) return { exists: false, baseDir };
  const checks = [
    { id: "agents_30s", label: "AGENTS.md 30s 决策树与 PMO 导航", ok: fs.existsSync(path.join(baseDir, "AGENTS.md")) },
    { id: "harness_md", label: "HARNESS.md 双支柱规范", ok: fs.existsSync(path.join(baseDir, "HARNESS.md")) },
    { id: "harness_cjs", label: "scripts/harness.cjs 9 大生命周期", ok: fs.existsSync(path.join(baseDir, "scripts/harness.cjs")) },
    {
      id: "cmmi_00_09",
      label: "scripts/cmmi-00..09.cjs 10 环节脚本",
      ok: ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09"].every((c) =>
        fs.existsSync(path.join(baseDir, CMMI_SPEC_STAGES[c].script))
      ),
    },
    {
      id: "speckit_cmmi",
      label: "scripts/lib/speckit-cmmi-docs.cjs 文档扩展内核",
      ok:
        fs.existsSync(path.join(baseDir, "scripts/lib/speckit-cmmi-docs.cjs")) ||
        fs.existsSync(path.join(baseDir, "scripts/cmmi-spec-docs.cjs")),
    },
    {
      id: "ephemeral_pg",
      label: "scripts/lib/ephemeral-pg.cjs 嵌入式真 PG 18.4",
      ok: fs.existsSync(path.join(baseDir, "scripts/lib/ephemeral-pg.cjs")),
    },
    {
      id: "blueprint_engine",
      label: "scripts/blueprint-engine.cjs (<500T 蓝图编译/自愈/E2E)",
      ok: fs.existsSync(path.join(baseDir, "scripts/blueprint-engine.cjs")),
    },
    {
      id: "project_reactor",
      label: "scripts/project-reactor.mjs 零污染沙箱白标引擎",
      ok: fs.existsSync(path.join(baseDir, "scripts/project-reactor.mjs")),
    },
    {
      id: "agent_route",
      label: "scripts/agent-route.cjs 确定性需求分诊器",
      ok: fs.existsSync(path.join(baseDir, "scripts/agent-route.cjs")),
    },
    {
      id: "multi_ide_entries",
      label: "6 大多智能体/IDE 入口 (CLAUDE/.cursor/.windsurf/.cline/copilot/llms)",
      ok: [
        "CLAUDE.md",
        ".cursorrules",
        ".windsurfrules",
        ".clinerules",
        ".github/copilot-instructions.md",
        "llms.txt",
      ].every((f) => fs.existsSync(path.join(baseDir, f))),
    },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const pmo = analyzeRepoPmo(baseDir);
  return {
    exists: true,
    baseName: path.basename(baseDir),
    passed,
    total: checks.length,
    checks,
    pmo,
  };
}

/**
 * 扫描同级船坞中的层 B 客户交付项目与工具池态势（专供 Coolie 工坊总 PMO）
 */
function inspectFoundryEcosystem(foundryRoot) {
  const parentDir = path.resolve(foundryRoot, "..");
  const coreRepos = new Set(["coolie", "cooliebase-all", "yudao-quad-terminal"]);
  const clientWorkspaces = [];

  if (fs.existsSync(parentDir)) {
    for (const entry of fs.readdirSync(parentDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || coreRepos.has(entry.name)) continue;
      const abs = path.join(parentDir, entry.name);
      const hasGit = fs.existsSync(path.join(abs, ".git"));
      const hasPkg = fs.existsSync(path.join(abs, "package.json"));
      if (!hasGit && !hasPkg) continue;
      const hasHarnessMd = fs.existsSync(path.join(abs, "HARNESS.md"));
      const hasHarnessScript =
        fs.existsSync(path.join(abs, "scripts/harness.cjs")) ||
        fs.existsSync(path.join(abs, "scripts/harness.mjs")) ||
        fs.existsSync(path.join(abs, "scripts/harness.sh"));
      const hasServiceSh = fs.existsSync(path.join(abs, "scripts/service.sh"));
      clientWorkspaces.push({
        name: entry.name,
        path: abs,
        triadOk: hasHarnessMd && hasHarnessScript && hasServiceSh,
        hasHarnessMd,
        hasHarnessScript,
        hasServiceSh,
      });
    }
  }

  const bases = [
    inspectBlueprintBaseParity(path.join(parentDir, "cooliebase-all")),
    inspectBlueprintBaseParity(path.join(parentDir, "yudao-quad-terminal")),
  ].filter((b) => b.exists);

  const employees = [
    { name: "Hermes (掌柜/PMO)", role: "全局意图分诊、WBS 拆单、双底座派活、终验核销", veto: "主线推进与立项拍板" },
    { name: "墨斗 (FDA)", role: "业务本体建模、租户隔离边界、EARS SRS 与 <500T 蓝图设计", veto: "架构与隔离越权否决" },
    { name: "铁匠 (Core-SWE)", role: "Monorepo 后端/契约/状态机实现、1 Task = 1 Commit", veto: "编译与类型报错否决" },
    { name: "门神 (FDSE)", role: "Admin/Miniapp/Expo 四端 UI、320px 防撑爆、两字交互", veto: "几何遮挡与假死按钮否决" },
    { name: "兜底渊 (PRE-SRE)", role: "不可变制品指纹、嵌入式 PG/容器化部署、秒级回滚 SOP", veto: "带病发布一票否决" },
    { name: "百晓生 (QA/CMMI)", role: "真 PG 18.4 6 阶段 E2E、agent-browser/device 真机打假", veto: "假 Mock 与缺工件否决" },
  ];

  return {
    bases,
    clientWorkspaces,
    employees,
  };
}

/**
 * 渲染 Markdown 格式的 PMO 待办大盘（用于终端展示及落盘 docs/01_management/pmo-dashboard.md）
 */
function renderPmoMarkdown(pmo, ecosystem = null) {
  const lines = [];
  const isFoundry = pmo.roleType === "FOUNDRY_MASTER_PMO";

  lines.push(
    isFoundry
      ? `# 🏛️ Coolie 交付工厂总 PMO 全域作战大盘 (Foundry Master PMO 4D Dashboard)`
      : `# 🧭 ${pmo.repoName} 项目 PMO 待办与全息状态大盘 (Project PMO Dashboard)`
  );
  lines.push("");
  lines.push(`> **实时刷新命令**: \`pnpm run pmo\`（或 \`node scripts/cmmi-01-management.cjs pmo [--write|--json]\`）`);
  lines.push(`> **项目坐标**: \`${pmo.repoName}@${pmo.version}\` | **分支**: \`${pmo.branch}\` | **HEAD**: \`${pmo.headCommit}\` | **工作区净度**: ${pmo.dirtyCount === 0 ? "✅ Clean (0 dirty)" : `⚠️ ${pmo.dirtyCount} 处未提交变更`}`);
  lines.push("");

  // ── 1. 规格与任务漏斗 ──
  lines.push(
    isFoundry
      ? `## 一、【维度 1 · 层A 工坊母仓自建】Spec-Kit 规格与 WBS 任务漏斗`
      : `## 一、Spec-Kit 规格漏斗与 WBS 原子任务进度`
  );
  lines.push("");
  lines.push(
    `- **活跃规格总数**: \`${pmo.specsSummary.totalActive}\` 个 ｜ 🔥 **施工中 (WIP)**: \`${pmo.specsSummary.wipCount}\` 个 ｜ 📋 **已立项待开工**: \`${pmo.specsSummary.plannedCount}\` 个 ｜ 📝 **待填骨架**: \`${pmo.specsSummary.skeletonCount}\` 个 ｜ 📦 **已完结待归档**: \`${pmo.specsSummary.completedUnarchivedCount}\` 个`
  );
  lines.push("");

  if (pmo.wipSpecs.length > 0) {
    lines.push(`### 🔥 1.1 正在施工规格 (WIP — 优先接续推进)`);
    lines.push(`| 规格标识 (\`domain/spec\`) | 进度 | 下一步待办任务 (\`Next Task\`) | 白名单范围 | 核验命令 |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- |`);
    for (const w of pmo.wipSpecs.slice(0, 10)) {
      const nt = w.pendingTasks[0];
      const diskTag = nt && nt.filesLandedOnDisk ? " *(文件已落盘，待核验标签)*" : "";
      lines.push(
        `| \`${w.domain}/${w.name}\` | **${w.done}/${w.total}** | **${nt ? nt.id : "-"}**: ${nt ? nt.title.slice(0, 58) : ""}${diskTag} | \`${nt ? nt.whitelist.slice(0, 45) : "-"}\` | \`node scripts/cmmi-04-implementation.cjs tasks --spec ${w.name}\` |`
      );
    }
    lines.push("");
  }

  if (pmo.plannedSpecs.length > 0) {
    lines.push(`### 📋 1.2 已立项待开工规格 (Planned — 待启动 T1)`);
    lines.push(`| 规格标识 (\`domain/spec\`) | 任务数 | 首条待办任务 (\`T1\`) | 白名单范围 | 启动命令 |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- |`);
    for (const p of pmo.plannedSpecs.slice(0, 8)) {
      const t1 = p.pendingTasks[0];
      lines.push(
        `| \`${p.domain}/${p.name}\` | **0/${p.total}** | **${t1 ? t1.id : "T1"}**: ${t1 ? t1.title.slice(0, 58) : ""} | \`${t1 ? t1.whitelist.slice(0, 45) : "-"}\` | \`node scripts/cmmi-04-implementation.cjs tasks --spec ${p.name}\` |`
      );
    }
    lines.push("");
  }

  if (pmo.completedSpecs.length > 0) {
    lines.push(`### 📦 1.3 代码与任务已完结规格 (Ready for Gate Evidence / Archive: 共 ${pmo.completedSpecs.length} 个)`);
    const preview = pmo.completedSpecs
      .slice(0, 8)
      .map((c) => `\`${c.domain}/${c.name}\` (${c.done}/${c.total})`)
      .join("、");
    lines.push(`- **代表规格**: ${preview}${pmo.completedSpecs.length > 8 ? ` 等 ${pmo.completedSpecs.length} 个` : ""}`);
    lines.push(`- **收口动作**: 核对 \`evidence.json\` 门禁证据后执行 \`node scripts/cmmi-09-operations.cjs archive --name <spec>\` 归档至 \`docs/specs/archive/\`。`);
    lines.push("");
  }

  // ── 2. 如果是 Coolie 工坊工厂总 PMO：展示维度 2（双底座联邦）+ 维度 3（层B船坞）+ 维度 4（数字员工舰队） ──
  if (ecosystem) {
    lines.push(`## 二、【维度 2 · 跨仓双底座联邦监控】两大蓝图母本 (\`cooliebase-all\` + \`yudao-quad-terminal\`) 联合态势`);
    lines.push("");
    lines.push(`| 蓝图底座仓库 | 10项标准对齐度 | 最新提交 (\`HEAD\`) | 净度 | 规格漏斗 (WIP/待开工/已完结) | 当前头号待办 (\`Top Next Action\`) |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- | :--- |`);
    for (const b of ecosystem.bases) {
      const bp = b.pmo;
      const topAction = bp.actionQueue[0] ? `[${bp.actionQueue[0].priority}] ${bp.actionQueue[0].title.slice(0, 48)}` : "✅ 全绿无阻塞";
      lines.push(
        `| **\`${b.baseName}\`** | **${b.passed}/${b.total}** ✅ | \`${bp.headCommit.slice(0, 38)}\` | ${bp.dirtyCount === 0 ? "✅ Clean" : `⚠️ ${bp.dirtyCount} dirty`} | WIP:${bp.specsSummary.wipCount} / Plan:${bp.specsSummary.plannedCount} / Done:${bp.specsSummary.completedUnarchivedCount} | ${topAction} |`
      );
    }
    lines.push("");

    lines.push(`## 三、【维度 3 · 层B 客户交付船坞与平级工作区】三件套合规态势`);
    lines.push("");
    lines.push(`| 工作区目录 (\`../<slug>\`) | \`HARNESS.md\` | \`scripts/harness.*\` | \`scripts/service.sh\` | 层B 标配三件套状态 |`);
    lines.push(`| :--- | :--- | :--- | :--- | :--- |`);
    for (const cw of ecosystem.clientWorkspaces.slice(0, 10)) {
      lines.push(
        `| \`../${cw.name}\` | ${cw.hasHarnessMd ? "✅" : "⚪"} | ${cw.hasHarnessScript ? "✅" : "⚪"} | ${cw.hasServiceSh ? "✅" : "⚪"} | ${cw.triadOk ? "✅ 合规层B船坞" : "ℹ️ 非层B交付物 / 待注入 Harness"} |`
      );
    }
    lines.push("");

    lines.push(`## 四、【维度 4 · 数字员工舰队与职责矩阵】`);
    lines.push("");
    lines.push(`| 数字员工角色 | 核心职责边界 | 一票否决权 |`);
    lines.push(`| :--- | :--- | :--- |`);
    for (const emp of ecosystem.employees) {
      lines.push(`| **${emp.name}** | ${emp.role} | ${emp.veto} |`);
    }
    lines.push("");
  }

  // ── 工程门禁与技术债待办池 ──
  lines.push(
    isFoundry
      ? `## 五、工程门禁、路线图与技术债待办池 (Engineering & Governance Backlog)`
      : `## 二、工程门禁、路线图与技术债待办池 (Engineering & Tech-Debt Backlog)`
  );
  lines.push("");
  lines.push(`| 优先级 | 领域 / 门禁维度 | 待办事项描述 | 核验 / 执行命令 |`);
  lines.push(`| :--- | :--- | :--- | :--- |`);
  for (const td of pmo.techDebts) {
    lines.push(`| **${td.priority}** | ${td.category} | ${td.summary} | \`${td.cmd}\` |`);
  }
  lines.push("");

  // ── PMO 优先级行动指令队列 ──
  lines.push(
    isFoundry
      ? `## 六、🎯 工坊总 PMO 跨项目下一步行动队列 (Cross-Project Next Action Queue)`
      : `## 三、🎯 本项目 PMO 接下来的待办工作队列 (Prioritized Next Actions)`
  );
  lines.push("");
  lines.push(`| 序 | 优先级 | 归属范围 | 接下来的具体待办工作 | 立即执行命令 |`);
  lines.push(`| :--- | :--- | :--- | :--- | :--- |`);

  const mergedQueue = ecosystem ? pmo.actionQueue.slice(0, 8) : [...pmo.actionQueue];
  if (ecosystem) {
    for (const b of ecosystem.bases) {
      for (const act of b.pmo.actionQueue.slice(0, 2)) {
        mergedQueue.push({
          priority: act.priority,
          scope: `[底座:${b.baseName}] ${act.scope}`,
          title: act.title,
          cmd: `cd ../${b.baseName} && ${act.cmd}`,
        });
      }
    }
  }

  mergedQueue.slice(0, 14).forEach((item, idx) => {
    lines.push(`| ${idx + 1} | **${item.priority}** | \`${item.scope}\` | ${item.title} | \`${item.cmd}\` |`);
  });
  lines.push("");

  return lines.join("\n");
}

/**
 * 运行 PMO 雷达（支持终端打印、--json 输出、--write 写入 docs/01_management/pmo-dashboard.md）
 */
function runPmoRadar(opts = {}) {
  const pmo = analyzeRepoPmo(ROOT, opts);
  const isFoundry = pmo.roleType === "FOUNDRY_MASTER_PMO" || Boolean(opts.federated);
  const ecosystem = isFoundry ? inspectFoundryEcosystem(ROOT) : null;

  if (opts.json) {
    console.log(JSON.stringify({ pmo, ecosystem }, null, 2));
    return 0;
  }

  const markdown = renderPmoMarkdown(pmo, ecosystem);
  console.log(markdown);

  if (opts.write) {
    const outPath = path.join(ROOT, "docs/01_management/pmo-dashboard.md");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, markdown, "utf8");
    console.log(`\n✅ [PMO] 已更新持久化 PMO 待办大盘: ${path.relative(ROOT, outPath)}`);
  }
  return 0;
}

/**
 * 统一拦截每个 CMMI 阶段脚本的 Spec-Kit 文档子命令 (docs | list | asset | check-docs | pmo)
 */
function tryHandleDocSubcommand(phaseCode, rawArgs = []) {
  const sub = rawArgs[0] && !rawArgs[0].startsWith("-") ? rawArgs[0] : "";
  const rest = sub ? rawArgs.slice(1) : rawArgs;
  const spec = getFlagValue(rawArgs, "--spec") || getFlagValue(rawArgs, "--name");
  const strict = rawArgs.includes("--strict");

  if (phaseCode === "01" && (sub === "pmo" || sub === "backlog" || sub === "todo" || sub === "radar")) {
    process.exit(
      runPmoRadar({
        spec,
        json: rawArgs.includes("--json"),
        write: rawArgs.includes("--write"),
        federated: rawArgs.includes("--federated"),
      })
    );
  }
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
  console.log("\n通用阶段文档与 PMO 子命令:");
  console.log("  pnpm run pmo  (或 node scripts/cmmi-01-management.cjs pmo [--write|--json])  作为本项目 PMO 查看接下来的待办工作");
  console.log("  pnpm run speckit -- cmmi <00..09> docs [--spec <规格名>]                     列出该阶段宏观文档与规格包阶段文档");
  console.log("  pnpm run speckit -- cmmi <00..09> check [--spec <规格名>]                    校验该阶段文档齐备度与阶段契约门禁");
  console.log("  pnpm run speckit -- cmmi <01..09> asset --type <类型> --title ...            创建该阶段 CMMI 标准过程文档\n");
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
  analyzeRepoPmo,
  inspectBlueprintBaseParity,
  inspectFoundryEcosystem,
  runPmoRadar,
};
