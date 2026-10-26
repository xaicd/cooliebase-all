import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

/**
 * `pnpm harness` 入口的**反向对照**全集。
 *
 * **为什么两个 describe 必须在同一个文件里**（不是风格偏好，是实测教训）：
 * 这些用例都要临时改写 `scripts/harness.cjs` / `package.json` / 挪基线文件；
 * 而 vitest 用**并行 worker 跑不同文件**。拆成两个文件时，
 * 一个文件把 `harness.cjs` 弄坏，另一个正好读到它 —— 于是**互相污染**，
 * 症状是「单跑全绿、全量必红」，而且报的错完全指错方向。
 * **同文件内默认串行**，合并即可消除竞争。
 */

const ROOT = path.resolve(__dirname, "../..")
const HARNESS = path.join(ROOT, "scripts/harness.cjs")
const CHECK = path.join(ROOT, "scripts/check-harness-trunk-dispatch.cjs")
const INTEGRITY = path.join(ROOT, "scripts/check-harness-integrity.cjs")
const PKG = path.join(ROOT, "package.json")
const BASE = path.join(ROOT, "docs/architecture/artifacts/harness-unreachable-scripts.json")

function run(script: string): { code: number; out: string } {
  try {
    return { code: 0, out: execFileSync(process.execPath, [script], { cwd: ROOT, encoding: "utf8" }) }
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` }
  }
}

const runCheck = () => run(CHECK)
const runIntegrity = () => run(INTEGRITY)

/** 改 `harness.cjs` 跑一次，无论成败都还原；还原后必须与原文逐字节相同 */
function withMutatedHarness(mutate: (src: string) => string): { code: number; out: string } {
  const original = fs.readFileSync(HARNESS, "utf8")
  try {
    fs.writeFileSync(HARNESS, mutate(original))
    return runCheck()
  } finally {
    fs.writeFileSync(HARNESS, original)
    expect(fs.readFileSync(HARNESS, "utf8")).toBe(original)
  }
}

/** 通用版：任意文件 × 任意检查器 */
function withMutated<T extends string>(
  file: string,
  mutate: (src: T) => string,
  runIt: () => { code: number; out: string },
) {
  const original = fs.readFileSync(file, "utf8") as T
  try {
    fs.writeFileSync(file, mutate(original))
    return runIt()
  } finally {
    fs.writeFileSync(file, original)
    expect(fs.readFileSync(file, "utf8")).toBe(original)
  }
}

describe("harness-trunk-dispatch：主干表与分派必须一致", () => {
  it("当前仓是绿的，且真的解析出了主干（不是「解析不到就算过」）", () => {
    const { code, out } = runCheck()
    expect(code).toBe(0)
    const m = out.match(/主干 (\d+) 条/)
    expect(m).toBeTruthy()
    expect(Number(m![1])).toBeGreaterThanOrEqual(8)
    for (const t of ["route", "spec", "check", "test", "e2e", "deliver", "agent", "ops", "evolve"]) {
      expect(out).toContain(t)
    }
  })

  it("反向对照①：表里加一条「假广告」（没有对应 case）必须红", () => {
    const { code, out } = withMutatedHarness((src) =>
      src.replace(
        /^(\s*\["route",)/m,
        '  ["ghost-trunk", "pnpm harness ghost-trunk", "故意加的假广告（测试注入）"],\n$1',
      ),
    )
    expect(code).toBe(1)
    expect(out).toContain("假广告")
    expect(out).toContain("ghost-trunk")
  })

  it("反向对照②：加一个「隐藏能力」（有 case 但表里没有）必须红", () => {
    const { code, out } = withMutatedHarness((src) =>
      src.replace(/^(\s*case "doctor":)/m, '$1\n    case "ghost-hidden":\n      return 0'),
    )
    expect(code).toBe(1)
    expect(out).toContain("隐藏能力")
    expect(out).toContain("ghost-hidden")
  })

  it("反向对照③：主干表被清空必须红（不许静默通过）", () => {
    const { code, out } = withMutatedHarness((src) =>
      src.replace(/^\s*\["[a-z][a-z0-9-]*",\s*"pnpm harness.*$/gm, ""),
    )
    expect(code).toBe(1)
    expect(out).toContain("0 条")
  })
})

describe("harness-integrity ⑦⑧⑨：自环 / 可达性 / 入口可解析", () => {
  it("当前仓是绿的，且基线文件存在（空数组也算已检查 —— 但文件不能缺）", () => {
    const { code } = runIntegrity()
    expect(code).toBe(0)
    expect(fs.existsSync(BASE)).toBe(true)
    const base = JSON.parse(fs.readFileSync(BASE, "utf8"))
    // 当前**全部可达**，所以是空数组 —— 不再断言 >0（那不是目标）。
    // 真正要守的是「文件必须在」：它本身就是"可达性被检查过"的凭证。
    expect(Array.isArray(base.unreachable)).toBe(true)
  })

  it("反向对照①：注入一个脚本自环 → 必须 FAIL 并指出成环路径", () => {
    const { code, out } = withMutated(
      PKG,
      (src) => {
        const pkg = JSON.parse(src)
        return JSON.stringify(
          {
            ...pkg,
            scripts: { ...pkg.scripts, "ghost-loop": "pnpm run ghost-loop-2", "ghost-loop-2": "pnpm run ghost-loop" },
          },
          null,
          2,
        )
      },
      runIntegrity,
    )
    expect(code).toBe(1)
    expect(out).toContain("成环")
    expect(out).toContain("ghost-loop")
  })

  it("反向对照②：新增一个到不了 harness 的脚本 → 必须 FAIL 并点名它", () => {
    const { code, out } = withMutated(
      PKG,
      (src) => {
        const pkg = JSON.parse(src)
        return JSON.stringify({ ...pkg, scripts: { ...pkg.scripts, "ghost-unreachable": "node scripts/ghost.cjs" } }, null, 2)
      },
      runIntegrity,
    )
    expect(code).toBe(1)
    expect(out).toContain("ghost-unreachable")
    expect(out).toContain("pnpm harness")
  })

  it("反向对照③：入口脚本语法坏掉 → 必须 FAIL 并点名", () => {
    // 本轮实测事故：给 help 文案加了一行、忘了转义反引号 →
    // 模板字符串提前结束 → `node --check` 报错，而 `pnpm run check` **全绿**
    //（因为 harness-integrity 只把它当文本读）。入口坏了 = 所有操作都进不去，必须拦住。
    const { code, out } = withMutated(HARNESS, (src) => `${src}\nconst broken = \`unterminated\n`, runIntegrity)
    expect(code).toBe(1)
    expect(out).toContain("无法解析")
    expect(out).toContain("harness.cjs")
  })

  it("反向对照④：基线文件缺失 → 必须 FAIL（不许「找不到基线就算过」）", () => {
    const original = fs.readFileSync(BASE, "utf8")
    const tmp = `${BASE}.bak-test`
    try {
      fs.renameSync(BASE, tmp)
      const { code, out } = runIntegrity()
      expect(code).toBe(1)
      expect(out).toContain("缺少可达性基线")
    } finally {
      fs.renameSync(tmp, BASE)
      expect(fs.readFileSync(BASE, "utf8")).toBe(original)
    }
  })
})
