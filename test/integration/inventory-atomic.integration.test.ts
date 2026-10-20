/**
 * L2 集成: 库存原子变更在**真实 PostgreSQL** 上的语义。
 *
 * 为什么必须跑真实库: `mutateColumnAtomic` 的正确性全在 SQL 里
 * （`SET col = col ± N WHERE ... AND guard` 的**影响行数**）。
 * 内存回退永远不会暴露 sql 模板的方言问题 —— 本仓已有过一次
 * "内存全绿、真实库全红" 的教训（见 AGENTS §9.4）。
 *
 * 运行: DATABASE_URL=... DB_DRIVER=postgres pnpm exec vitest run test/integration/inventory-atomic.integration.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest"

const isPostgres = Boolean(process.env.DATABASE_URL) && process.env.DB_DRIVER === "postgresql"

describe("L2 集成: 库存原子变更（真实库）", () => {
  let pool: { query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>; end: () => Promise<void> }
  let mutateColumnAtomic: typeof import("@/modules/shared/backend/lib/database").mutateColumnAtomic
  let sqlBuilders: typeof import("@/modules/shared/backend/lib/database")

  beforeAll(async () => {
    sqlBuilders = await import("@/modules/shared/backend/lib/database")
    mutateColumnAtomic = sqlBuilders.mutateColumnAtomic

    if (isPostgres) {
      const { Client } = await import("pg")
      const client = new Client({ connectionString: process.env.DATABASE_URL })
      await client.connect()
      pool = client as unknown as typeof pool
    } else {
      const Database = (await import("better-sqlite3")).default
      const os = await import("os")
      const path = await import("path")
      const fs = await import("fs")
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "inv-atomic-test-"))
      const dbPath = path.join(tmpDir, "inv.db")
      process.env.DB_DRIVER = "sqlite"
      process.env.DATABASE_URL = `file:${dbPath}`
      const sqlite = new Database(dbPath)
      sqlite.pragma("journal_mode = WAL")
      pool = {
        query: async (text: string, values: unknown[] = []) => {
          const sql = text.replace(/\$(\d+)/g, "?")
          if (sql.trim().toUpperCase().startsWith("SELECT")) {
            const rows = sqlite.prepare(sql).all(...values) as Array<Record<string, unknown>>
            return { rows, rowCount: rows.length }
          }
          const info = sqlite.prepare(sql).run(...values)
          return { rows: [], rowCount: info.changes }
        },
        end: async () => {
          sqlite.close()
          if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true })
          }
        },
      }
    }

    await pool.query(`CREATE TABLE IF NOT EXISTS inv_atomic_probe (
      id text PRIMARY KEY, qty integer NOT NULL, locked_qty integer NOT NULL DEFAULT 0, tenant_id text NOT NULL
    )`)
  })

  afterAll(async () => {
    if (pool) {
      await pool.query(`DROP TABLE IF EXISTS inv_atomic_probe`)
      await pool.end()
    }
  })

  async function seed(qty: number) {
    await pool.query(`DELETE FROM inv_atomic_probe WHERE id = 'p1'`)
    await pool.query(`INSERT INTO inv_atomic_probe (id, qty, locked_qty, tenant_id) VALUES ('p1', $1, 0, '1')`, [qty])
  }

  it("扣减成功时影响 1 行，且真的写下去了", async () => {
    await seed(10)
    const where = sqlBuilders.joinAnd([sqlBuilders.eqColumn("id", "p1"), sqlBuilders.eqColumn("tenant_id", "1")])
    const affected = await mutateColumnAtomic("inv_atomic_probe", "qty", -4, where)
    expect(affected).toBe(1)
    const row = await pool.query(`SELECT qty FROM inv_atomic_probe WHERE id = 'p1'`)
    expect(Number(row.rows[0].qty)).toBe(6)
  })

  it("★ guard 不满足时影响 0 行（而不是静默扣成负数）", async () => {
    await seed(3)
    const where = sqlBuilders.joinAnd([
      sqlBuilders.eqColumn("id", "p1"),
      sqlBuilders.eqColumn("tenant_id", "1"),
      sqlBuilders.comparePredicate("qty", 5, ">="),
    ])
    const affected = await mutateColumnAtomic("inv_atomic_probe", "qty", -5, where)
    expect(affected).toBe(0)
    const row = await pool.query(`SELECT qty FROM inv_atomic_probe WHERE id = 'p1'`)
    expect(Number(row.rows[0].qty)).toBe(3) // 未被改动
  })

  it("★ 并发扣减: 两个请求只有一个成功（超卖防护的落点）", async () => {
    await seed(5)
    const where = sqlBuilders.joinAnd([
      sqlBuilders.eqColumn("id", "p1"),
      sqlBuilders.eqColumn("tenant_id", "1"),
      sqlBuilders.comparePredicate("qty", 5, ">="),
    ])
    const results = await Promise.all([
      mutateColumnAtomic("inv_atomic_probe", "qty", -5, where),
      mutateColumnAtomic("inv_atomic_probe", "qty", -5, where),
    ])
    expect(results.filter((count) => count === 1)).toHaveLength(1)
    expect(results.filter((count) => count === 0)).toHaveLength(1)
    const row = await pool.query(`SELECT qty FROM inv_atomic_probe WHERE id = 'p1'`)
    expect(Number(row.rows[0].qty)).toBe(0)
  })

  it("租户条件生效: 换个租户扣不动", async () => {
    await seed(10)
    const where = sqlBuilders.joinAnd([sqlBuilders.eqColumn("id", "p1"), sqlBuilders.eqColumn("tenant_id", "999")])
    expect(await mutateColumnAtomic("inv_atomic_probe", "qty", -4, where)).toBe(0)
    const row = await pool.query(`SELECT qty FROM inv_atomic_probe WHERE id = 'p1'`)
    expect(Number(row.rows[0].qty)).toBe(10)
  })

  it("补货（正增量）无条件生效", async () => {
    await seed(1)
    const where = sqlBuilders.joinAnd([sqlBuilders.eqColumn("id", "p1")])
    expect(await mutateColumnAtomic("inv_atomic_probe", "qty", 9, where)).toBe(1)
    const row = await pool.query(`SELECT qty FROM inv_atomic_probe WHERE id = 'p1'`)
    expect(Number(row.rows[0].qty)).toBe(10)
  })
})
