import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * 规则 `route-service-update-arity`。
 *
 * 它守的是一个**实证过的系统性缺陷**：339 个代码生成的服务声明 `update(id, data, …)`，
 * 而 348 处 route 调用写成 `Service.update({ ...body, id })` —— 实测抛
 * `Cannot read properties of undefined (reading 'name')`，即**更新接口全部失效**。
 *
 * 关键是它**必须先解析服务的真实签名**：`SystemDeptService.update(input: UpdateInput)`
 * 是手写定制服务、签名本就是单对象，那种调用是对的。第一版规则没做这件事，直接误报了它。
 *
 * ## 为什么跑在**隔离根**上
 *
 * 本用例要**注入代码**再跑门禁。早先直接改真仓 —— 套件运行期间别的用例会读到中间态，
 * 表现为随机红（见 `test-shared-file-isolation` 规格）。现在改的是临时根的克隆。
 */

const GATE = "scripts/check-engineering-standards.cjs"

/** 代码生成的服务：签名是 (id, data, …) —— 传单对象首参就是错的。 */
const CODEGEN_ROUTE = "packages/plugins/plugin-ai/routes/admin/ai-tool/[id]/route.ts"
/** 手写定制服务：签名是 (input: UpdateInput) —— 单对象首参是**对的**。 */
const BESPOKE_ROUTE = "packages/domains/system/routes/admin/depts/[id]/route.ts"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("route-arity")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = () => root.run(GATE)

function withInjected<T>(relPath: string, snippet: string, body: (r: ReturnType<typeof runGate>) => T): T {
  const original = root.read(relPath)
  try {
    root.write(relPath, `${original}\n${snippet}\n`)
    return body(runGate())
  } finally {
    root.write(relPath, original)
    if (root.read(relPath) !== original) throw new Error(`${relPath} 未逐字还原`)
  }
}

describe("规则：route 层 Service.update 参数形态（跑在隔离根上）", () => {
  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.code).toBe(0)
    expect(result.out).toMatch(/PASS/)
  }, 120_000)

  it("★ 反向 1：对「签名是 (id, data)」的服务传单对象 → 必须失败", () => {
    withInjected(CODEGEN_ROUTE, "export const __probe = async () => AiToolService.update({ ...body, id })", (result) => {
      expect(result.code).toBe(1)
      expect(result.out).toMatch(/route-service-update-arity/)
      expect(result.out).toMatch(/ai-tool/)
    })
  }, 120_000)

  it("★ 反向 2：对「签名是单对象」的定制服务传单对象 → **不得**误报", () => {
    // 这条锁的是规则的精度：不做签名解析就会误报 SystemDeptService —— 误报会逼出无意义豁免。
    withInjected(BESPOKE_ROUTE, "export const __probe = async () => SystemDeptService.update({ ...input })", (result) => {
      expect(result.code).toBe(0)
      // 不能断言"输出里不含规则名" —— PASS 摘要行本身就会打印规则名。
      expect(result.out).not.toMatch(/FAIL\s+route-service-update-arity/)
      expect(result.out).not.toMatch(/depts\/\[id\]\/route\.ts/)
    })
  }, 120_000)
})
