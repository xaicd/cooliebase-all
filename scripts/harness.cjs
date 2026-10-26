#!/usr/bin/env node
/**
 * `pnpm harness <cmd>` —— 标准全流程的**唯一主干入口**。
 *
 * 设计约束（三条，缺一就会变成"第二个总闸灾难"）：
 *  1. **零判定逻辑**：这里只做「转发 + 状态汇总」。判定仍在各脚本里 ——
 *     否则会出现两处判定，正是本仓踩过的 `spec-gate.sh` 与 `pre-commit` 同源问题。
 *  2. **`harness check` 必须与 `pnpm run check` 完全等价**：不得放宽任何一步。
 *  3. 每条子命令都要能被证伪（见 `harness doctor` 的孤儿扫描与 `harness:surface:check`）。
 *
 * 背景（审计维度 5）：本仓有 188 个 npm script、46 个 check 类，
 * 但"哪一条是主干"没有任何声明 —— `agent-autopilot-daemon.ts` 甚至是个没人引用的孤儿。
 *
 * 用法：
 *   pnpm harness                     # = help
 *   pnpm harness doctor              # 只读体检（环境 / 钩子 / 真源 / 孤儿）
 *   pnpm harness route -- "<需求>"    # 需求分诊
 *   pnpm harness spec new|build|check # 规格链
 *   pnpm harness check               # 全量静态门禁（与 pnpm run check 等价）
 *   pnpm harness test [--fast]       # 测试金字塔
 *   pnpm harness e2e [--only init|create|both] [--fast] [--keep]
 *   pnpm harness deliver             # 交付门（build + smoke + security + load + fingerprint）
 *   pnpm harness ops -- <域>.<实体> <action>
 *   pnpm harness evolve              # 进化待办（report-only）
 */
const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const argv = process.argv.slice(2)
const sub = (argv[0] || "help").toLowerCase()
const rest = argv.slice(1)

function pnpmRun(script, extra = [], opts = {}) {
  const result = spawnSync("pnpm", ["run", script, ...extra], {
    cwd: ROOT,
    stdio: "inherit",
    ...opts,
  })
  return result.status ?? 1
}

function nodeScript(file, extra = []) {
  const result = spawnSync("node", [path.join(ROOT, file), ...extra], { cwd: ROOT, stdio: "inherit" })
  return result.status ?? 1
}

// ── 主干（这是"标准全流程"的声明，别处不要再列一份）─────────────────
const TRUNK = [
  ["route", "pnpm harness route -- \"<需求>\"", "需求分诊（三值判定：SPEC_REQUIRED / DIRECT_OK / NOT_A_REQUIREMENT）"],
  ["spec", "pnpm harness spec new|build|check", "规格链（立项 → 展开 → 进度）"],
  ["check", "pnpm harness check", "全量静态门禁（与 pnpm run check 等价）"],
  ["test", "pnpm harness test", "测试金字塔（L1 → L2 → L3 → L4）"],
  ["e2e", "pnpm harness e2e", "孵化端到端（产物自身门禁 + build + 起服务登录）"],
  ["deliver", "pnpm harness deliver", "交付门（build / smoke / security / load / fingerprint）"],
  ["agent", "pnpm harness agent status|up|down", "AI 运行时开关（默认不启；up 会写 patch 并验证 MCP 真的连上）"],
  ["ops", "pnpm harness ops -- <域>.<实体> <action>", "运营动作（体检 / 造数 / 清数）"],
  ["evolve", "pnpm harness evolve", "进化待办（report-only，永不失败）"],
  ["dev", "pnpm harness dev", "起开发服务器（Next dev）"],
  ["build", "pnpm harness build", "生产构建（含 standalone）"],
  ["lint", "pnpm harness lint", "代码规范检查"],
  ["db", "pnpm harness db <子命令>", "数据库（migrate / seed / generate / up / down / backup / bootstrap:sqlite / init:sql）"],
  ["project", "pnpm harness project <子命令>", "孵化与派生工程（init / create / hatch / clone / refactor）"],
  ["domain", "pnpm harness domain <子命令>", "域操作（list / pack / contracts / manifests / seams / up ...）"],
  ["sync", "pnpm harness sync <子命令>", "契约与文档同步（surface / openwiki / skills / catalog）"],
  ["release", "pnpm harness release", "发布打包（release:package）"],
  ["verify", "pnpm harness verify <子命令>", "真实库验证（real-db）"],
  ["tables", "pnpm harness tables <子命令>", "表定义（inventory / metadata-draft / migration）"],
  ["mcp", "pnpm harness mcp serve", "MCP 工具面（只读 / plan-preview，永不落盘）"],
  ["runtime", "pnpm harness runtime <all|split>", "一体运行 / 拆分部署"],
  ["domains", "pnpm harness domains <capabilities|parity>", "域能力扫描与来源对账"],
  ["socratic", "pnpm harness socratic <inquire|check>", "苏格拉底式追问引擎"],
  ["upstream", "pnpm harness upstream <radar|audit>", "上游能力雷达"],
  ["scaffold", "pnpm harness scaffold", "功能脚手架（scaffold-feature）"],
  ["baseline", "pnpm harness baseline", "重写「不可达脚本」基线（棘轮收紧用；会写文件）"],
]

/**
 * 分组主干：**声明式映射**，子命令 → 已有 npm script。
 * 加一条新操作 = 在这里加一行，**不要**再另开一个平行 npm 入口。
 */
const GROUPS = {
  db: {
    "": "db:generate",
    up: "db:up",
    down: "db:down",
    migrate: "db:migrate",
    seed: "db:seed",
    generate: "db:generate",
    backup: "db:backup",
    "bootstrap:sqlite": "db:bootstrap:sqlite",
    "init:sql": "db:init:sql",
  },
  project: {
    "": "project:create",
    init: "project:init",
    create: "project:create",
    hatch: "project:hatch",
    clone: "project:clone",
    refactor: "project:refactor",
  },
  domain: {
    "": "domain:list",
    list: "domain:list",
    pack: "domain:pack",
    contracts: "domain:contracts",
    manifests: "domain:manifests",
    seams: "domain:seams",
    up: "domain:up",
    build: "domain:build",
    dev: "domain:dev",
  },
  verify: {
    "": "verify:real-db",
    "real-db": "verify:real-db",
  },
  tables: {
    "": "tables:inventory",
    inventory: "tables:inventory",
    "metadata-draft": "tables:metadata-draft",
    migration: "tables:migration",
  },
  mcp: {
    "": "mcp:serve",
    serve: "mcp:serve",
  },
  runtime: {
    "": "runtime:all",
    all: "runtime:all",
    split: "runtime:split",
  },
  domains: {
    "": "domains:capabilities",
    capabilities: "domains:capabilities",
    parity: "domains:parity",
  },
  socratic: {
    "": "socratic:check",
    inquire: "socratic:inquire",
    check: "socratic:check",
  },
  upstream: {
    "": "upstream:radar",
    radar: "upstream:radar",
    audit: "upstream:audit",
  },
  scaffold: {
    "": "scaffold",
  },
  sync: {
    "": "surface:sync",
    surface: "surface:sync",
    openwiki: "openwiki:sync",
    skills: "skills:sync",
    catalog: "catalog:sync:cooliebase",
  },
}

function help() {
  console.log(`
标准全流程主干（唯一入口）：

${TRUNK.map(([id, usage, desc]) => `  ${String(id).padEnd(8)} ${usage.padEnd(42)} ${desc}`).join("\n")}

辅助命令：
  doctor   只读体检：环境 / git 钩子 / 真源 / **孤儿脚本扫描**
  help     打印本页

约定：
  · 本命令**只转发**，不新增任何判定 —— 判定真源仍是各脚本。
  · \`harness check\` 与 \`pnpm run check\` **完全等价**（不放宽）。
  · 需要传参时用 \`--\` 分隔，例如：pnpm harness route -- "给商城加优惠券"
`)
  return 0
}

// ── doctor：只读体检（不跑构建、不写任何文件）──────────────────────
function doctor() {
  const ok = "✓"
  const bad = "✗"
  const warn = "⚠"
  console.log("=== harness doctor（只读）===")

  // 1) 环境
  const node = process.version
  const pnpmV = spawnSync("pnpm", ["--version"], { encoding: "utf8" }).stdout?.trim() ?? "?"
  console.log(`\n[环境]\n  ${ok} node ${node} · pnpm ${pnpmV}`)

  // 2) git 钩子（跨 CLI 唯一兜底层）
  const hooksPath = spawnSync("git", ["config", "--get", "core.hooksPath"], { cwd: ROOT, encoding: "utf8" }).stdout?.trim()
  console.log(
    `\n[git 钩子]\n  ${hooksPath ? ok : bad} core.hooksPath=${hooksPath || "（未设置）"}` +
      (hooksPath ? "" : "  → 跑 `pnpm run setup:hooks`（或重新 pnpm install）"),
  )

  // 3) 真源
  const truths = [
    ["AGENTS.md", fs.existsSync(path.join(ROOT, "AGENTS.md"))],
    ["packages/shared/contract/compat-manifest.json", fs.existsSync(path.join(ROOT, "packages/shared/contract/compat-manifest.json"))],
    ["packages/shared/backend/constants/domain-catalog.json", fs.existsSync(path.join(ROOT, "packages/shared/backend/constants/domain-catalog.json"))],
    [".agents/context/ASSEMBLY.md", fs.existsSync(path.join(ROOT, ".agents/context/ASSEMBLY.md"))],
    [".agents/hooks/adapters.json", fs.existsSync(path.join(ROOT, ".agents/hooks/adapters.json"))],
  ]
  console.log(`\n[真源]\n${truths.map(([f, e]) => `  ${e ? ok : bad} ${f}`).join("\n")}`)

  // 4) 主干完整性：TRUNK 里的命令必须指向真实脚本
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"))
  const scripts = pkg.scripts || {}
  const required = ["check", "test:unit", "test:integration", "test:contract", "hatch:e2e", "agent:route", "speckit:new", "evolution:backlog"]
  const missing = required.filter((s) => !scripts[s])
  console.log(
    `\n[主干]\n  ${missing.length ? bad : ok} 必需脚本 ${required.length} 个` +
      (missing.length ? ` —— 缺: ${missing.join(", ")}` : " 全部存在"),
  )

  // 5) 孤儿扫描：scripts/ 下既无 npm script、又未被门禁链/测试引用的
  const orphan = findOrphans(pkg)
  console.log(`\n[孤儿脚本]  ${orphan.length ? warn : ok} ${orphan.length} 个`)
  for (const o of orphan.slice(0, 12)) console.log(`  · ${o}`)
  if (orphan.length > 12) console.log(`  … 另有 ${orphan.length - 12} 个`)

  // 6) 类型债务（只读：读基线，不跑 tsc —— doctor 必须快）
  const tcBaseline = path.join(ROOT, "docs/architecture/artifacts/typecheck-baseline.json")
  if (fs.existsSync(tcBaseline)) {
    try {
      const b = JSON.parse(fs.readFileSync(tcBaseline, "utf8"))
      const top = Object.entries(b.byDir || {}).slice(0, 3).map(([d, n]) => `${d} ${n}`).join(" · ")
      // 兼容早期基线（只有 count 与 keys，没有 uniqueKeys 字段）
      const uniq = b.uniqueKeys ?? (Array.isArray(b.keys) ? new Set(b.keys).size : "?")
      console.log(`\n[类型债务]  ${ok} 基线 ${b.count} 条诊断 / ${uniq} 唯一键  （${top}）`)
      console.log(`  → 棘轮门禁：pnpm run typecheck:check（新增即失败）`)
    } catch {
      console.log(`\n[类型债务]  ${warn} 基线文件无法解析`)
    }
  } else {
    console.log(`\n[类型债务]  ${warn} 无基线 —— 跑: node scripts/check-typecheck-ratchet.cjs --write-baseline`)
  }

  const failed = !hooksPath || missing.length > 0 || truths.some(([, e]) => !e)
  console.log(`\n结论: ${failed ? "存在硬问题（见上面 ✗）" : "无硬问题"}`)
  return failed ? 1 : 0
}

/** 扫描 scripts/ 下"没人调用"的脚本（启发式，仅供体检，不阻断） */
function findOrphans(pkg) {
  const all = fs.readdirSync(path.join(ROOT, "scripts")).filter((f) => /\.(cjs|mjs|js|ts)$/.test(f))
  const scriptValues = Object.values(pkg.scripts || {}).join("\n")
  const checkChain = pkg.scripts?.check || ""

  // 被测试/配置/文档引用的也算"有人用"
  const referenced = (name) => {
    if (scriptValues.includes(name)) return true
    if (checkChain.includes(name)) return true
    // **必须包括 docs/ 与 AGENTS.md** —— 实测漏掉它们会报出大量假孤儿
    // （例如 `align-validator-types.ts` 只在 AGENTS 的交付链里被点名，
    //   但它是真实入口，不是孤儿）。孤儿扫描是**报告**，假阳性会让人直接忽略它。
    const probes = [
      path.join(ROOT, "AGENTS.md"),
      path.join(ROOT, "docs"),
      path.join(ROOT, "scripts"),
      path.join(ROOT, "test"),
      path.join(ROOT, ".github"),
      path.join(ROOT, ".githooks"),
      path.join(ROOT, ".agents"),
    ]
    for (const dir of probes) {
      if (!fs.existsSync(dir)) continue
      const hit = spawnSync("grep", ["-rl", "--include=*", "--exclude-dir=node_modules", "--exclude-dir=.next-ruoyi", "--exclude-dir=.next", "--exclude-dir=.claude", name, dir], { encoding: "utf8" })
      // **必须排除它自己**：`scripts/` 探针会命中文件本身 → 造成"孤儿漏报"
      // （实测：`agent-autopilot-daemon.ts` 因此被判为"有人用"，而真实工程里没人调它）。
      const hits = (hit.stdout || "").split("\n").map((l) => l.trim()).filter(Boolean)
      if (hits.some((h) => path.basename(h) !== name)) return true
    }
    return false
  }

  return all.filter((f) => !referenced(f))
}

// ── 分派 ────────────────────────────────────────────────────────────
function main() {
  switch (sub) {
    case "help":
    case "--help":
    case "-h":
      return help()

    case "doctor":
      return doctor()

    case "route":
      return pnpmRun("agent:route", rest)

    case "spec": {
      const action = rest[0]
      const extra = rest.slice(1)
      if (!action) {
        console.error("[harness] spec 需要子动作（speckit 的子命令，如 new | build | check | tasks | archive | list）")
        return 2
      }
      // 优先用现成的 npm script；没有就直呼 speckit.ts 的同一子命令。
      // **不写死动作白名单**：写死了就会出现「主干支持的」与「工具自己提示的」两套入口
      // （实测 speckit.ts 提示 list / init / cmmi，而主干只认 5 个 —— 用户照着提示敲会失败）。
      const pkgScripts = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).scripts || {}
      if (pkgScripts[`speckit:${action}`]) return pnpmRun(`speckit:${action}`, extra)
      return nodeScript("scripts/speckit.ts", [action, ...extra])
    }

    // **必须与 `pnpm run check` 完全等价** —— 直接转发，不加任何额外参数
    case "check":
      return pnpmRun("check")

    case "test": {
      const fast = rest.includes("--fast")
      let code = pnpmRun("test:unit")
      if (code === 0) code = pnpmRun("test:integration")
      if (code === 0) code = pnpmRun("test:contract")
      if (code === 0 && !fast) code = pnpmRun("test:e2e")
      return code
    }

    case "e2e":
      return pnpmRun("hatch:e2e", rest)

    case "deliver": {
      // 交付门：逐条跑，**任何一条失败即整体失败**（不聚合、不降级）
      const steps = ["build", "smoke:login", "security:scan", "load:test", "fingerprint:verify"]
      for (const s of steps) {
        console.log(`\n[harness deliver] → ${s}`)
        const code = pnpmRun(s)
        if (code !== 0) {
          console.error(`[harness deliver] ✗ ${s} exit=${code} —— 交付门未通过（不继续后续步骤）`)
          return code
        }
      }
      console.log("\n[harness deliver] ✓ 全部通过")
      return 0
    }

    case "baseline": {
      // 显式运维动作：会写文件（与 doctor 的只读承诺分开）
      return nodeScript("scripts/check-harness-integrity.cjs", ["--write-reachability-baseline"])
    }

    case "dev":
    case "build":
    case "lint":
    case "release": {
      // 单值主干：直接转发同名 npm script（release 走 release:package）
      return pnpmRun(sub === "release" ? "release:package" : sub, rest)
    }

    case "db":
    case "project":
    case "domain":
    case "sync":
    case "verify":
    case "tables":
    case "mcp":
    case "runtime":
    case "domains":
    case "socratic":
    case "upstream":
    case "scaffold": {
      const group = GROUPS[sub]
      const action = rest[0] || ""
      const target = group[action]
      if (!target) {
        console.error(`[harness] ${sub} 需要子动作：${Object.keys(group).filter(Boolean).join(" | ")}`)
        return 2
      }
      return pnpmRun(target, rest.slice(1))
    }

    case "agent": {
      // 委托给 scripts/agent-runtime.cjs，**不在这里重写逻辑**（单一真源）
      const action = rest[0] || "status"
      return nodeScript("scripts/agent-runtime.cjs", [action])
    }

    case "ops":
      return pnpmRun("agent:ops", rest)

    case "evolve":
      return pnpmRun("evolution:backlog")

    default:
      console.error(`[harness] 未知子命令: ${sub}`)
      help()
      return 2
  }
}

process.exit(main())
