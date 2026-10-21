/**
 * ProjectReactor Engine
 *
 * 功能：
 * 1. 白名单二进制防损坏、长词优先有序替换、路径与包名重写；
 * 2. 融合 Node/Next.js 特性：自动隔离数据库名、PORT 端口分配、.env 自动生成；
 * 3. 极简全托管：自动连接 PostgreSQL 创建独立库 + 默认部署全量 SQL 基准与迁移！
 */

const fs = require("node:fs")
const path = require("node:path")
const { execSync, spawnSync } = require("node:child_process")
// **不要在这里 require("pg")**：`hatch.sh` 会从 degit 的**裸克隆**（没有 node_modules）
// 里直接跑本脚本，模块级 require 第三方包会直接 MODULE_NOT_FOUND ——
// 实测：`curl .../hatch.sh | bash -s -- my-app` 就是这么崩的（EXIT=1，产物都没建出来）。
// `pg` 只在 `autoProvisionDatabase()` 里用，用到时再引入。
const {
  parseArgv,
  helpText,
  resolveHatchPlan,
  shouldSkipRelPath,
  pruneCatalog,
  pruneRpcActions,
  buildHatchManifest,
} = require("./lib/hatch-profile.cjs")
const { writeSeamGraph } = require("./lib/seam-graph.cjs")

const SOURCE_ROOT = path.resolve(__dirname, "..")
const CATALOG_REL = path.join("packages", "shared", "backend", "constants", "domain-catalog.json")
const RPC_ACTIONS_REL = path.join("packages", "shared", "backend", "constants", "rpc-actions.json")
const AGENT_PROFILE_REL = path.join("packages", "shared", "contract", "agent-profile.json")
const HATCH_MANIFEST_REL = path.join("packages", "shared", "contract", "hatch-manifest.json")

// 默认基准标识符 (基准项目的英文名 / 短名 / 中文系统全称)
const BASE_PROJECT_NAME = "cooliebase-all"
const BASE_PROJECT_TITLE = "CoolieBase All"
const BASE_DB_NAME = "cooliebase_next"

/**
 * 基座的全部域（**不含 shared** —— shared 是核心 SDK、不是域，AGENTS §3.2）。
 * 裁剪别名时必须按「是否是被裁的域」判断，而不是「是否在保留集里」；
 * 后者会误删 @/modules/shared，工程能过门禁却起不来（实测）。
 */
const ALL_DOMAINS = ["system","infra","online","ai","aigw","bpm","pay","report","mp","mall","member","crm","erp","wms","mes","iot","im"]

// 二进制白名单后缀（直接二进制复制，严禁文本替换，防止破坏文件结构）
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".pdf", ".zip", ".tar", ".gz", ".dump", ".xdb"
])

// 排除的临时目录与产物
const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  ".next-cooliebase",
  ".next-ruoyi",
  ".git",
  ".idea",
  ".vscode",
  ".claude",
  ".commandcode",
  "backups",
  "tmp",
  ".data",
  "coverage",
  "dist",
  "build"
])

// 排除的临时文件
const EXCLUDE_FILES = new Set([
  ".DS_Store",
  "npm-debug.log",
  "yarn-error.log",
  "tsconfig.tsbuildinfo",
  "ts-errors-report.txt"
])

// 目标目录中需保护的已有设计文档（严禁覆盖）
const PROTECTED_DOCS = new Set([
  "all_task.md",
  "zq-agentall.md",
  "应算通-业务流程与数据流转.md",
  "应算通-平台菜单与网关设计.md",
  "应算通-总结.md",
  "应算通-运营管理功能设计.md"
])

/**
 * 文本内容重写器 (ProjectReactor)
 * 严格执行“长词优先”替换原则，避免短词误伤，深度抹除开源底座与供应商硬编码
 */
function transformFileContent(content, targetName, targetTitle, targetDbName, targetPort) {
  let res = content
    .replace(/cooliebase-all/g, targetName)
    .replace(/CoolieBase All/g, targetTitle)
    .replace(/cooliebase_next/g, targetDbName)
    .replace(/PORT=3100/g, `PORT=${targetPort}`)

  // ProjectReactor: 白标化脱敏清洗
  res = res
    .replace(/芋道四位一体企业级管理中台/g, `${targetTitle} · 企业级管理中台`)
    .replace(/芋道四位一体管理系统/g, `${targetTitle} · 业务管理系统`)
    .replace(/芋道四位一体业务工作台/g, `${targetTitle} · 业务工作台`)
    .replace(/芋道四位一体云商中台/g, `${targetTitle} · 业务中台`)
    .replace(/芋道四位一体/g, `${targetTitle} · 多端中台`)
    .replace(/芋道管理中台/g, `${targetTitle} · 管理中台`)
    .replace(/芋道管理后台/g, `${targetTitle} · 管理后台`)
    .replace(/芋道管理系统/g, `${targetTitle} · 业务系统`)
    .replace(/芋道源码/g, "企业级开源底座")
    .replace(/芋道/g, targetTitle)
    .replace(/yudao-quad-terminal/g, `${targetName}-quad`)
    .replace(/yudao-ui-admin-vue3/g, `@${targetName}/admin`)
    .replace(/yudao-cloud-backend/g, `@${targetName}/backend`)
    .replace(/yudao-server/g, `${targetName}-server`)
    .replace(/yudao-monorepo/g, `@${targetName}`)
    .replace(/yudao-native-app/g, `@${targetName}/app`)
    .replace(/yudao-boot-mini/g, `${targetName}-boot`)
    .replace(/yudao-cloud/g, `${targetName}-cloud`)
    .replace(/cn\.iocoder\.cloud/g, `com.${targetName}`)
    .replace(/cn\.iocoder\.boot/g, `com.${targetName}`)
    .replace(/cn\.iocoder\.yudao/g, `com.${targetName}.server`)
    .replace(/yudao/gi, (match) => {
      if (match === "Yudao") return targetName.charAt(0).toUpperCase() + targetName.slice(1)
      if (match === "YUDAO") return targetName.toUpperCase()
      return targetName.toLowerCase()
    })

  return res
}

/**
 * 递归反应堆拷贝与转换
 */
function reactorCopy(src, dest, ctx, rel = "") {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (shouldSkipRelPath(entryRel.replace(/\\/g, "/"), ctx.plan)) {
      continue
    }

    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue
      reactorCopy(srcPath, destPath, ctx, entryRel)
    } else if (entry.isFile()) {
      if (EXCLUDE_FILES.has(entry.name)) continue

      // 保护已有文档
      if (fs.existsSync(destPath) && PROTECTED_DOCS.has(entry.name)) {
        console.log(`[REACTOR PROTECT] 保留目标目录已有文档: ${entry.name}`)
        continue
      }

      const ext = path.extname(entry.name).toLowerCase()
      // 如果属于二进制白名单，直接以流/Buffer 复制
      if (BINARY_EXTENSIONS.has(ext)) {
        fs.copyFileSync(srcPath, destPath)
        continue
      }

      // 特殊处理 package.json
      if (entry.name === "package.json") {
        try {
          const pkg = JSON.parse(fs.readFileSync(srcPath, "utf8"))
          // **只改基座自己那份** package.json —— 工作区包（如 @cooliebase/plugin-sdk）
          // 有各自的包名，一起改会毁掉它们的身份：所有 `workspace:*` 依赖都解析不到
          // （实测: 孵化后 packages/plugins/sdk 的 name 变成目标工程名，install 直接失败）。
          if (pkg.name === BASE_PROJECT_NAME) pkg.name = ctx.targetName
          if (pkg.scripts && pkg.scripts.dev) {
            pkg.scripts.dev = pkg.scripts.dev.replace("-p 3100", `-p ${ctx.targetPort}`)
          }
          fs.writeFileSync(destPath, JSON.stringify(pkg, null, 2), "utf8")
          continue
        } catch {}
      }

      // 文本文件：执行反应堆内容替换
      try {
        const raw = fs.readFileSync(srcPath, "utf8")
        const transformed = transformFileContent(raw, ctx.targetName, ctx.targetTitle, ctx.targetDbName, ctx.targetPort)
        fs.writeFileSync(destPath, transformed, "utf8")
      } catch {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
}

/**
 * 从孵化产物里剔掉**指向被裁掉的域**的引用。
 *
 * 为什么必须做：基座里有若干份"域清单"是**硬编码**的（静态 import 表、loader 表、
 * 生成的 manifest 索引、tsconfig/vitest 的别名）。catalog 与 rpc-actions 早就裁了，
 * 但这些清单没有 —— 结果孵化出的工程**指向不存在的模块**：
 *   - first-party-entries 会"登记了却加载不了"（调用时才炸，最隐蔽）
 *   - tsconfig/vitest 的别名指向空目录
 * 这不是理论问题: 实测 minimal 孵化后 first-party-entries 仍列着 15 个插件、实际只有 4 个。
 */
function pruneDomainReferenceLists(destRoot, plan) {
  const keep = new Set(plan.domains)
  const dropped = []
  const read = (rel) => (fs.existsSync(path.join(destRoot, rel)) ? fs.readFileSync(path.join(destRoot, rel), "utf8") : null)
  const write = (rel, text) => fs.writeFileSync(path.join(destRoot, rel), text, "utf8")

  // 1) 静态入口表 / domain loader 表: 形如 `"<domain>": () => import("@/modules/<domain>/…")`
  for (const rel of [
    "packages/shared/backend/plugins/first-party-entries.ts",
    "packages/shared/backend/lib/domain-action-loaders.ts",
  ]) {
    const text = read(rel)
    if (!text) continue
    const lines = text.split("\n").filter((line) => {
      // key 里可能带点（如 "cooliebase.pay"）—— 只写 [a-z0-9_]+ 会整行漏掉，
      // 而漏掉的后果是"登记了却加载不了"，最隐蔽。域取 import 路径里那段。
      const m = line.match(/^\s*"[a-z0-9_.]+":\s*\(\)\s*=>\s*import\("@\/modules\/([a-z0-9_]+)\//)
      if (!m) return true
      if (keep.has(m[1])) return true
      dropped.push(`${rel}: ${m[1]}`)
      return false
    })
    write(rel, lines.join("\n"))
  }

  // 2) domain-service-loaders: 形如 `"<domain>": { ... },` 的多行块
  {
    const rel = "packages/shared/backend/lib/domain-service-loaders.ts"
    const text = read(rel)
    if (text) {
      const lines = text.split("\n")
      const out = []
      let skipping = false
      let depth = 0
      for (const line of lines) {
        const start = line.match(/^\s*"([a-z0-9_]+)":\s*\{/)
        if (start && !keep.has(start[1])) {
          dropped.push(`${rel}: ${start[1]}`)
          skipping = true
          depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
          if (depth <= 0) skipping = false
          continue
        }
        if (skipping) {
          depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
          if (depth <= 0) skipping = false
          continue
        }
        out.push(line)
      }
      write(rel, out.join("\n"))
    }
  }

  // 3) tsconfig paths 与 vitest 别名: 删掉指向被裁域的条目
  {
    const rel = "tsconfig.json"
    const text = read(rel)
    if (text) {
      const json = JSON.parse(text)
      const paths = json.compilerOptions?.paths ?? {}
      const prunedDomainNames = new Set(ALL_DOMAINS.filter((name) => !keep.has(name)))
      for (const key of Object.keys(paths)) {
        const m = key.match(/^@\/modules\/([a-z0-9_]+)/)
        if (m && prunedDomainNames.has(m[1])) {
          delete paths[key]
          dropped.push(`${rel}: ${key}`)
        }
      }
      write(rel, `${JSON.stringify(json, null, 2)}\n`)
    }
  }
  {
    const rel = "vitest.config.ts"
    const text = read(rel)
    if (text) {
      const prunedDomainNames = new Set(ALL_DOMAINS.filter((name) => !keep.has(name)))
      const lines = text.split("\n").filter((line) => {
        const m = line.match(/^\s*"@\/modules\/([a-z0-9_]+)(\/\*)?"\s*:/)
        if (!m) return true
        if (!prunedDomainNames.has(m[1])) return true
        dropped.push(`${rel}: @/modules/${m[1]}`)
        return false
      })
      write(rel, lines.join("\n"))
    }
  }

  // 4) 治理能力清单: 能力把"某域的文件路径 + 标记字符串"写在 ref/marker 里。
  //    域被裁掉后这些引用解析不了，microservice:check 会失败。
  //
  //    这里**不逐个枚举**该裁哪些（枚举必然漏 —— 实测连裁 3 轮才收敛），
  //    而是按"**裁完之后还能不能解析**"判定: ref 文件不存在、或 marker 不在文件里
  //    → 该能力属于被裁的域，摘掉。并同步从 required 摘掉，否则会变成另一半失败
  //    （"required 里的能力必须不是 TODO"）。
  {
    const rel = "packages/shared/backend/constants/microservice-governance.json"
    const text = read(rel)
    if (text) {
      const catalog = JSON.parse(text)
      const stillResolvable = (capability) => {
        const ref = capability.ref
        if (!ref) return true
        const abs = path.join(destRoot, ref)
        if (!fs.existsSync(abs)) return false
        if (!capability.marker) return true
        try {
          return fs.readFileSync(abs, "utf8").includes(capability.marker)
        } catch {
          return false
        }
      }
      const removed = (catalog.capabilities ?? []).filter((c) => !stillResolvable(c)).map((c) => c.id)
      if (removed.length > 0) {
        catalog.capabilities = catalog.capabilities.filter(stillResolvable)
        if (Array.isArray(catalog.required)) catalog.required = catalog.required.filter((id) => !removed.includes(id))
        write(rel, `${JSON.stringify(catalog, null, 2)}\n`)
        for (const id of removed) dropped.push(`${rel}: 能力 ${id}（ref/marker 指向被裁域）`)
      }
    }
  }

  // 4.5) 机检基准线: 冻结欠债用的文件路径清单，同样会指向被裁域。
  {
    const rel = "docs/architecture/artifacts/engineering-standards-baseline.json"
    const text = read(rel)
    if (text) {
      const pruned = new Set(["pay","report","bpm","mp","member","iot","erp","im","crm","wms","mall","mes"].filter((d) => !keep.has(d)))
      const json = JSON.parse(text)
      let hit = 0
      const scrub = (value) => {
        if (typeof value === "string") {
          for (const domain of pruned) {
            if (value.includes(`plugins/plugin-${domain}/`) || value.includes(`domains/${domain}/`)) { hit++; return undefined }
          }
          return value
        }
        if (Array.isArray(value)) return value.map(scrub).filter((v) => v !== undefined)
        if (value && typeof value === "object") {
          const out = {}
          for (const [k, v] of Object.entries(value)) {
            if (typeof k === "string") {
              let skip = false
              for (const domain of pruned) {
                if (k.includes(`plugins/plugin-${domain}/`) || k.includes(`domains/${domain}/`)) { skip = true; hit++; break }
              }
              if (skip) continue
            }
            const cleaned = scrub(v)
            if (cleaned !== undefined) out[k] = cleaned
          }
          return out
        }
        return value
      }
      write(rel, `${JSON.stringify(scrub(json), null, 2)}\n`)
      if (hit > 0) dropped.push(`${rel}: ${hit} 条指向被裁域的路径`)
    }
  }

  // 4.6) 兼容性契约: 里面有从域集派生的**计数**。裁剪后必须**全部**重算 ——
  //      逐一补会漏（实测连撞两次: domainCatalog.domains 之后还有 rpcActions.domains）。
  //      这里按"每个计数都能在真源里数出来"来做，不再枚举。
  {
    const rel = "packages/shared/contract/compat-manifest.json"
    const text = read(rel)
    if (text) {
      const manifest = JSON.parse(text)
      const contracts = manifest.contracts ?? {}
      const countOf = (sourceRel, pick) => {
        const source = read(sourceRel)
        if (!source) return undefined
        try {
          return pick(JSON.parse(source))
        } catch {
          return undefined
        }
      }
      const expected = {
        domainCatalog: countOf(CATALOG_REL, (json) => (json.domains ?? []).length),
        rpcActions: countOf(RPC_ACTIONS_REL, (json) => Object.keys(json.domains ?? {}).length),
      }
      for (const [key, actual] of Object.entries(expected)) {
        const entry = contracts[key]
        if (!entry || typeof entry.domains !== "number" || actual === undefined || entry.domains === actual) continue
        const before = entry.domains
        entry.domains = actual
        dropped.push(`${rel}: ${key}.domains ${before} -> ${actual}（按裁剪后的真源重算）`)
      }
      write(rel, `${JSON.stringify(manifest, null, 2)}\n`)
    }
  }

  // 4.7) admin-pages.json 管理端页面清单: 剔除被裁域的页面
  {
    const rel = "packages/shared/contract/admin-pages.json"
    const text = read(rel)
    if (text) {
      const json = JSON.parse(text)
      const beforeCount = (json.pages ?? []).length
      json.pages = (json.pages ?? []).filter((page) => {
        const m = page.module ? page.module.match(/^@\/modules\/([a-z0-9_]+)\//) : null
        const domain = m ? m[1] : (page.slug ? page.slug.split("/")[0] : null)
        if (!domain) return true
        return keep.has(domain)
      })
      write(rel, `${JSON.stringify(json, null, 2)}\n`)
      const removed = beforeCount - json.pages.length
      if (removed > 0) dropped.push(`${rel}: 剔除 ${removed} 个被裁域的管理端页面条目`)
    }
  }

  // 4.8) first-party-entries.ts 第一方插件静态入口: 剔除被裁域的条目
  {
    const rel = "packages/shared/backend/plugins/first-party-entries.ts"
    const text = read(rel)
    if (text) {
      const prunedPlugins = ALL_DOMAINS.filter((name) => !keep.has(name))
      const lines = text.split("\n")
      const out = lines.filter((line) => {
        for (const domain of prunedPlugins) {
          if (line.includes(`plugin-${domain}/plugin-entry`) || line.includes(`.${domain}":`)) {
            return false
          }
        }
        return true
      })
      if (out.length < lines.length) {
        write(rel, out.join("\n"))
        dropped.push(`${rel}: 剔除 ${lines.length - out.length} 个被裁域的插件入口`)
      }
    }
  }

  // 4.9) 测试文件里**按域名字符串**引用被裁域的，一并剔除。
  //      两类: 一类把域名当任意标签（registerService("pay")），一类就是**专门测该域**的。
  //      两类在裁剪后的工程里都跑不了 —— 前者因为 broker 会按 catalog 校验域名，
  //      后者因为被测对象已不存在。剔除等价于"跳过"，保留会在孵化工程里制造一片红。
  //      （更彻底的做法是让测试从 catalog 取示例域；那是后续收敛方向，见提交说明。）
  {
    const prunedNames = ["pay","report","bpm","mp","member","iot","erp","im","crm","wms","mall","mes"]
      .filter((d) => !keep.has(d))
    const doomed = []
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (["node_modules", ".next", ".git"].includes(entry.name)) continue
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) { walk(full); continue }
        if (!/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) continue
        const text = fs.readFileSync(full, "utf8")
        if (prunedNames.some((domain) => new RegExp(`["'\`]${domain}([."'\`]|\.[a-z])`).test(text))) {
          doomed.push(path.relative(destRoot, full).replace(/\\/g, "/"))
        }
      }
    }
    walk(path.join(destRoot, "packages"))
    walk(path.join(destRoot, "src"))
    walk(path.join(destRoot, "test"))
    for (const rel of doomed) {
      fs.rmSync(path.join(destRoot, rel), { force: true })
      dropped.push(`${rel}: 删除（测试引用了被裁域）`)
    }
    if (doomed.length > 0) console.log(`[REACTOR PRUNE] 删除 ${doomed.length} 个引用了被裁域的测试文件`)
  }

  // 4.10) 被裁域的插件目录**整个删除**。
  //        只删文件不够: 目录还在的话，`pnpm install` 会把它当工作区包、往里建 node_modules，
  //        于是裁剪过的工程里仍有一堆空的 plugin-<domain> 目录 —— 扫描类工具会把它们
  //        当成插件列出来（实测: minimal 孵化后 MCP 工具列出了 15 个"插件"，其中 11 个是空壳）。
  {
    const prunedPlugins = ALL_DOMAINS.filter((name) => !keep.has(name))
    for (const domain of prunedPlugins) {
      const dir = path.join(destRoot, "packages", "plugins", `plugin-${domain}`)
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
        dropped.push(`packages/plugins/plugin-${domain}/: 整个删除（被裁域）`)
      }
    }
  }

  // 4.11) lockfile 与裁剪结果同步。
  //        pnpm-lock.yaml 是**生成物**，但它声明了每个工作区包；被裁域的条目留着的话，
  //        `pnpm install --frozen-lockfile` 会据此把目录**重新建出来**（空壳、只有 node_modules）
  //        —— 实测: 裁剪后 plugins/ 只剩 4 个，install 之后又变回 16 个。
  //        生成物必须与真源一致: 这里按裁剪结果删掉对应 importer 块。
  {
    const rel = "pnpm-lock.yaml"
    const text = read(rel)
    if (text) {
      const prunedPlugins = ALL_DOMAINS.filter((name) => !keep.has(name)).map((name) => `packages/plugins/plugin-${name}`)
      const lines = text.split("\n")
      const out = []
      let skipping = false
      let removed = 0
      for (const line of lines) {
        const importer = line.match(/^ {2}([^\s:][^:]*):\s*$/)
        if (importer) {
          skipping = prunedPlugins.includes(importer[1].trim())
          if (skipping) { removed++; continue }
        } else if (skipping && /^\s{4,}/.test(line)) {
          continue
        } else if (skipping) {
          skipping = false
        }
        out.push(line)
      }
      if (removed > 0) {
        write(rel, out.join("\n"))
        dropped.push(`${rel}: 删除 ${removed} 个被裁域的 importer 条目（否则 install 会把目录建回来）`)
      }
    }
  }

  // 5) 彻底无法工作的文件直接删: src/app 下的路由/页面、以及测试。
  //    它们 import 了被裁域的模块 —— 留着必然编译失败，比删掉更糟。
  //    （测试被删会少覆盖，但一个 chunk 里引用了不存在模块的测试本来也跑不了。）
  {
    const pruned = new Set(["pay","report","bpm","mp","member","iot","erp","im","crm","wms","mall","mes"].filter((d) => !keep.has(d)))
    const doomed = []
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (["node_modules", ".next", ".git"].includes(entry.name)) continue
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) { walk(full); continue }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue
        const rel = path.relative(destRoot, full).replace(/\\/g, "/")
        const isAppOrTest = rel.startsWith("src/app/") || rel.includes("/__tests__/") || rel.startsWith("test/")
        if (!isAppOrTest) continue
        const text = fs.readFileSync(full, "utf8")
        for (const domain of pruned) {
          if (new RegExp(`@/modules/${domain}[/"]`).test(text)) { doomed.push(rel); break }
        }
      }
    }
    walk(path.join(destRoot, "src/app"))
    walk(path.join(destRoot, "packages"))
    walk(path.join(destRoot, "test"))
    for (const rel of doomed) {
      fs.rmSync(path.join(destRoot, rel), { force: true })
      dropped.push(`${rel}: 删除（引用了被裁域，无法工作）`)
    }
    if (doomed.length > 0) console.log(`[REACTOR PRUNE] 删除 ${doomed.length} 个引用了被裁域的路由/测试文件`)
  }

  if (dropped.length > 0) {
    console.log(`[REACTOR PRUNE] 剔掉 ${dropped.length} 处指向被裁域的引用`)
    for (const item of dropped.slice(0, 8)) console.log(`  - ${item}`)
    if (dropped.length > 8) console.log(`  …(共 ${dropped.length})`)
  }
  return dropped
}

/**
 * 自检: 孵化产物里**不得**再有指向被裁域的代码引用。
 * 宁可孵化失败，也不要静默产出一个指向不存在模块的工程。
 */
function assertNoStaleDomainReferences(destRoot, plan) {
  const keep = new Set(plan.domains)
  const pruned = new Set(["pay","report","bpm","mp","member","iot","erp","im","crm","wms","mall","mes"].filter((d) => !keep.has(d)))
  const hits = []
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git", "scratch"].includes(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) { walk(full); continue }
      if (!/\.(ts|tsx|json)$/.test(entry.name)) continue
      const text = fs.readFileSync(full, "utf8")
      for (const domain of pruned) {
        // 代码用 import 路径；JSON 产物（机检基准线等）用相对路径 —— 两种都要认，
        // 否则会出现"自检通过、但项目自己的门禁照样失败"（实测踩过）。
        const stale =
          new RegExp(`@/modules/${domain}[/"]`).test(text) ||
          new RegExp(`(plugins/plugin-${domain}|domains/${domain})/`).test(text)
        if (stale) {
          hits.push(`${path.relative(destRoot, full).replace(/\\/g, "/")} -> ${domain}`)
          break
        }
      }
    }
  }
  walk(path.join(destRoot, "src"))
  walk(path.join(destRoot, "packages"))
  if (hits.length > 0) {
    throw new Error(`孵化产物仍有指向被裁域的引用（${hits.length} 处）:\n  ${hits.slice(0, 6).join("\n  ")}`)
  }
  console.log("[REACTOR SELFCHECK] ✅ 无指向被裁域的残留引用")
}

/**
 * 把路径里出现旧项目名的**目录/文件**改成新名。
 * 自底向上处理，先改深的，避免改完父目录后子路径失效。
 */
function renamePathSegments(destRoot, targetName) {
  const from = BASE_PROJECT_NAME
  const to = targetName || BASE_PROJECT_NAME
  if (!to || from === to) return
  const renamed = []
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".git", ".next"].includes(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      if (entry.name.includes(from)) {
        const next = path.join(dir, entry.name.replaceAll(from, to))
        if (fs.existsSync(next)) {
          // 目标已存在（对**已孵化过的目录**再跑一次孵化时会发生）——
          // 直接 renameSync 会 ENOTEMPTY 炸掉。合并后删源，让孵化器**可重复运行**。
          fs.cpSync(full, next, { recursive: true, force: true })
          fs.rmSync(full, { recursive: true, force: true })
        } else {
          fs.renameSync(full, next)
        }
        renamed.push(path.relative(destRoot, next).replace(/\\/g, "/"))
      }
    }
  }
  walk(destRoot)
  if (renamed.length > 0) console.log(`[REACTOR RENAME] 重命名 ${renamed.length} 处路径含旧项目名的目录/文件`)
}

function applyHatchPatches(destRoot, plan, sourceCatalog, targetName) {
  const catalogPath = path.join(destRoot, CATALOG_REL)
  const rpcPath = path.join(destRoot, RPC_ACTIONS_REL)
  const hatchPath = path.join(destRoot, HATCH_MANIFEST_REL)
  const agentPath = path.join(destRoot, AGENT_PROFILE_REL)
  const destCatalog = pruneCatalog(sourceCatalog, plan)

  fs.writeFileSync(catalogPath, `${JSON.stringify(destCatalog, null, 2)}\n`, "utf8")

  let destRpc = { domains: {} }
  if (fs.existsSync(rpcPath)) {
    destRpc = pruneRpcActions(JSON.parse(fs.readFileSync(rpcPath, "utf8")), plan)
    fs.writeFileSync(rpcPath, `${JSON.stringify(destRpc, null, 2)}\n`, "utf8")
  }

  fs.writeFileSync(hatchPath, `${JSON.stringify(buildHatchManifest(plan), null, 2)}\n`, "utf8")
  writeSeamGraph({ root: destRoot, catalog: destCatalog, rpcActions: destRpc })
  // 路径级重命名: 内容里的项目名被替换了，但**目录/文件名**还叫旧名 ——
  // 必须把路径中含旧项目名的目录/文件一并更新，避免与契约清单脱节。
  renamePathSegments(destRoot, targetName)
  pruneDomainReferenceLists(destRoot, plan)

  // 生成物必须用**生成器**重建，不要手工改 —— 手工改出来的与真源不一致，
  // 孵化工程的 `check` 会直接报漂移（实测）。这条命令只依赖 node 与 catalog，无需装依赖。
  // 裁剪会改变域集，**所有由域集派生的产物都必须重建** —— 少建一个，
  // 孵化工程的 check 就会报漂移（实测: agent 契约注册表还是基座那份 324，
  // 而新工程只有 15 份）。这些都是纯 node 脚本，不依赖 pnpm install。
  // 派生物清单**共用**（scripts/lib/derived-artifacts.cjs）——
  // 漏一个的表现是门禁对不上（'注册表 14 vs 实际 15'），这一轮已经漏过两次。
  const { DERIVED_ARTIFACTS } = require("./lib/derived-artifacts.cjs")
  for (const { script, args, label } of DERIVED_ARTIFACTS) {
    if (!fs.existsSync(path.join(destRoot, script))) continue
    try {
      execSync(`node ${script}${args.length ? " " + args.join(" ") : ""}`, { cwd: destRoot, stdio: "pipe" })
      console.log(`[REACTOR GEN] 已重建${label}`)
    } catch (error) {
      throw new Error(`重建${label}失败（孵化产物会带着漂移的生成物）: ${error.message}`)
    }
  }

  assertNoStaleDomainReferences(destRoot, plan)

  if (fs.existsSync(agentPath)) {
    const agentProfile = JSON.parse(fs.readFileSync(agentPath, "utf8"))
    agentProfile.selectedHatch = {
      profile: plan.profile,
      domains: plan.domains,
      includeClients: plan.includeClients,
      hatchCommand: `pnpm run project:create -- <target-path> --profile ${plan.profile}${plan.bundle.length ? ` --bundle ${plan.bundle.join(",")}` : ""}`,
    }
    fs.writeFileSync(agentPath, `${JSON.stringify(agentProfile, null, 2)}\n`, "utf8")
  }
}

/**
 * 自动创建 PostgreSQL 数据库并执行默认 SQL 迁移
 */
/**
 * 管理员引导凭据。**种子与 .env 必须用同一份** ——
 * 否则会出现"种子建的用户名是 admin、而 .env 的平台用户白名单写的是别的"，
 * 于是工程起得来却登不进去（实测：孵化时继承了源仓库 .env 里的本地值）。
 */
function resolveBootstrap() {
  const { randomBytes } = require("node:crypto")
  return {
    username: process.env.ADMIN_BOOTSTRAP_USERNAME || "admin",
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || `Vf1!${randomBytes(10).toString("hex")}`,
    salt: process.env.ADMIN_BOOTSTRAP_SALT || randomBytes(8).toString("hex"),
  }
}

/**
 * 外部 PostgreSQL 的**管理连接串**。
 *
 * 为什么要有覆盖入口：本函数此前把 `postgresql://cooliebase:cooliebase123@localhost:5433/...`
 * **写死在三处**（连接 / 迁移 / 生成的 `.env`），于是这条路**只能**在
 * "本机恰好有一台 5433 的 Docker Postgres" 时才成立 —— 而 Docker 不可用（如 colima
 * 端口不可达）时，脚本不报错、继续写下 postgres 配置，孵化出的工程**起不来**。
 *
 * 注意**刻意不读 `DATABASE_URL`**：它在本仓常被指向 sqlite 文件或另一个库，
 * 拿它去 CREATE DATABASE 可能落到别人的实例上。故用专用变量。
 */
function resolvePgAdminUrl() {
  return process.env.PROJECT_PG_ADMIN_URL || "postgresql://cooliebase:cooliebase123@localhost:5433/postgres"
}
function pgUrlFor(adminUrl, dbName) {
  const u = new URL(adminUrl)
  u.pathname = `/${dbName}`
  return `${u.toString()}?schema=public`
}

async function autoProvisionDatabase(targetDbName) {
  console.log("----------------------------------------------------------------")
  console.log(`[REACTOR DB] 正在连接 PostgreSQL 并自动初始化数据库: ${targetDbName}...`)

  const { Client } = require("pg")
  const client = new Client({
    connectionString: resolvePgAdminUrl(),
  })

  let dbReady = false
  try {
    await client.connect()
    const check = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDbName])
    if (check.rows.length === 0) {
      // **不写 `OWNER cooliebase`**：那要求实例上恰好存在 `cooliebase` 角色 ——
      // 嵌入式 Postgres 只有 `postgres`，于是报 `role "cooliebase" does not exist`（实测）。
      // 省略后默认归**当前连接角色**所有，Docker 与嵌入式两条路都成立。
      await client.query(`CREATE DATABASE "${targetDbName}"`)
      console.log(`[REACTOR DB] ✅ 成功创建新数据库: "${targetDbName}"`)
    } else {
      console.log(`[REACTOR DB] 数据库 "${targetDbName}" 已存在，准备检查与部署 SQL`)
    }
    dbReady = true
  } catch (err) {
    console.log(`[REACTOR DB NOTICE] PostgreSQL 连接提示: ${err.message}`)
  } finally {
    try { await client.end() } catch {}
  }

  // 提到函数作用域：原先只在 try 内 `const`，块外引用会 ReferenceError（实测被验证脚本抓到）
  const targetDbUrl = pgUrlFor(resolvePgAdminUrl(), targetDbName)

  if (dbReady) {
    try {
      console.log(`[REACTOR SQL] 正在自动导入全量基准 SQL 与 27 项迁移...`)
      execSync("pnpm exec prisma migrate deploy", {
        cwd: SOURCE_ROOT,
        env: {
          ...process.env,
          DATABASE_URL: targetDbUrl,
        },
        stdio: "inherit",
      })
      // 只跑迁移**不等于**"菜单权限已就绪" —— 用户/角色/菜单这些来自种子脚本。
      // 此前只有 start.sh 的 dev/infra 模式会做，孵化路径漏了，于是新工程
      // 能起来却登不进去（system_user 为空），而日志还宣称一切就绪（实测）。
      console.log(`[REACTOR SEED] 正在注入基础种子数据（管理员/角色/菜单/字典）...`)
      const { randomBytes } = require("node:crypto")
      // 管理员凭据要**告诉用户** —— 否则工程起得来、却没人知道怎么登进去（可用性的一部分）。
      // 未显式提供时生成一个强密码并打印；生产环境应通过环境变量注入，不要用这里的随机值。
      const bootstrapUsername = resolveBootstrap().username
      const bootstrapPassword = resolveBootstrap().password
      const bootstrapSalt = resolveBootstrap().salt
      execSync("pnpm exec tsx scripts/seed-postgresql.ts", {
        cwd: SOURCE_ROOT,
        env: {
          ...process.env,
          DATABASE_URL: targetDbUrl,
          // 种子脚本要求这几个存在且密码满足强度（缺一个直接 fail-fast）。
          ADMIN_BOOTSTRAP_USERNAME: bootstrapUsername,
          ADMIN_BOOTSTRAP_PASSWORD: bootstrapPassword,
          ADMIN_BOOTSTRAP_SALT: bootstrapSalt,
        },
        stdio: "inherit",
      })
      console.log(`[REACTOR SQL SUCCESS] ✅ 数据库 "${targetDbName}" 迁移与基础种子（含菜单权限）已自动就绪！`)
      console.log("")
      console.log("  ┌──────────────── 管理员登录凭据 ────────────────┐")
      console.log(`  │  用户名: ${bootstrapUsername}`)
      console.log(`  │  密码:   ${bootstrapPassword}`)
      console.log("  └────────────────────────────────────────────────┘")
      console.log("  （本地开发用。生产请通过 ADMIN_BOOTSTRAP_* 环境变量注入，勿沿用此随机值。）")
    } catch (migrateErr) {
      console.log(`[REACTOR SQL WARN] 自动部署迁移提示: ${migrateErr.message}`)
      return { ok: false, url: targetDbUrl }
    }
    return { ok: true, url: targetDbUrl }
  }
  return { ok: false, url: null }
}

/**
 * 主执行函数
 */
async function runProjectReactor(targetDir, plan, sourceCatalog, options = {}) {
  const resolvedTarget = path.resolve(targetDir)
  const targetName = (path.basename(resolvedTarget) || "agent-app").replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()
  const targetDbName = targetName.replace(/[^a-z0-9_]/g, "_")
  const targetTitle = options.customTitle || targetName.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
  const targetPort = "3200"
  const ctx = { targetName, targetTitle, targetDbName, targetPort, plan }

  console.log("================================================================")
  console.log("             ProjectReactor - Next.js 全自动项目重塑引擎          ")
  console.log("================================================================")
  console.log(`  源底座路径:    ${SOURCE_ROOT}`)
  console.log(`  目标工程路径:  ${resolvedTarget}`)
  console.log(`  目标工程包名:  ${targetName}`)
  console.log(`  目标数据库名:  ${targetDbName}`)
  console.log(`  默认服务端口:  ${targetPort}`)
  console.log(`  Hatch profile: ${plan.profile}`)
  console.log(`  保留域:        ${plan.domains.join(", ")}`)
  if (plan.excludedDomains.length) {
    console.log(`  裁剪域:        ${plan.excludedDomains.join(", ")}`)
  }
  console.log(`  客户端包:      ${plan.includeClients ? "保留" : "跳过"}`)
  console.log("================================================================")

  if (options.dryRun) {
    console.log("[DRY-RUN] 仅打印计划，不复制文件、不初始化数据库。")
    console.log(JSON.stringify(buildHatchManifest(plan), null, 2))
    return plan
  }

  if (!fs.existsSync(resolvedTarget)) {
    fs.mkdirSync(resolvedTarget, { recursive: true })
  }

  reactorCopy(SOURCE_ROOT, resolvedTarget, ctx)
  applyHatchPatches(resolvedTarget, plan, sourceCatalog, targetName)

  // **裁剪后必须重生成 wiki** —— 与 `project-init.cjs` 的既有做法一致。
  // hatch 裁剪会删掉被裁域的代码（如 `packages/plugins/plugin-bpm/`），但
  // `wiki/domains/*.md` 是**生成物**、不会自己消失，于是仍指向已删路径 →
  // 产物自身 `gen:paths:check` 必红。
  // 实测（2026-10-20，minimal profile）：产物 `pnpm run check` exit=1，
  // 报 `wiki/domains/bpm.md:3 — 引用了不存在的路径: packages/plugins/plugin-bpm/`。
  // 注意这是**同一类缺陷的第二处**：第一处在 `project-init` 的归档清理路径，已修。
  // **裁剪后还必须重写"规模声明"** —— 同一类缺陷的第三处。
  // `llms.txt` / `llms-full.txt` / `AGENTS.md` / `README.md` 是**手写**的，里面写着基座规模
  // （「17 原生业务域」「342 份契约」）；裁剪后真值只剩 5 域 / 16 契约，于是产物自己的
  // `llms:check` 必红（实测：9 处断言失败）。
  // 改写由 `check-llms-sync.cjs --restamp` 完成 —— **判真值与改写是同一个脚本**，避免第二真源。
  const llmsSync = path.join(resolvedTarget, "scripts", "check-llms-sync.cjs")
  if (fs.existsSync(llmsSync)) {
    try {
      const out = execSync("node scripts/check-llms-sync.cjs --restamp", { cwd: resolvedTarget, encoding: "utf8" })
      const line = String(out).split("\n").filter(Boolean).pop() ?? ""
      console.log(`[REACTOR FACTS] ✓ 已按裁剪后的真源重写规模声明（${line.trim()}）`)
    } catch (error) {
      console.log(`[REACTOR FACTS WARN] 重写规模声明失败: ${String(error?.message ?? error).split("\n")[0]}`)
    }
  }

  const wikiSync = path.join(resolvedTarget, "scripts", "sync-openwiki.cjs")
  if (fs.existsSync(wikiSync)) {
    try {
      execSync("node scripts/sync-openwiki.cjs --write", { cwd: resolvedTarget, stdio: "pipe" })
      console.log("[REACTOR WIKI] ✓ 已按裁剪后的域目录重生成 wiki（消除指向被裁域的悬空引用）")
    } catch (error) {
      console.log(`[REACTOR WIKI WARN] 重生成 wiki 失败: ${String(error?.message ?? error).split("\n")[0]}`)
    }
  }

  // **先连库，再写 .env**（顺序很关键）。
  // 此前顺序相反：连不上也照样写下 `DB_DRIVER=postgresql` + 不可达 URL，然后打印 SUCCESS ——
  // 孵化出的工程**起不来**却被宣称就绪（实测）。宁可这里**明确失败**，也不要产出坏工程。
  // `--no-provision-db`：调用方自己决定数据库（`project:init --target` 走 **SQLite**，
  // 它委派到本脚本只是为了克隆+裁剪，**不该被 Postgres 拦住**）。
  // 这是实测出来的：fail-loud 守卫上线后 `project:init --target` 直接中止 ——
  // 那条路本来是零容器 SQLite，却因为这里必须连上 Postgres 而断掉。
  const db = options.noProvisionDb
    ? { ok: true, url: null, skipped: true }
    : await autoProvisionDatabase(targetDbName)
  if (options.noProvisionDb) {
    console.log("[REACTOR DB] 已跳过数据库准备（--no-provision-db）—— 由调用方决定（project:init 走 SQLite）")
  }
  if (!db.ok) {
    console.log("")
    console.log("  ✗ 无法准备 PostgreSQL 数据库 —— **已中止**，未生成 .env（避免产出起不来的工程）。")
    console.log(`    尝试的管理连接: ${resolvePgAdminUrl()}`)
    console.log("")
    console.log("  三条路，任选其一：")
    console.log("    ① 指到任意可达的 Postgres（无需 Docker）:")
    console.log("         PROJECT_PG_ADMIN_URL=postgresql://user:pass@host:5432/postgres pnpm run project:create -- <目录>")
    console.log("    ② 起本机 PostgreSQL 后重试（历史默认 5433）。")
    console.log("    ③ **零容器**路线：改用 `pnpm run project:init -- --target <目录> --profile base`")
    console.log("       （走 SQLite，自带库文件，不依赖任何外部服务）。")
    process.exit(1)
  }

  // .env 不能只是"把源仓库的 .env 拷过来" —— 里面可能有**源仓库本地的取值**
  // （如 TENANT_PLATFORM_USERNAMES 指向某个本机账号），新工程继承了就会
  // "起得来、登不进去"（实测）。必需的项这里显式写死，其余保留源的作为基底。
  const destEnv = path.join(resolvedTarget, ".env")
  const srcEnv = path.join(SOURCE_ROOT, ".env")
  const bootstrap = resolveBootstrap()
  const required = {
    PORT: String(targetPort),
    JWT_SECRET: require("node:crypto").randomBytes(32).toString("hex"),
    TENANT_MODE: "disabled",
    TENANT_PLATFORM_USERNAMES: bootstrap.username,
  }
  // 只有**真的准备了**数据库才写库相关配置；跳过后留给调用方（否则会把 SQLite 覆盖成 postgres）。
  if (db.url) {
    required.DATABASE_URL = db.url
    required.DB_DRIVER = "postgresql"
    // **引导凭据必须落盘**：此前只 `console.log` 打印一次（"管理员登录凭据"框），
    // 客户漏看一眼就**永远登不进去**（实测：`hatch:e2e` 的开箱判据当场抓到
    // `create` 产物没有 ADMIN_BOOTSTRAP_*，而 `init` 产物有 —— 两个入口行为不一致）。
    // `.env.local` 本就是 gitignored 的本地配置，`project:init` 也写在这里，两者对齐。
    required.ADMIN_BOOTSTRAP_USERNAME = bootstrap.username
    required.ADMIN_BOOTSTRAP_PASSWORD = bootstrap.password
    required.ADMIN_BOOTSTRAP_SALT = bootstrap.salt
  }
  const kept = []
  const seen = new Set()
  if (fs.existsSync(srcEnv)) {
    for (const line of fs.readFileSync(srcEnv, "utf8").split("\n")) {
      const key = line.split("=")[0]?.trim()
      if (!key || key.startsWith("#")) { kept.push(line); continue }
      if (key in required) { kept.push(`${key}=${required[key]}`); seen.add(key); continue }
      kept.push(line)
    }
  }
  for (const [key, value] of Object.entries(required)) {
    if (!seen.has(key)) kept.push(`${key}=${value}`)
  }
  const envBody = kept.filter((line, index, all) => !(line === "" && index === all.length - 1)).join("\n") + "\n"
  fs.writeFileSync(destEnv, envBody, "utf8")
  // 必需的运行期取值**再写一份到 .env.local** —— Next.js 的优先级是
  // process.env > .env.local > .env，而"只写 .env"在某些启动路径下没进到 process.env
  // （实测: .env 里明明有 TENANT_PLATFORM_USERNAMES=admin，运行期读到的却是空，
  //  于是平台管理员被当成租户账号、报"必须填写租户标识"）。
  // .env.local 本就是 gitignored 的本地配置，放这里既优先又不入库。
  fs.writeFileSync(path.join(resolvedTarget, ".env.local"), Object.entries(required).map(([k, v]) => `${k}=${v}`).join("\n") + "\n", "utf8")

  console.log("================================================================")
  console.log("[SUCCESS] 项目重构与一键初始化完成。")
  console.log("================================================================")
  console.log("\n启动指引:")
  console.log(`  1. cd /d "${resolvedTarget}"`)
  console.log("  2. start.bat")
  console.log("  3. 新增表结构后运行 pnpm run db:migrate")
  if (plan.excludedDomains.length > 0) {
    console.log("")
    console.log("  ⚠ 已知缺口（裁剪场景）: pnpm-lock.yaml 里仍声明着被裁掉的工作区包，")
    console.log("    因此 `pnpm install` 会把它们的目录**重新建出来**（空壳，只有 node_modules）。")
    console.log("    已做的兜底: 此类无 manifest 的目录不会被当成插件（MCP/扫描器均已按此判定）。")
    console.log("    彻底修法: 按裁剪结果同步 lockfile，或裁剪后跑一次 pnpm install 重建 lockfile。")
  }
  console.log("")
  console.log("  首次启动后需要**登记第一方插件**（走鉴权）:")
  console.log("    curl -X POST -H \"Authorization: Bearer <token>\" \\")
  console.log("         http://localhost:<port>/api/v1/admin/plugins")
  console.log("  不登记的话，插件域的接口（/api/v1/plugins/<id>/api/…）会一直 404 ——")
  console.log("  因为宿主只挂载**已登记**的插件（实测: 登记前 404、登记后 200）。")
  console.log(`  Hatch: ${plan.profile} → ${HATCH_MANIFEST_REL}`)
  console.log("")
  console.log("  提示: 启动前若 shell 里已有同名环境变量（尤其 DATABASE_URL / DB_DRIVER /")
  console.log("        TENANT_*），它会**覆盖 .env** —— 那样工程会连到别的库、或把平台")
  console.log("        管理员当成租户账号，表现为「登录说用户名或密码错误」（实测踩过）。")
  console.log("")
  console.log("  提示: 起服务后跑一次 pnpm run smoke:login —— 它会自己建库/迁移/种子/起服务，")
  console.log("        验到「登录 200 + 受保护接口 200」为止。今天就是这条抓住了登录 401。")
  console.log("================================================================")
  // 派生工程必须有版本控制 —— 否则任务痕迹（commit 里的 [T1]）与环境指纹
  // （commit + 脏树）全都无从取证，整套交付治理会空转。
  // 实测: 刚孵化的工程跑 `task:verify` 直接抛 "not a git repository"。
  if (!fs.existsSync(path.join(resolvedTarget, ".git"))) {
    const gitInit = (args) => spawnSync("git", args, { cwd: resolvedTarget, stdio: "ignore" })
    gitInit(["init", "-q"])
    gitInit(["add", "-A"])
    gitInit([
      "-c", "user.email=hatch@local", "-c", "user.name=hatch",
      "commit", "-q", "-m", "chore: 孵化自 cooliebase-all 基座\n\nCo-authored-by: CommandCodeBot <noreply@commandcode.ai>",
    ])
    console.log("[reactor] 已 git init 并提交首个快照（任务痕迹与指纹需要它）")
  }

  return plan
}

function main() {
  try {
    const parsed = parseArgv(process.argv)
    if (parsed.help) {
      console.log(helpText())
      return Promise.resolve()
    }

    const catalog = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, CATALOG_REL), "utf8"))
    const plan = resolveHatchPlan(catalog, parsed)
    // **必须显式给目标路径**。这里原先有个硬编码默认值（一个 Windows 路径）——
    // 不带参数运行就会往那个路径孵化。实测: 误执行该 CLI 时在仓库里造出几千个
    // 嵌套目录，因为相对路径解析到了仓库根，等于往自己家里写垃圾。
    // 没有显式目标就报用法退出 —— 不要有「默认往哪写」这种事。
    if (!parsed.target) {
      console.error("[REACTOR] 缺少目标路径。用法:")
      console.error("  node scripts/clone-project-base.cjs <目标路径> [--profile base|minimal|standard] [--bundle a,b]")
      console.error("       [--no-provision-db]   跳过数据库准备（由调用方负责，project:init --target 走 SQLite 时用）")
      process.exitCode = 2
      return Promise.resolve()
    }
    const targetArg = parsed.target
    return runProjectReactor(targetArg, plan, catalog, { dryRun: parsed.dryRun, noProvisionDb: parsed.noProvisionDb })
  } catch (err) {
    console.error("[REACTOR ERROR]", err.stack || err.message || err)
    process.exitCode = 1
    return Promise.resolve()
  }
}

main().catch((err) => {
  console.error("[REACTOR ERROR]", err.stack || err.message || err)
  process.exit(1)
})
