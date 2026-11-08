/**
 * PageSchema Service - 端无关「页面 Schema」的存取（低代码底座）。
 *
 * 存储：system_config，key=`page.schema.<entity>`，value=JSON.stringify(PageSchema)。
 * 零 DDL、跨库、预览即生效——客户加字段只是往 fields[] 追加一条，无需 ALTER TABLE。
 * 与 appearance 同套存储机制（hasRealDatabase 走 Kysely system_config，否则内存兜底）。
 */

import { hasRealDatabase, getKyselyDb } from "@/modules/shared/backend/lib/database"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import {
  pageSchemaSchema,
  pageSchemaUpdateSchema,
  fieldDefSchema,
  defaultPageSchema,
  type PageSchema,
} from "@/modules/online/backend/validators/page-schema.validators"
import { ensureColumns } from "@/modules/online/backend/adapters/persistence/schema-ddl"
import { generatedPageSchema } from "@/modules/shared/contract/page-schemas.generated"

const keyOf = (entity: string) => `page.schema.${entity}`

// 内存兜底（仅无真实库时）
const MEMORY_STORE = new Map<string, string>()

/**
 * 取该实体的页面 schema。
 *
 * 优先级: system_config 里的配置 > **由 Agent 契约生成的兜底** > 空默认。
 *
 * 中间那层是关键: 没有它，新生成的业务域在 C 端是**空白页**
 * （defaultPageSchema 的 fields 是空的）。而契约由表元数据生成，
 * 所以"新域建好 -> C 端立刻有真实字段"，无需人工再录一遍。
 * 配置仍然优先，低代码可编辑性不受影响。
 */
function parseOrDefault(entity: string, raw: string | null): PageSchema {
  if (raw) {
    try {
      const parsed = pageSchemaSchema.parse(JSON.parse(raw))
      if (parsed.fields.length > 0) return parsed
    } catch {
      // 配置坏了 -> 退到生成物，而不是直接给空页面（静默降级到"能看"比"空白"好）
    }
  }
  const generated = generatedPageSchema(entity)
  if (generated && generated.fields.length > 0) {
    return { entity: generated.entity, title: generated.title, fields: generated.fields as PageSchema["fields"] }
  }
  return defaultPageSchema(entity)
}

async function readRaw(key: string): Promise<string | null> {
  if (hasRealDatabase()) {
    const db = await getKyselyDb()
    const row = await db
      .selectFrom("system_config")
      .select(["value"])
      .where("key", "=", key)
      .where("deleted", "=", 0 as any)
      .executeTakeFirst()
    return row?.value ?? null
  }
  return MEMORY_STORE.get(key) ?? null
}

async function writeRaw(key: string, entity: string, value: string): Promise<void> {
  if (hasRealDatabase()) {
    const db = await getKyselyDb()
    const existing = await db.selectFrom("system_config").select(["id"]).where("key", "=", key).executeTakeFirst()
    if (existing) {
      await db.updateTable("system_config").set({ value, updated_at: new Date().toISOString() } as any).where("key", "=", key).execute()
    } else {
      await db
        .insertInto("system_config")
        .values({
          id: `cfg-pageschema-${entity}-${Date.now()}`,
          category: "PAGE_SCHEMA",
          name: `页面Schema:${entity}`,
          key,
          value,
          type: "SYSTEM",
          updated_at: new Date().toISOString(),
        } as any)
        .execute()
    }
    return
  }
  MEMORY_STORE.set(key, value)
}

export class PageSchemaService {
  /** 读取某实体的页面 Schema（无则返回默认空） */
  static async get(entity: string): Promise<PageSchema> {
    return parseOrDefault(entity, await readRaw(keyOf(entity)))
  }

  /** 后台更新（局部：title / fields 整体替换）。fields 经 zod 校验，非法字段被拒。 */
  static async update(entity: string, patch: unknown): Promise<PageSchema> {
    const parsedPatch = pageSchemaUpdateSchema.parse(patch ?? {})
    const current = await PageSchemaService.get(entity)
    const merged = pageSchemaSchema.parse({
      entity,
      title: parsedPatch.title ?? current.title,
      layoutMode: parsedPatch.layoutMode ?? current.layoutMode,
      fields: parsedPatch.fields ?? current.fields,
      blocks: parsedPatch.blocks ?? current.blocks,
      queries: parsedPatch.queries ?? current.queries,
      actions: parsedPatch.actions ?? current.actions,
    })
    // 🆕 真加列：把 fields 同步为实体表的物理列（ALTER TABLE ADD COLUMN，分方言，幂等）。
    // 「加字段就真加列」——ORM/table 那层落实；失败不吞（让调用方知道 DDL 未成功）。
    // 内存兜底（无真实库）时 ensureColumns 内部 getKyselyDb 会失败，此处仅在有真实库时同步。
    let ddl: { added: string[]; skipped: string[] } = { added: [], skipped: [] }
    try {
      ddl = await ensureColumns(entity, merged.fields)
    } catch (e) {
      // 无真实库/驱动不可用时跳过物理加列（schema JSON 仍生效，兼容纯内存预览）
      domainLog.event("online.pageSchema.ddlSkipped", { entity, reason: (e as Error)?.message?.slice(0, 120) })
    }
    await writeRaw(keyOf(entity), entity, JSON.stringify(merged))
    domainLog.event("online.pageSchema.update", { entity, fieldCount: merged.fields.length, columnsAdded: ddl.added })
    domainLog.audit("online.pageSchema.update", { targetType: "ONLINE_PAGE_SCHEMA", targetId: entity })
    return merged
  }

  /** 便捷：给实体追加一个字段（"客户加个字段"最短路径） */
  static async addField(entity: string, field: unknown): Promise<PageSchema> {
    const current = await PageSchemaService.get(entity)
    const next = pageSchemaSchema.parse({ ...current, fields: [...current.fields, field] })
    return PageSchemaService.update(entity, { fields: next.fields })
  }
}
