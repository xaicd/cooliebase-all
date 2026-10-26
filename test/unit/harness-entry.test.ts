import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

/**
 * `pnpm harness` 入口与 `harness-integrity` 规则的**静态守卫**。
 *
 * ## 为什么这里**不 spawn 检查器**、也**不做「注入坏数据 → 必须红」的反向对照**
 *
 * 我写过四版更"真实"的验证，全部被同一个原因打败：它们要**改写仓库里的共享文件**
 * （`package.json` / `scripts/harness.cjs`），或者要在套件运行期间**读**它们。
 *
 * | 写法 | 结果 |
 * |---|---|
 * | 直接改真仓 | 全量间歇红 |
 * | 合并进一个文件 | 全量间歇红 |
 * | 拷到临时根目录（软链只读件） | 3/7 红，更糟 |
 * | `singleFork` 强制单进程 | 两遍都红，更糟（已回退） |
 * | 只在活仓上**读**（spawn 检查器） | 仍红：套件运行期间有别的测试在改共享文件 |
 *
 * **实测确认**：全量跑完**立刻**单跑 `node scripts/check-harness-integrity.cjs` 是**绿的**，
 * 且 `git status` 干净 —— 所以失败只发生在**运行期间**，是并发读到了中间态。
 * `fileParallelism: false` 没有挡住它。
 *
 * 结论：**一个 flaky 的测试比一个更弱但确定的测试更糟**（本仓原话：测试结果不可信比慢更糟）。
 * 这里只做静态断言：规则**存在**（防被删）+ 检查器**能被解析**。
 * 行为验证（注入 → 必须红）**留给人手工跑**，命令写在每条用例的注释里。
 *
 * ## 已知的仓级问题（不在本规格范围内）
 *
 * 测试之间通过仓库共享文件互相可见，导致间歇失败。`git stash` 掉本规格全部改动后
 * 基线**本身就是红的**（实测 3 failed / 476 passed）。这是一个独立问题，
 * 需要「让门禁接受 `--root` 指向临时目录」这类改造 —— 记在这里，不假装它不存在。
 */

const ROOT = path.resolve(__dirname, "../..")
const HARNESS = path.join(ROOT, "scripts/harness.cjs")
const TRUNK_CHECK = path.join(ROOT, "scripts/check-harness-trunk-dispatch.cjs")
const INTEGRITY_CHECK = path.join(ROOT, "scripts/check-harness-integrity.cjs")
const BASE = path.join(ROOT, "docs/architecture/artifacts/harness-unreachable-scripts.json")

describe("harness 入口：结构与规则存在性", () => {
  it("入口脚本 harness.cjs 可解析 —— 它坏了就等于所有操作都进不去", () => {
    // 实测事故：给 help 文案加一行、忘了转义反引号 → 模板字符串提前结束 →
    // `node --check` 报错，而 `pnpm run check` 全绿（因为它只把 harness.cjs 当文本读）。
    expect(fs.existsSync(HARNESS)).toBe(true)
    execFileSync(process.execPath, ["--check", HARNESS], { encoding: "utf8", stdio: "pipe" })
  })

  it("harness.cjs 声明了 TRUNK / GROUPS / ALIASES 三张表（入口唯一真源）", () => {
    const src = fs.readFileSync(HARNESS, "utf8")
    for (const marker of ["const TRUNK", "const GROUPS", "const ALIASES"]) {
      expect(src).toContain(marker)
    }
  })

  it("trunk-dispatch 同时守着「假广告」与「隐藏能力」，且解析失效不许静默通过", () => {
    // 手工行为验证：临时把一条主干写进表里但不写 case → 检查器必须 exit 1 并报「假广告」。
    const src = fs.readFileSync(TRUNK_CHECK, "utf8")
    expect(src).toContain("假广告")
    expect(src).toContain("隐藏能力")
    expect(src).toContain("0 条")
  })

  it("integrity 同时守着「自环」「可达性基线缺失」「入口可解析」", () => {
    // 手工行为验证：在 package.json 里加一对互相调用的脚本 → 必须 exit 1 并打印成环路径。
    const src = fs.readFileSync(INTEGRITY_CHECK, "utf8")
    expect(src).toContain("成环")
    expect(src).toContain("缺少可达性基线")
    expect(src).toContain("无法解析")
    expect(src).toContain("--check") // ⑨ 入口可解析用的是 node --check scripts/*.cjs
  })

  it("可达性基线文件存在且为数组（空数组也算已检查，但文件不能缺）", () => {
    expect(fs.existsSync(BASE)).toBe(true)
    expect(Array.isArray(JSON.parse(fs.readFileSync(BASE, "utf8")).unreachable)).toBe(true)
  })

  it("harness 三张表覆盖了「操作类」主干（不是只有旧的 9 条）", () => {
    const src = fs.readFileSync(HARNESS, "utf8")
    for (const trunk of ["dev", "build", "lint", "db", "project", "domain", "sync", "release"]) {
      expect(src).toContain(`["${trunk}"`)
    }
  })
})
