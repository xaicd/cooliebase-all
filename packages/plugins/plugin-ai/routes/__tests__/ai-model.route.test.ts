import { describe, expect, it } from "vitest"

import { runWithTenantContext } from "@/modules/shared/backend/lib/biz-tenant"

import { GET as listGET, POST } from "../admin/ai-model/route"
import { DELETE, GET as itemGET, PUT } from "../admin/ai-model/[id]/route"

/**
 * 路由层集成测试（真实调用 route handler）。
 *
 * 为什么要有这一层：本仓此前**从不测路由层**，于是两个系统性缺陷长期漏过 ——
 *   ① 路由调用 `Service.update({ ...body, id })`（签名是 `(id, data)`）→ 更新直接抛错；
 *   ② api 客户端打集合路径 `PUT /resource`、`DELETE /resource?id=`，而路由只在 `/[id]` 上实现 → 405。
 * 单元测试只覆盖 Service，所以全绿；门禁只看静态形态，也全绿。
 * 这个用例把「HTTP 方法 → 路由文件 → Service → 仓储」整条链真实跑一遍。
 */
const TENANT = { tenantId: "1" }

const listRequest = (query = "") => new Request(`http://localhost/api/v1/admin/ai/ai-model${query}`)
const itemRequest = (id: string, init?: RequestInit) =>
  new Request(`http://localhost/api/v1/admin/ai/ai-model/${id}`, init)
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

describe("plugin-ai / ai-model 路由层", () => {
  it("完整 CRUD 链路：创建 → 列表 → 详情 → 更新（并落库）→ 删除 → 详情 404", async () => {
    await runWithTenantContext(TENANT, async () => {
      // ① 创建
      const created = await POST(
        new Request("http://localhost/api/v1/admin/ai/ai-model", {
          method: "POST",
          headers: { "content-type": "application/json" },
          // `model_key` / `provider` 在真实表里是**无默认值的 NOT NULL 列**：
          // 不填则 PostgreSQL 直接拒绝（内存回退不校验，所以此前"通过"）。
          body: JSON.stringify({
            name: "route-probe-model",
            model_key: "route-probe-key",
            provider: "openai",
            sort: 1,
            status: "ENABLED",
          }),
        }),
      )
      if (created.status !== 201) {
        // 带出响应原文：400 可能是校验失败、也可能是真实库约束（NOT NULL/长度/类型）拒绝
        throw new Error(`POST 返回 ${created.status}: ${(await created.text()).slice(0, 200)}`)
      }
      expect(created.status).toBe(201)
      const createdBody = (await created.json()) as { success: boolean; data: { id: string; name: string } }
      expect(createdBody.success).toBe(true)
      const id = String(createdBody.data.id)
      expect(id).toBeTruthy()

      // ② 列表
      const list = await listGET(listRequest("?page=1&pageSize=20"))
      expect(list.status).toBe(200)
      const listBody = (await list.json()) as { success: boolean; data: { items: Array<{ id: string }> } }
      expect(listBody.success).toBe(true)
      expect(listBody.data.items.some((item) => String(item.id) === id)).toBe(true)

      // ③ 详情
      const detail = await itemGET(itemRequest(id), ctx(id))
      expect(detail.status).toBe(200)

      // ④ 更新 —— 这一步正是此前会抛 "Cannot read properties of undefined" 的地方
      const updated = await PUT(
        itemRequest(id, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "route-probe-model-renamed" }),
        }),
        ctx(id),
      )
      expect(updated.status).toBe(200)
      const updatedBody = (await updated.json()) as { success: boolean }
      expect(updatedBody.success).toBe(true)

      // ⑤ 更新必须**真的落库**（不是只回显）
      const afterUpdate = await itemGET(itemRequest(id), ctx(id))
      const afterBody = (await afterUpdate.json()) as { data: { name: string } }
      expect(afterBody.data.name).toBe("route-probe-model-renamed")

      // ⑥ 删除
      const deleted = await DELETE(itemRequest(id, { method: "DELETE" }), ctx(id))
      expect(deleted.status).toBe(200)

      // ⑦ 删除后详情应为 404
      const gone = await itemGET(itemRequest(id), ctx(id))
      expect(gone.status).toBe(404)
    })
  })
})
