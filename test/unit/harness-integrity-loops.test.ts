import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

/**
 * `harness-integrity` ⑦⑧ 两条新检查的**反向对照**。
 *
 * ## ⑦ 脚本自环（enforce）
 * 实测事故：用脚本批量改字符串时误伤了 `package.json` 的脚本值，把
 *   speckit:tasks: "pnpm harness spec tasks"
 * 变成 `harness → speckit:tasks → harness` 的自环 —— `pnpm harness spec tasks`
 * **跑满 600s 超时**（一天内两次）。静态门禁当时查不出它：它只是慢，不报错。
 *
 * ## ⑧ 脚本可达性（ratchet）
 * 用户要求：所有流程与操作都必须能从 `pnpm harness` 进。
 * 到不了的，要么加进主干/分组，要么登记为已知欠债（只减不增）。
 */

const ROOT = path.resolve(__dirname, "../..")
const PKG = path.join(ROOT, "package.json")
const CHECK = path.join(ROOT, "scripts/check-harness-integrity.cjs")
const BASE = path.join(ROOT, "docs/architecture/artifacts/harness-unreachable-scripts.json")

function runCheck(): { code: number; out: string } {
  try {
    return { code: 0, out: execFileSync(process.execPath, [CHECK], { cwd: ROOT, encoding: "utf8" }) }
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` }
  }
}

/** 改一个文件跑一次，无论成败都还原；还原后逐字节断言 */
function withMutated<T extends string>(file: string, mutate: (src: T) => string, run: () => { code: number; out: string }) {
  const original = fs.readFileSync(file, "utf8") as T
  try {
    fs.writeFileSync(file, mutate(original))
    return run()
  } finally {
    fs.writeFileSync(file, original)
    expect(fs.readFileSync(file, "utf8")).toBe(original)
  }
}

describe("harness-integrity ⑦⑧：自环与可达性", () => {
  it("当前仓是绿的，且基线文件存在（空数组也算已检查 —— 但文件不能缺）", () => {
    const { code } = runCheck()
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
      (src) =>
        JSON.stringify(
          { ...JSON.parse(src), scripts: { ...JSON.parse(src).scripts, "ghost-loop": "pnpm run ghost-loop-2", "ghost-loop-2": "pnpm run ghost-loop" } },
          null,
          2,
        ),
      runCheck,
    )
    expect(code).toBe(1)
    expect(out).toContain("成环")
    expect(out).toContain("ghost-loop")
  })

  it("反向对照②：新增一个到不了 harness 的脚本 → 必须 FAIL 并点名它", () => {
    const { code, out } = withMutated(
      PKG,
      (src) =>
        JSON.stringify(
          { ...JSON.parse(src), scripts: { ...JSON.parse(src).scripts, "ghost-unreachable": "node scripts/ghost.cjs" } },
          null,
          2,
        ),
      runCheck,
    )
    expect(code).toBe(1)
    expect(out).toContain("ghost-unreachable")
    expect(out).toContain("pnpm harness")
  })

  it("反向对照④：入口脚本语法坏掉 → 必须 FAIL 并点名", () => {
    // 本轮实测事故：给 help 文案加了一行、忘了转义反引号 →
    // 模板字符串提前结束 → `node --check` 报错，而 `pnpm run check` **全绿**
    //（因为 harness-integrity 只把它当文本读）。入口坏了 = 所有操作都进不去，必须拦住。
    const harness = path.join(ROOT, "scripts/harness.cjs")
    const { code, out } = withMutated(harness, (src) => `${src}\nconst broken = \`unterminated\n`, runCheck)
    expect(code).toBe(1)
    expect(out).toContain("无法解析")
    expect(out).toContain("harness.cjs")
  })

  it("反向对照③：基线文件缺失 → 必须 FAIL（不许「找不到基线就算过」）", () => {
    const original = fs.readFileSync(BASE, "utf8")
    const tmp = `${BASE}.bak-test`
    try {
      fs.renameSync(BASE, tmp)
      const { code, out } = runCheck()
      expect(code).toBe(1)
      expect(out).toContain("缺少可达性基线")
    } finally {
      fs.renameSync(tmp, BASE)
      expect(fs.readFileSync(BASE, "utf8")).toBe(original)
    }
  })
})
