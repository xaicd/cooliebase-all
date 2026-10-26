/**
 * Engineering-standards gate (AGENTS.md prose -> machine check).
 *
 * A rule must be machine-checkable to count as "settled". Each rule declares a mode:
 *
 *   enforce  violations fail the build outright
 *   ratchet  existing debt is frozen in a reviewed baseline; only NEW debt fails
 *   report   printed for humans, never fails (needs judgement, not a boolean)
 *
 * Usage:
 *   node scripts/check-engineering-standards.cjs               # gate (used by pnpm run check)
 *   node scripts/check-engineering-standards.cjs --json        # machine-readable, for MCP
 *   node scripts/check-engineering-standards.cjs --audit       # print every rule, never fail
 *   node scripts/check-engineering-standards.cjs --write-baseline
 */

const fs = require("fs")
const path = require("path")
const { ROOT, loadCatalog } = require("./lib/domain-catalog.cjs")
const { findDuplicateKeys } = require("./lib/json-duplicate-keys.cjs")
const { spawnSync } = require("node:child_process")

const BASELINE_REL = "docs/architecture/artifacts/engineering-standards-baseline.json"
const GOVERNANCE_DOC = "docs/architecture/cooliebase-all-domain-governance.md"
const SRC = "src"
// 各域与 shared 已迁到 packages/（见 pnpm-workspace.yaml 与 AGENTS.md §3.2）。
const DOMAINS = "packages/domains"
// 域迁成第一方插件后代码在 packages/plugins/plugin-* —— 只扫 packages/domains
// 会让这些规则对已迁域**完全失效**（而且 check 仍是绿的，静默退化）。
const PLUGINS = "packages/plugins"
/** 域代码的两处根。sdk 是插件 SDK 包，不是插件，排除。 */
function domainRoots() {
  return [DOMAINS, PLUGINS]
}
/** 在"域代码的两个根"里递归收集文件（排除 packages/plugins/sdk）。 */
function walkDomains(predicate) {
  return domainRoots()
    .flatMap((root) => walk(root, predicate))
    .filter((file) => !toRel(file).startsWith("packages/plugins/sdk/"))
}
const SHARED = "packages/shared"

const asJson = process.argv.includes("--json")
const auditOnly = process.argv.includes("--audit")
const writeBaseline = process.argv.includes("--write-baseline")

// Logger implementations and code generators are where console output legitimately lives;
// codegen-templates emit code as strings, so their console.* is generated text, not repo code.
const CONSOLE_EXEMPT = new Set([
  "packages/shared/backend/lib/observability.ts",
  "packages/shared/backend/lib/exception-analyzer.ts",
  // 合并形态插件的宿主侧日志出口: 插件在**宿主进程内**运行, 没有 stderr 管道可接
  // （独立形态由 worker-manager 收 stderr）, 这里就是它的日志边界。
  "packages/shared/backend/plugins/merged-runtime.ts",
])
const CONSOLE_EXEMPT_DIRS = ["codegen-templates"]
const CONSOLE_PATTERN = /console\.(log|warn|error|info|debug)\s*\(/

// Port/hexagonal interface files only *declare* repository signatures (they even take tenantId
// as an input); they are type declarations, not implementations, so tenant scoping does not apply.
const TENANT_SCOPE_EXEMPT_DIRS = ["/ports/"]

function abs(rel) {
  return path.join(ROOT, ...rel.split("/"))
}

function toRel(full) {
  return path.relative(ROOT, full).replace(/\\/g, "/")
}

function walk(dirRel, predicate) {
  const root = abs(dirRel)
  if (!fs.existsSync(root)) return []
  const out = []
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue
        visit(full)
      } else if (predicate(entry.name)) {
        out.push(full)
      }
    }
  }
  visit(root)
  return out.sort()
}

function isTestFile(file) {
  return file.includes("__tests__") || /\.(test|spec)\./.test(file)
}

function isCodegenTemplate(file) {
  return CONSOLE_EXEMPT_DIRS.some((dir) => file.includes(`/${dir}/`))
}

const RULES = [
  {
    id: "src-top-level-layout",
    section: "AGENTS.md §3.2",
    mode: "enforce",
    description: "src/ only allows app/ at the top level (src/modules was a vestigial shim, deleted)",
    run() {
      // src/ 只应有 app —— 各域与 shared 已在 packages/ 下（AGENTS.md §3.2）。
      // 注意: @/modules/* 只是导入前缀, 指向 packages/, 与 src/modules 无关;
      // 这里仍然禁止 src/modules 被重建。
      const allowed = new Set(["app"])
      return fs
        .readdirSync(abs(SRC), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !allowed.has(entry.name))
        .map((entry) => ({ file: `${SRC}/${entry.name}`, detail: "unexpected top-level directory under src/" }))
    },
  },
  {
    id: "no-flat-domain-services",
    section: "AGENTS.md §3.2 / §14.3",
    mode: "enforce",
    description: "domain code must live in backend/services, never packages/domains/<domain>/services",
    run() {
      const modulesRoot = abs(`${DOMAINS}`)
      return fs
        .readdirSync(modulesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => fs.existsSync(path.join(modulesRoot, entry.name, "services")))
        .map((entry) => ({
          file: `${DOMAINS}/${entry.name}/services`,
          detail: "flat services/ directory; move to backend/services/",
        }))
    },
  },
  {
    id: "no-vacuous-test-assertions",
    section: "AGENTS.md §8 / RSK-007",
    mode: "enforce",
    description:
      "tests must not assert literal tautologies (expect(true).toBe(true) etc.) — 一条不可能失败的断言不是测试",
    run() {
      // 实测动机（RSK-007）：本仓出现过"断言看起来在跑、实际恒真"的假绿，
      // 例如 MCP「零落盘」用例因基线被前序用例污染而恒真、SQL 规则读不到文件而 return []。
      // 这条只拦**字面恒真**这一最明确、零误报的子集；更深的结构性空转要靠反向对照。
      const testFilePattern = /\.(test|spec)\.(ts|tsx|mjs|js)$/
      const files = [
        ...walk("test", (name) => testFilePattern.test(name)),
        ...walk(DOMAINS, (name) => testFilePattern.test(name)),
        ...walk(PLUGINS, (name) => testFilePattern.test(name)),
        ...walk(SHARED, (name) => testFilePattern.test(name)),
        ...walk(SRC, (name) => testFilePattern.test(name)),
        ...walk("scripts", (name) => testFilePattern.test(name)),
      ]
      const patterns = [
        /expect\(\s*(true|false|-?\d+|'[^']*'|"[^"]*")\s*\)\s*\.\s*(?:toBe|toEqual|toStrictEqual)\(\s*\1\s*\)/g,
        /expect\(\s*(?:true|1)\s*\)\s*\.\s*toBeTruthy\(\s*\)/g,
        /expect\(\s*(?:false|0|''|"")\s*\)\s*\.\s*toBeFalsy\(\s*\)/g,
      ]
      const violations = []
      for (const file of files) {
        const source = fs.readFileSync(file, "utf8")
        for (const pattern of patterns) {
          pattern.lastIndex = 0
          let match
          while ((match = pattern.exec(source)) !== null) {
            const line = source.slice(0, match.index).split("\n").length
            violations.push({
              file: toRel(file),
              detail: `literal tautology at line ${line}: ${match[0].replace(/\s+/g, " ").trim()}`,
            })
          }
        }
      }
      return violations
    },
  },
  {
    id: "frontend-api-url-shape",
    section: "AGENTS.md §3.3 / §14.4",
    mode: "enforce",
    description:
      "生成的 api 客户端更新/删除必须走 item 路径（/base/:id）；PUT 打集合路径、DELETE 用 ?id= 在路由里没有对应实现",
    run() {
      // 实证：340 个生成客户端写成 `request.put(BASE_URL, data)` 与
      // `request.delete(`${BASE_URL}?id=${id}`)`，而路由注册里 PUT/DELETE 有 **696 个是 item 级**
      // （`/[id]`）、collection 级只有 40 个且全是定制动作（如 `/profile`、`/channels`）。
      // 即：界面的"编辑保存"与"删除"打的是**没人处理的路径**（405）。
      // 修后本规则覆盖该类回归；实测全仓 0 命中（零误报）。
      const violations = []
      for (const file of walkDomains((name) => name.endsWith(".api.ts"))) {
        const rel = toRel(file)
        if (!rel.includes("/frontend/api/")) continue
        const lines = fs.readFileSync(file, "utf8").split("\n")
        lines.forEach((line, index) => {
          const putToCollection = /request\.put<\w+>\(\s*BASE_URL\s*,/.test(line)
          const deleteByQuery = /request\.delete<void>\(`\$\{BASE_URL\}\?id=/.test(line)
          if (putToCollection || deleteByQuery) {
            violations.push({
              file: rel,
              detail: `line ${index + 1}: ${putToCollection ? "PUT 打到集合路径" : "DELETE 用 ?id= 查询参数"
                } —— 路由里没有对应实现，应为 /base/:id：${line.trim().slice(0, 100)}`,
            })
          }
        })
      }
      return violations
    },
  },
  {
    id: "route-service-update-arity",
    section: "AGENTS.md §4.1 / §5.1",
    mode: "enforce",
    description:
      "route 层调用 Service.update 必须与该服务**真实签名**一致：签名是 (id, data/…) 时传单对象会让 id 收到对象、data 收到 undefined",
    run() {
      // 实证过的系统性缺陷：339 个服务声明 `update(id, data, …)`，而 348 处 route 调用写成
      // `Service.update({ ...body, id })` —— 实测会抛
      // `Cannot read properties of undefined (reading 'name')`，即**更新接口全部失效**。
      //
      // 判定必须**先看服务真实签名**，否则会误报：`SystemDeptService.update(input: UpdateInput)`
      // 是手写的定制服务、签名本就是单对象，那种调用是**对的**。
      // 于是只在该服务声明的 update 首参为 `id`（或可变参数桩 `...args`）时才判违规。
      const serviceSignatureByClass = (domainDir) => {
        const map = new Map()
        const servicesDir = path.join(domainDir, "backend", "services")
        let entries = []
        try {
          entries = fs.readdirSync(servicesDir, { withFileTypes: true })
        } catch {
          return map
        }
        for (const entry of entries) {
          if (!entry.isFile() || !entry.name.endsWith(".service.ts")) continue
          const text = fs.readFileSync(path.join(servicesDir, entry.name), "utf8")
          for (const match of text.matchAll(/class\s+(\w+Service)\b[\s\S]*?static\s+async\s+update\(([^)]*)\)/g)) {
            map.set(match[1], match[2].trim())
          }
        }
        return map
      }

      const cache = new Map()
      const violations = []
      for (const file of walkDomains((name) => name === "route.ts")) {
        const rel = toRel(file)
        if (!rel.includes("/routes/")) continue
        const domainDir = file.slice(0, file.indexOf("/routes/"))
        if (!cache.has(domainDir)) cache.set(domainDir, serviceSignatureByClass(domainDir))
        const signatures = cache.get(domainDir)

        const lines = fs.readFileSync(file, "utf8").split("\n")
        lines.forEach((line, index) => {
          const match = line.match(/(\w+Service)\.update\(\s*\{/)
          if (!match) return
          const signature = signatures.get(match[1])
          // 看不懂签名一律不报（宁可漏，不可误报 —— 误报会逼出无意义豁免）
          if (!signature) return
          const firstParam = signature.split(",")[0].trim()
          if (!/^(id\b|\.\.\.)/.test(firstParam)) return
          violations.push({
            file: rel,
            detail:
              `line ${index + 1}: ${match[1]}.update 的签名是 (${firstParam}, …)，`
              + `但调用传了单对象首参 —— 应为 (id, data)：${line.trim().slice(0, 100)}`,
          })
        })
      }
      return violations
    },
  },
  {
    id: "backend-no-console",
    section: "AGENTS.md §4.5",
    mode: "enforce",
    description: "backend business code must not use console.* (logger impls and codegen templates exempt)",
    run() {
      const files = walkDomains((name) => /\.tsx?$/.test(name)).filter(
        (file) =>
          toRel(file).includes("/backend/") &&
          !isTestFile(toRel(file)) &&
          !isCodegenTemplate(toRel(file)) &&
          !CONSOLE_EXEMPT.has(toRel(file)),
      )
      const violations = []
      for (const file of files) {
        const rel = toRel(file)
        const lines = fs.readFileSync(file, "utf8").split("\n")
        lines.forEach((line, index) => {
          if (CONSOLE_PATTERN.test(line)) {
            violations.push({ file: rel, detail: `console.* at line ${index + 1}` })
          }
        })
      }
      return violations
    },
  },
  {
    id: "repository-service-dual-export",
    section: "AGENTS.md §4.7",
    mode: "enforce",
    description: "object-singleton repositories and services must export both PascalCase and camelCase",
    run() {
      const files = walkDomains((name) => /\.(repository|service)\.ts$/.test(name)).filter(
        (file) => !isTestFile(toRel(file)),
      )

      const violations = []
      for (const file of files) {
        const rel = toRel(file)
        const source = fs.readFileSync(file, "utf8")
        const exported = new Set(
          [...source.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)/g)].map((match) => match[1]),
        )
        for (const name of exported) {
          // In scope: the object-singleton pattern from AGENTS.md §4.7
          //   export const AigwUsageRepository = { ... }
          //   export const aigwUsageRepository = AigwUsageRepository
          // Out of scope: SCREAMING_SNAKE_CASE constants (MEMORY_X / SEED_X) and classes,
          // which are single identifiers consumed consistently in PascalCase.
          if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || !/[a-z]/.test(name)) continue
          // `AigwEnterpriseRepositorySingleton = new AigwEnterpriseRepository()` is paired with
          // `aigwEnterpriseRepository` (named after the class, not the const), which still gives
          // consumers the camelCase entry point the rule exists to guarantee.
          const stem = name.replace(/(Singleton|Instance|Impl)$/, "")
          const camel = `${stem[0].toLowerCase()}${stem.slice(1)}`
          if (!exported.has(camel)) {
            violations.push({ file: rel, detail: `missing camelCase alias export for ${name}` })
          }
        }
      }
      return violations
    },
  },
  {
    id: "business-repository-tenant-scope",
    section: "AGENTS.md §4.8",
    mode: "report",
    description: "business-domain repositories should reference tenant scope (needs human judgement)",
    run() {
      // 业务域 = business ∪ plugin（域插件化后会移出 business 层）。
      // 只按 kind === "business" 筛会得到空集 —— 规则**空转**而门禁仍绿。
      const businessDomains = new Set(
        loadCatalog()
          .domains.filter((domain) => domain.kind === "business" || domain.kind === "plugin")
          .map((domain) => domain.name),
      )
      const files = walkDomains((name) => /\.repository\.ts$/.test(name)).filter(
        (file) => !isTestFile(toRel(file)) && !TENANT_SCOPE_EXEMPT_DIRS.some((dir) => toRel(file).includes(dir)),
      )
      const violations = []
      for (const file of files) {
        const rel = toRel(file)
        // 两种布局: packages/domains/<domain>/… 与 packages/plugins/plugin-<domain>/…
        // 写死 rel.split("/")[2] 对插件路径会取到 "plugins"，于是整条规则静默失效。
        const parts = rel.split("/")
        const domain = parts[1] === "plugins" ? parts[2].replace(/^plugin-/, "") : parts[2]
        if (!businessDomains.has(domain)) continue
        const source = fs.readFileSync(file, "utf8")
        // Accepts both context-based (getCurrentTenantId) and explicit tenantId parameters;
        // the explicit form is the deprecated long-term pattern, reported separately by reviewers.
        if (/tenant/i.test(source)) continue
        violations.push({ file: rel, detail: "no tenant reference found at all" })
      }
      return violations
    },
  },
  {
    id: "domain-governance-coverage",
    section: "AGENTS.md §6",
    mode: "enforce",
    description:
      "every domain in domain-catalog.json must have a governance row (stage / Skill binding / TestRefs / SplitNote)",
    run() {
      // 为什么需要这条: 历史上一条独立的 governance npm script 在 standalone 项目里是空转
      // ([SKIP] script omitted), 于是"新注册一个域但漏登记治理"没有任何门禁拦得住 ——
      // aigw 就这么漂了很久。入口已删, 但治理覆盖这条规则必须内化进 standards:check。
      // 文档名**跟着工程名改过**（孵化会重命名整个仓库的标识），写死会让衍生工程里
      // 这条规则永远报"文档缺失"。动态找: docs/architecture/*-domain-governance.md
      const archDir = abs("docs/architecture")
      const candidates = fs.existsSync(archDir)
        ? fs.readdirSync(archDir).filter((f) => f.endsWith("-domain-governance.md")).sort()
        : []
      const docRel = candidates.length > 0 ? `docs/architecture/${candidates[0]}` : `${GOVERNANCE_DOC}`
      const doc = abs(docRel)
      if (!fs.existsSync(doc)) return [{ file: docRel, detail: "governance doc is missing" }]

      const names = new Set(loadCatalog().domains.map((domain) => domain.name))
      const covered = new Set()
      for (const line of fs.readFileSync(doc, "utf8").split(/\r?\n/)) {
        if (!line.startsWith("|")) continue
        const first = line.slice(1).split("|")[0].trim()
        if (names.has(first)) covered.add(first)
      }
      return [...names]
        .filter((name) => !covered.has(name))
        .sort()
        .map((name) => ({
          file: docRel,
          detail: `domain "${name}" is registered in domain-catalog.json but has no governance row`,
        }))
    },
  },
  {
    id: "facade-method-dispatch-mapped",
    section: "AGENTS.md §3.3",
    mode: "ratchet",
    description:
      "every method a domain facade declares must be dispatchable (mapped in rpc-actions.json, or built-in ping)",
    run() {
      // 声明了 facade 方法却没有派发映射 = 调用时抛 "Method X not found in Y service"。
      // 只声明不兑现的 facade 会让"域可拆分"变成纸面结论, 所以必须机器可见。
      const catalogRel = "packages/shared/backend/constants/rpc-actions.json"
      const rpcActions = JSON.parse(fs.readFileSync(abs(catalogRel), "utf8"))
      const violations = []
      const modulesRoot = abs(`${DOMAINS}`)

      for (const domain of fs.readdirSync(modulesRoot, { withFileTypes: true })) {
        if (!domain.isDirectory()) continue
        const contractDir = path.join(modulesRoot, domain.name, "contract")
        if (!fs.existsSync(contractDir)) continue

        const mapped = new Set(
          (rpcActions.domains?.[domain.name]?.actions ?? [])
            .filter((action) => action.service || action.target)
            .map((action) => action.method),
        )

        for (const entry of fs.readdirSync(contractDir)) {
          if (!/\.facade\.ts$/.test(entry)) continue
          const file = path.join(contractDir, entry)
          const source = fs.readFileSync(file, "utf8")
          const declaration = source.match(/FACADE_METHODS\s*=\s*\[([^\]]*)\]\s*as const/)
          if (!declaration) continue

          for (const [, method] of declaration[1].matchAll(/"([^"]+)"/g)) {
            if (method === "ping") continue // 内建方法, 无需映射
            if (mapped.has(method)) continue
            violations.push({
              file: toRel(file),
              detail: `facade method "${domain.name}.${method}" has no service/target mapping in rpc-actions.json`,
            })
          }

          // 光有映射还不够: 映射指向的 service/target 必须真的存在, 否则调用时
          // 一样抛 "Method X not found in Y service"。这一层才拦住"声明+映射都齐、
          // 但目标写错/改名"的情形。
          for (const action of rpcActions.domains?.[domain.name]?.actions ?? []) {
            if (!action.service) continue
            if (declaration[1] && !declaration[1].includes(`"${action.method}"`)) continue
            const moduleRel = action.module
              ? `${DOMAINS}/${domain.name}/backend/services/${action.module}.ts`
              : `${DOMAINS}/${domain.name}/backend/services/index.ts`
            const moduleFile = abs(moduleRel)
            const orIndex = abs(`${DOMAINS}/${domain.name}/backend/services/index.ts`)
            const candidate = fs.existsSync(moduleFile) ? moduleFile : orIndex
            if (!fs.existsSync(candidate)) {
              violations.push({ file: toRel(file), detail: `"${domain.name}.${action.method}" 的 module 文件不存在: ${moduleRel}` })
              continue
            }
            const source = fs.readFileSync(candidate, "utf8")
            const target = action.target ?? action.method
            const declared = new RegExp(`export (const|class) ${action.service}\\b`).test(source)
            const hasMethod = new RegExp(`\\b${target}\\s*\\(`).test(source)
            if (!declared || !hasMethod) {
              violations.push({
                file: toRel(file),
                detail: `"${domain.name}.${action.method}" -> ${action.service}.${target} 在 ${toRel(candidate)} 中${declared ? "缺少该方法" : "不存在该 service 导出"}`,
              })
            }
          }
        }
      }
      return violations.sort((a, b) => a.file.localeCompare(b.file) || a.detail.localeCompare(b.detail))
    },
  },
  {
    id: "no-new-npx",
    section: "AGENTS.md §2.1",
    mode: "enforce",
    description:
      "docs/scripts must not introduce new `npx` — at runtime it can download-and-install a missing package, silently bypassing pnpm-lock.yaml",
    run() {
      // 为什么需要：`npx <pkg>` 在包缺失时会**隐式安装** —— 等于绕过 `pnpm-lock.yaml`，
      // 而这正是"锁文件真源"要防的事。仓内已有大量历史写法（skills/rules/docs），
      // 逐个改风险大、收益低，故**棘轮冻结存量、只拦新增**。
      // 对应替代：`pnpm exec <tool>`（已安装执行器）/ `pnpm dlx <pkg>`（一次性下载执行）。
      const violations = []
      const skipPrefixes = [
        "node_modules/",
        ".git/",
        "docs/features/",
        "docs/architecture/artifacts/",
        ".claude/worktrees/", // git worktree 里的副本，不参与判定
        ".kiro/steering/ui-ux-pro-max/data/", // 第三方技能数据（Astro/shadcn/Nuxt 的生态建议），改它等于改上游
        "docs/specs/archive/", // 已归档规格是**历史记录**，会刻意引用旧代码与旧命令
        "package-lock.json",
      ]
      // 三种**可执行**形态都要抓：
      //   `npx prisma …`（文档/脚本里的命令行）
      //   `sh("npx", ["prisma", …])` / `spawnSync("npx", …)`（作为参数传给子进程）
      //   `npx.cmd`（Windows 分支）
      // 只抓 `npx + 工具名` 会漏掉后两种 —— 实测两次"假清零"都是这么来的。
      const pattern = /\bnpx\s+[a-z@]|["']npx(?:\.cmd)?["']|\bnpx\.cmd\b/i
      const walk = (dir) => {
        for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
          const rel = dir ? `${dir}/${entry.name}` : entry.name
          if (skipPrefixes.some((prefix) => rel.startsWith(prefix))) continue
          if (entry.isDirectory()) {
            walk(rel)
            continue
          }
          if (!/\.(md|sh|ts|cjs|json|js|txt)$/.test(entry.name) && !/^Dockerfile/.test(entry.name)) continue
          if (rel === "scripts/check-engineering-standards.cjs") continue // 规则自身必须提到 npx
          const lines = fs.readFileSync(path.join(ROOT, rel), "utf8").split("\n")
          for (let i = 0; i < lines.length; i += 1) {
            if (pattern.test(lines[i])) violations.push({ file: rel, detail: `line ${i + 1}` })
          }
        }
      }
      for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
        if (entry.name.startsWith(".")) continue // 根目录的隐藏项统一跳过（.git/.agents 等由别处守）
        if (entry.isDirectory()) walk(entry.name)
        else if (/\.(md|sh|ts|cjs)$/.test(entry.name)) {
          const lines = fs.readFileSync(path.join(ROOT, entry.name), "utf8").split("\n")
          for (let i = 0; i < lines.length; i += 1) {
            if (pattern.test(lines[i])) violations.push({ file: entry.name, detail: `line ${i + 1}` })
          }
        }
      }
      // .agents/ 也要扫（skills/rules 里大量命令行示例）
      if (fs.existsSync(path.join(ROOT, ".agents"))) walk(".agents")

      // **package.json 的 scripts 也必须扫** —— 之前只扫文件内容，漏掉了 36 条脚本里的 npx，
      // 于是"清零"是假的（本仓最怕的假绿）。scripts 是**运行时真调用**，比注释更严重。
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
      for (const [name, command] of Object.entries(pkg.scripts || {})) {
        if (pattern.test(String(command))) violations.push({ file: "package.json", detail: `scripts.${name}` })
      }
      return violations.sort((a, b) => a.file.localeCompare(b.file) || a.detail.localeCompare(b.detail))
    },
  },
  {
    id: "no-new-npm-run",
    section: "AGENTS.md §2.1",
    mode: "ratchet",
    description:
      "docs/scripts must not introduce new `npm run <script>` — the canonical form is `pnpm run <script>`",
    run() {
      // 为什么需要：本仓的包管理器是 **pnpm**，`check-docs-commands.cjs:93` 的命令真实性
      // 检查器用的是 `(?<![pP])npm run` —— **显式把 `pnpm run` 排除在外**，规范形态即 pnpm。
      // 混用会让「文档里写的」与「实际该敲的」长期分叉（实测存量：AGENTS.md 104 处 / 全仓 2841 处）。
      //
      // 存量太大（689 文件），逐个改风险高、且大量属**历史记录**（施工日志/归档规格/构建产物/生成镜像），
      // 故按本仓既有做法：**棘轮冻结存量、只拦新增**（同 `no-new-npx`）。
      // 注意：`npm run` 与 `pnpm run` 在 pnpm 布局下**都能跑通** —— 这条拦的是**规范一致性**，
      // 不是"会失败"，所以用 ratchet 而不是 enforce。
      const violations = []
      const skipPrefixes = [
        "node_modules/",
        ".git/",
        // **构建产物一律跳过**：它们是 .gitignore 排除的、随构建变化的内容。
        // 扫它们不只是噪音 —— `dist/release-assets/*` 每次发版重建，计数会漂，
        // 于是"新增欠债"忽真忽假（实测基线里混进了 3 个 dist 文件）。
        "dist/",
        "gen/",
        "coverage/",
        "build/",
        "docs/features/", // 施工日志：历史记录，刻意保留当时的写法
        "docs/architecture/artifacts/", // 生成物
        "docs/specs/archive/", // 已归档规格是历史记录
        ".claude/worktrees/", // git worktree 里的副本，不参与判定
        "public/", // 由 surface:sync 生成的镜像，改它无意义
        ".well-known/",
      ]
      // 只认"可执行指引"形态：`npm run <script>`。裸提 `npm`（如"包管理器统一为 pnpm"）不算。
      // 两种形态都要抓（`no-new-npx` 的教训：只抓文本形态会漏掉"作为参数传给子进程"）：
      //   `npm run <script>`            —— 文档/脚本里的命令行
      //   `spawnSync("npm", ["run", …)` —— 数组形态（实测：`gate_run` 就这么写的，此前漏检）
      const pattern = /(?<![pP])npm\s+run\s|["']npm(?:\.cmd)?["']\s*,\s*\[\s*["']run["']/
      const walk = (dir) => {
        for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
          const rel = dir ? `${dir}/${entry.name}` : entry.name
          if (skipPrefixes.some((prefix) => rel.startsWith(prefix))) continue
          if (entry.isDirectory()) {
            walk(rel)
            continue
          }
          if (!/\.(md|sh|ts|tsx|cjs|mjs|js|json|txt|bat|yml|yaml)$/.test(entry.name)) continue
          if (rel === "scripts/check-engineering-standards.cjs") continue // 规则自身必须提到该模式
          const lines = fs.readFileSync(path.join(ROOT, rel), "utf8").split("\n")
          for (let i = 0; i < lines.length; i += 1) {
            if (pattern.test(lines[i])) violations.push({ file: rel, detail: `line ${i + 1}` })
          }
        }
      }
      for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
        if (entry.name.startsWith(".")) continue // 隐藏项（.git/.claude/.next-* 等）统一跳过
        if (entry.isDirectory()) walk(entry.name)
        else if (/\.(md|sh|ts|cjs|bat|yml|yaml)$/.test(entry.name)) {
          const lines = fs.readFileSync(path.join(ROOT, entry.name), "utf8").split("\n")
          for (let i = 0; i < lines.length; i += 1) {
            if (pattern.test(lines[i])) violations.push({ file: entry.name, detail: `line ${i + 1}` })
          }
        }
      }
      if (fs.existsSync(path.join(ROOT, ".agents"))) walk(".agents")
      // **`.github` 必须显式走**：根目录循环会跳过所有隐藏项（`entry.name.startsWith(".")`），
      // 于是 CI 工作流**整块不在扫描面** —— 而它恰恰是最该统一用 pnpm 的地方。
      // （这条规则的第一版就漏了这个洞：扩展名没含 yml，且 .github 被隐藏项规则跳过。）
      if (fs.existsSync(path.join(ROOT, ".github"))) walk(".github")

      // `package.json` 的 scripts 是**运行时真调用**，比注释更严重 —— 同 `no-new-npx` 的教训。
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
      for (const [name, command] of Object.entries(pkg.scripts || {})) {
        if (pattern.test(String(command))) violations.push({ file: "package.json", detail: `scripts.${name}` })
      }
      return violations.sort((a, b) => a.file.localeCompare(b.file) || a.detail.localeCompare(b.detail))
    },
  },
  {
    id: "no-machine-absolute-paths",
    section: "AGENTS.md §17 / 交付边界",
    mode: "enforce",
    description:
      "packages/ 与 src/ 里不得出现「机器私有的绝对路径」——它们会随每个孵化产物下发到客户服务器",
    run() {
      // 实测动机（2026-10-26）：`agent-profile.json` 里有
      //   "runtimePath": "D:/workspace/cw/ai/DigitalStaff"
      // 这是**交付机器**上的 Windows 路径，而该文件随产物走 —— 客户工程里会躺着一个 D: 盘路径。
      // 运行时位置应当**运行期发现**（如 install-hermes-hook.cjs 找 ~/.hermes），而不是写死在模板里。
      //
      // 只认「被引号包住的绝对路径」，避免 `REJECTED: []` 这类误报。
      const violations = []
      const ABS = /["'](?:[A-Za-z]:[\\/]|\/Users\/|\/home\/)[^"'\n]*["']/g
      const scan = (dir) => {
        if (!fs.existsSync(dir)) return
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name === "node_modules" || entry.name.startsWith(".") || entry.name === "__tests__") continue
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) { scan(full); continue }
          if (!/\.(ts|tsx|json)$/.test(entry.name)) continue
          const src = fs.readFileSync(full, "utf8")
          ABS.lastIndex = 0
          let m
          while ((m = ABS.exec(src)) !== null) {
            // 注释里的示例不算（只拦真的字符串字面量）
            const line = src.slice(0, m.index).split("\n").length
            const lineText = src.split("\n")[line - 1] || ""
            if (/^\s*(\/\/|\*|#)/.test(lineText)) continue
            violations.push({ file: toRel(full), detail: `机器私有绝对路径会随产物下发: ${m[0]} (line ${line})` })
          }
        }
      }
      scan(DOMAINS); scan(PLUGINS); scan(SHARED); scan(SRC)
      return violations
    },
  },
  {
    id: "no-pnpm-overrides-in-package-json",
    section: "AGENTS.md §2.1",
    mode: "enforce",
    description:
      "pnpm 12 起不再读取 package.json 的 pnpm.overrides —— 写在那里会被**静默忽略**（只打一行 WARN），必须写在 pnpm-workspace.yaml",
    run() {
      // 实测动机（2026-10-24）：一条 high 级漏洞的 override 写了两次都"不生效"，
      // 我据此判断"上游把版本钉死了"—— **错**。真因是 pnpm 12 把 overrides 搬到了
      // `pnpm-workspace.yaml`，而 package.json 里那份被**静默忽略**（只有一行 WARN）。
      // 这类"配置写了但没生效"的坑，靠人读 WARN 不可靠 —— 必须机检。
      const violations = []
      for (const rel of ["package.json"]) {
        const abs = path.join(ROOT, rel)
        if (!fs.existsSync(abs)) continue
        let pkg
        try {
          pkg = JSON.parse(fs.readFileSync(abs, "utf8"))
        } catch {
          continue // 由 JSON 合法性另有门禁负责
        }
        if (pkg.pnpm && Object.prototype.hasOwnProperty.call(pkg.pnpm, "overrides")) {
          violations.push({
            file: rel,
            detail:
              `pnpm.overrides 写在 ${rel} 里 —— pnpm 12 起**不再读取**它（只打 WARN 就忽略）。` +
              `请移到 pnpm-workspace.yaml 的顶层 overrides: 下`,
          })
        }
      }
      return violations
    },
  },
  {
    id: "no-duplicate-json-keys",
    section: "AGENTS.md §2.1",
    mode: "enforce",
    description:
      "JSON config files must not contain duplicate object keys — JSON.parse keeps the LAST one, so the earlier definition is silently dead",
    run() {
      // 为什么需要：`JSON.parse` **不报错**，重复键静默取最后一个 ——
      // 于是前面那份定义成了死代码，而 npm / 所有门禁都看不出来。
      //
      // 实测（2026-10-20）：`package.json` 里 `test:all` 出现两次
      //   L51 `bash scripts/lifecycle.sh . test`      ← 某提交声明"新增 test:all"
      //   L62 `vitest run test/unit test/integration && playwright test`
      // 后者胜出 → 那次"新增"**从未生效**。而 `npm run test:all` 看起来一切正常。
      const targets = ["package.json", "compat-manifest.json"]
      for (const dir of ["packages", "clients"]) {
        if (!fs.existsSync(path.join(ROOT, dir))) continue
        const walk = (rel) => {
          for (const entry of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })) {
            if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
            const next = `${rel}/${entry.name}`
            if (entry.isDirectory()) walk(next)
            else if (entry.name === "package.json") targets.push(next)
          }
        }
        walk(dir)
      }
      const violations = []
      for (const rel of targets) {
        const abs = path.join(ROOT, rel)
        if (!fs.existsSync(abs)) continue
        let dups
        try {
          dups = findDuplicateKeys(fs.readFileSync(abs, "utf8"))
        } catch (error) {
          violations.push({ file: rel, detail: `JSON 无法解析: ${String(error?.message ?? error)}` })
          continue
        }
        for (const d of dups) violations.push({ file: rel, detail: "k " + d.key + " @L" + d.line + " (首次 @L" + d.firstLine + ")" })
      }
      return violations.sort((a, b) => a.file.localeCompare(b.file) || a.detail.localeCompare(b.detail))
    },
  },
  {
    id: "launcher-gateway-port-consistency",
    section: "AGENTS.md §2.1",
    mode: "enforce",
    description:
      "the launcher, the gateway snippet and package.json must agree on the service port — otherwise the gateway proxies to a dead port",
    run() {
      // 为什么需要：`scripts/run-all.cjs` 的端口回退曾回落到 `3000 + portOffset`
      // （yudao 血统的多项目隔离端口），而 `deploy/caddy/*.caddy` 的 reverse_proxy 指向 3200
      // → **部署后网关指到空端口**（实测）。
      //
      // 更值得记的是：这条判据我先写进了规格的 acceptance，**却没做成机检** ——
      // 结果一小时内就被一次并发提交覆盖回旧值，而 `check` 依然是绿的。
      // **写了判据不机检，等于没写**（本仓反复栽的同一课）。
      const violations = []
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
      const devPort = Number(String(pkg.scripts?.dev || "").match(/-p\s+(\d+)/)?.[1] ?? 0)
      if (!devPort) return [{ file: "package.json", detail: "dev 脚本里找不到 `-p <port>`，无法比对" }]

      const caddyDir = path.join(ROOT, "deploy", "caddy")
      const snippets = fs.existsSync(caddyDir)
        ? fs.readdirSync(caddyDir).filter((n) => n.endsWith(".caddy"))
        : []
      if (snippets.length === 0) return []
      const snippetPorts = new Set()
      for (const name of snippets) {
        const text = fs.readFileSync(path.join(caddyDir, name), "utf8")
        for (const m of text.matchAll(/reverse_proxy\s+127\.0\.0\.1:(\d+)/g)) snippetPorts.add(Number(m[1]))
      }
      for (const port of snippetPorts) {
        if (port !== devPort) {
          violations.push({ file: "deploy/caddy", detail: `网关指向 ${port}，而 package.json 的 dev 是 ${devPort}` })
        }
      }

      // 端到端：拉起器**实际解析出**的端口（--check 既只读又足够快）
      try {
        const out = spawnSync("node", ["scripts/run-all.cjs", "--check"], { cwd: ROOT, encoding: "utf8", timeout: 20000 })
        // **只认配置值那一行**（`端口: 后端 X / 前端 Y`）。
        // 早先我对整段输出抓 `/端口\s+(\d+)/` —— 而 `--check` 还会**探测端口占用**
        // 并打印"实际端口"，占用情况一变结果就变 → 门禁**不稳定**（实测偶发 FAIL）。
        const configured = String(out.stdout ?? "").match(/端口:\s*后端\s*(\d+)\s*\/\s*前端\s*(\d+)/)
        const resolved = configured ? [Number(configured[1]), Number(configured[2])] : []
        for (const port of resolved) {
          if (port !== devPort) {
            violations.push({ file: "scripts/run-all.cjs", detail: `解析出端口 ${port}，与 dev 的 ${devPort} / 网关的 ${[...snippetPorts].join("/")} 不一致` })
          }
        }
      } catch (error) {
        violations.push({ file: "scripts/run-all.cjs", detail: `无法运行 --check: ${String(error?.message ?? error).split("\n")[0]}` })
      }
      return violations.sort((a, b) => a.file.localeCompare(b.file) || a.detail.localeCompare(b.detail))
    },
  },
  {
    id: "init-sql-seed-columns",
    section: "AGENTS.md §9.2",
    mode: "ratchet",
    description:
      "the generated V1 init SQL must be self-consistent: seed INSERTs must use existing columns AND not reference parent rows that do not exist yet",
    run() {
      // 为什么需要这条: sql/init/*.sql 是 AGENTS.md §9.2 认定的"唯一官方标准初始化入口",
      // 但它的**建表部分是每次 build:init-sql 重新生成的**, 而**种子 INSERT 是手写的** ——
      // schema 演进后没人跑过它, 于是整份 SQL 在全新库上必然中途失败。
      //
      // 两类实际抓到过的缺陷:
      //   1) 列漂移: INSERT 用了已不存在的列 (column "contact_user_name" does not exist)
      //   2) 缺父行: INSERT 引用了不存在/尚未插入的父行 (FK 违反)
      //      —— 实测抓到 aigw-seats 菜单未登记、3 个字典类型从未定义。
      // 第 2 类必须**按语句顺序**判定: 引用后面才插入的行同样会在真实执行时失败。
      const sqlRel = "sql/init/cooliebase_all_next_v1.0.0_postgresql.sql"
      const sqlFile = abs(sqlRel)
      if (!fs.existsSync(sqlFile)) return []

      const sql = fs.readFileSync(sqlFile, "utf8")
      const tables = new Map()
      // 外键必须**按所属表**解析：只在 CREATE TABLE 块内收集。
      // (第一版按列名全局匹配 -> 300 条误报: A 表里同名的普通列会被拿去和 B 表的外键比对。)
      const foreignKeysByTable = new Map()
      for (const match of sql.matchAll(/CREATE TABLE (?:"public"\.)?"([^"]+)" \(([\s\S]*?)\n\);/g)) {
        const [, tableName, body] = match
        tables.set(tableName, new Set([...body.matchAll(/^\s*"([a-z_]+)"\s/gm)].map((m) => m[1])))
        const fks = []
        for (const fk of body.matchAll(/FOREIGN KEY \("([a-z_]+)"\) REFERENCES (?:"public"\.)?"([^"]+)"\(/g)) {
          fks.push({ column: fk[1], references: fk[2] })
        }
        if (fks.length > 0) foreignKeysByTable.set(tableName, fks)
      }

      const violations = []
      // 每张表已插入的 id（按出现顺序累积）+ 该表所有 INSERT 引用过的外键值
      const insertedIds = new Map()
      const dangling = []

      // 按语句顺序扫描：INSERT 语句与 CREATE/FOREIGN KEY 都在同一份文件里
      for (const match of sql.matchAll(/INSERT INTO (?:"public"\.)?"([^"]+)" \(([^)]*)\) VALUES\n([\s\S]*?);\n/g)) {
        const [, table, columnList, values] = match
        const columns = columnList.split(",").map((c) => c.trim().replace(/"/g, ""))
        // 生成器每条记录写一行 —— 按行切分才不会被行内的 NOW() 等函数调用括号截断。
        const rows = values
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("("))
          .map((line) => line.replace(/^\(/, "").replace(/\),?$/, ""))

        if (!tables.has(table)) {
          violations.push({ file: sqlRel, detail: `INSERT into unknown table "${table}"` })
          continue
        }
        const missing = columns.filter((c) => c && !tables.get(table).has(c))
        if (missing.length > 0) {
          violations.push({ file: sqlRel, detail: `INSERT into "${table}" uses missing column(s): ${missing.join(", ")}` })
        }

        const idIndex = columns.indexOf("id")
        const seen = insertedIds.get(table) ?? new Set()
        for (const row of rows) {
          const cells = row.match(/'(?:[^']|'')*'|NULL|TRUE|FALSE|[^,]+/g) ?? []
          // 先校验外键：父行必须**已经**插入过
          for (const fk of foreignKeysByTable.get(table) ?? []) {
            if (!columns.includes(fk.column)) continue
            const index = columns.indexOf(fk.column)
            const raw = (cells[index] ?? "").trim()
            const value = raw.startsWith("'") ? raw.slice(1, -1).replace(/''/g, "'") : raw
            if (!value || value === "NULL") continue
            const parents = insertedIds.get(fk.references)
            if (parents && !parents.has(value)) {
              dangling.push(`INSERT into "${table}" references ${fk.references}.${fk.column}="${value}" which is not inserted yet`)
            }
          }
          if (idIndex >= 0) {
            const raw = (cells[idIndex] ?? "").trim()
            const value = raw.startsWith("'") ? raw.slice(1, -1) : raw
            if (value) seen.add(value)
          }
        }
        insertedIds.set(table, seen)
      }

      for (const detail of [...new Set(dangling)].sort()) violations.push({ file: sqlRel, detail })
      return violations.sort((a, b) => a.detail.localeCompare(b.detail))
    },
  },
  {
    id: "table-definition-coverage",
    section: "AGENTS.md §9.4",
    mode: "enforce",
    description:
      "every table a repository queries must be created somewhere (low-code metadata / prisma migrations / sqlite bootstrap)",
    run() {
      // 表定义真源 = 低代码元数据（AGENTS §9.4）；migrations 与 sqlite bootstrap 是它的落地产物。
      // 这里拦的是**最危险的一类**：仓储在查、却没有任何地方创建 —— 内存回退下全绿，
      // 一配真实库必然 `relation "..." does not exist`，看起来却像自己改坏了代码。
      const {
        readMetadataTables,
        readMigrationTables,
        readSqliteBootstrapTables,
        readPrismaTables,
        readQueriedTables,
      } = require("./lib/table-definitions.cjs")

      // 已知欠债: 这些表没有**任何**定义来源（连元数据也没有）。
      // 补 DDL 等于凭空造 schema，比留红更危险 —— 所以显式列出、等元数据补齐后从这里删掉。
      // 每张都要能被 `node scripts/report-table-inventory.cjs` 复现。
      // 已补齐并出列的: system_partner（元数据见 scripts/data/system-tables.ts）。
      // 现在是空的: 此前 7 张（aigw_* / system_partner）已按 AGENTS §9.5 补齐元数据，
      // 其中 4 张随 aigw 定制业务剥离、仓储一并删除（AGENTS §17.3），已不再被查询。
      // **不要留陈旧名单** —— 留着的名字会掩盖"同一张表将来又被重新引入"。
      const KNOWN_DEBT = new Set([])

      const created = new Set([
        ...readMetadataTables(),
        ...readMigrationTables(),
        ...readSqliteBootstrapTables(),
        ...readPrismaTables(),
      ])
      return [...readQueriedTables()]
        .filter((table) => !created.has(table) && !KNOWN_DEBT.has(table))
        .sort()
        .map((table) => ({
          file: table,
          detail:
            "被仓储查询，但低代码元数据/migrations/sqlite bootstrap 都没有创建它；"
            + "补元数据后用 scripts/generate-table-migration.ts 生成建表迁移",
        }))
    },
  },
  {
    id: "base-native-domain-boundary",
    section: "AGENTS.md §2 / §17",
    mode: "enforce",
    description: "the base repo only builds CoolieBase native domains; custom/vertical business must live in a derived business project",
    run() {
      // 基座（本仓）= CoolieBase 原生能力。**定制业务不得放进基座** ——
      // 它属于由基座衍生出的业务工程（例如同源的 rome-all 那一脉），
      // 否则每次业务改动都要回改基座，基座也就不再是"可复用的底座"。
      // AGENTS §2 早就写了"不接收非原生扩展域"，但一直只靠人记 —— 这里把它变成机检。
      const NATIVE_DOMAINS = new Set([
        "system", "infra", "online", "bpm", "pay", "report", "mp", "mall",
        "member", "crm", "erp", "wms", "mes", "ai", "iot", "im",
      ])
      // 已知越界: 已经在基座里、但属定制业务的域。列出而不直接判死 ——
      // 剥离它们是一次产品级搬迁（要连表、路由、页面一起挪到业务工程），
      // 不是重命名；补齐后从这里删掉。
      const KNOWN_CUSTOM = new Set(["aigw"])

      // 这条规矩是给**基座自己**守的。由基座衍生的业务工程里，加定制域正是目的 ——
      // 判据: hatch-manifest.json 存在 ⇒ 这是孵化出来的工程，不是基座。
      if (fs.existsSync(abs("packages/shared/contract/hatch-manifest.json"))) return []

      const { loadCatalog } = require("./lib/domain-catalog.cjs")
      const catalog = loadCatalog()
      return (catalog.domains || [])
        .filter((domain) => !NATIVE_DOMAINS.has(domain.name) && !KNOWN_CUSTOM.has(domain.name))
        .map((domain) => ({
          file: domain.name,
          detail:
            "不在 AGENTS §2 的 CoolieBase 原生域清单内 —— 定制业务应放在由基座衍生的业务工程，"
            + "而不是基座本身；确属原生能力则把它加进 AGENTS §2 与 NATIVE_DOMAINS",
        }))
    },
  },
]

function countByFile(violations) {
  const counts = {}
  for (const violation of violations) {
    counts[violation.file] = (counts[violation.file] || 0) + 1
  }
  return counts
}

function loadBaseline() {
  const full = abs(BASELINE_REL)
  if (!fs.existsSync(full)) return { version: 1, kind: "engineering-standards-baseline", rules: {} }
  return JSON.parse(fs.readFileSync(full, "utf8"))
}

const results = RULES.map((rule) => ({ rule, violations: rule.run() }))

if (writeBaseline) {
  const rules = {}
  for (const { rule, violations } of results) {
    if (rule.mode !== "ratchet") continue
    rules[rule.id] = { accepted: countByFile(violations) }
  }
  const baseline = {
    version: 1,
    kind: "engineering-standards-baseline",
    note: "Frozen engineering-standards debt. Ratchet rules fail on NEW debt only. Regenerate with `pnpm run standards:baseline` and review the delta.",
    rules,
  }
  const full = abs(BASELINE_REL)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, `${JSON.stringify(baseline, null, 2)}\n`)
  console.log(`[standards] wrote ${BASELINE_REL}`)
  for (const { rule, violations } of results) {
    if (rule.mode === "ratchet") {
      console.log(`  - ${rule.id}: froze ${violations.length} accepted violation(s) across ${Object.keys(countByFile(violations)).length} file(s)`)
    }
  }
  process.exit(0)
}

const baseline = loadBaseline()
const failures = []
const report = []

for (const { rule, violations } of results) {
  const entry = {
    id: rule.id,
    section: rule.section,
    mode: rule.mode,
    description: rule.description,
    violations: violations.length,
  }

  if (rule.mode === "enforce") {
    report.push({ ...entry, status: violations.length === 0 ? "pass" : "fail" })
    if (violations.length > 0) failures.push({ rule, violations })
    continue
  }

  if (rule.mode === "report") {
    report.push({ ...entry, status: "report" })
    continue
  }

  const accepted = baseline.rules?.[rule.id]?.accepted || {}
  const current = countByFile(violations)
  const newDebt = []
  for (const [file, count] of Object.entries(current)) {
    const allowed = accepted[file] || 0
    if (count > allowed) newDebt.push({ file, count, allowed })
  }

  report.push({
    ...entry,
    status: newDebt.length === 0 ? "pass" : "fail",
    acceptedFiles: Object.keys(accepted).length,
    newDebt: newDebt.length,
  })
  if (newDebt.length > 0) failures.push({ rule, violations, newDebt })
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        kind: "engineering-standards-report",
        baseline: BASELINE_REL,
        passed: failures.length === 0,
        rules: report,
        reportOnly: results
          .filter(({ rule }) => rule.mode === "report")
          .flatMap(({ rule, violations }) => violations.map((v) => ({ rule: rule.id, ...v }))),
      },
      null,
      2,
    ),
  )
  process.exit(failures.length === 0 ? 0 : 1)
}

console.log(`[standards] engineering standards from AGENTS.md`)

for (const entry of report) {
  const marker = entry.status === "pass" ? "PASS" : entry.status === "report" ? "INFO" : "FAIL"
  console.log(
    `  ${marker}  ${entry.id} (${entry.mode}) — ${entry.section}: ${entry.description}` +
      (entry.mode === "ratchet" ? ` [accepted files: ${entry.acceptedFiles ?? 0}, new debt: ${entry.newDebt ?? 0}]` : ""),
  )
}

const reported = results.filter(({ rule }) => rule.mode === "report")
for (const { rule, violations } of reported) {
  if (violations.length === 0) continue
  console.log(`  INFO  ${rule.id}: ${violations.length} item(s) need human judgement, e.g.`)
  for (const violation of violations.slice(0, 5)) console.log(`          ${violation.file} — ${violation.detail}`)
  if (violations.length > 5) console.log(`          … +${violations.length - 5} more`)
}

if (auditOnly) {
  console.log(`[standards] audit complete (${results.reduce((total, r) => total + r.violations.length, 0)} total findings)`)
  process.exit(0)
}

if (failures.length > 0) {
  console.error(`[standards] FAIL`)
  for (const { rule, violations, newDebt } of failures) {
    console.error(`  ${rule.id} (${rule.section}):`)
    if (rule.mode === "enforce") {
      for (const violation of violations.slice(0, 20)) {
        console.error(`    - ${violation.file} — ${violation.detail}`)
      }
      if (violations.length > 20) console.error(`    … +${violations.length - 20} more`)
    } else {
      for (const debt of newDebt) {
        console.error(`    - ${debt.file}: ${debt.count} violation(s), baseline accepts ${debt.allowed}`)
      }
      console.error(`    fix the new debt, or re-baseline with "pnpm run standards:baseline" and review the delta`)
    }
  }
  process.exit(1)
}

console.log(`[standards] PASS: ${report.length} rules enforced/reported`)
