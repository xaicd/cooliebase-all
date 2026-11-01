import { getKyselyDb, hasRealDatabase } from "@/modules/shared/backend/lib/database"
import type { PageResult } from "@/modules/shared/backend/lib/database"
import { ApiError } from "@/modules/shared/backend/http/api-error"
import type { ProductDTO, ProductStatus } from "../types/product.types"

/** 表名真源：与 prisma/migrations 的 flip_product 及 COO-32 data-model 对齐。 */
const TABLE_NAME = "flip_product" as const

/** 列集合真源：任何新增列必须三处同改（迁移 / 本表 / validator）。 */
const TABLE_COLUMNS = [
  "id",
  "tenant_id",
  "name",
  "sku_code",
  "price_cents",
  "stock",
  "status",
  "cover_url",
  "description",
  "created_by",
  "created_at",
  "updated_by",
  "updated_at",
  "deleted_at",
  "version",
] as const

const WRITABLE_COLUMNS = ["name", "sku_code", "price_cents", "stock", "status", "cover_url", "description"] as const

type FlipProductRow = {
  id: string
  tenant_id: string
  name: string
  sku_code: string
  price_cents: number
  stock: number
  status: string
  cover_url: string | null
  description: string | null
  created_at: Date | string
  updated_at: Date | string
  version: number
}

function requireDatabase(): void {
  if (!hasRealDatabase()) throw new ApiError("DEPENDENCY_UNAVAILABLE", "商品需要已迁移的 PostgreSQL 数据库，不支持内存持久化")
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value)
}

function mapProduct(row: FlipProductRow): ProductDTO {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    skuCode: row.sku_code,
    priceCents: row.price_cents,
    stock: row.stock,
    status: row.status as ProductStatus,
    coverUrl: row.cover_url,
    description: row.description,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    version: row.version,
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505"
}

export class KyselyFlipProductRepository {
  /** 列表：**强制 tenant_id 前导** + 软删过滤，软删记录对任何租户不可见。 */
  static async page(input: {
    tenantId: string
    page: number
    pageSize: number
    keyword?: string
    status?: ProductStatus
  }): Promise<PageResult<ProductDTO>> {
    requireDatabase()
    const db = await getKyselyDb()
    let base = db
      .selectFrom(TABLE_NAME)
      .where("tenant_id", "=", input.tenantId)
      .where("deleted_at", "is", null)

    if (input.keyword) {
      const keyword = `%${input.keyword}%`
      base = base.where((eb) =>
        eb.or([eb("name", "ilike", keyword), eb("sku_code", "ilike", keyword)]),
      )
    }
    if (input.status) base = base.where("status", "=", input.status)

    const count = await base.select((eb) => eb.fn.countAll<number>().as("count")).executeTakeFirst()
    const rows = await base
      .selectAll()
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .offset((input.page - 1) * input.pageSize)
      .limit(input.pageSize)
      .execute()

    return {
      items: (rows as FlipProductRow[]).map(mapProduct),
      total: Number(count?.count ?? 0),
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  /** 详情：跨租户 / 已软删一律返回 null —— 上层转 404，不泄露其它租户是否存在。 */
  static async findById(input: { tenantId: string; id: string }): Promise<ProductDTO | null> {
    requireDatabase()
    const db = await getKyselyDb()
    const row = await db
      .selectFrom(TABLE_NAME)
      .selectAll()
      .where("tenant_id", "=", input.tenantId)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .executeTakeFirst()
    return row ? mapProduct(row as FlipProductRow) : null
  }

  /** INV-PRODUCT-02：租户内未软删记录中 SKU 唯一（软删后可复用）。 */
  static async existsBySku(input: { tenantId: string; skuCode: string }): Promise<boolean> {
    requireDatabase()
    const db = await getKyselyDb()
    const row = await db
      .selectFrom(TABLE_NAME)
      .select("id")
      .where("tenant_id", "=", input.tenantId)
      .where("sku_code", "=", input.skuCode)
      .where("deleted_at", "is", null)
      .executeTakeFirst()
    return Boolean(row)
  }

  static async create(input: {
    tenantId: string
    actorId: string
    name: string
    skuCode: string
    priceCents: number
    stock: number
    status: ProductStatus
    coverUrl?: string | null
    description?: string | null
  }): Promise<ProductDTO> {
    requireDatabase()
    const db = await getKyselyDb()
    const now = new Date()
    try {
      const row = await db
        .insertInto(TABLE_NAME)
        .values({
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          name: input.name,
          sku_code: input.skuCode,
          price_cents: input.priceCents,
          stock: input.stock,
          status: input.status,
          cover_url: input.coverUrl ?? null,
          description: input.description ?? null,
          created_by: input.actorId,
          created_at: now,
          updated_by: input.actorId,
          updated_at: now,
          deleted_at: null,
          version: 1,
        })
        .returningAll()
        .executeTakeFirstOrThrow()
      return mapProduct(row as FlipProductRow)
    } catch (error) {
      // 部分唯一索引 uk_flip_product_tenant_sku_active 兜底：并发写入同 SKU → 409 而非 500。
      if (isUniqueViolation(error)) throw new ApiError("CONFLICT", `SKU ${input.skuCode} 在当前租户内已存在`)
      throw error
    }
  }
}
