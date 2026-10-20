const fs = require("fs")
const path = require("path")

const root = path.resolve(__dirname, "..")
const routesRoot = path.join(root, "src", "app", "api", "v1", "admin")
const outputPath = path.join(root, "docs", "architecture", "artifacts", "admin-route-policy-baseline.json")
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]

const { resolveRouteSource } = require("./lib/route-source.cjs")

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(target, files)
    else if (entry.name === "route.ts") files.push(target)
  }
  return files
}

function protectionForMethod(source, method) {
  const escapedMethod = method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  if (new RegExp(`admin-route-manifest:\\s*dynamic-wrapper\\s+${escapedMethod}\\b`).test(source)) return "wrapper"
  if (new RegExp(`export\\s+const\\s+${escapedMethod}\\s*=\\s*withAdminRoute\\b`).test(source)) return "wrapper"
  if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${escapedMethod}\\b`).test(source)) {
    return /requireAdminAuth|requirePlatformAdmin|ensurePermission/.test(source) ? "legacy-direct-guard" : "proxy-authenticated"
  }
  if (new RegExp(`export\\s+const\\s+${escapedMethod}\\s*=`).test(source)) return "proxy-authenticated"
  return null
}

function collect() {
  return walk(routesRoot).map((file) => {
    const source = resolveRouteSource(file)
    const relative = path.relative(routesRoot, file).replace(/\\/g, "/").replace(/\/route\.ts$/, "")
    const operations = HTTP_METHODS
      .map((method) => ({ method, protection: protectionForMethod(source, method) }))
      .filter((operation) => operation.protection)
    return {
      path: `/api/v1/admin/${relative === "" ? "" : relative}`.replace(/\/$/, ""),
      operations,
      source: path.relative(root, file).replace(/\\/g, "/"),
    }
  }).sort((left, right) => left.path.localeCompare(right.path))
}

function summarize(routes) {
  return routes.flatMap((route) => route.operations).reduce((result, operation) => {
    result[operation.protection] = (result[operation.protection] ?? 0) + 1
    return result
  }, {})
}

const routes = collect()
const baseline = {
  generatedAt: new Date().toISOString(),
  routeCount: routes.length,
  operationCount: routes.reduce((total, route) => total + route.operations.length, 0),
  routes,
}
if (process.argv.includes("--check")) {
  if (!fs.existsSync(outputPath)) throw new Error("admin route baseline is missing; run pnpm run admin:routes:manifest")
  const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"))
  const comparable = (value) => JSON.stringify({ routeCount: value.routeCount, operationCount: value.operationCount, routes: value.routes })
  if (comparable(existing) !== comparable(baseline)) throw new Error("admin route baseline is stale; run pnpm run admin:routes:manifest and review the policy delta")
  const legacyDirectGuardRoutes = routes.flatMap((route) => route.operations.filter((operation) => operation.protection === "legacy-direct-guard").map((operation) => `${operation.method} ${route.path}`))
  if (legacyDirectGuardRoutes.length > 0) throw new Error(`legacy direct guards are forbidden; migrate these operations to withAdminRoute: ${legacyDirectGuardRoutes.join(", ")}`)
  console.log(`[admin-route-manifest] PASS: ${baseline.routeCount} routes / ${baseline.operationCount} operations match the reviewed baseline; ${summarize(routes).wrapper ?? 0} use withAdminRoute`)
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(baseline, null, 2)}\n`)
  console.log(`[admin-route-manifest] wrote ${baseline.routeCount} routes / ${baseline.operationCount} operations: ${JSON.stringify(summarize(routes))}`)
}
