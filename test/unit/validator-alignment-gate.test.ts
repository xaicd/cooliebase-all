import path from "node:path"
import { execFileSync } from "node:child_process"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * `validator-type-drift` 的红灯用例（T1）。
 *
 * ## 它守的是什么
 *
 * 生成物（`*.validator.ts`）与表元数据（`scripts/data/*-tables.ts`，AGENTS §9.5 的真源）
 * 的字段类型必须一致。元数据改了、生成物没重跑，就会漂移 ——
 * 症状是**合法字符串输入在真实消费路径上被 schema 拒绝**（400）。
 *
 * ## 实测到的两个缺陷（2026-10-27）
 *
 * ① **工具不是门禁**：`scripts/align-validator-types.ts` 检测到漂移时只打印
 *    「需改: N 处」，然后 **exit 0**。所以它接进 `check` 也永远绿。
 * ② **有识别盲区**：正则只认 `z.coerce.number()` / `z.string()` / `z.boolean()`；
 *    手写的 `z.number()` **完全不被识别** —— 报「需改: 0 处」看起来像没问题，
 *    实际是没看见。
 *
 * ## 为什么跑在隔离根上
 *
 * 用例要**注入漂移**（改一个真实的 validator 文件）。真仓不能碰 ——
 * 否则别的测试会读到中间态（见 `test-shared-file-isolation` 规格）。
 */

const GATE = "scripts/align-validator-types.ts"
/** 元数据是 varchar、生成物是 z.string() 的一列 —— 拿它做注入靶子。 */
const VICTIM = "packages/plugins/plugin-ai/backend/validators/ai-api-key.validator.ts"
const CLEAN_DECL = "name: z.string().trim().optional()"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("validator-align")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

/** 跑工具。`--check` 是 T2 要加的模式；现在传进去会被忽略。 */
function runTool(args: string[]): { code: number; out: string } {
  // 隔离根里没有 node_modules，所以借用真仓的 tsx（只读执行，不改真仓）
  const tsx = path.resolve(__dirname, "../../node_modules/.bin/tsx")
  try {
    return {
      code: 0,
      out: execFileSync(tsx, [path.join(root.dir, GATE), ...args], { cwd: root.dir, encoding: "utf8" }),
    }
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` }
  }
}

/** 注入漂移跑一次，无论成败都还原 */
function withInjected<T>(replacement: string, body: () => T): T {
  const original = root.read(VICTIM)
  try {
    expect(original).toContain(CLEAN_DECL) // 靶子还在，否则本用例会空转
    root.write(VICTIM, original.replace(CLEAN_DECL, replacement))
    return body()
  } finally {
    root.write(VICTIM, original)
    expect(root.read(VICTIM)).toBe(original)
  }
}

describe("校验器类型对齐：必须是门禁，且不能有盲区（跑在隔离根上）", () => {
  it("干净仓库：--check 通过（exit 0）", () => {
    const r = runTool(["--all", "--check"])
    expect(r.code).toBe(0)
  }, 120_000)

  it("★ 反向对照①：注入漂移（工具认识的写法）→ --check 必须失败并点名表.字段", () => {
    // 这是**当前缺陷的核心**：工具会报 "需改: 1 处"，但退出码仍是 0。
    withInjected("name: z.coerce.number().optional()", () => {
      const r = runTool(["--all", "--check"])
      expect(r.code, "有漂移时 --check 必须非零退出").not.toBe(0)
      expect(r.out).toMatch(/ai-api-key\.name/)
    })
  }, 120_000)

  it("★ 反向对照②：手写 z.number() 也不许漏（识别盲区）", () => {
    // 正则只认 z.coerce.number()，所以这种写法当前报 0 处 —— 盲区。
    withInjected("name: z.number().optional()", () => {
      const r = runTool(["--all", "--check"])
      expect(r.code, "手写 z.number() 也是漂移，必须非零退出").not.toBe(0)
      expect(r.out).toMatch(/ai-api-key\.name/)
    })
  }, 120_000)

  it("--check 与 --write 互斥（否则门禁会改代码）", () => {
    const r = runTool(["--all", "--check", "--write"])
    expect(r.code, "同时给 --check 与 --write 应当报用法错误并退出 2").toBe(2)
  }, 120_000)

  it("--check 不写盘：跑完隔离根里的文件逐字节不变", () => {
    const before = root.read(VICTIM)
    withInjected("name: z.coerce.number().optional()", () => {
      runTool(["--all", "--check"])
      // 注入仍在（因为我们自己写的），但工具不得把它改回去
      expect(root.read(VICTIM)).toContain("z.coerce.number()")
    })
    expect(root.read(VICTIM)).toBe(before)
  }, 120_000)
})
