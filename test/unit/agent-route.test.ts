import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterAll, describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const SCRIPT = "scripts/agent-route.cjs"
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "agent-route-test-"))

afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }))

/**
 * 需求分诊器（`npm run agent:route`）。
 *
 * 守的是什么：此前"这条需求要不要立规格"**没有任何判定**（入口文件写的是"所有 feature/bugfix/
 * enhancement/refactor 都归规格管"，等于全都需要、也等于没判断）。现在判定权收归仓内一条命令。
 *
 * 三条必须成立的性��：
 * 1. **确定性**：同一段输入永远同一个结论（不允许"看模型心情"）；
 * 2. **判不准宁严勿宽**：两边规则都不命中时，要求规格 —— 多走一步流程，优于漏掉一次；
 * 3. **可溯源**：输出必须说明命中了哪几条规则，改规则改的是那张表而不是去猜模型。
 */
function route(requirement: string, extraEnv: Record<string, string> = {}) {
  const env = {
    ...process.env,
    AGENT_ROUTE_LOG_DIR: path.join(TMP, "log"),
    AGENT_ROUTE_ARTIFACT: path.join(TMP, "last.json"),
    ...extraEnv,
  }
  const stdout = execFileSync("node", [SCRIPT, requirement], { cwd: ROOT, encoding: "utf8", env })
  return stdout
}

function routeJson(requirement: string) {
  const env = {
    ...process.env,
    AGENT_ROUTE_LOG_DIR: path.join(TMP, "log"),
    AGENT_ROUTE_ARTIFACT: path.join(TMP, "last.json"),
  }
  const stdout = execFileSync("node", [SCRIPT, "--json", requirement], { cwd: ROOT, encoding: "utf8", env })
  return JSON.parse(stdout) as {
    verdict: string
    specType: string
    matched: string[]
    exempted: string[]
    noTask: string[]
  }
}

describe("需求分诊：是否需要走规格流程", () => {
  it("新增能力（含建表/页面）→ 要求规格，且能说明命中了哪些规则", () => {
    const out = route("给商城加一个优惠券秒杀功能，需要新表和前端页面")
    expect(out).toMatch(/SPEC_REQUIRED/)
    expect(out).toMatch(/db-schema/)
    expect(out).toMatch(/page-ui/)
    // 可溯源：输出里必须出现命中理由，而不是只给一个结论
    expect(out).toMatch(/必须/)
  })

  it("文案错别字 → 可直接改（豁免只因自身不触发规格）", () => {
    const out = route("修一下 README 里的错别字")
    expect(out).toMatch(/DIRECT_OK/)
    expect(out).toMatch(/typo-doc/)
  })

  it("★ 判不准时宁严勿宽：未命中任何规则的输入 → 仍要求规格", () => {
    const result = routeJson("帮我看下这个")
    expect(result.verdict).toBe("SPEC_REQUIRED")
    expect(result.matched).toEqual([])
    expect(result.exempted).toEqual([])
  })

  it("★ 同时命中「豁免」与「需要规格」→ 以需要规格为准（豁免不是免死金牌）", () => {
    const result = routeJson("改一下文档，顺便加一个导出接口")
    expect(result.verdict).toBe("SPEC_REQUIRED")
    expect(result.exempted.length).toBeGreaterThan(0) // 确实命中了豁免词
    expect(result.matched).toContain("api-contract")
  })

  it("★ 确定性：同一段输入连跑两次结论一致", () => {
    const first = routeJson("重构一下支付模块，拆分状态机")
    const second = routeJson("重构一下支付模块，拆分状态机")
    expect(first.verdict).toBe(second.verdict)
    expect(first.matched).toEqual(second.matched)
    expect(first.specType).toBe("refactor")
  })

  it("兑现 §15：写入当日记录且序号递增（此前只有条文、无强制）", () => {
    route("第一条：补一个测试")
    route("第二条：再补一个测试")
    const logDir = path.join(TMP, "log")
    const files = fs.readdirSync(logDir).filter((name) => name.endsWith(".md"))
    expect(files).toHaveLength(1)
    const content = fs.readFileSync(path.join(logDir, files[0]), "utf8")
    expect(content).toMatch(/### 1\./)
    expect(content).toMatch(/### 2\./)
    expect(content).toMatch(/第一条：补一个测试/)
    expect(content).toMatch(/需求原文/)
  })

  /**
   * ★ 以下 6 条来自**真实历史输入的回测**（不是编的用例）。
   *
   * 初版分类器在 11 条真实对话上**全部**判 SPEC_REQUIRED —— 因为 fail-safe 把
   * "没命中任何规则"也当成需要规格，于是「干」「你做决定」这些根本不是需求的输入也要立规格。
   * **全都需要规格 = 没人会遵守 = 机制自己死掉**。故引入第三类 `NOT_A_REQUIREMENT`，
   * 并把这几条真实输入固化成回归测试。
   */
  it("★ 回测：「干」这类纯确认 → 不是需求（不立规格、也不改代码）", () => {
    expect(routeJson("干").verdict).toBe("NOT_A_REQUIREMENT")
  })

  it("★ 回测：「你做决定,自己进化」→ 授权，不是需求", () => {
    const result = routeJson("你做决定,自己进化")
    expect(result.verdict).toBe("NOT_A_REQUIREMENT")
    expect(result.noTask).toContain("autonomy-grant")
  })

  it("★ 回测：「现在情况是我主要使用 cmd/Claude Code,不是 IDE」→ 上下文陈述，不是需求", () => {
    expect(routeJson("现在情况是 我主要使用 cmd,claude code, agy,Hermes 终端啊,不是ide").verdict).toBe(
      "NOT_A_REQUIREMENT",
    )
  })

  it("★ 回测：「继续做,直到满足你的目标」→ 续作指令，不是需求", () => {
    expect(routeJson("继续做,直到 满足你的目标").verdict).toBe("NOT_A_REQUIREMENT")
  })

  it("★ 回测：「你看看隔壁仓库最近更新了啥」→ 调研提问，不是需求", () => {
    expect(routeJson("你看看 隔壁 coolie 最近更新了啥, 开发规范,交付规范 是否有值得学习的地方").verdict).toBe(
      "NOT_A_REQUIREMENT",
    )
  })

  it("★ 回测：名词「开发」不得被当成「新增能力」（曾把「让开发自己决定」误判为需要规格）", () => {
    const result = routeJson("你把变更放入一个文档说明，让他们的项目开发自己决定吧")
    expect(result.verdict).toBe("DIRECT_OK")
    expect(result.matched).not.toContain("feature-word")
  })

  it("★ 回测：但「继续跑真实库测试并按域修复分歧」仍按任务处理（续作词不得盖过真实任务）", () => {
    expect(routeJson("继续跑真实库域级测试并按域修复分歧").verdict).toBe("SPEC_REQUIRED")
  })

  it("机器可读记录含判定与命中规则（供 hooks / 门禁核对跑没跑过）", () => {
    routeJson("新增一个 CRM 客户公海接口")
    const record = JSON.parse(fs.readFileSync(path.join(TMP, "last.json"), "utf8")) as Record<string, unknown>
    expect(record.verdict).toBe("SPEC_REQUIRED")
    expect(record).toHaveProperty("requirementHash")
    expect(record).toHaveProperty("rulesVersion")
    expect(Array.isArray(record.matched)).toBe(true)
  })
})
