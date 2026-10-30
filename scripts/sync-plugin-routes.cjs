#!/usr/bin/env node
/**
 * `plugins:sync-routes` —— 把每个第一方插件的 `plugin.manifest.json#apiRoutes`
 * **从真实路由文件重新派生**（脚手架只生成一次，之后没人同步 → 必然漂移）。
 *
 * ## 为什么
 *
 * 实测：`GET /api/v1/plugins/cooliebase.ai/api/ai-model` 返回
 * 「插件未声明该路由: GET /ai-model」，而 `routes/admin/ai-model/route.ts` **明明存在** ——
 * 因为 `apiRoutes` 是 `scaffold-domain-plugin.cjs` 在**脚手架当时**写死的，之后新增的路由
 * 没有回填。全仓 342 份契约里有 **48 个**这样"契约声明的接口插件没声明"。
 *
 * 判定口径与 `scripts/scaffold-domain-plugin.cjs` **完全一致**（同一份扫描规则，
 * 所以重新生成不会改变既有条目的形态）。
 *
 * ## 用法
 *   node scripts/sync-plugin-routes.cjs --write
 *   node scripts/sync-plugin-routes.cjs --check   # CI: manifest 是否与路由文件一致
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const PLUGINS = path.join(ROOT, "packages", "plugins")

/** 与 scaffold-domain-plugin.cjs 同表：admin → operator / app → company / open → public */
const SURFACE_AUTH = { admin: "operator", app: "company", open: "public" }

function routeFiles(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...routeFiles(full))
    else if (entry.name === "route.ts") out.push(full)
  }
  return out.sort()
}

/** 由路由文件派生 apiRoutes（顺序稳定：surface → path → method）。 */
function deriveRoutes(pluginDir) {
  const declarations = []
  for (const surface of ["admin", "app", "open"]) {
    const base = path.join(pluginDir, "routes", surface)
    for (const file of routeFiles(base)) {
      const rel = path.relative(base, path.dirname(file)).replace(/\\/g, "/")
      const text = fs.readFileSync(file, "utf8")
      const methods = [...new Set([...text.matchAll(/export\s+(?:const|async function)\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]))]
      if (methods.length === 0) continue
      const relKey = rel || "root"
      // 与 scaffold-domain-plugin.cjs 同一条别名规则 —— 重生成不会改名。
      const alias = `route_${surface}_${relKey.replace(/[^a-zA-Z0-9]/g, "_")}`
      for (const method of [...methods].sort()) {
        declarations.push({
          routeKey: `${surface}:${relKey}:${method.toLowerCase()}`,
          method,
          path: relKey === "root" ? "/" : `/${relKey}`,
          auth: SURFACE_AUTH[surface],
          // 仅用于 plugin-entry.ts（不进 manifest）
          __alias: alias,
          __module: `@/modules/${path.basename(pluginDir).replace(/^plugin-/, "")}/routes/${surface}/${relKey === "root" ? "" : relKey + "/"}route`,
        })
      }
    }
  }
  return declarations
}

function loadManifest(dir) {
  const file = path.join(dir, "plugin.manifest.json")
  if (!fs.existsSync(file)) return null
  try {
    return { file, json: JSON.parse(fs.readFileSync(file, "utf8")) }
  } catch (error) {
    console.error(`[plugin-routes] ${path.relative(ROOT, file)} 不是合法 JSON —— ${error.message}`)
    process.exit(1)
  }
}

function render(json, routes) {
  // apiRoutes 固定放在末尾：与 scaffold-domain-plugin.cjs 的产物形状一致，diff 才干净。
  const { apiRoutes: _ignored, ...rest } = json
  const clean = routes.map(({ routeKey, method, path, auth }) => ({ routeKey, method, path, auth }))
  return `${JSON.stringify({ ...rest, apiRoutes: clean }, null, 2)}\n`
}

/**
 * 重写 `plugin-entry.ts` 里**只有**这两块（其余 `invoke` / `setup` / `onHealth` 原样保留）：
 *   1. `import * as route_…` 静态 import 块 —— 新路由必须在这里出现（Turbopack 不能动态 import TS）
 *   2. `routes: { … }` 处理器映射
 * 缺了它们，路由虽在 manifest 里声明，宿主仍报「插件未导出路由处理器」500（实测 48 个接口如此）。
 */
function renderEntry(text, routes) {
  const byModule = new Map()
  for (const d of routes) if (!byModule.has(d.__alias)) byModule.set(d.__alias, d.__module)
  const importLines = [...byModule.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([alias, mod]) => `import * as ${alias} from "${mod}"`)

  const lines = text.split("\n")
  const importIdx = lines.map((line, i) => (/^import \* as route_/.test(line) ? i : -1)).filter((i) => i >= 0)
  if (importIdx.length === 0) return null
  let body = [...lines.slice(0, importIdx[0]), ...importLines, ...lines.slice(importIdx[importIdx.length - 1] + 1)]

  const routeStart = body.findIndex((line) => /^  routes: \{\s*$/.test(line))
  if (routeStart < 0) return null
  let routeEnd = -1
  for (let i = routeStart + 1; i < body.length; i += 1) {
    if (/^  \},?\s*$/.test(body[i])) {
      routeEnd = i
      break
    }
  }
  if (routeEnd < 0) return null

  const handlerLines = routes.map(
    (d) => `    ${JSON.stringify(d.routeKey)}: (input: any) => invoke(${d.__alias}.${d.method}, input),`,
  )
  body = [...body.slice(0, routeStart + 1), ...handlerLines, ...body.slice(routeEnd)]
  return body.join("\n")
}

function entryPath(dir) {
  return path.join(dir, "plugin-entry.ts")
}

function main() {
  const write = process.argv.includes("--write")
  const check = process.argv.includes("--check")
  if (!fs.existsSync(PLUGINS)) {
    console.error("[plugin-routes] 找不到 packages/plugins")
    return 1
  }

  let drifted = 0
  let totalRoutes = 0
  for (const name of fs.readdirSync(PLUGINS).sort()) {
    const dir = path.join(PLUGINS, name)
    if (!fs.statSync(dir).isDirectory()) continue
    const loaded = loadManifest(dir)
    if (!loaded) continue
    const routes = deriveRoutes(dir)
    totalRoutes += routes.length
    const next = render(loaded.json, routes)
    const current = fs.readFileSync(loaded.file, "utf8")

    // plugin-entry.ts 的静态 import 块 + routes 映射 = 同一份真源
    const entryFile = entryPath(dir)
    const entryText = fs.existsSync(entryFile) ? fs.readFileSync(entryFile, "utf8") : null
    const nextEntry = entryText ? renderEntry(entryText, routes) : null

    const manifestChanged = next !== current
    const entryChanged = nextEntry !== null && nextEntry !== entryText
    if (!manifestChanged && !entryChanged) continue

    drifted += 1
    const wasCount = Array.isArray(loaded.json.apiRoutes) ? loaded.json.apiRoutes.length : 0
    if (write) {
      if (manifestChanged) fs.writeFileSync(loaded.file, next, "utf8")
      if (entryChanged) fs.writeFileSync(entryFile, nextEntry, "utf8")
      console.log(`[plugin-routes] ${name}: ${wasCount} → ${routes.length} 条${entryChanged ? "（含 plugin-entry）" : ""}`)
    } else if (!check) {
      console.log(`[plugin-routes] ${name}: 声明 ${wasCount} 条，实际 ${routes.length} 条（drift）`)
    }
  }

  if (write) {
    console.log(`[plugin-routes] 已同步 ${drifted} 个插件（共 ${totalRoutes} 条路由声明）`)
    return 0
  }
  if (check) {
    if (drifted === 0) {
      console.log(`[plugin-routes] PASS: 全部插件的 apiRoutes 与路由文件一致（共 ${totalRoutes} 条）`)
      return 0
    }
    console.error(`[plugin-routes] ✗ ${drifted} 个插件的 apiRoutes 与路由文件不一致 —— 跑 \`pnpm run plugins:sync-routes\``)
    return 1
  }
  console.log(`[plugin-routes] drift ${drifted} 个插件（dry-run；加 --write 落盘）`)
  return 0
}

process.exit(main())
