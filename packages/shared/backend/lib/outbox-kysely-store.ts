/**
 * Kysely adapter for transactional outbox / consumer inbox.
 * JSON payload/headers are stored as TEXT for PostgreSQL and MySQL dialect portability.
 */
import type { Transaction } from "kysely"
import { getKyselyDb } from "./database"
import type { DB } from "./database/schema"
import type { OutboxRecord } from "./transactional-outbox"
import type { OutboxStore, OutboxTx } from "./outbox-store"

type OutboxRow = DB["infra_message_outbox"]

function toRow(record: OutboxRecord) {
  return {
    id: record.id,
    event_id: record.eventId,
    subject: record.subject,
    type: record.type,
    source: record.source,
    payload: JSON.stringify(record.payload),
    headers: JSON.stringify(record.headers),
    status: record.status,
    attempts: record.attempts,
    tenant_id: record.headers["x-tenant-id"] ?? null,
    created_at: new Date(record.createdAt),
    published_at: record.publishedAt ? new Date(record.publishedAt) : null,
  }
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function fromRow(row: OutboxRow): OutboxRecord {
  const created = row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
  const published = row.published_at
    ? (row.published_at instanceof Date ? row.published_at.toISOString() : String(row.published_at))
    : undefined
  return {
    id: row.id,
    eventId: row.event_id,
    subject: row.subject,
    type: row.type,
    source: row.source,
    payload: parseJson(row.payload, {}),
    headers: parseJson(row.headers, {}),
    status: row.status as OutboxRecord["status"],
    attempts: row.attempts,
    createdAt: created,
    publishedAt: published,
  }
}

async function insertWith(db: Transaction<DB> | Awaited<ReturnType<typeof getKyselyDb>>, record: OutboxRecord) {
  await db.insertInto("infra_message_outbox").values(toRow(record)).execute()
}

export function createKyselyOutboxStore(): OutboxStore {
  return {
    driver: "kysely",
    async runInTransaction<T>(fn: (tx: OutboxTx) => Promise<T>): Promise<T> {
      const db = await getKyselyDb()
      return db.transaction().execute(async (trx) => fn({
        db: trx,
        insertOutbox: (record) => insertWith(trx, record),
      }))
    },
    async list(status) {
      const db = await getKyselyDb()
      let query = db.selectFrom("infra_message_outbox").selectAll()
      if (status) query = query.where("status", "=", status)
      return (await query.execute()).map(fromRow)
    },
    async listPending(limit) {
      const db = await getKyselyDb()
      return (await db.selectFrom("infra_message_outbox")
        .selectAll()
        .where("status", "=", "pending")
        .orderBy("created_at", "asc")
        .limit(limit)
        .execute()).map(fromRow)
    },
    async save(record) {
      const db = await getKyselyDb()
      await db.updateTable("infra_message_outbox").set({
        status: record.status,
        attempts: record.attempts,
        published_at: record.publishedAt ? new Date(record.publishedAt) : null,
        payload: JSON.stringify(record.payload),
        headers: JSON.stringify(record.headers),
      }).where("id", "=", record.id).execute()
    },
    async inboxHas(consumer, eventId) {
      const db = await getKyselyDb()
      const row = await db.selectFrom("infra_message_inbox")
        .select("id")
        .where("consumer", "=", consumer)
        .where("event_id", "=", eventId)
        .executeTakeFirst()
      return Boolean(row)
    },
    async inboxMark(consumer, eventId) {
      const db = await getKyselyDb()
      try {
        await db.insertInto("infra_message_inbox").values({
          id: `${consumer}:${eventId}`,
          consumer,
          event_id: eventId,
          processed_at: new Date(),
        }).execute()
      } catch {
        // unique(consumer, event_id) means already processed
      }
    },
    async reset() {
      // 生产数据不得被抹掉 —— 但**测试模式**下必须真的清理。
      //
      // 这里原先无条件空实现，注释理由是"tests use the memory store"。那个假设**已经过时**:
      // 本仓现在会针对真实库跑测试（`pnpm run verify:real-db`，内存模式全绿 ≠ 真实库正确）。
      // 于是测试的清理**静默失效**：outbox 行越积越多，"断言空表"的用例必然失败
      // （实测积累到 40 行），而且看起来像代码改坏了。
      //
      // 所以保留原意图、但按运行模式区分: 只有明确的测试进程才清。
      if (process.env.NODE_ENV !== "test") return
      const db = await getKyselyDb()
      await db.deleteFrom("infra_message_inbox").execute()
      await db.deleteFrom("infra_message_outbox").execute()
    },
  }
}
