import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * 规则 `frontend-api-url-shape`。
 *
 * 实证：340 个生成客户端写成 `request.put(BASE_URL, data)` 与
 * `request.delete(`${BASE_URL}?id=${id}`)` —— 打的是**集合路径**；
 * 而路由注册里 PUT/DELETE 有 **696 个是 item 级**（`/[id]`），collection 级仅 40 个且全是
 * 定制动作（`/profile`、`/channels` 之类）。即：界面的"编辑保存"与"删除"打的是没人处理的路径。
 *
 * ## 为什么跑在**隔离根**上
 *
 * 本用例要**注入代码**再跑门禁。早先直接改真仓 —— 套件运行期间别的用例会读到中间态，
 * 表现为随机红（见 `test-shared-file-isolation` 规格）。现在改的是临时根的克隆。
 */

const GATE = "scripts/check-engineering-standards.cjs"
const CLIENT = "packages/plugins/plugin-ai/frontend/api/ai-tool.api.ts"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("api-url-shape")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = () => root.run(GATE)

function withInjected<T>(snippet: string, body: (r: ReturnType<typeof runGate>) => T): T {
  const original = root.read(CLIENT)
  try {
    root.write(CLIENT, `${original}\n${snippet}\n`)
    return body(runGate())
  } finally {
    root.write(CLIENT, original)
    if (root.read(CLIENT) !== original) throw new Error("客户端文件未逐字还原")
  }
}

describe("规则：api 客户端 URL 形态（跑在隔离根上）", () => {
  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.code).toBe(0)
    expect(result.out).toMatch(/PASS/)
  }, 120_000)

  it("★ 反向 1：PUT 打到集合路径 → 必须失败", () => {
    withInjected("export const __probePut = async () => request.put<ProbeVO>(BASE_URL, {})", (result) => {
      expect(result.code).toBe(1)
      expect(result.out).toMatch(/frontend-api-url-shape/)
      expect(result.out).toMatch(/PUT 打到集合路径/)
    })
  }, 120_000)

  it("★ 反向 2：DELETE 用 ?id= 查询参数 → 必须失败", () => {
    withInjected(
      "export const __probeDelete = async (id: string) => request.delete<void>(`${BASE_URL}?id=${id}`)",
      (result) => {
        expect(result.code).toBe(1)
        expect(result.out).toMatch(/frontend-api-url-shape/)
        expect(result.out).toMatch(/DELETE 用 \?id=/)
      },
    )
  }, 120_000)

  it("★ 反向 3：正确的 item 路径写法 → **不得**误报", () => {
    withInjected("export const __probeOk = async (id: string) => request.delete<void>(`${BASE_URL}/${id}`)", (result) => {
      expect(result.code).toBe(0)
      // 注意：不能断言"输出里不含规则名" —— PASS 摘要行本身会打印规则名。
      expect(result.out).not.toMatch(/FAIL\s+frontend-api-url-shape/)
    })
  }, 120_000)
})
