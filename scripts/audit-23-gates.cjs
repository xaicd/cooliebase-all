#!/usr/bin/env node
/**
 * scripts/audit-23-gates.cjs
 *
 * 跨底座统一 23 道出厂硬门禁审计入口（与 yudao-quad-terminal/scripts/audit-23-gates.mjs 同参同契约）：
 *   pnpm run gates:23:static     # Day-0 静态结构、规范、兼容契约与全量静态门禁链
 *   pnpm run gates:23            # 静态全链 + 四端客户端构建门禁 (Expo Web + MiniApp H5)
 *   node scripts/audit-23-gates.cjs [--static-only] [--json] [--write-report]
 */

"use strict"

const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm"

function runStep(id, title, command, args) {
  const started = Date.now()
  const res = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 600000,
    shell: process.platform === "win32",
  })
  const durationMs = Date.now() - started
  const ok = !res.error && res.status === 0
  const output = `${res.stdout || ""}\n${res.stderr || ""}`.trim()
  const tail = output.split("\n").slice(-3).join(" | ").slice(0, 200)
  return {
    id,
    title,
    status: ok ? "PASS" : "FAIL",
    durationMs,
    detail: ok ? `${(durationMs / 1000).toFixed(1)}s` : `exit=${res.status} ${tail}`,
    rawOutput: output,
  }
}

function main() {
  const argv = process.argv.slice(2)
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("用法: node scripts/audit-23-gates.cjs [--static-only] [--json] [--write-report]")
    process.exit(0)
  }

  const staticOnly = argv.includes("--static-only")
  const jsonOut = argv.includes("--json")
  const writeReport = argv.includes("--write-report")

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
  const slug = String(pkg.name || "cooliebase-all")

  const results = []

  // 1. 核心治理文档齐备性
  const coreDocs = ["AGENTS.md", "HARNESS.md", "SWARM.md", "compat-manifest.json"]
  const missingDocs = coreDocs.filter((f) => !fs.existsSync(path.join(ROOT, f)))
  results.push({
    id: "G01",
    title: "治理宪法、HARNESS 与兼容契约真源齐备",
    status: missingDocs.length === 0 ? "PASS" : "FAIL",
    detail: missingDocs.length === 0 ? coreDocs.join(", ") : `缺失: ${missingDocs.join(", ")}`,
  })

  // 2. 四端工程拓扑齐备性 (Admin + 2C Portal + Expo + MiniApp)
  const terminals = [
    "src/app/(admin-pages)/admin",
    "src/app/(portal-pages)",
    "clients/expo/package.json",
    "clients/miniapp/package.json",
    "clients/miniapp/manifest.json",
    "clients/miniapp/pages.json",
  ]
  const missingTerminals = terminals.filter((rel) => !fs.existsSync(path.join(ROOT, rel)))
  results.push({
    id: "G02",
    title: "四位一体多端拓扑 (Admin + 2C + Expo + MiniApp)",
    status: missingTerminals.length === 0 ? "PASS" : "FAIL",
    detail: missingTerminals.length === 0 ? "4 终端齐备" : `缺失: ${missingTerminals.join(", ")}`,
  })

  // 3. 工程规范机检 (standards:check - 24 条规则)
  const stdStep = runStep("G03", "工程规范与包管理器/数据库纪律 (standards:check)", process.execPath, [
    path.join(ROOT, "scripts/check-engineering-standards.cjs"),
  ])
  results.push(stdStep)

  // 4. 下游兼容契约校验 (compat:check)
  const compatStep = runStep("G04", "下游兼容契约与表面镜像一致性 (compat:check)", process.execPath, [
    path.join(ROOT, "scripts/check-compat-manifest.cjs"),
  ])
  results.push(compatStep)

  // 5. 三员分立与领域裁剪引擎就绪度
  const hasThreeRole = fs.existsSync(path.join(ROOT, "scripts/scaffold-three-role-audit.cjs"))
  const hasDomainPrune = fs.existsSync(path.join(ROOT, "scripts/domain-prune.cjs"))
  results.push({
    id: "G05",
    title: "IT 三员分立审计与领域裁剪引擎就绪",
    status: hasThreeRole && hasDomainPrune ? "PASS" : "FAIL",
    detail: `gen:three-role=${hasThreeRole}, domain:prune=${hasDomainPrune}`,
  })

  // 6. 全量静态门禁链 (pnpm run check)
  const fullCheckStep = runStep("G06", "全量静态治理与契约门禁链 (pnpm run check)", PNPM, ["run", "check"])
  results.push(fullCheckStep)

  // 7. 跨端打包门禁 (非 static-only 时追加复验，注意 check 链内亦已包含 clients:build:check)
  if (staticOnly) {
    results.push({
      id: "G07",
      title: "运行态独立制品深度核验",
      status: "SKIP",
      detail: "--static-only 模式仅运行静态与无污染打包门禁链",
    })
  } else {
    const clientStep = runStep("G07", "Expo Web 与 MiniApp H5 独立打包复验", process.execPath, [
      path.join(ROOT, "scripts/check-client-build.cjs"),
    ])
    results.push(clientStep)
  }

  const sanitized = results.map(({ rawOutput: _raw, ...rest }) => rest)
  const failed = results.filter((r) => r.status === "FAIL")
  const passed = results.filter((r) => r.status === "PASS")
  const skipped = results.filter((r) => r.status === "SKIP")

  const summary = {
    ok: failed.length === 0,
    mode: staticOnly ? "static-only" : "full",
    project: slug,
    counts: {
      total: sanitized.length,
      pass: passed.length,
      skip: skipped.length,
      fail: failed.length,
    },
    gates: sanitized,
  }

  if (writeReport) {
    const outFile = path.join(ROOT, "docs/architecture/artifacts/23-gates-audit.json")
    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    fs.writeFileSync(outFile, `${JSON.stringify(summary, null, 2)}\n`, "utf8")
  }

  if (jsonOut) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    console.log("================================================================")
    console.log(`[gates:23] CoolieBase 出厂硬门禁审计 [${slug}] (${summary.mode})`)
    console.log("================================================================")
    for (const g of sanitized) {
      const mark = g.status === "PASS" ? "PASS" : g.status === "SKIP" ? "SKIP" : "FAIL"
      console.log(`  [${mark}] ${g.id} ${g.title} — ${g.detail}`)
    }
    for (const f of failed) {
      if (f.rawOutput) {
        console.error(`\n--- ${f.id} 失败输出尾部 ---\n${f.rawOutput.slice(-2000)}`)
      }
    }
    console.log("----------------------------------------------------------------")
    console.log(`汇总: PASS=${passed.length} | SKIP=${skipped.length} | FAIL=${failed.length}`)
  }

  process.exit(summary.ok ? 0 : 1)
}

main()
