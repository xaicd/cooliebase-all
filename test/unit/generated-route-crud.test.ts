import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { runWithTenantContext } from "@/modules/shared/backend/lib/biz-tenant"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))

/**
 * 第 15 轮批量补齐的 47 个资源（欠债清零前的那批）。
 * 这里逐个跑**真实路由 handler**：创建 → 列表 → 详情 → 更新 → 删除 → 详情 404。
 *
 * 为什么需要这一层：形状测试只能证明"文件导出了什么方法"，证明不了"整条链能跑"。
 * 本仓此前从不测路由层，于是一度出现「路由调用形态错」与「客户端打错路径」两个系统性缺陷，
 * 而全部测试与门禁始终全绿。
 *
 * 说明：内存回退模式（不连真实数据库）。payload 取每个 repository 的 `WRITABLE_COLUMNS` 首列，
 * 因为它一定是该表可写的真实列；这样无需为 47 个资源手写 47 份 payload。
 */
const RESOURCES: Array<[string, string]> = [
  ["bpm", "bpm-process-definition-info"],
  ["crm", "crm-business-product"], ["crm", "crm-business-status-type"], ["crm", "crm-contact-business"],
  ["crm", "crm-contract-product"], ["crm", "crm-owner-record"],
  ["erp", "erp-finance-payment-item"], ["erp", "erp-finance-receipt-item"], ["erp", "erp-purchase-in-item"],
  ["erp", "erp-purchase-order-item"], ["erp", "erp-purchase-return-item"], ["erp", "erp-sale-order-item"],
  ["erp", "erp-sale-out-item"], ["erp", "erp-sale-return-item"], ["erp", "erp-stock-check-item"],
  ["erp", "erp-stock-in-item"], ["erp", "erp-stock-move-item"], ["erp", "erp-stock-out-item"],
  ["im", "im-channel"], ["im", "im-face-pack-item"], ["im", "im-rtc-participant"], ["im", "im-sensitive-word"],
  ["mall", "after-sale-log"], ["mall", "cart"], ["mall", "combination-product"],
  ["mall", "delivery-express-template-charge"], ["mall", "delivery-express-template-free"],
  ["mall", "discount-product"], ["mall", "point-product"], ["mall", "product-sku"],
  ["mall", "seckill-product"], ["mall", "trade-order-item"], ["mall", "trade-order-log"],
  ["member", "member-address"],
  ["mes", "mes-pro-work-record-log"], ["mes", "mes-qc-indicator-result-detail"],
  ["mes", "mes-wm-item-consume-detail"], ["mes", "mes-wm-item-consume"], ["mes", "mes-wm-misc-issue-detail"],
  ["mes", "mes-wm-misc-receipt-detail"], ["mes", "mes-wm-product-produce-detail"],
  ["mes", "mes-wm-product-produce"], ["mes", "mes-wm-transaction"],
  ["pay", "pay-app"], ["pay", "pay-notify-log"], ["pay", "pay-notify-task"], ["pay", "pay-order-extension"],
]

// 用 `*` 匹配目录名，避免把 `[id]` 当成 glob 字符类
const collectionModules = import.meta.glob("../../packages/{plugins/plugin-*,domains/*}/routes/admin/*/route.ts")
const itemModules = import.meta.glob("../../packages/{plugins/plugin-*,domains/*}/routes/admin/*/*/route.ts")

const domainBase = (domain: string) =>
  ["system", "infra"].includes(domain) ? `packages/domains/${domain}` : `packages/plugins/plugin-${domain}`

function firstWritableColumn(domain: string, resource: string): string | null {
  const file = path.join(ROOT, domainBase(domain), "backend", "repositories", `${resource}.repository.ts`)
  if (!fs.existsSync(file)) return null
  const match = fs.readFileSync(file, "utf8").match(/const WRITABLE_COLUMNS = \[([^\]]*)\]/)
  if (!match) return null
  const columns = match[1].split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
  return columns[0] ?? null
}

function findModule(modules: Record<string, () => Promise<unknown>>, domain: string, resource: string, suffix: string) {
  const keys = Object.keys(modules)
  return (
    keys.find((key) => key.endsWith(`/plugin-${domain}/routes/admin/${resource}/${suffix}`))
    ?? keys.find((key) => key.endsWith(`/domains/${domain}/routes/admin/${resource}/${suffix}`))
    ?? null
  )
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

describe("批量补齐的 47 个资源：真实路由 CRUD", () => {
  it("每个资源都能走完 创建 → 列表 → 详情 → 更新 → 删除 → 404", async () => {
    const failures: string[] = []
    let ok = 0

    for (const [domain, resource] of RESOURCES) {
      const key = `${domain}/${resource}`
      const column = firstWritableColumn(domain, resource)
      const collectionKey = findModule(collectionModules, domain, resource, "route.ts")
      const itemKey = findModule(itemModules, domain, resource, "[id]/route.ts")

      if (!column || !collectionKey || !itemKey) {
        failures.push(`${key}: 缺少 payload 列或路由模块（column=${column}, collection=${Boolean(collectionKey)}, item=${Boolean(itemKey)}）`)
        continue
      }

      try {
        const collection = (await collectionModules[collectionKey]()) as Record<string, any>
        const item = (await itemModules[itemKey]()) as Record<string, any>

        await runWithTenantContext({ tenantId: "1" }, async () => {
          const base = `http://localhost/api/v1/admin/${domain}/${resource}`

          const created = await collection.POST(
            new Request(base, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ [column]: "probe" }),
            }),
          )
          if (created.status !== 201) throw new Error(`POST 返回 ${created.status}`)
          const createdBody = (await created.json()) as { success: boolean; data: { id: string } }
          if (!createdBody.success) throw new Error("POST success=false")
          const id = String(createdBody.data?.id ?? "")
          if (!id) throw new Error("POST 未返回 id")

          const list = await collection.GET(new Request(`${base}?page=1&pageSize=20`))
          if (list.status !== 200) throw new Error(`列表返回 ${list.status}`)
          const listBody = (await list.json()) as { data: { items: Array<{ id: string }> } }
          if (!listBody.data.items.some((row) => String(row.id) === id)) throw new Error("列表中找不到刚创建的行")

          const detail = await item.GET(new Request(`${base}/${id}`), ctx(id))
          if (detail.status !== 200) throw new Error(`详情返回 ${detail.status}`)

          const updated = await item.PUT(
            new Request(`${base}/${id}`, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ [column]: "probe-updated" }),
            }),
            ctx(id),
          )
          if (updated.status !== 200) throw new Error(`PUT 返回 ${updated.status}`)

          const afterUpdate = await item.GET(new Request(`${base}/${id}`), ctx(id))
          const afterBody = (await afterUpdate.json()) as { data: Record<string, unknown> }
          if (String(afterBody.data?.[column]) !== "probe-updated") {
            throw new Error(`更新未落库：${column}=${String(afterBody.data?.[column])}`)
          }

          const deleted = await item.DELETE(new Request(`${base}/${id}`, { method: "DELETE" }), ctx(id))
          if (deleted.status !== 200) throw new Error(`DELETE 返回 ${deleted.status}`)

          const gone = await item.GET(new Request(`${base}/${id}`), ctx(id))
          if (gone.status !== 404) throw new Error(`删除后详情应为 404，实际 ${gone.status}`)
        })
        ok += 1
      } catch (error) {
        failures.push(`${key}: ${(error as Error).message}`)
      }
    }

    console.log(`[route-crud] ${ok}/${RESOURCES.length} 通过`)
    for (const failure of failures) console.log(`[route-crud] ${failure}`)
    expect(failures).toEqual([])
    expect(ok).toBe(RESOURCES.length)
  }, 180000)
})
