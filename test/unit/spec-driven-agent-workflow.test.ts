import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = path.resolve(__dirname, "../..")
const { resolveSpecDir, listAllSpecs } = require("../../scripts/lib/spec-resolver.cjs")

const SPEC_NAME = "__agent_test_spec__"
const DOMAIN = "mall"

describe("AI Agent 驱动的 Spec 闭环与防污染生命周期验证", () => {
  const cleanup = () => {
    // 清理活跃区与归档区
    const activeDir = path.join(ROOT, "docs", "specs", DOMAIN, SPEC_NAME)
    fs.rmSync(activeDir, { recursive: true, force: true })
    const domainDir = path.join(ROOT, "docs", "specs", DOMAIN)
    if (fs.existsSync(domainDir) && fs.readdirSync(domainDir).length === 0) {
      fs.rmdirSync(domainDir)
    }

    // 清理归档区
    const archiveRoot = path.join(ROOT, "docs", "specs", "archive")
    if (fs.existsSync(archiveRoot)) {
      for (const q of fs.readdirSync(archiveRoot)) {
        const candidate = path.join(archiveRoot, q, DOMAIN, SPEC_NAME)
        fs.rmSync(candidate, { recursive: true, force: true })
        const dDir = path.join(archiveRoot, q, DOMAIN)
        if (fs.existsSync(dDir) && fs.readdirSync(dDir).length === 0) fs.rmdirSync(dDir)
        const qDir = path.join(archiveRoot, q)
        if (fs.existsSync(qDir) && fs.readdirSync(qDir).length === 0) fs.rmdirSync(qDir)
      }
      if (fs.readdirSync(archiveRoot).length === 0) fs.rmdirSync(archiveRoot)
    }
  }

  beforeAll(() => cleanup())
  afterAll(() => cleanup())

  it("1. Agent 脚手架生成: 必须按域隔离于 docs/specs/<domain>/<name>，并生成规范资源目录与特化 Brief", () => {
    execFileSync(
      "pnpm",
      [
        "exec",
        "tsx",
        "scripts/speckit.ts",
        "new",
        "--name",
        SPEC_NAME,
        "--domain",
        DOMAIN,
        "--title",
        "智能体驱动验证规格",
        "--type",
        "bugfix",
      ],
      { cwd: ROOT, stdio: "ignore" },
    )

    const expectedDir = path.join(ROOT, "docs", "specs", DOMAIN, SPEC_NAME)
    expect(fs.existsSync(expectedDir)).toBe(true)

    // 检查原型切图与 HTML 原型目录
    expect(fs.existsSync(path.join(expectedDir, "assets"))).toBe(true)
    expect(fs.existsSync(path.join(expectedDir, "prototypes"))).toBe(true)

    // 检查 brief.json 中包含 bugfix 专属的根因字段与红灯任务
    const brief = JSON.parse(fs.readFileSync(path.join(expectedDir, "brief.json"), "utf8"))
    expect(brief.type).toBe("bugfix")
    expect(brief.symptom).toBeDefined()
    expect(brief.rootCause).toBeDefined()
    expect(brief.tasks[0].title).toMatch(/Red Test/i)

    // 检查 spec.json 元数据
    const specJson = JSON.parse(fs.readFileSync(path.join(expectedDir, "spec.json"), "utf8"))
    expect(specJson.domain).toBe(DOMAIN)
    expect(specJson.type).toBe("bugfix")
  })

  it("2. Agent 声明式展开: 由 brief 自动展开全套文档，无任何遗漏且具备缺陷特化章节", () => {
    execFileSync("pnpm", ["harness", "spec", "build", "--name", SPEC_NAME], {
      cwd: ROOT,
      stdio: "ignore",
    })

    const specDir = resolveSpecDir(SPEC_NAME)
    expect(specDir).toBeDefined()

    const reqContent = fs.readFileSync(path.join(specDir, "requirements.md"), "utf8")
    expect(reqContent).toContain("缺陷现象 (Symptom)")
    // 生成器实际标题是 `### 根因分析 (Root Cause - 5-Whys)`。
    // 用「锚定标题」的正则而不是旧的精确片段：既容忍标题后缀随模板演进，
    // 又仍然强制它必须是一个**标题行**（比裸 toContain 更强）。
    expect(reqContent).toMatch(/^### 根因分析 \(Root Cause/m)
    expect(reqContent).toContain("类型：`bugfix`")

    expect(fs.existsSync(path.join(specDir, "design.md"))).toBe(true)
    expect(fs.existsSync(path.join(specDir, "tasks.md"))).toBe(true)
    expect(fs.existsSync(path.join(specDir, "runbook.json"))).toBe(true)
    // 资产**按规格类型裁剪**（`260918b5`）：
    //   · prototype.md 只给带界面的类型（feature / enhancement）；
    //   · 本规格是 bugfix（无 UI），产出它才是空壳 —— 所以反过来断言「不该存在」。
    // 用反向断言而不是删掉这一行：删了就没人守着「裁剪规则别被改回去」。
    expect(fs.existsSync(path.join(specDir, "prototype.md"))).toBe(false)
  })

  it("3. Agent 交付门禁验证: delivery:check 能精准识别 docs/specs 下的骨架与任务状态", () => {
    const out = execFileSync(
      "node",
      ["scripts/check-delivery.cjs", "--feature", SPEC_NAME, "--json"],
      { cwd: ROOT, encoding: "utf8" },
    )
    const result = JSON.parse(out)
    expect(result.phases.length).toBeGreaterThan(0)
    // 骨架状态必须准确暴露
    expect(result.missingTotal).toBeGreaterThan(0)
  })

  it("4. 统一检索与全息列表: listAllSpecs 能同时识别活跃与历史规格", () => {
    const specs = listAllSpecs()
    const found = specs.find((s: { name: string }) => s.name === SPEC_NAME)
    expect(found).toBeDefined()
    expect(found.domain).toBe(DOMAIN)
    expect(found.isArchived).toBe(false)
  })

  it("5. 施工完毕后归档: spec:archive 将完成的规格移入按季度隔离的归档区，且仍支持全生命周期追溯", () => {
    execFileSync("pnpm", ["exec", "tsx", "scripts/speckit.ts", "archive", "--name", SPEC_NAME], {
      cwd: ROOT,
      stdio: "ignore",
    })

    // 活跃目录应当不再存在（防止目录污染）
    const activeDir = path.join(ROOT, "docs", "specs", DOMAIN, SPEC_NAME)
    expect(fs.existsSync(activeDir)).toBe(false)

    // 规格解析器仍能从 archive 找到该规格（保证永久可审计追溯）
    const archivedDir = resolveSpecDir(SPEC_NAME)
    expect(archivedDir).not.toBeNull()
    expect(archivedDir).toContain(path.join("docs", "specs", "archive"))

    const archivedSpecJson = JSON.parse(fs.readFileSync(path.join(archivedDir!, "spec.json"), "utf8"))
    expect(archivedSpecJson.archived).toBe(true)
    expect(archivedSpecJson.archiveQuarter).toMatch(/^\d{4}-Q[1-4]$/)
  })
})
