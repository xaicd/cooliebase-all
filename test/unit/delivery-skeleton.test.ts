import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = path.resolve(__dirname, "../..")
const FIXTURE_SPECS = path.join(ROOT, "docs", "specs", "fixture", "__skeleton_fixture__")
const FIXTURE_FEATURES = path.join(ROOT, "docs", "features", "__skeleton_fixture__")
const cleanFixtures = () => {
  fs.rmSync(FIXTURE_SPECS, { recursive: true, force: true })
  fs.rmSync(FIXTURE_FEATURES, { recursive: true, force: true })
  const fixtureParent = path.dirname(FIXTURE_SPECS)
  if (fs.existsSync(fixtureParent) && fs.readdirSync(fixtureParent).length === 0) {
    fs.rmdirSync(fixtureParent)
  }
}

/**
 * 交付检查器必须**认得出骨架**。
 *
 * 这条测试守的是一个真实的坑: 生成器产出骨架后，如果检查器只看"文件在不在"，
 * 一个**没写任何内容**的 requirements.md 就会让"需求"阶段变绿 —— 假绿。
 * 所以这里同时钉住两个方向: 骨架必须被标 ⚠️；填好的不能被误伤。
 */
describe("delivery 检查器的骨架判定", () => {
  beforeAll(() => {
    // 幂等: 夹具目录若残留（上次跑崩/被中断），create-feature 会**拒绝覆盖**而 exit 2，
    // 整个 beforeAll 抛错 → 这个文件的用例全被跳过。先清后建。
    cleanFixtures()
    // 新流程是两步: create-feature 只产 brief；build-feature 由 brief 展开文档。
    // 骨架 brief 里的占位符会被展开进文档 → 骨架判定应当照样拦住（不假绿）。
    execFileSync("pnpm", ["exec", "tsx", "scripts/create-feature.ts", "--name", "__skeleton_fixture__", "--domain", "fixture", "--title", "骨架夹具"], { cwd: ROOT, stdio: "ignore" })
    execFileSync("node", ["scripts/build-feature.cjs", "--name", "__skeleton_fixture__"], { cwd: ROOT, stdio: "ignore" })
  })
  afterAll(() => cleanFixtures())

  it("全新骨架被标记为未完成（不假绿）", () => {
    const out = execFileSync("node", ["scripts/check-delivery.cjs", "--feature", "__skeleton_fixture__", "--json"], { cwd: ROOT, encoding: "utf8" })
    const data = JSON.parse(out)
    const requirement = data.phases.find((phase: { id: string }) => phase.id === "requirement")
    expect(requirement.skeleton).toMatch(/待填/)
    expect(data.missingTotal).toBeGreaterThan(0)
  })

  it("缺陷清单: 未修的被数出来，缺复现/验证命令的被标出来", () => {
    const dir = path.join(ROOT, "docs", "features", "__bugs__")
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, "feature.json"), JSON.stringify({ name: "__bugs__", domain: "x" }))
    fs.writeFileSync(
      path.join(dir, "bugs.md"),
      [
        "# 缺陷", "",
        "| ID | 现象 | 复现命令 | 验证命令 | 状态 |",
        "|---|---|---|---|---|",
        "| B1 | 下单超卖 | npm run repro:b1 | npm run verify:b1 | 未修 |",
        "| B2 | 弹窗遮罩点不中 | | | 未修 |",
        "| B3 | 已修的历史问题 | cmd | cmd | 已修 |",
        "",
      ].join("\n"),
    )
    try {
      const out = execFileSync("node", ["scripts/check-delivery.cjs", "--feature", "__bugs__", "--json"], { cwd: ROOT, encoding: "utf8" })
      const bugs = JSON.parse(out).bugs
      expect(bugs.present).toBe(true)
      expect(bugs.open).toBe(2)      // B1 + B2（已修的 B3 不算）
      expect(bugs.malformed).toBe(1) // B2 缺复现/验证命令
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("坏掉的 feature.json 给出清晰错误而不是栈（exit 2）", () => {
    const dir = path.join(ROOT, "docs", "features", "__bad_json__")
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, "feature.json"), "{ broken")
    try {
      execFileSync("node", ["scripts/check-delivery.cjs", "--feature", "__bad_json__"], { cwd: ROOT, stdio: "pipe" })
      throw new Error("应当以非 0 退出")
    } catch (error) {
      const status = (error as { status?: number }).status
      expect(status).toBe(2)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("已经填好的特性不被误伤", () => {
    const out = execFileSync("node", ["scripts/check-delivery.cjs", "--feature", "ecommerce", "--json"], { cwd: ROOT, encoding: "utf8" })
    const data = JSON.parse(out)
    const docs = data.phases.filter((phase: { skeleton?: string }) => phase.skeleton)
    expect(docs).toHaveLength(0)
  })
})
