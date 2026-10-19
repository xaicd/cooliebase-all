/**
 * SBOM（软件物料清单）生成器。
 *
 * 为什么不是模板：`scripts/cmmi-asset-scaffold.cjs` 原来的 `sbom` 资产是一段
 * **手写的散文依赖清单**（"Next.js 16.x (MIT)" 之类）—— 那不是物料清单，是号称清单的便签。
 * 生成它反而比留空更糟：`cmmi:asset:check` 会把它算成"真实资产"，而内容与锁文件无关。
 *
 * 真源：
 *   · 包与版本  ← `pnpm-lock.yaml`（离线可解析，确定）
 *   · 许可证    ← 已安装依赖的真实 `license` 字段（`pnpm licenses list --json`）
 *
 * 两种模式（**要求不同，是刻意的**）：
 *   `--write`  生成并落盘。要求 `node_modules` 已安装 —— 否则许可证只能凭空填，
 *              宁可直接失败，也不产出一份没有许可证的"SBOM"。
 *   `--check`  只做漂移判定。**只读锁文件**，故无需安装依赖，可在任意环境跑。
 *              比较的是**确定性部分**（包名+版本的完整清单与计数）。
 *
 * 为什么 `--check` 不等比许可证：许可证来自安装树，不同环境可能有差异；
 * 把它纳入漂移判定会让门禁变成"环境相关"，那不是门禁该有的性质。
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")
const { LOCKFILE_REL, parseLockfile, hostReachablePackageNames } = require("./lib/pnpm-lock.cjs")

const MD_REL = "docs/04_implementation/software-bill-of-materials.md"
const JSON_REL = "docs/04_implementation/sbom.json"

const write = process.argv.includes("--write")
const check = process.argv.includes("--check")
const asJson = process.argv.includes("--json")

function abs(rel) {
  return path.join(ROOT, ...rel.split("/"))
}

function fail(message) {
  console.error(`[sbom] ✗ ${message}`)
  process.exit(1)
}

if (write === check) {
  fail("必须且只能指定 --write 或 --check 之一")
}

function templateVersion() {
  const pkg = JSON.parse(fs.readFileSync(abs("package.json"), "utf8"))
  return pkg.version || "0.0.0"
}

/** 从锁文件推导确定性清单：每一行是 `name@version`。 */
function inventoryFromLockfile() {
  const { snapshots } = parseLockfile(ROOT)
  const entries = []
  for (const { name, version } of snapshots.values()) {
    if (!name) continue
    entries.push({ name, version })
  }
  if (entries.length === 0) fail(`${LOCKFILE_REL}: 推导出的包清单为空 —— 拒绝产出空 SBOM`)
  entries.sort((a, b) => (a.name === b.name ? a.version.localeCompare(b.version) : a.name.localeCompare(b.name)))
  return entries
}

/** 从已安装依赖读真实许可证。不落盘，只返回 Map<`name@version`, license>。 */
function licensesFromInstalledTree() {
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
  const result = spawnSync(pnpm, ["licenses", "list", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 300000,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0 || !result.stdout) {
    fail(`无法读取已安装依赖的许可证（pnpm licenses 退出码 ${result.status}）：${(result.stderr || "").slice(0, 300)}`)
  }
  let parsed
  try {
    parsed = JSON.parse(result.stdout)
  } catch (error) {
    fail(`pnpm licenses 输出无法解析为 JSON: ${error.message}`)
  }
  const map = new Map()
  for (const [license, packages] of Object.entries(parsed)) {
    for (const entry of packages || []) {
      for (const version of entry.versions || []) {
        map.set(`${entry.name}@${version}`, license)
      }
    }
  }
  return map
}

function buildReport() {
  const components = inventoryFromLockfile()
  const hostReachable = hostReachablePackageNames(ROOT)
  const licenses = licensesFromInstalledTree()

  const enriched = components.map((entry) => ({
    ...entry,
    reach: hostReachable.has(entry.name) ? "host" : "client",
    // 读不到就**如实写 UNKNOWN**，绝不猜、绝不省略这一列。
    license: licenses.get(`${entry.name}@${entry.version}`) || "UNKNOWN",
  }))

  const licenseCounts = {}
  for (const component of enriched) {
    licenseCounts[component.license] = (licenseCounts[component.license] || 0) + 1
  }
  const sortedLicenseCounts = Object.fromEntries(Object.entries(licenseCounts).sort((a, b) => a[0].localeCompare(b[0])))

  return {
    kind: "sbom",
    specVersion: "cooliebase-sbom/1",
    templateVersion: templateVersion(),
    lockfile: LOCKFILE_REL,
    generatedBy: "scripts/generate-sbom.cjs --write",
    componentCount: {
      total: enriched.length,
      host: enriched.filter((c) => c.reach === "host").length,
      client: enriched.filter((c) => c.reach === "client").length,
    },
    licenses: sortedLicenseCounts,
    components: enriched,
  }
}

/** 宽松许可证白名单：不在此列且非 UNKNOWN 的，必须在 SBOM 里**显式列出**供准入评审。 */
const PERMISSIVE = new Set([
  "MIT", "MIT-0", "ISC", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "0BSD", "Unlicense",
  "CC0-1.0", "CC-BY-4.0", "Zlib", "BlueOak-1.0.0", "Python-2.0", "WTFPL", "MIT and ISC",
  "(BSD-2-Clause OR MIT OR Apache-2.0)",
])

function needsReview(license) {
  return license !== "UNKNOWN" && !PERMISSIVE.has(license)
}

function renderMarkdown(report) {
  const unknown = report.licenses.UNKNOWN || 0
  const top = Object.entries(report.licenses)
    .filter(([license]) => license !== "UNKNOWN")
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)

  const reviewItems = report.components.filter((c) => needsReview(c.license))
  const reviewByLicense = new Map()
  for (const item of reviewItems) {
    if (!reviewByLicense.has(item.license)) reviewByLicense.set(item.license, [])
    reviewByLicense.get(item.license).push(item)
  }
  const reviewSection = reviewItems.length === 0
    ? "✓ 全部非 UNKNOWN 的依赖均为宽松许可证（MIT / ISC / Apache-2.0 / BSD 等）。"
    : [...reviewByLicense.entries()]
        .map(([license, items]) => `- **${license}**（${items.length} 个）: ${items.map((i) => `\`${i.name}@${i.version}\``).join(", ")}`)
        .join("\n")

  const rows = report.components
    .map((component) => `| \`${component.name}\` | ${component.version} | ${component.reach} | ${component.license} |`)
    .join("\n")

  return `# 软件物料清单 (Software Bill of Materials - SBOM)

- **生成方式**: \`npm run sbom:generate\`（**禁止手写**，本文件由脚本覆盖）
- **锁文件真源**: \`${report.lockfile}\`
- **模板版本**: ${report.templateVersion}
- **包总数**: ${report.componentCount.total}（host ${report.componentCount.host} / client ${report.componentCount.client}）
- **归属规范**: CMMI 04_implementation (TS / CM)

> 机器可读版本：[\`sbom.json\`](./sbom.json)。漂移由 \`npm run sbom:check\` 判定。

---

## 0. 需要人工评审的许可证

${reviewSection}

## 0.1 未解析出许可证的包（UNKNOWN）

共 **${unknown}** 个（占 ${report.componentCount.total} 的 ${((unknown / report.componentCount.total) * 100).toFixed(1)}%）。

原因**不是**锁文件缺信息，而是读取口径的限制：许可证来自**已安装依赖树**
（\`pnpm licenses list\`），而清单里有大量**仅供其他平台使用的可选二进制**
（\`@esbuild/linux-x64\`、\`@rollup/win32-x64-msvc\`、\`@next/swc-*\`、\`@img/sharp-*\`、
\`lightningcss-*\` 等）—— 它们在当前平台**不会被安装**，因此拿不到 \`license\` 字段。
这些包与其父包同源（esbuild / rollup / sharp / lightningcss），父包许可证见下方清单。

这也是 \`sbom:check\` **只比较包名+版本、不比较许可证**的原因：
许可证列是**环境相关**的，纳入漂移判定会让门禁变成"换个平台就红"，那不是门禁该有的性质。

## 1. 许可证分布

| 许可证 | 包数 |
|---|---|
${top.map(([license, count]) => `| ${license} | ${count} |`).join("\n")}
${unknown > 0 ? `\n⚠️ **${unknown} 个包未能解析出许可证（标记为 UNKNOWN）** —— 需要在依赖准入时人工确认。\n` : ""}
## 2. 口径说明

- **host**: 根 \`.\` 与 \`packages/**\` 依赖图可达 —— 即服务端运行时与构建链实际用到的包。
- **client**: 其余（主要是 \`clients/expo\` 客户端工具链）。客户端漏洞与运行时风险**分开评估**，
  见 \`docs/architecture/cooliebase-all-dependency-policy.md\`。
- 版本为**锁定版本**（锁文件解析结果），非 semver 区间。

---

## 3. 全量包清单 (${report.componentCount.total})

| 包名 | 版本 | 归属 | 许可证 |
|---|---|---|---|
${rows}
`
}

if (write) {
  if (!fs.existsSync(abs("node_modules"))) {
    fail("node_modules 缺失：无法读取真实许可证。请先 `pnpm install`（拒绝产出没有许可证的 SBOM）")
  }
  const report = buildReport()
  fs.mkdirSync(path.dirname(abs(MD_REL)), { recursive: true })
  fs.writeFileSync(abs(JSON_REL), `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(abs(MD_REL), renderMarkdown(report))
  console.log(
    `[sbom] ✓ 已生成 ${MD_REL} 与 ${JSON_REL}`
    + `（${report.componentCount.total} 包：host ${report.componentCount.host} / client ${report.componentCount.client}）`,
  )
  process.exit(0)
}

// --check：只读锁文件，判定确定性部分是否漂移。
const jsonFull = abs(JSON_REL)
if (!fs.existsSync(jsonFull)) {
  fail(`${JSON_REL} 不存在。请运行 \`npm run sbom:generate\``)
}

const committed = JSON.parse(fs.readFileSync(jsonFull, "utf8"))
const current = inventoryFromLockfile()
const committedComponents = (committed.components || []).map((c) => ({ name: c.name, version: c.version }))

const keyOf = (entry) => `${entry.name}@${entry.version}`
const committedKeys = new Set(committedComponents.map(keyOf))
const currentKeys = new Set(current.map(keyOf))

const added = current.filter((entry) => !committedKeys.has(keyOf(entry)))
const removed = committedComponents.filter((entry) => !currentKeys.has(keyOf(entry)))
const problems = []
if (added.length > 0) problems.push(`新出现 ${added.length} 个包未登记: ${added.slice(0, 8).map(keyOf).join(", ")}`)
if (removed.length > 0) problems.push(`已移除 ${removed.length} 个包仍登记: ${removed.slice(0, 8).map(keyOf).join(", ")}`)
if ((committed.componentCount?.total ?? -1) !== current.length) {
  problems.push(`计数不一致: SBOM 记 ${committed.componentCount?.total}，锁文件实际 ${current.length}`)
}
if (committed.templateVersion !== templateVersion()) {
  problems.push(`版本基线漂移: SBOM 记 ${committed.templateVersion}，当前 ${templateVersion()}（请重跑 sbom:generate）`)
}

if (problems.length > 0) {
  if (asJson) {
    console.log(JSON.stringify({ ok: false, problems, added: added.slice(0, 50), removed: removed.slice(0, 50) }, null, 2))
  } else {
    for (const problem of problems) console.error(`[sbom] ✗ ${problem}`)
    console.error("[sbom] 提示: 依赖变化后请运行 `npm run sbom:generate` 并提交产物。")
  }
  fail(`❌ ${problems.length} 处漂移`)
}

if (asJson) {
  console.log(JSON.stringify({ ok: true, total: current.length }, null, 2))
} else {
  console.log(
    `[sbom] PASS: SBOM 与 ${LOCKFILE_REL} 一致（${current.length} 包，v${committed.templateVersion}）`,
  )
}
