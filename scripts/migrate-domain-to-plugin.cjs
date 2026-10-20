#!/usr/bin/env node
/**
 * 把一个业务域完整迁移成**第一方插件**（执行 scaffold 打印的那份清单）。
 *
 * 为什么要有这个脚本: 迁移涉及 6 件事、每件都会牵动互相引用的登记与门禁，
 * 手敲 13 遍必然漏项。把"清单"做成可执行的东西，才谈得上"工具先行"。
 *
 * 用法:
 *   node scripts/migrate-domain-to-plugin.cjs bpm                # dry-run
 *   node scripts/migrate-domain-to-plugin.cjs bpm --write        # 落盘
 *   node scripts/migrate-domain-to-plugin.cjs bpm mp member --write
 *
 * 明确**不做**: system / infra。它们是 platform 地基，不是可插拔的业务能力 ——
 * 降成插件会破坏 moduleLayerOf / isFoundationModule 语义。
 */

const fs = require("node:fs")
const path = require("node:path")
const { execFileSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const PROTECTED = new Set(["system", "infra"])

const args = process.argv.slice(2)
const write = args.includes("--write")
const names = args.filter((a) => !a.startsWith("-"))

if (names.length === 0) {
  console.error("用法: node scripts/migrate-domain-to-plugin.cjs <domain...> [--write]")
  process.exit(1)
}

const catalogPath = path.join(ROOT, "packages/shared/backend/constants/domain-catalog.json")
// 治理文档名是**跟着工程名改过的**（孵化会重命名），所以动态找而不是写死 ——
// 写死会让孵化工程里这里读到空文件，后面"补治理行"的分支被静默跳过（实测）。
const governanceCandidates = fs.existsSync(path.join(ROOT, "docs/architecture"))
  ? fs.readdirSync(path.join(ROOT, "docs/architecture")).filter((f) => f.endsWith("-domain-governance.md"))
  : []
const governancePath = path.join(ROOT, "docs/architecture", governanceCandidates[0] ?? "cooliebase-all-domain-governance.md")
const entriesPath = path.join(ROOT, "packages/shared/backend/plugins/first-party-entries.ts")
const tsconfigPath = path.join(ROOT, "tsconfig.json")
const vitestPath = path.join(ROOT, "vitest.config.ts")

const read = (p) => fs.readFileSync(p, "utf8")
const writeFile = (p, s) => fs.writeFileSync(p, s)

const catalog = JSON.parse(read(catalogPath))
const byName = new Map(catalog.domains.map((d) => [d.name, d]))

/**
 * 待删除的 Next 转发文件。
 *
 * 匹配规则: 域名的位置**固定**，即 src/app/api/v1/<surface>/<domain>/…。
 * 绝不要用"路径里含域名"的子串模式 —— 实测会把
 * src/app/api/v1/admin/mes/work-orders/report/route.ts 这种误删
 * （父目录恰好与某个域名同名）。域名出现在中间段时，子串匹配是错的。
 */
function nextRouteFilesOf(domain) {
  const out = []
  for (const surface of ["admin", "app", "open"]) {
    const dir = path.join(ROOT, "src", "app", "api", "v1", surface, domain)
    if (fs.existsSync(dir)) walk(dir, out)
  }
  return out
}
function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name === "route.ts") out.push(full)
  }
}

/**
 * 为一个**尚未登记**的新域补登记（插件语义）。
 *
 * 为什么需要: 这条链路的起点是"对话里冒出一个新业务域"（如电商平台要个 `shop`），
 * 此时域目录刚由元数据 + codegen 生成出来，catalog 里还没有它 ——
 * 而后面 7 步都要求域已登记。缺这一步，新业务就卡在"代码有了、注册不了"。
 */
/**
 * 按**实际生成的路由**推导公开前缀。
 *
 * 不能写死 `admin + open`: codegen 生成的路由可能只有 admin 面，
 * 而 `domain-pack:check` 会校验"声明的公共前缀必须在 manifest 里真有对应路由"——
 * 多声明一个不存在的面就会被判成空承诺（实测）。
 */
function derivePublicPrefixes(name) {
  const surfaces = ["admin", "app", "open"].filter((surface) =>
    fs.existsSync(path.join(ROOT, "packages", "domains", name, "routes", surface)) ||
    fs.existsSync(path.join(ROOT, "packages", "plugins", `plugin-${name}`, "routes", surface)))
  return (surfaces.length > 0 ? surfaces : ["admin"]).map((surface) => `/api/v1/${surface}/${name}`)
}

function registerNewDomain(name) {
  const catalogPath = path.join(ROOT, "packages", "shared", "backend", "constants", "domain-catalog.json")
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
  const ports = (catalog.domains || []).map((item) => item.defaultPort).filter((port) => typeof port === "number")
  const entry = {
    name,
    owner: name,
    kind: "plugin",
    stage: "B",
    contractVersion: "v1",
    publicPrefixes: derivePublicPrefixes(name),
    implementation: "local-ts",
    upstreamEnv: `COOLIEBASE_DOMAIN_${name.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_UPSTREAM`,
    defaultPort: (ports.length ? Math.max(...ports) : 3200) + 1,
    packable: true,
    packKind: "api-only",
    dependsOnModules: ["shared"],
    independentDatabase: false,
    auth: { audience: "admin", tenantPolicy: "required" },
    resilience: { timeoutMs: 15000, retryMaxAttempts: 1, safeMethodsOnly: true, idempotencyRequired: true },
  }
  catalog.domains = [...(catalog.domains || []), entry]
  catalog.layers = catalog.layers || {}
  catalog.layers.plugin = catalog.layers.plugin || { domains: [], description: "第一方插件: 保留域级特征(可独立打包), 但不属于平台/业务层" }
  catalog.layers.plugin.domains = [...new Set([...(catalog.layers.plugin.domains || []), name])].sort()
  return { catalogPath, catalog, entry }
}

for (const name of names) {
  let entry = byName.get(name)
  let justRegistered = false
  if (!entry) {
    // 未登记 —— 但域目录若已存在（元数据 + codegen 刚生成），就补登记而不是报错
    const domainDir = path.join(ROOT, "packages", "domains", name)
    if (!fs.existsSync(domainDir)) {
      console.error(`✗ ${name}: 既不在 domain-catalog.json 里，也没有 packages/domains/${name} 目录`)
      process.exit(1)
    }
    const registered = registerNewDomain(name)
    if (write) {
      fs.writeFileSync(registered.catalogPath, `${JSON.stringify(registered.catalog, null, 2)}\n`)
      console.log(`  ✓ ${name}: 已登记进 catalog（kind=plugin，端口 ${registered.entry.defaultPort}）`)
    } else {
      console.log(`  · ${name}: 待登记（kind=plugin，端口 ${registered.entry.defaultPort}）`)
    }
    entry = registered.entry
    byName.set(name, entry)
    justRegistered = true   // 新登记的本就是 plugin，别再被"已经是插件了"拦住
  }
  if (PROTECTED.has(name)) {
    console.error(`✗ ${name}: system/infra 是 platform 地基，不允许迁成插件`)
    process.exit(1)
  }
  // 「已是插件」不等于「迁移完成」—— 判据必须加上"目录是否已经搬过去"，
  // 否则首次只登记、第二次就报"已经是插件了"，卡在半途无法续跑（实测踩到）。
  // 已是插件不再报错: 后续 7 步都做成了**幂等**（已搬就跳过 0~2、其余可重复执行），
  // 所以重跑只会"收敛"，不会破坏现场 —— 这也让"跑到一半"的状态可以续做。
  if (entry.kind === "plugin" && !justRegistered) {
    console.log(`  · ${name}: 已是插件，按幂等方式续做/收敛`)
  }
}

console.log(`[migrate-domain-to-plugin] ${write ? "落盘" : "dry-run"} · ${names.length} 个域\n`)

const plan = []
for (const name of names) {
  const from = path.join("packages", "domains", name)
  const to = path.join("packages", "plugins", `plugin-${name}`)
  const files = nextRouteFilesOf(name)
  plan.push({ name, from, to, files, entry: byName.get(name) })
  console.log(`  ${name}`)
  console.log(`      目录  ${from} -> ${to}`)
  console.log(`      删 Next 转发 ${files.length} 个（按 /api/v1/<surface>/${name}/ 固定段匹配）`)
}

if (!write) {
  console.log("\n  (dry-run: 未写入任何文件。加 --write 执行)")
  process.exit(0)
}

for (const { name, from, to, files } of plan) {
  console.log(`\n== ${name} ==`)

  // **可续跑**: 若域已在插件目录（此前跑到一半），就跳过 0~2、直接做后续步骤。
  // 否则"搬完但尾部没做完"的状态无法修复，只能手工收拾（实测踩到）。
  const alreadyMoved = fs.existsSync(path.join(ROOT, to))
  if (alreadyMoved) {
    console.log(`   · 域已在 ${to}（续跑：跳过搬迁与脚手架生成）`)
  }


  // 1) 生成插件声明与入口（在域目录里生成，再整体搬走）
  // 0/7：**新生成的域**（元数据 + codegen）其路由处理器落在 `src/app/api/v1/<surface>/<域>/…`，
  //      而插件布局要求它们**在域内** `packages/domains/<域>/routes/…`（脚手架正是按后者生成入口的）。
  //      对**已迁移**的旧域，域内已有 routes/，src/app 下只是转发桩 —— 那种情况不搬，直接删（见 7/7）。
  const domainRoutesDir = path.join(ROOT, alreadyMoved ? to : from, "routes")
  if (!alreadyMoved && !fs.existsSync(domainRoutesDir) && files.length > 0) {
    let moved = 0
    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/")
      const match = rel.match(/^src\/app\/api\/v1\/([a-z]+)\/([a-z0-9_]+)\/(.+)\/route\.ts$/)
      if (!match) continue
      const target = path.join(ROOT, from, "routes", match[1], match[3], "route.ts")
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.copyFileSync(file, target)
      moved++
    }
    if (moved > 0) console.log(`   0/7 已把 ${moved} 个路由处理器搬进域内（codegen 产物 -> 插件布局）`)
  }

  if (!alreadyMoved) {
    execFileSync("node", [path.join("scripts", "scaffold-domain-plugin.cjs"), from, "--write"], { cwd: ROOT, stdio: "ignore" })
    console.log("   1/7 已生成 plugin.manifest.json + plugin-entry.ts")

    // 2) 搬家（并确保旧目录清干净 —— 残留会让路径解析器误判域还在原地）
    fs.mkdirSync(path.dirname(path.join(ROOT, to)), { recursive: true })
    fs.renameSync(path.join(ROOT, from), path.join(ROOT, to))
    fs.rmSync(path.join(ROOT, from), { recursive: true, force: true })
    console.log(`   2/7 已移到 ${to}`)
  }

  // 3) package.json: cooliebasePlugin 指针 + plugin-sdk 依赖
  const pkgPath = path.join(ROOT, to, "package.json")
  const pkg = fs.existsSync(pkgPath) ? JSON.parse(read(pkgPath)) : { name: `@cooliebase/plugin-${name}`, version: "0.1.0", private: true, type: "module" }
  pkg.name = pkg.name || `@cooliebase/plugin-${name}`
  pkg.cooliebasePlugin = { manifest: "./plugin.manifest.json", merged: "./plugin-entry.ts" }
  pkg.dependencies = { ...(pkg.dependencies || {}), "@cooliebase/plugin-sdk": "workspace:*" }
  writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
  console.log("   3/7 已加 cooliebasePlugin 指针与 @cooliebase/plugin-sdk 依赖")

  // 4) 宿主静态入口表
  let entries = read(entriesPath)
  const line = `  "cooliebase.${name}": () => import("@/modules/${name}/plugin-entry"),`
  if (!entries.includes(line)) {
    entries = entries.replace(/(\n\}\n)/, `\n${line}$1`)
    writeFile(entriesPath, entries)
  }
  console.log("   4/7 已登记静态入口")

  // 5) catalog: 保留该域，kind 改 plugin，从 platform/business 移入 plugin 层
  const cat = JSON.parse(read(catalogPath))
  if (!cat.domains.some((d) => d.name === name)) {
    const ports = cat.domains.map((d) => d.defaultPort).filter((port) => typeof port === "number")
    cat.domains.push({
      name, owner: name, kind: "plugin", stage: "B", contractVersion: "v1",
      publicPrefixes: derivePublicPrefixes(name),
      implementation: "local-ts", upstreamEnv: `COOLIEBASE_DOMAIN_${name.toUpperCase()}_UPSTREAM`,
      defaultPort: (ports.length ? Math.max(...ports) : 3200) + 1,
      packable: true, packKind: "api-only", dependsOnModules: ["shared"], independentDatabase: false,
      auth: { audience: "admin", tenantPolicy: "required" },
      resilience: { timeoutMs: 15000, retryMaxAttempts: 1, safeMethodsOnly: true, idempotencyRequired: true },
    })
  }
  const target = cat.domains.find((d) => d.name === name)
  target.kind = "plugin"
  // 幂等收敛: publicPrefixes 按**实际路由面**重算 —— 只在首次登记时算的话，
  // 后续补了路由（或首次算错）就永远修不回来（实测踩到）。
  target.publicPrefixes = derivePublicPrefixes(name)
  for (const layer of ["platform", "business"]) cat.layers[layer].domains = cat.layers[layer].domains.filter((d) => d !== name)
  cat.layers.plugin = cat.layers.plugin || { domains: [], description: "第一方插件: 保留域级特征(可独立打包), 但不属于平台/业务层" }
  if (!cat.layers.plugin.domains.includes(name)) cat.layers.plugin.domains.push(name)
  cat.layers.plugin.domains.sort()
  writeFile(catalogPath, JSON.stringify(cat, null, 2) + "\n")

  // 6) 治理行改为插件语义
  // 治理文档属于**基座自己的**治理材料，孵化的工程里可能不存在 —— 不存在就跳过，别让链条断在这里。
  let gov = fs.existsSync(governancePath) ? read(governancePath) : ""
  const govRow = gov.split("\n").find((l) => l.startsWith(`| ${name} `))
  if (!govRow && gov) {
    // 新域没有治理行 —— 补一行（§6 的 domain-governance-coverage 会逐域校验）
    const header = gov.split("\n").findIndex((l) => l.startsWith("|---"))
    if (header >= 0) {
      const cols = gov.split("\n")[header].split("|").length - 2
      const row = `| ${name} | plugin | B | — | — | ` + Array(Math.max(0, cols - 5)).fill("—").join(" | ")
      const lines = gov.split("\n")
      lines.splice(header + 1, 0, row)
      gov = lines.join("\n")
      writeFile(governancePath, gov)
    }
  }
  if (govRow) {
    const cells = govRow.split("|")
    cells[7] = cells[7].replace(from.replace(/\//g, "/"), to)
    cells[9] = ` **第一方插件**(kind=plugin): 保留域级特征(可 API-only 独立打包/运行/部署, \`npm run domain:up -- ${name}\`), 同时支持合并运行; 路由经 /api/v1/plugins/cooliebase.${name}/api/** 挂载 `
    gov = gov.replace(govRow, cells.join("|"))
    writeFile(governancePath, gov)
  }
  // 5.5) `rpc-actions.json` 登记本域。
  //      这份文件**没有任何生成器**（只有校验器在读），不登记的话
  //      `domain:check` 会直接报 `rpc-actions.json missing domain: <域>`（实测）。
  //      方法名从域内生成的 actions 契约里派生（`cooliebase.cmd.<域>.<实体>.<方法>`）。
  const rpcActionsPath = path.join(ROOT, "packages", "shared", "backend", "constants", "rpc-actions.json")
  if (fs.existsSync(rpcActionsPath)) {
    const rpc = JSON.parse(read(rpcActionsPath))
    rpc.domains = rpc.domains || {}
    if (!rpc.domains[name]) {
      // 从域内 actions 契约里派生: `"cooliebase.cmd.<域>.<实体>.<方法>": <schema>`
      // 内联 `z.object(...)` 的（get/delete）没有具名 schema，校验器要求 schema 必须
      // 落在本域 validators 里，所以这类不写进来；`ping` 由框架内置，也不写。
      const actions = []
      const contractDir = path.join(ROOT, to, "contract")
      if (fs.existsSync(contractDir)) {
        for (const file of fs.readdirSync(contractDir)) {
          if (!file.endsWith(".actions.ts")) continue
          const source = fs.readFileSync(path.join(contractDir, file), "utf8")
          for (const match of source.matchAll(/"cooliebase\.cmd\.\w+\.(\w+)\.(\w+)":\s*([A-Za-z_][A-Za-z0-9_]*)\s*,/g)) {
            const entity = match[1]
            const kebab = entity.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
            actions.push({
              method: `${entity}.${match[2]}`,
              service: `${entity}Service`,
              module: `${kebab}.service`,
              schema: match[3],
            })
          }
        }
      }
      rpc.domains[name] = { actions: actions.sort((a, b) => a.method.localeCompare(b.method)) }
      writeFile(rpcActionsPath, JSON.stringify(rpc, null, 2) + "\n")
      console.log(`   5.5/7 已登记 rpc-actions（${actions.length} 个方法）`)
    }
  }

  // 5.6) hatch-manifest 与 catalog 对齐。
  //      它记录的是"孵化时带了哪些域"，`domain-pack:check` 会拿它与 catalog 比对 ——
  //      新加的域不同步就会报 `hatch-manifest domains must match domain-catalog`（实测）。
  const hatchManifestPath = path.join(ROOT, "packages", "shared", "contract", "hatch-manifest.json")
  if (fs.existsSync(hatchManifestPath)) {
    const manifest = JSON.parse(read(hatchManifestPath))
    if (Array.isArray(manifest.domains) && !manifest.domains.includes(name)) {
      manifest.domains = [...manifest.domains, name].sort()
      if (Array.isArray(manifest.excludedDomains)) {
        manifest.excludedDomains = manifest.excludedDomains.filter((item) => item !== name)
      }
      manifest.note = `${manifest.note ?? ""}（新增域 ${name}: ${new Date().toISOString().slice(0, 10)}）`.trim()
      writeFile(hatchManifestPath, JSON.stringify(manifest, null, 2) + "\n")
      console.log("   5.6/7 已同步 hatch-manifest")
    }
  }

  // 5.7) compat-manifest 里由域集派生的**计数**要跟着重算。
  //      它记录"清单说有 N 个域"并与 catalog 比对；加了域不同步就报
  //      `contracts.domainCatalog.domains is N but catalog has M`（实测）。
  const compatPath = path.join(ROOT, "packages", "shared", "contract", "compat-manifest.json")
  if (fs.existsSync(compatPath)) {
    const compat = JSON.parse(read(compatPath))
    const expected = {
      domainCatalog: cat.domains.length,
      rpcActions: Object.keys(JSON.parse(read(rpcActionsPath)).domains || {}).length,
    }
    let touched = false
    for (const [key, actual] of Object.entries(expected)) {
      const entry = compat.contracts?.[key]
      if (entry && typeof entry.domains === "number" && entry.domains !== actual) {
        entry.domains = actual
        touched = true
      }
    }
    if (touched) {
      writeFile(compatPath, JSON.stringify(compat, null, 2) + "\n")
      console.log("   5.7/7 已重算 compat-manifest 的派生计数")
    }
  }

  console.log("   5/7 catalog 与治理表已改为插件语义")

  // 7) 别名（tsconfig + vitest）
  const ts = JSON.parse(read(tsconfigPath))
  ts.compilerOptions.paths[`@/modules/${name}/*`] = [`${to}/*`]
  ts.compilerOptions.paths[`@/modules/${name}`] = [to]
  writeFile(tsconfigPath, JSON.stringify(ts, null, 2) + "\n")

  let vt = read(vitestPath)
  const vtLine = `      "@/modules/${name}": path.resolve(__dirname, "${to}"),`
  if (!vt.includes(vtLine)) {
    vt = vt.replace(/(      "@\/modules": path\.resolve\(__dirname, "packages\/domains"\),)/, `${vtLine}\n$1`)
    writeFile(vitestPath, vt)
  }
  console.log("   6/7 已加 tsconfig + vitest 别名")

  // 8) 删除 Next 转发文件（精确列表，删的是生成声明时用过的那些）
  for (const file of files) fs.rmSync(file, { force: true })
  for (const surface of ["admin", "app", "open"]) {
    const dir = path.join(ROOT, "src", "app", "api", "v1", surface, name)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  }
  console.log(`   7/7 已删 ${files.length} 个 Next 转发文件`)
}

console.log("\n下一步（脚本不做，因为会改生成物与基线）:")
console.log("  pnpm run domain:contracts && pnpm run domain:seams && pnpm run domain:manifests && pnpm run admin:routes:manifest")
console.log("  pnpm run check && pnpm exec vitest run && pnpm run build")
