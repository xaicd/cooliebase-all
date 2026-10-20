import { describe, expect, it } from "vitest"

import { aiApiKeyPageQuerySchema } from "@/plugins/plugin-ai/backend/validators/ai-api-key.validator"
import { wmsInventoryHistoryPageQuerySchema } from "@/plugins/plugin-wms/backend/validators/wms-inventory-history.validator"

/**
 * 列表页 `keyword` 必须能被 page query schema 接受。
 *
 * 缺陷本体：通用列表模板 `packages/shared/frontend/templates/admin-list-page.template.tsx`
 * 会发 `keyword`（`request.get(apiEndpoint, { page, pageSize, keyword })`），
 * 而生成的 `PageQuerySchema` 是 `.strict()` 且只含 `page/pageSize/筛选列` ——
 * 缺 `keyword` 时，**搜索框一打字就 400**：
 *   `{"code":"unrecognized_keys","keys":["keyword"],"message":"Unrecognized key: \"keyword\""}`
 *
 * 实测范围：**339 份 page schema 全部如此**（100%）。其中 `wms` 是**已接线**的域，
 * 也就是说这条缺陷在唯一启用校验器的地方**已经生效**了，只是没有测试覆盖到搜索路径。
 *
 * 修复：生成器模板补 `keyword`（`validator.template.ts`），并按 codemod 回填已有 339 份。
 *
 * 反空转守卫：断言前先确认探针确实是 `.strict()` —— 否则该用例会因 schema 宽松而恒真。
 */
describe("列表页 keyword 不得被 page query schema 拒绝", () => {
  const probes: Array<[string, unknown, unknown]> = [
    ["ai（待接线域）", aiApiKeyPageQuerySchema, "ai-api-key"],
    ["wms（已接线域）", wmsInventoryHistoryPageQuerySchema, "wms-inventory-history"],
  ]

  for (const [label, schema, resource] of probes) {
    it(`${label} ${resource} 的 PageQuerySchema 接受 keyword`, () => {
      // 反空转：必须仍是 strict（否则"接受 keyword"这个断言毫无意义）
      const unknownKey = (schema as { safeParse: (v: unknown) => { success: boolean } }).safeParse({
        page: "1",
        pageSize: "20",
        __definitely_not_a_field__: "x",
      })
      expect(unknownKey.success).toBe(false)

      const result = (schema as { safeParse: (v: unknown) => { success: boolean; error?: unknown } }).safeParse({
        page: "1",
        pageSize: "20",
        keyword: "abc",
      })
      if (!result.success) {
        throw new Error(
          `page schema 拒绝了 keyword（列表搜索框会 400）：${JSON.stringify((result.error as { issues?: unknown[] })?.issues?.slice(0, 2))}`,
        )
      }
      expect(result.success).toBe(true)
    })
  }
})
