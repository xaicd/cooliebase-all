#!/usr/bin/env node
/**
 * 把某个域转成**第一方插件**的脚手架（③ 的机械部分）。
 *
 * 为什么先做这个工具: pay 试点已经证明「域 → 插件」的代码转换是**机械的** ——
 * 路由处理器（已被 withAdminRoute / withAppRoute 包装，鉴权/权限/schema 校验都在里面）
 * 可以**原样复用**，只需生成 manifest 声明 + 一个适配器入口。既然如此，就不该每次手写。
 *
 * 它做什么（默认 dry-run，加 --write 才落盘）:
 *   - 扫描 <domain> 下 routes/{admin,app,open} 里的 route.ts
 *   - 推导 apiRoutes 声明（path / method / auth）：
 *       admin -> operator   app -> company   open -> public
 *   - 生成 plugin.manifest.json（含 capabilities: api.routes.register）
 *   - 生成 plugin-entry.ts（静态 import + 适配器，**不重写业务逻辑**）
 *
 * 它**不做什么**（这些是真正的关卡，必须显式做，不能藏在脚手架里）:
 *   - 不动 domain-catalog.json / 治理表 / permissions —— 把一个域从"平台模块"改成"插件"
 *     会牵动这些互相引用的登记与门禁，属于需要单独评审的一步
 *   - 不动 src/app 下的路由转发文件
 *   - 不加宿主侧的静态 import 表
 * 运行结束时会把这份清单打印出来。
 *
 * 用法:
 *   node scripts/scaffold-domain-plugin.cjs pay            # dry-run，只打印
 *   node scripts/scaffold-domain-plugin.cjs pay --write     # 落盘
 */
const fs = require("node:fs")
const path = require("node:path")

/**
 * 读取域名在 catalog 里的域级特征。插件身份 = 域身份，这些特征必须随插件带走
 * （可打包性、默认端口、上行环境变量、公开前缀、租户与弹性策略）。
 */
function loadCatalogEntry(name) {
  try {
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/shared/backend/constants/domain-catalog.json"), "utf8"))
    const entry = (catalog.domains || []).find((item) => item.name === name)
    if (!entry) return null
    return {
      kind: entry.kind,
      stage: entry.stage,
      contractVersion: entry.contractVersion,
      publicPrefixes: entry.publicPrefixes,
      upstreamEnv: entry.upstreamEnv,
      defaultPort: entry.defaultPort,
      packable: entry.packable,
      independentDatabase: entry.independentDatabase,
      dependsOnModules: entry.dependsOnModules,
      auth: entry.auth,
      resilience: entry.resilience,
    }
  } catch {
    return null
  }
}

const ROOT = path.resolve(__dirname, "..")
const SURFACE_AUTH = { admin: "operator", app: "company", open: "public" }

const domain = process.argv[2]
const write = process.argv.includes("--write")
if (!domain) {
  console.error("用法: node scripts/scaffold-domain-plugin.cjs <domain> [--write]")
  process.exit(1)
}

// 接受"域名"或"路径": 迁移到 packages/plugins/ 之后目录已经变了, 工具不该假定位置。
// 传域名时必须走共享解析器 —— 直接拼 packages/domains/<domain> 对 15 个已插件化的域
// 全都找不到（而且报的是"找不到域目录"，看起来像域名写错了，实际是路径假设错了）。
const { domainDirOf } = require("./lib/domain-catalog.cjs")
const domainDir = path.isAbsolute(domain) || domain.includes("/")
  ? path.resolve(ROOT, domain)
  : path.join(ROOT, domainDirOf(ROOT, domain))
if (!fs.existsSync(domainDir)) {
  console.error(`找不到域目录: ${domain}`)
  process.exit(1)
}

/** 递归列出某目录下的 route.ts。 */
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

const declarations = []
const modules = [] // { surface, rel, alias }
for (const surface of ["admin", "app", "open"]) {
  const base = path.join(domainDir, "routes", surface)
  for (const file of routeFiles(base)) {
    const rel = path.relative(base, path.dirname(file)).replace(/\\/g, "/")
    const text = fs.readFileSync(file, "utf8")
    const methods = [...new Set([...text.matchAll(/export\s+(?:const|async function)\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]))]
    if (methods.length === 0) continue
    const relKey = rel || "root"
    modules.push({ surface, rel: relKey, alias: `route_${surface}_${relKey.replace(/[^a-zA-Z0-9]/g, "_")}` })
    for (const method of [...methods].sort()) {
      declarations.push({
        routeKey: `${surface}:${relKey}:${method.toLowerCase()}`,
        method,
        path: relKey === "root" ? "/" : `/${relKey}`,
        auth: SURFACE_AUTH[surface],
      })
    }
  }
}

if (declarations.length === 0) {
  console.error(`域 ${domain} 下没有可转换的路由（${path.relative(ROOT, domainDir)}/routes/...）`)
  process.exit(1)
}

// 域名 = 目录名去掉 plugin- 前缀（目录位置/命名不应影响插件身份）
const domainName = path.basename(domainDir).replace(/^plugin-/, "")
// 域级特征原样带过来。**必须带**: 用户要求插件既"像微服务那样独立"、又能"合并运行"，
// 所以第一方插件保留可打包性/端口/上行环境变量/公开前缀 —— 拆分代理与治理门禁都靠它。
// 漏了这段，插件在 catalog 里就没有域语义，publicPrefix 会被判成空承诺。
const catalogEntry = loadCatalogEntry(domainName)
const manifest = {
  $schema: "cooliebase-plugin-manifest/v1",
  id: `cooliebase.${domainName}`,
  apiVersion: 1,
  version: "0.1.0",
  displayName: catalogEntry?.displayName ?? domainName,
  description: `${domainName} 域（由 scripts/scaffold-domain-plugin.cjs 生成的第一方插件声明）`,
  author: "CoolieBase All",
  categories: ["automation"],
  // 只用**插件 manifest 的白名单**（packages/shared/backend/plugins/types.ts 的
  // KNOWN_CAPABILITIES）。别抄注册表列表里那些 facade.invoke / rpc.serve / pack.independent ——
  // 那是**桥接层**描述内置域用的另一套词表，写进 manifest 会被安装期校验直接拒收。
  // 可打包性等域级信息在下面的 domain 段里，不走 capability。
  capabilities: ["api.routes.register"],
  entrypoints: { merged: "./plugin-entry.ts" },
  ...(catalogEntry ? { domain: catalogEntry } : {}),
  apiRoutes: declarations,
}

const entryLines = [
  "/**",
  ` * ${domainName} 域的**插件入口**（合并/同进程形态）。由 scripts/scaffold-domain-plugin.cjs 生成。`,
  " *",
  " * 设计要点: 不重写业务逻辑 —— 处理器仍是包内 routes 目录下那些已被",
  " * withAdminRoute / withAppRoute 包装过的函数（鉴权/权限码/schema 校验都在里面），",
  " * 这里只做一层适配: 宿主的 {method,path,query,body,headers} -> Request -> Response -> {status,body}。",
  " *",
  " * 为什么用静态 import: 仓内第一方插件是 TS, 宿主无法用运行期 import() 加载（Node 不认 TS）,",
  " * 而模板字符串动态 import 在 Turbopack 下也无法解析 —— 必须显式列出每条 import。",
  " */",
  'import { definePlugin } from "@cooliebase/plugin-sdk"',
  "",
  ...modules.map((m) => `import * as ${m.alias} from "@/modules/${domainName}/routes/${m.surface}/${m.rel === "root" ? "route" : `${m.rel}/route`}"`),
  "",
  "async function invoke(handler: (request: Request, context?: unknown) => Promise<Response> | Response, input: any) {",
  "  const url = new URL(`http://plugin.invalid${input.path}`)",
  "  for (const [key, value] of Object.entries(input.query ?? {})) url.searchParams.set(key, String(value))",
  "  const request = new Request(url, {",
  "    method: input.method,",
  "    headers: input.headers,",
  "    body: input.body === undefined ? undefined : JSON.stringify(input.body),",
  "  })",
  "  const response = await handler(request)",
  "  const text = await response.text()",
  "  let body: unknown = text",
  "  try { body = text ? JSON.parse(text) : null } catch { /* 非 JSON 原样返回 */ }",
  "  return { status: response.status, body }",
  "}",
  "",
  "export default definePlugin({",
  '  async setup(ctx) { ctx.logger.info("ready (merged)") },',
  '  async onHealth() { return { status: "ok" } },',
  "  async onShutdown() {},",
  "  routes: {",
  ...declarations.map((d) => {
    const m = modules.find((x) => `${x.surface}:${x.rel}:` === d.routeKey.slice(0, `${x.surface}:${x.rel}:`.length))
    return `    ${JSON.stringify(d.routeKey)}: (input: any) => invoke(${m.alias}.${d.method}, input),`
  }),
  "  },",
  "})",
  "",
]

console.log(`[scaffold-domain-plugin] ${domain}`)
console.log(`  路由声明: ${declarations.length} 条   静态 import: ${modules.length} 个`)
console.log(`  -> ${path.relative(ROOT, domainDir)}/plugin.manifest.json`)
console.log(`  -> ${path.relative(ROOT, domainDir)}/plugin-entry.ts`)
console.log("")
console.log("  ⚠️  以下步骤本工具**不做**，需要显式完成（它们会牵动互相引用的登记与门禁）:")
console.log("     1. catalog 里**保留**该域，但把 kind 改成 \"plugin\"，并在 layers.plugin.domains 登记")
console.log("        （不要移除! 移除等于丢掉域级特征 —— broker 会拒收它的 subject，打包与治理也对不上。")
console.log("         同时把 docs/architecture/cooliebase-all-domain-governance.md 的治理行改为插件语义）")
console.log("     2. 把该域目录移到 packages/plugins/plugin-<domain>（宿主才发现得到）")
console.log("        —— 搬完必须清干净旧目录: 残留会让路径解析器误判域还在原地（实测踩过反馈回路）")
console.log("     3. 在 package.json 里加 cooliebasePlugin 指针与 @cooliebase/plugin-sdk 依赖")
console.log("     4. 在 packages/shared/backend/plugins/first-party-entries.ts 加一行静态入口")
console.log("        （仓内 TS 插件不能用运行期 import() 加载，Node 不认 TS、打包器也追不到）")
console.log("     5. 删掉 src/app/api/v1/**/<domain> 下的路由转发文件，并重生成域清单与路由基线")
console.log("        （拆分模式下转发仍由 proxy 按 publicPrefixes 完成，删文件不影响独立部署）")
console.log("     6. 验证三种 auth 声明: operator/company 无 token 必须 401、public 放行、未声明 404")
console.log("")

if (!write) {
  console.log("  (dry-run: 未写入。加 --write 落盘)")
  process.exit(0)
}

fs.writeFileSync(path.join(domainDir, "plugin.manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
fs.writeFileSync(path.join(domainDir, "plugin-entry.ts"), entryLines.join("\n"))
console.log("  已写入。")
