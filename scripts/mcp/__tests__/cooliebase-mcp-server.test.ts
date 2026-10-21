import { execFileSync } from "node:child_process"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const require = createRequire(import.meta.url)
const { TOOLS, TOOL_NAMES } = require("../cooliebase-mcp-server.cjs") as {
  TOOLS: { name: string; run: (args: Record<string, unknown>) => unknown }[]
  TOOL_NAMES: string[]
}

/**
 * 示例域从 **catalog 取**，不写死。
 * 写死 "mall"/"pay" 会让本文件在裁剪过的工程（孵化 profile/bundle）里必然失败 ——
 * 而那正是"基座能不能拿来开新项目"的检验点。取第一个插件域，任何 profile 下都成立。
 */
function samplePluginDomain(): string {
  const catalog = call("cooliebase_domain_list")
  const plugin = catalog.layers.plugin?.[0]
  if (!plugin) throw new Error("该工程没有插件域，本用例不适用")
  return plugin
}

/** 平台地基（system/infra）永远在，与 profile 无关。 */
function platformDomain(): string {
  const catalog = call("cooliebase_domain_list")
  return catalog.layers.platform?.[0] ?? "system"
}

function call(name: string, args: Record<string, unknown> = {}): any {
  const tool = TOOLS.find((entry) => entry.name === name)
  if (!tool) throw new Error(`unknown tool ${name}`)
  return tool.run(args)
}

/**
 * MCP 是**给 AI 消费的面** —— 它给错信息的后果比脚本出错更重（AI 会照着错信息干活，
 * 而且不会怀疑）。所以这些工具必须有测试，尤其是"域目录"这类容易被写死的东西。
 */
// base profile（只留 system+infra）下没有任何插件域 —— 依赖示例插件的用例不适用，跳过。
const HAS_PLUGIN_DOMAIN = (call("cooliebase_domain_list").layers.plugin ?? []).length > 0

describe("MCP: 域与插件工具", () => {
  it("工具名唯一且可枚举", () => {
    expect(new Set(TOOL_NAMES).size).toBe(TOOL_NAMES.length)
    expect(TOOL_NAMES.length).toBeGreaterThan(10)
  })

  describe("cooliebase_domain_list", () => {
    it("暴露 plugin 层（只给 business 会让调用方以为这些域不存在）", () => {
      const result = call("cooliebase_domain_list")
      expect(Array.isArray(result.layers.plugin)).toBe(true)
      if (HAS_PLUGIN_DOMAIN) expect(result.layers.plugin.length).toBeGreaterThan(0)
    })

    it("每个域都带真实目录（否则调用方只能猜，而猜错通常不报错）", () => {
      const result = call("cooliebase_domain_list")
      for (const domain of result.domains) {
        expect(domain.dir, `${domain.name} 缺 dir`).toBeTruthy()
      }
      const pluginDomain = HAS_PLUGIN_DOMAIN ? samplePluginDomain() : null
      const someone = pluginDomain ? result.domains.find((d: any) => d.name === pluginDomain) : null
      const platform = result.domains.find((d: any) => d.name === platformDomain())
      if (someone) expect(someone.dir).toBe(`packages/plugins/plugin-${pluginDomain}`)
      expect(platform.dir.startsWith("packages/domains/")).toBe(true)
    })
  })

  describe.skipIf(!HAS_PLUGIN_DOMAIN)("cooliebase_domain_resolve", () => {
    it("插件域 -> 插件目录，且标明 kind=plugin", () => {
      const domain = samplePluginDomain()
      const result = call("cooliebase_domain_resolve", { domain })
      expect(result.isPlugin).toBe(true)
      expect(result.dir).toBe(`packages/plugins/plugin-${domain}`)
      expect(result.pluginId).toBe(`cooliebase.${domain}`)
      expect(result.kind).toBe("plugin")
    })

    it("平台地基仍在地基目录，不算插件", () => {
      const result = call("cooliebase_domain_resolve", { domain: platformDomain() })
      expect(result.isPlugin).toBe(false)
      expect(result.dir.startsWith("packages/domains/")).toBe(true)
      expect(result.kind).toBe("platform")
    })

    it("缺参数直接报错，不静默返回空", () => {
      expect(() => call("cooliebase_domain_resolve", {})).toThrow(/domain is required/)
    })
  })

  describe.skipIf(!HAS_PLUGIN_DOMAIN)("cooliebase_plugin_list", () => {
    it("列出全部插件，且都带真实声明（不是空壳）", () => {
      const result = call("cooliebase_plugin_list")
      // 数量不写死: 孵化 profile 会裁剪插件域，写死会让本文件在裁剪过的工程里失败。
      // 用 catalog 的插件层作为期望值 —— 那才是"本工程应有几个插件"的真源。
      expect(result.count).toBe(call("cooliebase_domain_list").layers.plugin.length)
      for (const plugin of result.plugins) {
        expect(plugin.routeCount, `${plugin.id} 没有路由声明`).toBeGreaterThan(0)
        expect(plugin.capabilities).toContain("api.routes.register")
        expect(plugin.dir.startsWith("packages/plugins/plugin-")).toBe(true)
      }
      // 断言"某个真实存在的插件"具备域级特征，不写死 cooliebase.pay ——
      // 裁剪过的工程里 pay 可能不存在（写死会让本文件在裁剪场景失败）。
      const sample = result.plugins.find((p: any) => p.authSurfaces.includes("operator")) ?? result.plugins[0]
      expect(sample.authSurfaces.length).toBeGreaterThan(0)
      // 域级特征必须在（拆分代理与治理门禁都靠它）
      expect(sample.domainTraits.publicPrefixes.length).toBeGreaterThan(0)
    })
  })

  describe("cooliebase_codegen_targets", () => {
    it.skipIf(!HAS_PLUGIN_DOMAIN)("低代码落点按真实目录解析（插件域不能落到 packages/domains）", () => {
      if (!HAS_PLUGIN_DOMAIN) return
      const domain = samplePluginDomain()
      const result = call("cooliebase_codegen_targets", { domain })
      expect(result.base).toBe(`packages/plugins/plugin-${domain}`)
      expect(result.paths.backend).toBe(`packages/plugins/plugin-${domain}/backend`)
      expect(result.importAlias).toBe(`@/modules/${domain}`)
    })

    it("地基域仍指向 packages/domains", () => {
      const result = call("cooliebase_codegen_targets", { domain: "infra" })
      expect(result.base).toBe("packages/domains/infra")
    })

    it("未知域报错并指路，而不是默默给个路径", () => {
      expect(() => call("cooliebase_codegen_targets", { domain: "nope" })).toThrow(/unknown domain/)
    })
  })
})

/**
 * 写类工具（B1 二期）：一律 plan / preview，**永不落盘**。
 *
 * 两条最关键的不变量必须由测试证明，否则"零落盘"只是一句声明：
 *   1. 不给入口：inputSchema 里没有 write 类入参，返回的 writes 恒为 false；
 *   2. 真的一动不动：调用全部工具后工作区**实测**没有任何变化。
 * 契约见 docs/specs/infra/mcp-write-tools/write-tool-contract.md。
 */
const ROOT = fileURLToPath(new URL("../../..", import.meta.url))

/**
 * 工作区快照。用 `--ignored=matching` 而非裸 `git status --porcelain`：
 * 后者看不见被 .gitignore 覆盖的路径，工具若往 `gen/`、`*.log` 这类地方写就会漏检
 * （一开始就是这么写的，靠反向对照才发现）。delta 比较使它不受既有脏文件影响。
 */
function worktreeSnapshot(): string {
  return execFileSync("git", ["status", "--porcelain", "--ignored=matching"], {
    cwd: ROOT,
    encoding: "utf8",
  })
}

const PLAN_TOOLS = [
  "cooliebase_scaffold_plan",
  "cooliebase_codegen_preview",
  "cooliebase_table_migration_plan",
] as const

/**
 * 从磁盘发现一份真实表元数据模块，**不写死域** —— 裁剪过的工程里某个域未必存在。
 * 找不到就跳过对应用例，而不是让本文件在别的组合下必然失败。
 */
function firstTablesModule(): { rel: string; exportName: string } | null {
  const dir = path.join(ROOT, "scripts", "data")
  if (!fs.existsSync(dir)) return null
  for (const entry of fs.readdirSync(dir).filter((f) => f.endsWith("-tables.ts")).sort()) {
    const source = fs.readFileSync(path.join(dir, entry), "utf8")
    const match = /export const ([A-Za-z0-9_]+)\s*:\s*CodegenConfig\[\]/.exec(source)
    if (match) return { rel: `scripts/data/${entry}`, exportName: match[1] }
  }
  return null
}

const TABLES = firstTablesModule()

describe("MCP: 写类工具（plan/preview，零落盘）", () => {
  /**
   * ★ 必须放在本 describe 的**第一个** it。
   *
   * 它用 delta 比较判断"有没有写盘"，而 delta 只能发现"新增的变化" —— 若先跑的正向用例
   * 已经把某个产物写出来，这里取基线时它已存在，断言就会**假通过**。
   * 实测教训：把写文件探针注入 table_migration_plan 后，本用例依然全绿（因为前面的正向
   * 用例先写了同一个文件）；把它提到首位并配合 --ignored=matching 后探针才被抓住。
   */
  it("★ 零落盘：调用全部写类工具后工作区实测无变化", () => {
    const before = worktreeSnapshot()

    call("cooliebase_scaffold_plan", { domain: "planonlyprobe" })
    if (TABLES) {
      call("cooliebase_table_migration_plan", {
        tables: TABLES.rel,
        export: TABLES.exportName,
        name: "plan_only_probe",
      })
    }
    // 被守卫拒绝的调用同样不得留下任何痕迹 —— 预期抛错，但工作区必须干净
    expect(() => call("cooliebase_codegen_preview", { extractedDir: "scripts" })).toThrow()

    expect(worktreeSnapshot()).toBe(before)
  })

  it("三个工具已注册，且 inputSchema 不含 write 类入参（不给入口）", () => {
    for (const name of PLAN_TOOLS) {
      const tool = TOOLS.find((entry) => entry.name === name)
      expect(tool, `${name} 未注册`).toBeTruthy()
      const props = Object.keys((tool as any).inputSchema.properties ?? {})
      for (const forbidden of ["write", "apply", "force", "yes", "confirm", "commit"]) {
        expect(props, `${name} 暴露了写类入参 ${forbidden}`).not.toContain(forbidden)
      }
    }
  })

  describe("cooliebase_table_migration_plan", () => {
    it.skipIf(!TABLES)("正向：给出可审阅的 DDL 与表数，且标记零落盘", () => {
      if (!TABLES) return
      const result = call("cooliebase_table_migration_plan", {
        tables: TABLES.rel,
        export: TABLES.exportName,
        name: "plan_only_probe",
      })
      expect(result.writes).toBe(false)
      expect(Array.isArray(result.plannedWrites)).toBe(true)
      expect(result.details.tableCount).toBeGreaterThan(0)
      // DDL 必须真的出来 —— 否则"预览"名不副实
      expect(result.details.ddl).toMatch(/CREATE TABLE/)
      // 必须告诉调用方真正落盘的那条命令，而不是让人回头读源码
      expect(result.manualSteps.join(" ")).toMatch(/--write/)
    })

    it("反向：仓库外路径与非法迁移名一律拒绝，不静默纠正", () => {
      expect(() =>
        call("cooliebase_table_migration_plan", { tables: "../../etc/passwd", name: "x" }),
      ).toThrow(/inside the repository/)
      expect(() =>
        call("cooliebase_table_migration_plan", { tables: "scripts/data/whatever.ts", name: "Bad-Name!" }),
      ).toThrow(/invalid migration name/)
    })
  })

  describe("cooliebase_scaffold_plan", () => {
    it("反向：已登记的域被拒绝（本工具只规划**新**域）", () => {
      const existing = call("cooliebase_domain_list").domains[0].name
      expect(() => call("cooliebase_scaffold_plan", { domain: existing })).toThrow(/already registered/)
    })

    it("反向：非法域名被拒绝（域名会进路径与子进程参数）", () => {
      for (const bad of ["../etc", "Upper", "has space", "-leading", "a".repeat(60)]) {
        expect(() => call("cooliebase_scaffold_plan", { domain: bad }), bad).toThrow(/invalid domain/)
      }
    })

    it("正向：新域返回统一契约；元数据缺失时诚实报 not validated 而不编造成功", () => {
      const result = call("cooliebase_scaffold_plan", { domain: "planonlyprobe" })
      expect(result.writes).toBe(false)
      // 元数据文件本用例不会创建 —— 工具必须如实反映，而不是假装校验通过
      expect(result.details.metadataValidated).toBe(false)
      expect(result.details.dryRunExitCode).not.toBe(0)
      expect(result.manualSteps.join(" ")).toMatch(/pnpm run domain:new planonlyprobe/)
    })
  })

  describe("cooliebase_codegen_preview", () => {
    it("反向：目录不存在 / 越界 / 缺 codegen-manifest.json 一律拒绝", () => {
      expect(() => call("cooliebase_codegen_preview", { extractedDir: "tmp/definitely-not-here" })).toThrow(
        /does not exist/,
      )
      expect(() => call("cooliebase_codegen_preview", { extractedDir: "/etc" })).toThrow(/inside the repository/)
      expect(() => call("cooliebase_codegen_preview", { extractedDir: "scripts" })).toThrow(
        /no codegen-manifest\.json/,
      )
    })
  })
})


/**
 * 全接口探测工具（`cooliebase_api_probe`）。
 *
 * 它存在的理由：`/healthz` 只证明"进程活着"，证明不了**342 个契约对应的接口**是否可用
 * 或是否漂移。本工具按 `docs/agent/contracts.json` 逐个调 list 并断言响应结构
 * （`items[]` + 数字 `total`），能抓到浅探抓不到的契约漂移。
 *
 * 两条硬约束在这里被钉死：
 *   1. **零写**：入参只有 baseUrl / contract / limit，没有任何写类字段；
 *   2. **连不上不崩**：如实返回 `reachable:false` + 提示，而不是抛异常。
 */
describe("全接口探测: cooliebase_api_probe", () => {
  const tool = () => TOOLS.find((t: { name: string }) => t.name === "cooliebase_api_probe")

  it("已注册，且入参**不含任何写类字段**（零写契约）", () => {
    const t = tool()
    expect(t, "缺 cooliebase_api_probe —— MCP 面与全接口探测脱节").toBeTruthy()
    const props = Object.keys(t.inputSchema.properties ?? {})
    expect(props.sort()).toEqual(["baseUrl", "contract", "limit"])
    expect(t.inputSchema.additionalProperties).toBe(false)
    // 反向对照：这些词一旦出现，说明工具可能落盘
    for (const forbidden of ["write", "apply", "seed", "purge", "create", "update", "delete"]) {
      expect(props.join(",")).not.toContain(forbidden)
    }
  })

  it("应用不可达时如实返回，而非抛异常", () => {
    const result = tool().run({ baseUrl: "http://127.0.0.1:19999" })
    expect(result.reachable).toBe(false)
    expect(String(result.hint ?? "")).toContain("pnpm run dev")
  })
})
