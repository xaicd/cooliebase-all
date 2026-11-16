#!/usr/bin/env node
/**
 * scripts/domain-prune.cjs
 *
 * 跨底座统一第一方业务插件裁剪与纯粹化引擎（同时支撑 `pnpm run domain:prune` 与 `pnpm run trim:modules`）：
 *   pnpm run domain:prune -- --list
 *   pnpm run domain:prune -- --keep mall,member,pay --dry-run
 *   pnpm run trim:modules -- --profile minimal --dry-run
 *   pnpm run domain:prune -- --check
 *
 * 安全铁律：
 *   1. 默认 dry-run，除非显式传入 `--apply --yes` 绝不改动任何文件；
 *   2. 母本仓库（不存在 hatch-manifest.json 且未显式 `--force-mother`）拒绝破坏性物理删除，防止误裁基座；
 *   3. 平台地基（`system`, `infra`）与平台静态伴生域（`online`）永久受保护不可裁除。
 */

"use strict"

const fs = require("node:fs")
const path = require("node:path")
const { execFileSync } = require("node:child_process")
const { ROOT, loadCatalog } = require("./lib/domain-catalog.cjs")
const { PLATFORM_COMPANIONS } = require("./lib/hatch-profile.cjs")

const PROTECTED_DOMAINS = new Set(["system", "infra", ...PLATFORM_COMPANIONS])

const PROFILE_PRESETS = Object.freeze({
  lite: [],
  base: [],
  minimal: [],
  commerce: ["mall", "member", "pay"],
  enterprise: ["oa", "hrm", "fms", "pms", "bpm"],
  supply: ["erp", "wms", "mes", "crm"],
})

function splitCsv(val) {
  return String(val || "")
    .split(/[,+\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function parseArgs(argv = process.argv.slice(2)) {
  const get = (flag) => {
    const idx = argv.indexOf(flag)
    if (idx >= 0 && argv[idx + 1] && !argv[idx + 1].startsWith("-")) return argv[idx + 1]
    const eq = argv.find((a) => a.startsWith(`${flag}=`))
    return eq ? eq.slice(flag.length + 1) : null
  }
  return {
    list: argv.includes("--list"),
    check: argv.includes("--check"),
    keep: splitCsv(get("--keep") || get("--bundle")),
    profile: get("--profile") || get("--domain"),
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply"),
    apply: argv.includes("--apply"),
    yes: argv.includes("--yes"),
    forceMother: argv.includes("--force-mother"),
    json: argv.includes("--json"),
    help: argv.includes("--help") || argv.includes("-h"),
  }
}

function inspectWorkspaceDomains() {
  const catalog = loadCatalog()
  const platform = catalog.layers?.platform?.domains || ["system", "infra"]
  const plugins = catalog.layers?.plugin?.domains || []
  const pluginsDir = path.join(ROOT, "packages", "plugins")
  const diskPlugins = fs.existsSync(pluginsDir)
    ? fs
        .readdirSync(pluginsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.startsWith("plugin-"))
        .map((e) => e.name.slice("plugin-".length))
        .sort()
    : []
  return { catalog, platform, plugins, diskPlugins }
}

function main() {
  const opts = parseArgs()
  if (opts.help) {
    console.log(`用法: node scripts/domain-prune.cjs [选项]

选项:
  --list                       列出平台地基、伴生域与全部可裁剪第一方业务插件
  --keep <d1,d2,...>           指定保留的第一方业务插件白名单（其余插件列入裁剪计划）
  --profile <name>             预设画像: minimal | lite | commerce | enterprise | supply
  --dry-run                    预览裁剪计划，不改动任何文件（默认）
  --check                      校验 domain-catalog.json 插件层与物理目录是否 100% 对齐
  --apply --yes                在派生工程中执行物理裁剪并重建契约索引
  --json                       输出机器可读 JSON`)
    process.exit(0)
  }

  const { catalog, platform, plugins, diskPlugins } = inspectWorkspaceDomains()

  if (opts.list) {
    const payload = {
      protectedPlatform: platform,
      protectedCompanions: [...PLATFORM_COMPANIONS],
      firstPartyPlugins: plugins,
      prunablePlugins: plugins.filter((d) => !PROTECTED_DOMAINS.has(d)),
      totalDomains: (catalog.domains || []).length,
    }
    if (opts.json) {
      console.log(JSON.stringify(payload, null, 2))
    } else {
      console.log(`[domain:prune] 当前工作区共 ${payload.totalDomains} 个域:`)
      console.log(`  · 平台地基 (不可裁)   : ${payload.protectedPlatform.join(", ")}`)
      console.log(`  · 平台伴生 (不可裁)   : ${payload.protectedCompanions.join(", ")}`)
      console.log(`  · 可裁剪业务插件 (${payload.prunablePlugins.length}) : ${payload.prunablePlugins.join(", ")}`)
    }
    process.exit(0)
  }

  if (opts.check) {
    const inCatalogOnly = plugins.filter((d) => !diskPlugins.includes(d))
    const onDiskOnly = diskPlugins.filter((d) => !plugins.includes(d))
    const ok = inCatalogOnly.length === 0 && onDiskOnly.length === 0
    if (opts.json) {
      console.log(JSON.stringify({ ok, plugins: plugins.length, inCatalogOnly, onDiskOnly }, null, 2))
    } else if (ok) {
      console.log(`[domain:prune] PASS: ${plugins.length} 个第一方插件目录与 domain-catalog.json 100% 对齐`)
    } else {
      console.error(`[domain:prune] FAIL: catalog 独有=[${inCatalogOnly.join(",")}] 磁盘独有=[${onDiskOnly.join(",")}]`)
    }
    process.exit(ok ? 0 : 1)
  }

  let requestedKeep = [...opts.keep]
  if (requestedKeep.length === 0 && opts.profile) {
    if (Object.prototype.hasOwnProperty.call(PROFILE_PRESETS, opts.profile)) {
      requestedKeep = PROFILE_PRESETS[opts.profile]
    } else {
      console.error(`[domain:prune] 未知预设 --profile ${opts.profile}（可选: ${Object.keys(PROFILE_PRESETS).join(", ")}）`)
      process.exit(1)
    }
  }

  const allKnown = new Set((catalog.domains || []).map((d) => d.name))
  const unknown = requestedKeep.filter((d) => !allKnown.has(d))
  if (unknown.length > 0) {
    console.error(`[domain:prune] --keep 含未知域名: ${unknown.join(", ")}`)
    process.exit(1)
  }

  const keepSet = new Set([...PROTECTED_DOMAINS, ...requestedKeep])
  const toPrune = plugins.filter((d) => !keepSet.has(d))
  const keptPlugins = plugins.filter((d) => keepSet.has(d))

  const plan = {
    mode: opts.apply && opts.yes ? "apply" : "dry-run",
    keepDomains: [...keepSet].filter((d) => allKnown.has(d)),
    keptPlugins,
    prunePlugins: toPrune,
  }

  if (!opts.apply || !opts.yes) {
    if (opts.json) {
      console.log(JSON.stringify(plan, null, 2))
    } else {
      console.log(`[domain:prune] (dry-run) 计划保留 ${plan.keepDomains.length} 个域，裁剪 ${toPrune.length} 个第一方插件:`)
      console.log(`  · 保留域   : ${plan.keepDomains.join(", ")}`)
      console.log(`  · 待裁插件 : ${toPrune.join(", ") || "(无)"}`)
      console.log("  提示: 确认无误后在派生工程中追加 `--apply --yes` 落盘执行。")
    }
    process.exit(0)
  }

  const isHatched = fs.existsSync(path.join(ROOT, "packages/shared/contract/hatch-manifest.json"))
  if (!isHatched && !opts.forceMother) {
    console.error(
      "[domain:prune] 拒绝在母本仓库直接执行物理删除（未检测到 hatch-manifest.json）。"
        + "请先使用 `pnpm run project:init -- --target /tmp/<slug>` 派生沙箱后再裁剪。",
    )
    process.exit(1)
  }

  for (const dom of toPrune) {
    fs.rmSync(path.join(ROOT, "packages", "plugins", `plugin-${dom}`), { recursive: true, force: true })
  }

  const catalogPath = path.join(ROOT, "packages/shared/backend/constants/domain-catalog.json")
  catalog.domains = (catalog.domains || []).filter((d) => keepSet.has(d.name))
  if (catalog.layers?.plugin) {
    catalog.layers.plugin.domains = (catalog.layers.plugin.domains || []).filter((d) => keepSet.has(d))
  }
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")

  const rpcPath = path.join(ROOT, "packages/shared/backend/constants/rpc-actions.json")
  if (fs.existsSync(rpcPath)) {
    const rpc = JSON.parse(fs.readFileSync(rpcPath, "utf8"))
    for (const dom of toPrune) {
      if (rpc.domains) delete rpc.domains[dom]
    }
    fs.writeFileSync(rpcPath, `${JSON.stringify(rpc, null, 2)}\n`, "utf8")
  }

  const entriesPath = path.join(ROOT, "packages/shared/backend/plugins/first-party-entries.ts")
  if (fs.existsSync(entriesPath)) {
    const lines = fs
      .readFileSync(entriesPath, "utf8")
      .split("\n")
      .filter((line) => !toPrune.some((dom) => line.includes(`"cooliebase.${dom}"`)))
    fs.writeFileSync(entriesPath, lines.join("\n"), "utf8")
  }

  execFileSync(process.execPath, [path.join(ROOT, "scripts/write-seam-graph.cjs")], { cwd: ROOT, stdio: "inherit" })
  execFileSync(process.execPath, [path.join(ROOT, "scripts/write-domain-manifests.cjs")], { cwd: ROOT, stdio: "inherit" })
  execFileSync(process.execPath, [path.join(ROOT, "scripts/check-generated-paths.cjs"), "--prune"], { cwd: ROOT, stdio: "inherit" })

  console.log(`[domain:prune] 已完成裁剪，移除 ${toPrune.length} 个插件，保留 ${plan.keepDomains.length} 个域。`)
}

main()
