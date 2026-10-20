const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT, listDomains, getDomain, domainDirOf, domainPathOf } = require("./lib/domain-catalog.cjs")

function parseArgs(argv) {
  const args = {
    domain: "",
    list: false,
    all: false,
    materialize: false,
    dryRun: false,
    dev: false,
    build: false,
    out: "",
  }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === "--list") args.list = true
    else if (token === "--all") args.all = true
    else if (token === "--materialize") args.materialize = true
    else if (token === "--dry-run") args.dryRun = true
    else if (token === "--dev") args.dev = true
    else if (token === "--build") args.build = true
    else if (token === "--out") args.out = argv[++index]
    else if (!token.startsWith("-") && !args.domain) args.domain = token
    else fail(`unknown argument: ${token}`)
  }
  return args
}

function fail(message) {
  throw new Error(`[domain-pack] ${message}`)
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true })
  fs.cpSync(from, to, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(from, source).replace(/\\/g, "/")
      if (!relative) return true
      return !relative.split("/").some((segment) => segment === "node_modules" || segment === ".next-cooliebase" || segment === "__tests__")
    },
  })
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) return false
  fs.mkdirSync(path.dirname(to), { recursive: true })
  if (fs.statSync(from).isDirectory()) copyDir(from, to)
  else fs.copyFileSync(from, to)
  return true
}

/**
 * 从种子模块出发，扫描非测试源码里的 `@/modules/<name>/` 引用，推导出需要的模块闭包。
 *
 * 为什么不能硬编码成 [domain, "shared"]：`shared` 虽然是 L0，但它按设计要调
 * `system` 的平台面（鉴权 resolveTenantEntitlement，见 AGENTS.md §3.3），
 * 还引用了 `infra` 的 file-storage。硬编码会让每个域包都**编译不过**
 * （Turbopack: Can't resolve '@/modules/system/contract/system.platform.facade'），
 * 这正是拆分运行长期跑不通的原因。
 *
 * 测试文件不算依赖：打包本就排除 __tests__，而 shared 对 pay 的引用只出现在测试里。
 */
function expandModuleClosure(seedModules) {
  const seen = new Set(seedModules)
  const queue = [...seedModules]

  while (queue.length > 0) {
    const current = queue.pop()
    // 域可能是第一方插件(目录在 packages/plugins/plugin-*) —— 写死会 continue 掉，
    // 导致打包时依赖闭包为空、漏拷依赖域
    const dir = domainPathOf(ROOT, current)
    if (!fs.existsSync(dir)) continue

    for (const file of walkSourceFiles(dir)) {
      const source = fs.readFileSync(file, "utf8")
      for (const match of source.matchAll(/@\/modules\/([a-z0-9_-]+)\//g)) {
        const dependency = match[1]
        if (seen.has(dependency)) continue
        seen.add(dependency)
        queue.push(dependency)
      }
    }
  }

  return [...seen].sort()
}

function walkSourceFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "__tests__" || entry.name === ".next-cooliebase") continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkSourceFiles(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

function buildPlan(domain) {
  const apiRouteDirs = domain.publicPrefixes.map((prefix) => prefix.replace(/^\/api/, "src/app/api"))
  const modules = expandModuleClosure(Array.from(new Set([domain.name, ...domain.dependsOnModules])))
  const files = [
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tsconfig.json",
    "postcss.config.js",
    "tailwind.config.js",
    ".npmrc",
    "next-env.d.ts",
    "src/app/layout.tsx",
    "src/app/globals.css",
  ]
  const dirs = [
    "prisma",
    "public",
    "src/app/healthz",
    "src/app/readyz",
    "src/app/api/internal",
    // 域可能是第一方插件(目录在 packages/plugins/plugin-*) —— 用共享解析器，别写死
    ...modules.map((name) => domainDirOf(ROOT, name)),
    ...apiRouteDirs,
  ]
  return { domain: domain.name, defaultPort: domain.defaultPort, upstreamEnv: domain.upstreamEnv, files, dirs, apiRouteDirs, modules }
}

function materialize(plan, outDir) {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })
  const copied = []
  const missing = []

  for (const relative of plan.files) {
    const ok = copyIfExists(path.join(ROOT, relative), path.join(outDir, relative))
    if (ok) copied.push(relative)
    else missing.push(relative)
  }
  for (const relative of plan.dirs) {
    const ok = copyIfExists(path.join(ROOT, relative), path.join(outDir, relative))
    if (ok) copied.push(`${relative}/`)
    else missing.push(relative)
  }

  fs.writeFileSync(
    path.join(outDir, "src", "app", "page.tsx"),
    `export default function DomainRuntimePage() {\n  return <main>cooliebase domain runtime: ${plan.domain}</main>\n}\n`,
  )
  copied.push("src/app/page.tsx")

  const packageJsonPath = path.join(outDir, "package.json")
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    pkg.name = `cooliebase-domain-${plan.domain}`
    pkg.private = true
    pkg.scripts = {
      ...pkg.scripts,
      dev: `next dev -p ${plan.defaultPort}`,
      start: "node .next-cooliebase/standalone/server.js",
    }
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
  }

  fs.writeFileSync(
    path.join(outDir, ".env.domain"),
    `COOLIEBASE_PACK_DOMAIN=${plan.domain}\nPORT=${plan.defaultPort}\n`,
  )
  fs.writeFileSync(
    path.join(outDir, "domain-pack.json"),
    `${JSON.stringify({ ...plan, copied, missing: missing.filter((item) => item !== "next-env.d.ts") }, null, 2)}\n`,
  )

  const rootModules = path.join(ROOT, "node_modules")
  const packModules = path.join(outDir, "node_modules")
  if (fs.existsSync(rootModules) && !fs.existsSync(packModules)) {
    // 相对符号链接，不用绝对路径：绝对路径会把本机路径烘进打包产物，
    // 产物一换机器/进容器就失效，而且在 Dockerfile.domain 里 COPY 到 /app 后
    // 会变成 /app/node_modules -> 自身，导致构建报 "evalSymlinksInScope: too many links"。
    const relativeTarget = path.relative(path.dirname(packModules), rootModules)
    fs.symlinkSync(relativeTarget, packModules, process.platform === "win32" ? "junction" : "dir")
  }
  fs.mkdirSync(path.join(outDir, "public"), { recursive: true })

  return { copied, missing: missing.filter((item) => item !== "next-env.d.ts") }
}

function runNext(plan, outDir, mode) {
  const args = mode === "dev" ? ["next", "dev", "-p", String(plan.defaultPort)] : ["next", "build"]
  const result = spawnSync("pnpm", ["exec", ...args], {
    cwd: outDir,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      COOLIEBASE_PACK_DOMAIN: plan.domain,
      PORT: String(plan.defaultPort),
    },
  })
  if (result.status !== 0) fail(`${mode} failed for domain ${plan.domain}`)
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.list) {
    console.log("runtime\tdomain\tport\tstage\tkind\tinvoke\tupstreamEnv")
    console.log("all-in-one\tall-next\t3100\tA\tmonolith\tsdk\t(none)")
    for (const domain of listDomains()) {
      console.log(`split\t${domain.name}\t${domain.defaultPort}\t${domain.stage}\t${domain.kind}\trpc-when-remote\t${domain.upstreamEnv}`)
    }
    return
  }
  if (args.all || args.domain === "all" || args.domain === "all-next") {
    console.log(JSON.stringify({
      runtime: "all-in-one",
      process: 1,
      invoke: "sdk",
      port: 3100,
      pack: "full Next.js app (Dockerfile)",
      dev: "npm run dev",
      start: "npm run build && npm run start",
      compose: "npm run runtime:all",
    }, null, 2))
    return
  }
  if (!args.domain) fail("usage: node scripts/pack-domain.cjs <domain|--all> [--dry-run|--materialize|--dev|--build]")

  const domain = getDomain(args.domain)
  const plan = buildPlan(domain)
  const outDir = args.out ? path.resolve(args.out) : path.join(ROOT, "dist", "domain-packs", domain.name)

  if (args.dryRun || (!args.materialize && !args.dev && !args.build)) {
    console.log(JSON.stringify({ outDir: path.relative(ROOT, outDir).replace(/\\/g, "/"), ...plan }, null, 2))
    return
  }

  const result = materialize(plan, outDir)
  console.log(`[domain-pack] materialized ${domain.name} -> ${outDir}`)
  console.log(`[domain-pack] copied ${result.copied.length} entries`)
  if (result.missing.length > 0) console.log(`[domain-pack] missing optional paths: ${result.missing.join(", ")}`)

  if (args.dev) runNext(plan, outDir, "dev")
  if (args.build) runNext(plan, outDir, "build")
}

main()
