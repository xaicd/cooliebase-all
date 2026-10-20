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

function payloadTarget(domain: string, resource: string): { table: string; column: string } | null {
  const file = path.join(ROOT, domainBase(domain), "backend", "repositories", `${resource}.repository.ts`)
  if (!fs.existsSync(file)) return null
  const text = fs.readFileSync(file, "utf8")
  const columnsMatch = text.match(/const WRITABLE_COLUMNS = \[([^\]]*)\]/)
  const tableMatch = text.match(/const TABLE_NAME = "([^"]+)"/)
  if (!columnsMatch || !tableMatch) return null
  const columns = columnsMatch[1].split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
  if (columns.length === 0) return null
  return { table: tableMatch[1], column: columns[0] }
}

/**
 * 生成**类型匹配**的写入值。
 *
 * 为什么需要：通用 payload 用字符串 `"probe"` 写所有列，在内存回退下永远能过，
 * 但在**真实库**上会被类型系统拒绝 —— 实测两个资源的首列是整数列，报
 * `invalid input syntax for type integer: "probe"`。这正是 `verify:real-db` 才能暴露的缺陷。
 *
 * 类型真源是**运行时数据库**（这些表来自低代码元数据，不在 prisma/schema.prisma 里）：
 * 有真实连接时查 `information_schema.columns`；内存模式没有类型系统，退回字符串即可。
 */
function valueForType(dataType: string | null, variant: "create" | "update"): unknown {
  const base = variant === "create" ? 1 : 2
  const suffix = variant === "create" ? "probe" : "probe-updated"
  switch ((dataType ?? "").toLowerCase()) {
    case "integer": case "bigint": case "smallint": case "numeric": case "decimal":
    case "real": case "double precision": case "int": case "int4": case "int8":
      return base
    case "boolean": case "bool":
      return variant === "create"
    case "timestamp with time zone": case "timestamp without time zone": case "timestamp": case "date":
      return variant === "create" ? "2026-01-01T00:00:00.000Z" : "2026-01-02T00:00:00.000Z"
    default:
      return suffix
  }
}

/**
 * 从**表元数据**取列类型（离线可得，两种运行模式都有）。
 *
 * 为什么优先用元数据而不是只查 `information_schema`：内存回退模式下查不到真实库，
 * 原来会退回字符串 `"probe"` —— 而这在**接线校验器之后**会被数值列拒成 400
 * （实测 `crm_owner_record.biz_type` 是 `int`，收 `"probe"` → `expected number, received NaN`）。
 * 元数据是离线真源，用它才能让两种模式下 payload 都合法。
 */
async function metadataTypeOf(domain: string, table: string, column: string): Promise<string | null> {
  try {
    const mod = (await import(`../../scripts/data/${domain}-source-tables.ts`)) as Record<string, unknown>
    const list = Object.values(mod).find((value) => Array.isArray(value)) as
      | Array<{ table?: { name?: string; columns?: Array<{ name?: string; type?: string }> } }>
      | undefined
    const config = list?.find((item) => item.table?.name === table)
    return config?.table?.columns?.find((item) => item.name === column)?.type ?? null
  } catch {
    return null
  }
}

async function columnDataType(table: string, column: string): Promise<string | null> {
  const url = process.env.DATABASE_URL
  if (!url) return null // 内存模式：没有类型系统
  const { Client } = require("pg")
  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    const result = await client.query(
      "SELECT data_type FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1",
      [table, column],
    )
    return result.rows?.[0]?.data_type ?? null
  } catch {
    return null
  } finally {
    await client.end().catch(() => undefined)
  }
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
      const target = payloadTarget(domain, resource)
      const column = target?.column ?? null
      const dataType = target
        ? (await metadataTypeOf(domain, target.table, target.column)) ??
          (await columnDataType(target.table, target.column))
        : null
      const createValue = valueForType(dataType, "create")
      const updateValue = valueForType(dataType, "update")
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
              body: JSON.stringify({ [column]: createValue }),
            }),
          )
          if (created.status !== 201) {
            // 把**响应错误原文**带出来：真实库下 400 往往是约束/类型问题，
            // 只说"返回 400"无法判断是路由错还是 payload 不合法。
            const body = await created.text()
            throw new Error(`POST 返回 ${created.status}: ${body.slice(0, 160)}`)
          }
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
              body: JSON.stringify({ [column]: updateValue }),
            }),
            ctx(id),
          )
          if (updated.status !== 200) throw new Error(`PUT 返回 ${updated.status}`)

          const afterUpdate = await item.GET(new Request(`${base}/${id}`), ctx(id))
          const afterBody = (await afterUpdate.json()) as { data: Record<string, unknown> }
          if (String(afterBody.data?.[column]) !== String(updateValue)) {
            throw new Error(`更新未落库：${column}=${String(afterBody.data?.[column])}（期望 ${String(updateValue)}，列类型 ${dataType ?? "memory"}）`)
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
