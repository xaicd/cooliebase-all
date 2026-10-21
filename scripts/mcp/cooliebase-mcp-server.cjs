/**
 * cooliebase MCP server (stdio, zero-dependency).
 *
 * Exposes this repository's code-framework knowledge to any external agent
 * (Claude Code / Cursor / Command Code / DSH / hermes).
 *
 * **Never mutates the repository.** Tools are either read-only queries or
 * plan/preview (they return what a real run *would* do and leave writing to an
 * explicit command a human runs). The plan/preview tools never pass --write,
 * and their inputSchema exposes no write-class argument.
 * See docs/specs/infra/mcp-write-tools/write-tool-contract.md.
 *
 * Every tool wraps existing sources of truth. Do not reimplement domain logic
 * here — that would create a second source of truth.
 *
 * Register with an MCP host:
 *   { "command": "node",
 *     "args": ["<repo>/scripts/mcp/cooliebase-mcp-server.cjs"] }
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT, loadCatalog, domainDirOf, domainPathOf } = require("../lib/domain-catalog.cjs")

/** 域代码的两处根: 未插件化的域/地基在 packages/domains，第一方插件在 packages/plugins/plugin-*。 */
function isPluginDomain(name) {
  return fs.existsSync(path.join(ROOT, "packages", "plugins", `plugin-${name}`))
}

/** 读某个第一方插件的 manifest（没有则返回 null）。 */
function readPluginManifest(name) {
  const file = path.join(domainPathOf(ROOT, name), "plugin.manifest.json")
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

const SERVER_NAME = "cooliebase-all"
const SERVER_VERSION = "1.0.0"
const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2024-11-05"]
const GATE_TIMEOUT_MS = 120000

const CONTRACT_DIR = "packages/shared/contract"
const GATES = Object.freeze({
  domain: "domain:check",
  harness: "harness:check",
  microservice: "microservice:check",
  standards: "standards:check",
  "admin-routes": "admin:routes:check",
  "foundation-ontology": "foundation:ontology:check",
  skills: "skills:check",
})

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, ...rel.split("/")), "utf8"))
}

function readSkillIndex() {
  const dir = path.join(ROOT, ".agents", "skills")
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const full = path.join(dir, entry.name, "SKILL.md")
      if (!fs.existsSync(full)) return { name: entry.name, description: null }
      const body = fs.readFileSync(full, "utf8")
      const end = body.startsWith("---\n") ? body.indexOf("\n---", 4) : -1
      const frontmatter = end === -1 ? "" : body.slice(4, end)
      const description = /^description:\s*(.+)$/m.exec(frontmatter)
      return { name: entry.name, description: description ? description[1].trim() : null }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function truncate(text, max) {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n… (${text.length - max} more chars truncated)`
}

/**
 * 域名会进入路径与子进程参数 —— 必须是最小字符集，不接受任意字符串。
 * 契约见 docs/specs/infra/mcp-write-tools/write-tool-contract.md §2。
 */
const DOMAIN_SLUG = /^[a-z][a-z0-9-]{0,40}$/

function requireDomainSlug(raw) {
  const name = String(raw == null ? "" : raw).trim()
  if (!DOMAIN_SLUG.test(name)) {
    throw new Error(`invalid domain ${JSON.stringify(raw)}; expected ${DOMAIN_SLUG}`)
  }
  return name
}

/** MCP 入参是系统边界：只接受仓库内路径，越界一律拒绝（不纠正、不兜底）。 */
function resolveInsideRepo(value, label) {
  const raw = String(value == null ? "" : value).trim()
  if (!raw) throw new Error(`${label} is required`)
  const full = path.resolve(ROOT, raw)
  const rel = path.relative(ROOT, full)
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`${label} must stay inside the repository: ${raw}`)
  }
  return { full, rel: rel.split(path.sep).join("/") }
}

const PNPM = process.platform === "win32" ? "pnpm.cmd" : "pnpm"

/**
 * 执行既有脚本并回收输出。**永不**传 --write / --force —— 本批的零落盘保证靠这里兜住，
 * 而不是靠调用方自觉。
 */
function runExistingScript(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: GATE_TIMEOUT_MS,
    shell: false,
  })
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    spawnError: result.error ? String(result.error.message) : null,
  }
}

/** 统一返回契约（write-tool-contract.md §3）：writes 恒 false，是保证不是提示。 */
function planEnvelope(tool, mode, payload) {
  return {
    tool,
    mode,
    writes: false,
    plannedWrites: payload.plannedWrites || [],
    followUpGates: payload.followUpGates || ["pnpm run check"],
    manualSteps: payload.manualSteps || [],
    details: payload.details || {},
  }
}

const TOOLS = [
  {
    name: "cooliebase_domain_list",
    description:
      "List every CoolieBase domain declared in the runtime source of truth (domain-catalog.json): kind, migration stage, default port, upstream env, public API prefixes and tenant policy. Use this first when locating which domain owns a capability.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run() {
      const catalog = loadCatalog()
      const domains = catalog.domains.map((domain) => ({
        name: domain.name,
        kind: domain.kind,
        // 真实目录: 域可能已迁成第一方插件。**必须给** —— 否则调用方会去猜
        // packages/domains/<name>，而"写死路径"的后果通常是静默失效而非报错。
        dir: domainDirOf(ROOT, domain.name),
        stage: domain.stage,
        contractVersion: domain.contractVersion,
        publicPrefixes: domain.publicPrefixes,
        upstreamEnv: domain.upstreamEnv,
        defaultPort: domain.defaultPort,
        tenantPolicy: domain.auth.tenantPolicy,
        dependsOnModules: domain.dependsOnModules,
      }))
      return {
        catalogVersion: catalog.version,
        layers: {
          foundation: catalog.layers.foundation.modules,
          platform: catalog.layers.platform.domains,
          // plugin 层 = 已插件化的业务域。遍历"业务域"的调用方必须把 business 与 plugin
          // **合并**看待；只读 business 会以为这些域不存在（当前 business 可能为空）。
          business: catalog.layers.business.domains,
          plugin: (catalog.layers.plugin && catalog.layers.plugin.domains) || [],
        },
        count: domains.length,
        domains,
      }
    },
  },
  {
    name: "cooliebase_domain_seam",
    description:
      "Return the capability seam (definition / provider / consumer) for one domain, including facade files, provider service methods, and page/API consumer paths. Use before calling into a domain to confirm the allowed integration point.",
    inputSchema: {
      type: "object",
      properties: { domain: { type: "string", description: "Domain name, e.g. pay" } },
      required: ["domain"],
      additionalProperties: false,
    },
    run(args) {
      const domain = String(args.domain || "").trim()
      if (!domain) throw new Error("domain is required")
      const graph = readJson(`${CONTRACT_DIR}/seam-graph.json`)
      const entry = (graph.domains || []).find((item) => item.name === domain)
      if (!entry) {
        throw new Error(
          `unknown domain "${domain}"; known: ${(graph.domains || []).map((item) => item.name).join(", ")}`,
        )
      }
      return entry
    },
  },
  {
    name: "cooliebase_action_lookup",
    description:
      "Look up RPC actions (method -> service / module / zod schema / fields) from rpc-actions.json. Filter by domain, or by exact/method substring to find which Service implements a capability and what its payload looks like.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Restrict to one domain" },
        method: { type: "string", description: "Method name or substring, e.g. listOrders" },
        limit: { type: "integer", description: "Max matches to return (default 25)" },
      },
      additionalProperties: false,
    },
    run(args) {
      const actions = readJson("packages/shared/backend/constants/rpc-actions.json").domains || {}
      const method = String(args.method || "").trim().toLowerCase()
      const limit = Number.isInteger(args.limit) && args.limit > 0 ? args.limit : 25

      const scoped = args.domain ? [[String(args.domain), actions[String(args.domain)]]] : Object.entries(actions)
      const matches = []
      for (const [domainName, spec] of scoped) {
        if (!spec) {
          if (args.domain) throw new Error(`unknown domain "${args.domain}"`)
          continue
        }
        for (const action of spec.actions || []) {
          if (method && !String(action.method).toLowerCase().includes(method)) continue
          matches.push({ domain: domainName, ...action })
        }
      }
      return { count: matches.length, truncated: matches.length > limit, actions: matches.slice(0, limit) }
    },
  },
  {
    name: "cooliebase_skills_list",
    description:
      "List the repository's Agent Skills (progressive-disclosure SKILL.md set) with descriptions, plus the NPC L0-L8 layer -> skill mapping declared in agent-profile.json. Load a skill body from .agents/skills/<name>/SKILL.md when a task matches.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run() {
      const profile = readJson(`${CONTRACT_DIR}/agent-profile.json`)
      return {
        sourceDir: profile.npc?.skillsDir || ".agents/skills",
        skills: readSkillIndex(),
        npcLayers: profile.npc?.layers || {},
      }
    },
  },
  {
    name: "cooliebase_compat_info",
    description:
      "Return the compatibility manifest: template version, toolchain versions, contract versions (domain catalog / RPC protocol / agent profile), the machine-readable consumption surface, and what downstream projects may rely on as frozen vs additive.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run() {
      return readJson(`${CONTRACT_DIR}/compat-manifest.json`)
    },
  },
  {
    name: "cooliebase_standards_report",
    description:
      "Run the AGENTS.md engineering-standards gate and return a machine-readable report: per-rule mode (enforce / ratchet / report), pass state, frozen-debt counts, and the items that still need human judgement. Use this before changing backend or repository code to learn which conventions are machine-enforced.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run() {
      const result = spawnSync(
        process.execPath,
        [path.join(ROOT, "scripts", "check-engineering-standards.cjs"), "--json"],
        { cwd: ROOT, encoding: "utf8", timeout: GATE_TIMEOUT_MS },
      )
      const stdout = (result.stdout || "").trim()
      if (!stdout) {
        throw new Error(`standards check produced no JSON output: ${(result.stderr || "").trim()}`)
      }
      return JSON.parse(stdout)
    },
  },
  {
    name: "cooliebase_evolution_backlog",
    description:
      "Return the evolution backlog: prioritised, evidence-linked work items aggregated from this repository's own gate artifacts (gate trace, standards report + frozen debt, per-domain test coverage, oversized files, TODO markers). Use this to answer 'what should I work on here?' instead of guessing; each item carries the exact command that verifies a fix.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run() {
      const result = spawnSync(
        process.execPath,
        [path.join(ROOT, "scripts", "build-evolution-backlog.cjs"), "--json"],
        { cwd: ROOT, encoding: "utf8", timeout: GATE_TIMEOUT_MS },
      )
      const stdout = (result.stdout || "").trim()
      if (!stdout) {
        throw new Error(`evolution backlog produced no JSON output: ${(result.stderr || "").trim()}`)
      }
      return JSON.parse(stdout)
    },
  },
  {
    name: "cooliebase_gate_run",
    description:
      "Run one whitelisted repository governance gate and return its exit code and output. Read-only checks only; nothing in this list mutates the repository. Allowed gates are listed in the 'gates' argument description.",
    inputSchema: {
      type: "object",
      properties: {
        gate: {
          type: "string",
          enum: Object.keys(GATES),
          description: `One of: ${Object.keys(GATES).join(", ")}`,
        },
      },
      required: ["gate"],
      additionalProperties: false,
    },
    run(args) {
      const gate = String(args.gate || "").trim()
      const script = GATES[gate]
      if (!script) {
        throw new Error(`gate "${gate}" is not whitelisted; allowed: ${Object.keys(GATES).join(", ")}`)
      }
      // 本仓包管理器是 pnpm（AGENTS §2.1）；此前这里用 npm —— 数组形态逃过了 no-new-npm-run 的文本匹配
      const runner = process.platform === "win32" ? "pnpm.cmd" : "pnpm"
      const result = spawnSync(runner, ["run", "--silent", script], {
        cwd: ROOT,
        encoding: "utf8",
        timeout: GATE_TIMEOUT_MS,
        shell: false,
      })
      const output = `${result.stdout || ""}${result.stderr || ""}`.trim()
      return {
        gate,
        script,
        exitCode: result.status,
        timedOut: result.error?.code === "ETIMEDOUT" || false,
        passed: result.status === 0,
        output: truncate(output, 12000),
      }
    },
  },
  {
    name: "cooliebase_api_probe",
    description:
      "Read-only health probe across EVERY declared API contract (docs/agent/contracts.json, ~342 entries): calls each contract's list endpoint and asserts the response shape (items[] + numeric total), so it catches contract drift that a shallow /healthz probe cannot. Never writes. Requires the app to be running; set baseUrl or COOLIEBASE_AGENT_BASE_URL. Authentication uses COOLIEBASE_AGENT_USERNAME / COOLIEBASE_AGENT_PASSWORD from the environment — when absent it reports authenticated:false and every probe returns 401 (routes exist and are guarded, but health is unverified).",
    inputSchema: {
      type: "object",
      properties: {
        baseUrl: {
          type: "string",
          description: "Target app base URL. Defaults to COOLIEBASE_AGENT_BASE_URL or http://localhost:3200.",
        },
        contract: {
          type: "string",
          description: "Probe a single contract only, e.g. \"system.SystemUser\" or \"system-user\". Omit to probe all.",
        },
        limit: {
          type: "number",
          description: "Cap the number of contracts probed (useful for a quick smoke). Omit for all.",
        },
      },
      additionalProperties: false,
    },
    run(args) {
      const baseUrl = String(args.baseUrl || process.env.COOLIEBASE_AGENT_BASE_URL || "http://localhost:3200").trim()
      const contract = args.contract ? String(args.contract).trim() : ""
      const limit = Number.isFinite(Number(args.limit)) && Number(args.limit) > 0 ? Math.floor(Number(args.limit)) : 0
      const cliArgs = ["scripts/agent/run-ops.cjs"]
      if (contract) cliArgs.push(contract)
      cliArgs.push("health", "--json")

      const result = spawnSync(process.execPath, cliArgs, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 180_000,
        env: { ...process.env, COOLIEBASE_AGENT_BASE_URL: baseUrl },
      })
      const stdout = String(result.stdout || "").trim()
      const stderr = String(result.stderr || "").trim()

      // 预检失败（应用没在跑）时 run-ops 以 exit=2 退出并给可读提示 —— 这里**不抛异常**，
      // 而是把"连不上"如实返回（和 /readyz 的自诊断一个取向：让调用方看见真相）。
      if (result.status === 2 && !stdout) {
        return {
          reachable: false,
          baseUrl,
          hint: "应用未运行或不可达。先 `pnpm run dev`，或用 baseUrl 指向已启动的实例。",
          detail: truncate(stderr, 2000),
        }
      }
      let report
      try {
        report = JSON.parse(stdout)
      } catch {
        return { reachable: true, baseUrl, parsed: false, exitCode: result.status, detail: truncate(`${stdout}\n${stderr}`, 4000) }
      }
      if (limit > 0 && Array.isArray(report.results)) {
        report.results = report.results.slice(0, limit)
        report.truncatedTo = limit
      }
      return { reachable: true, baseUrl, ...report, readOnly: true, exitCode: result.status }
    },
  },
  {
    name: "cooliebase_plugin_list",
    description:
      "List every first-party plugin on disk (packages/plugins/plugin-*): id, directory, declared API route count, the auth surfaces it declares (operator/company/public), capabilities, and the domain-level traits carried in its manifest. Use this to answer \"is this domain a plugin\" and \"where does its code live\" without guessing paths.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    run() {
      const pluginsRoot = path.join(ROOT, "packages", "plugins")
      const dirs = fs.existsSync(pluginsRoot)
        ? fs.readdirSync(pluginsRoot, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && entry.name.startsWith("plugin-"))
            .map((entry) => entry.name)
            .sort()
        : []
      const plugins = dirs.map((dirName) => {
        const name = dirName.replace(/^plugin-/, "")
        const manifest = readPluginManifest(name)
        // 没有有效 manifest 的目录不算插件 —— 否则裁剪过的工程里那些残留空目录
        // （pnpm 会给工作区包建 node_modules）会被当成"没有路由声明的插件"列出来。
        if (!manifest) return null
        const routes = manifest.apiRoutes || []
        const auth = [...new Set(routes.map((route) => route.auth))].sort()
        return {
          id: manifest.id,
          domain: name,
          dir: `packages/plugins/${dirName}`,
          routeCount: routes.length,
          authSurfaces: auth,
          capabilities: (manifest && manifest.capabilities) || [],
          entrypoints: (manifest && manifest.entrypoints) || null,
          domainTraits: (manifest && manifest.domain) || null,
        }
      })
      const valid = plugins.filter(Boolean)
      return { count: valid.length, plugins: valid }
    },
  },
  {
    name: "cooliebase_domain_resolve",
    description:
      "Resolve a domain name to its real directory and plugin status. ALWAYS call this before building a path by hand: 15 of the business domains live under packages/plugins/plugin-<name>, not packages/domains/<name>, and hardcoding the old path usually fails SILENTLY (generated code lands in a directory the app never imports).",
    inputSchema: {
      type: "object",
      properties: { domain: { type: "string", description: "Domain name, e.g. mall" } },
      required: ["domain"],
      additionalProperties: false,
    },
    run(args) {
      const name = String(args.domain || "").trim()
      if (!name) throw new Error("domain is required")
      const catalog = loadCatalog()
      const entry = (catalog.domains || []).find((item) => item.name === name)
      const manifest = readPluginManifest(name)
      return {
        domain: name,
        registered: Boolean(entry),
        kind: entry ? entry.kind : null,
        isPlugin: isPluginDomain(name),
        dir: domainDirOf(ROOT, name),
        hasPluginManifest: Boolean(manifest),
        pluginId: manifest ? manifest.id : null,
        routeCount: manifest ? ((manifest.apiRoutes || []).length) : 0,
        note: entry && entry.kind === "plugin"
          ? "已插件化: 保留域级特征(可独立打包/被 broker 寻址)，但不属于 platform/business 层"
          : "platform 地基或尚未插件化: 代码在 packages/domains/ 下",
      }
    },
  },
  {
    name: "cooliebase_codegen_targets",
    description:
      "Return where the low-code code generator will write files for a domain (backend / frontend / contract dirs), resolved against the domain's REAL directory. Use before scaffolding or generating code: writing to a hardcoded packages/domains/<name> for a plugin domain produces code the application never imports.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Target domain, e.g. mall" },
        submodule: { type: "string", description: "Optional submodule segment" },
      },
      required: ["domain"],
      additionalProperties: false,
    },
    run(args) {
      const name = String(args.domain || "").trim()
      if (!name) throw new Error("domain is required")
      const catalog = loadCatalog()
      if (!(catalog.domains || []).some((item) => item.name === name)) {
        throw new Error(`unknown domain "${name}"; see cooliebase_domain_list`)
      }
      const sub = args.submodule ? `/${args.submodule}` : ""
      const base = domainDirOf(ROOT, name)
      return {
        domain: name,
        isPlugin: isPluginDomain(name),
        base: `${base}${sub}`,
        paths: {
          contract: `${base}${sub}/contract`,
          backend: `${base}${sub}/backend`,
          frontend: `${base}${sub}/frontend`,
          api: `src/app/api/v1/admin/${name}${sub}`,
          adminPage: `src/app/(admin-pages)/admin/${name}${sub}`,
        },
        importAlias: `@/modules/${name}${sub ? `${sub}` : ""}`,
        warning:
          "插件域的导入别名指向 packages/plugins/plugin-<name>（见 tsconfig paths）。"
          + "不要手写 packages/domains/<name> —— 生成物会落到应用从不 import 的目录。",
      }
    },
  },
  {
    name: "cooliebase_delivery_status",
    description:
      "AI-driven delivery status across all phases (requirement / prototype / ui-design / architecture / development / testing / ops / operations / implementation): which artifacts exist, which are missing, and the Skill + gate command per phase. Use this to decide what to do next instead of re-reading AGENTS.md.",
    inputSchema: {
      type: "object",
      properties: {
        phase: { type: "string", description: "Optional phase id, e.g. testing" },
        spec: { type: "string", description: "Optional spec name, e.g. cmmi-governance" },
      },
      additionalProperties: false,
    },
    run(args) {
      const { execFileSync } = require("node:child_process")
      const argv = ["scripts/check-delivery.cjs", "--json"]
      if (args.phase) argv.push("--phase", String(args.phase))
      if (args.spec) argv.push("--spec", String(args.spec))
      return JSON.parse(execFileSync("node", argv, { cwd: ROOT, encoding: "utf8" }))
    },
  },
  {
    name: "cooliebase_spec_list",
    description:
      "List all active and archived specifications (feature, bugfix, enhancement, refactor, security) across all domains, including name, domain, type, status, and physical paths. Read-only query tool.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Optional domain filter, e.g. system" },
      },
      additionalProperties: false,
    },
    run(args) {
      const { listAllSpecs } = require("../lib/spec-resolver.cjs")
      const all = listAllSpecs()
      const filtered = args.domain ? all.filter((s) => s.domain === args.domain) : all
      return { count: filtered.length, specs: filtered }
    },
  },
  {
    name: "cooliebase_cmmi_list",
    description:
      "Query CMMI 01~09 lifecycle phases, designated skills, supported asset types, and current deliverable asset status across docs/01~09. Read-only query tool.",
    inputSchema: {
      type: "object",
      properties: {
        phase: { type: "string", description: "Optional phase number, e.g. 01, 02, ..., 09" },
      },
      additionalProperties: false,
    },
    run(args) {
      const PHASES = [
        {
          phase: "01",
          dir: "docs/01_management",
          name: "01_management",
          title: "立项与策划 (Project Planning & Decision)",
          practiceArea: "PLAN / MC / RSKM / DAR",
          skill: "dar-decision-matrix",
          types: ["charter", "plan", "risk", "dar", "pcm"],
        },
        {
          phase: "02",
          dir: "docs/02_requirements",
          name: "02_requirements",
          title: "需求工程 (Requirements Development)",
          practiceArea: "RDM / EARS",
          skill: "ears-spec-writer",
          types: ["srs", "rtm", "nfr", "urs"],
        },
        {
          phase: "03",
          dir: "docs/03_design",
          name: "03_design",
          title: "系统设计与架构 (Technical Solution / Architecture)",
          practiceArea: "TS / MADR / Archify",
          skill: "adr-architect",
          types: ["adr", "erd", "archify", "hld", "api-spec"],
        },
        {
          phase: "04",
          dir: "docs/04_implementation",
          name: "04_implementation",
          title: "实现与构造 (Construction / Engineering Blueprint)",
          practiceArea: "TS / Coding / Plugins",
          skill: "coding",
          types: ["code-review", "plugin-blueprint", "sbom"],
        },
        {
          phase: "05",
          dir: "docs/05_verification",
          name: "05_verification",
          title: "验证与打假 (Verification & Validation / Mutation)",
          practiceArea: "VV / Testing / Mutation",
          skill: "automated-testing",
          types: ["test-plan", "test-summary", "mutation-report", "peer-review"],
        },
        {
          phase: "06",
          dir: "docs/06_quality_assurance",
          name: "06_quality_assurance",
          title: "质保与配置审计 (Process & Product QA / Configuration)",
          practiceArea: "PQA / CM / FCA-PCA",
          skill: "compliance-auditor",
          types: ["qa-plan", "audit", "gate-trace"],
        },
        {
          phase: "07",
          dir: "docs/07_release",
          name: "07_release",
          title: "发布与割接 (Transition / Deployment / Rollback)",
          practiceArea: "TRANS / DevOps",
          skill: "devops",
          types: ["deployment-sop", "release-notes", "rollback-runbook", "user-manual"],
        },
        {
          phase: "08",
          dir: "docs/08_sre",
          name: "08_sre",
          title: "站点可靠性与安全 (Service Continuity / SRE / Postmortem)",
          practiceArea: "SCON / CAM / SRE",
          skill: "sre-slo-manager",
          types: ["slo-matrix", "postmortem", "dr-plan", "strix-report"],
        },
        {
          phase: "09",
          dir: "docs/09_operations",
          name: "09_operations",
          title: "持续运营与平账 (Service Delivery / BizOps / DataOps)",
          practiceArea: "CMMI-SVC / BizOps / DataOps",
          skill: "financial-reconciliation-agent",
          types: ["reconciliation", "agent-ops-ledger", "inspection-report"],
        },
      ]

      function scan(dir) {
        let results = []
        if (!fs.existsSync(dir)) return results
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, item.name)
          if (item.isSymbolicLink()) continue
          if (item.isDirectory()) results = results.concat(scan(full))
          else results.push(full)
        }
        return results
      }

      const selected = args.phase ? PHASES.filter((p) => p.phase === String(args.phase).padStart(2, "0")) : PHASES
      const result = selected.map((p) => {
        const fullDir = path.join(ROOT, p.dir)
        const files = scan(fullDir)
        const realFiles = files.filter((f) => !f.endsWith(".gitkeep")).map((f) => path.relative(ROOT, f))
        const hasPlaceholder = files.some((f) => f.endsWith(".gitkeep"))
        return {
          ...p,
          realAssetsCount: realFiles.length,
          placeholderOnly: realFiles.length === 0 && hasPlaceholder,
          realAssets: realFiles,
        }
      })

      return { totalPhases: PHASES.length, returnedPhases: result.length, phases: result }
    },
  },
  {
    name: "cooliebase_scaffold_plan",
    description:
      "PLAN ONLY — never writes. For a NEW domain plus its low-code table metadata module, validate the metadata and return the ordered steps a real scaffold would run, so the caller does not have to memorise the npm commands. Refuses domains already registered in domain-catalog.json (this plans new ones). --write is never passed.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "New domain slug, e.g. shop" },
        tables: {
          type: "string",
          description: "Repo-relative metadata module; defaults to scripts/data/<domain>-tables.ts",
        },
        export: {
          type: "string",
          description: "Exported CodegenConfig[] name; defaults to <DOMAIN>_TABLES",
        },
      },
      required: ["domain"],
      additionalProperties: false,
    },
    run(args) {
      const domain = requireDomainSlug(args.domain)
      const catalog = loadCatalog()
      if ((catalog.domains || []).some((item) => item.name === domain)) {
        throw new Error(
          `domain "${domain}" is already registered in domain-catalog.json; scaffold_plan targets NEW domains only. `
          + `For an existing domain use cooliebase_domain_resolve / cooliebase_codegen_targets.`,
        )
      }
      const tablesRel = args.tables
        ? resolveInsideRepo(args.tables, "tables").rel
        : `scripts/data/${domain}-tables.ts`
      const exportName = args.export
        ? String(args.export).trim()
        : `${domain.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_TABLES`

      const result = runExistingScript(PNPM, [
        "exec",
        "tsx",
        "scripts/create-business-domain.ts",
        domain,
        "--dry-run",
        "--tables",
        tablesRel,
        "--export",
        exportName,
      ])
      const tables = [...result.stdout.matchAll(/^\s+·\s+(\S+)\s+->\s+(\S+)\s*$/gm)].map((match) => ({
        table: match[1],
        className: match[2],
      }))

      return planEnvelope("cooliebase_scaffold_plan", "plan", {
        // dry-run 只校验元数据，拿不到完整文件清单 —— 诚实置空而不猜路径。
        plannedWrites: [],
        followUpGates: ["pnpm run check", "pnpm run domain:check"],
        manualSteps: [
          `写表元数据（属产品决策，工具不代写）：${tablesRel} 需导出 \`${exportName}: CodegenConfig[]\``,
          `真正落盘（本工具不执行）：pnpm run domain:new ${domain}`,
          "部署到目标库：pnpm exec prisma migrate deploy",
          "提交前跑：pnpm run check",
        ],
        details: {
          domain,
          tablesModule: tablesRel,
          exportName,
          metadataValidated: result.status === 0,
          dryRunExitCode: result.status,
          dryRunOutput: truncate(`${result.stdout}${result.stderr}`.trim(), 4000),
          tables,
          plannedWritesNote:
            "create-business-domain.ts 的 --dry-run 分支只校验表元数据并列出表名（源码第 80-84 行），"
            + "不执行第 2-5 步，因此无法给出完整文件清单。此处留空是刻意的 —— 猜路径在插件域上会静默失效。",
          finalDirAfterStep4: `packages/plugins/plugin-${domain}`,
          finalDirNote:
            "真实运行先在第 1 步前于 packages/domains/<域> 建目录，第 4 步 migrate-domain-to-plugin.cjs 再搬到 "
            + "packages/plugins/plugin-<域> —— 上面给的是搬完之后的最终落点。",
        },
      })
    },
  },
  {
    name: "cooliebase_codegen_preview",
    description:
      "PREVIEW ONLY — never writes. Given an already-extracted codegen output directory (must contain codegen-manifest.json), dry-run the injector and return the exact files it WOULD copy, plus any overwrite conflicts the injector detected. Also returns the target domain's real codegen directories so paths are never guessed. Nothing is copied.",
    inputSchema: {
      type: "object",
      properties: {
        extractedDir: {
          type: "string",
          description: "Repo-relative extracted codegen directory containing codegen-manifest.json",
        },
        domain: {
          type: "string",
          description: "Optional target domain (must be registered) — returned for path context",
        },
      },
      required: ["extractedDir"],
      additionalProperties: false,
    },
    run(args) {
      const { full, rel } = resolveInsideRepo(args.extractedDir, "extractedDir")
      if (!fs.existsSync(full)) throw new Error(`extractedDir does not exist: ${rel}`)
      if (!fs.existsSync(path.join(full, "codegen-manifest.json"))) {
        throw new Error(`${rel} has no codegen-manifest.json; the injector refuses to run without it`)
      }
      let domain = null
      if (args.domain) {
        domain = requireDomainSlug(args.domain)
        const catalog = loadCatalog()
        if (!(catalog.domains || []).some((item) => item.name === domain)) {
          throw new Error(`unknown domain "${domain}"; see cooliebase_domain_list`)
        }
      }

      const result = runExistingScript(process.execPath, [
        "scripts/inject-codegen-output.cjs",
        rel,
        "--dry-run",
      ])
      const wouldCopy = [...result.stdout.matchAll(/^\s+WOULD COPY:\s+(\S+)\s*$/gm)].map((match) => match[1])
      const validated = /DRY RUN: Validated (\d+) files?/.exec(result.stdout)

      return planEnvelope("cooliebase_codegen_preview", "preview", {
        plannedWrites: wouldCopy,
        followUpGates: ["pnpm run check"],
        manualSteps: [
          `确认清单无误后真正注入（本工具不执行）：node scripts/inject-codegen-output.cjs ${rel}`,
          "注入器遇到已存在文件会中止而不是覆盖 —— 冲突需人工决策后再处理",
          "提交前跑：pnpm run check",
        ],
        details: {
          extractedDir: rel,
          domain,
          domainTargets: domain
            ? {
                base: domainDirOf(ROOT, domain),
                backend: `${domainDirOf(ROOT, domain)}/backend`,
                frontend: `${domainDirOf(ROOT, domain)}/frontend`,
                contract: `${domainDirOf(ROOT, domain)}/contract`,
              }
            : null,
          validatedFileCount: validated ? Number(validated[1]) : null,
          wouldCopyCount: wouldCopy.length,
          exitCode: result.status,
          output: truncate(`${result.stdout}${result.stderr}`.trim(), 6000),
        },
      })
    },
  },
  {
    name: "cooliebase_table_migration_plan",
    description:
      "PLAN ONLY — never writes. Given a low-code table metadata module (CodegenConfig[]), return the PostgreSQL DDL a migration would contain and where it would land. The underlying generator is dry-run by default and --write is never passed. Use before authoring a migration so the DDL is reviewable first.",
    inputSchema: {
      type: "object",
      properties: {
        tables: { type: "string", description: "Repo-relative metadata module, e.g. scripts/data/wms-tables.ts" },
        export: { type: "string", description: "Exported CodegenConfig[] name; defaults to \"default\"" },
        name: { type: "string", description: "Migration name, e.g. add_wms_tables" },
      },
      required: ["tables", "name"],
      additionalProperties: false,
    },
    run(args) {
      const { rel } = resolveInsideRepo(args.tables, "tables")
      const name = String(args.name == null ? "" : args.name).trim()
      if (!/^[a-z0-9_]{1,60}$/.test(name)) {
        throw new Error(`invalid migration name ${JSON.stringify(args.name)}; expected /^[a-z0-9_]{1,60}$/`)
      }
      const exportName = args.export ? String(args.export).trim() : "default"
      if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(exportName)) {
        throw new Error(`invalid export name ${JSON.stringify(args.export)}`)
      }

      const result = runExistingScript(PNPM, [
        "exec",
        "tsx",
        "scripts/generate-table-migration.ts",
        "--tables",
        rel,
        "--export",
        exportName,
        "--name",
        name,
      ])
      const summary = /\[table-migration\] dry-run: (\d+) 张表/.exec(result.stdout)
      // 同名迁移已存在时是**原地更新**（生成器第 79-87 行的幂等分支），路径因此可确定。
      const migrationsDir = path.join(ROOT, "prisma", "migrations")
      const existing = fs.existsSync(migrationsDir)
        ? fs.readdirSync(migrationsDir).find((entry) => entry.endsWith(`_${name}`))
        : undefined

      return planEnvelope("cooliebase_table_migration_plan", "plan", {
        plannedWrites: existing ? [`prisma/migrations/${existing}/migration.sql`] : [],
        followUpGates: ["pnpm run check", "pnpm run tables:inventory"],
        manualSteps: [
          `真正落盘：pnpm exec tsx scripts/generate-table-migration.ts --tables ${rel} --export ${exportName} --name ${name} --write`,
          existing
            ? `注意：同名迁移 ${existing} 已存在，--write 会原地更新该文件（幂等，不堆目录）`
            : "注意：尚不存在同名迁移，--write 会按 UTC 时间戳新建目录",
          "表定义的唯一真源是低代码元数据（AGENTS §9.5），不要手写 DDL",
        ],
        details: {
          tablesModule: rel,
          exportName,
          migrationName: name,
          tableCount: summary ? Number(summary[1]) : null,
          existingMigrationDir: existing || null,
          plannedWritesNote: existing
            ? `同名迁移 ${existing} 已存在，--write 原地更新该文件，路径可确定。`
            : "尚无同名迁移，--write 会按 UTC 时间戳新建 prisma/migrations/<timestamp>_"
              + `${name}/migration.sql；时间戳此刻不可知，故 plannedWrites 留空而不猜。`,
          exitCode: result.status,
          ddl: truncate(result.stdout.split("\n[table-migration]")[0].trim(), 8000),
        },
      })
    },
  },
]

const TOOL_NAMES = TOOLS.map((tool) => tool.name)

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result })
}

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } })
}

function handleToolCall(id, params) {
  const name = params?.name
  const tool = TOOLS.find((entry) => entry.name === name)
  if (!tool) {
    sendError(id, -32602, `unknown tool "${name}"; known: ${TOOL_NAMES.join(", ")}`)
    return
  }

  try {
    const payload = tool.run(params.arguments || {})
    sendResult(id, { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] })
  } catch (error) {
    sendResult(id, {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    })
  }
}

function handle(message) {
  const { id, method, params } = message
  // Notifications carry no id and must never be answered.
  if (id === undefined || id === null) return

  switch (method) {
    case "initialize": {
      const requested = params?.protocolVersion
      sendResult(id, {
        protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
          ? requested
          : SUPPORTED_PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      })
      return
    }
    case "ping":
      sendResult(id, {})
      return
    case "tools/list":
      sendResult(id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      })
      return
    case "tools/call":
      handleToolCall(id, params)
      return
    default:
      sendError(id, -32601, `method not found: ${method}`)
  }
}

function main() {
  let buffer = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", (chunk) => {
    buffer += chunk
    let index = buffer.indexOf("\n")
    while (index !== -1) {
      const line = buffer.slice(0, index).trim()
      buffer = buffer.slice(index + 1)
      if (line) {
        try {
          handle(JSON.parse(line))
        } catch (error) {
          process.stderr.write(`[cooliebase-mcp] invalid message: ${error.message}\n`)
        }
      }
      index = buffer.indexOf("\n")
    }
  })
}

if (require.main === module) main()

module.exports = { TOOLS, TOOL_NAMES, GATES, SERVER_VERSION, SUPPORTED_PROTOCOL_VERSIONS }
