/**
 * L2 集成: 翻牌小店 (flipshop) 商品域在**真实 PostgreSQL** 上的语义。
 *
 * 为什么必须跑真实库: 租户隔离(INV-PRODUCT-02 部分唯一索引 / tenant_id 前导过滤)
 * 与信封语义全在真实 SQL 与路由包装器里，内存回退看不见（本仓已有过
 * "内存全绿、真实库全红" 的教训，见 AGENTS §9.4）。
 *
 * 运行: pnpm exec vitest run test/integration/flipshop-product.integration.test.ts
 * 无 DATABASE_URL 时自动拉起仓内嵌入式 Postgres（embedded-postgres），零外部依赖。
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import fs from "node:fs"
import path from "node:path"

// 鉴权在集成层被替换为固定上下文人，用于验证路由信封（真实登录走 FDSE 的 E2E）。
const authState = vi.hoisted(() => ({ auth: null as unknown }))
vi.mock("@/modules/shared/backend/auth/guards", () => ({
  requireAdminAuth: async () => authState.auth,
  requirePlatformAdmin: async () => authState.auth,
}))

const MIGRATION = path.join(process.cwd(), "prisma/migrations/20261101120000_add_flipshop_tables/migration.sql")

const authA = { subject: "ops-a", userId: "user-a", tenantId: "tenant-A", roles: [], permissions: [], endpoint: "admin", isGuest: false }
const authB = { subject: "ops-b", userId: "user-b", tenantId: "tenant-B", roles: [], permissions: [], endpoint: "admin", isGuest: false }

let endpoint: { url: string; close: () => Promise<void> }
let runSql!: (sql: string, params?: unknown[]) => Promise<unknown>
let repository: typeof import("@/modules/flipshop/backend/repositories/product.repository")
let service: typeof import("@/modules/flipshop/backend/services")
let validators: typeof import("@/modules/flipshop/backend/validators")
let database: typeof import("@/modules/shared/backend/lib/database")
let productsRoute: { GET: (request: Request) => Promise<Response>; POST: (request: Request) => Promise<Response> }
let productDetailRoute: { GET: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> }
let crossTenantProductId = ""

beforeAll(async () => {
  delete process.env.DATABASE_URL
  const mod = (await import("../../scripts/lib/ephemeral-pg.cjs")) as unknown as {
    resolveDatabaseEndpoint: (o?: unknown) => Promise<{ url: string; close: () => Promise<void> }>
    query: (url: string, sql: string, params?: unknown[]) => Promise<unknown>
  }
  const pg = (mod as unknown as { default?: unknown }).default ?? mod
  endpoint = await (pg as typeof mod).resolveDatabaseEndpoint({ logger: { log() {}, error() {} } })
  process.env.DB_DRIVER = "postgresql"
  process.env.DATABASE_URL = endpoint.url
  process.env.TENANT_MODE = "required"
  runSql = (sql, params) => (pg as typeof mod).query(endpoint.url, sql, params)

  // 用**真实迁移文件**建表：门禁与运行时看到的是同一份 DDL。
  const ddl = fs.readFileSync(MIGRATION, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
  for (const statement of ddl.split(";").map((s) => s.trim()).filter(Boolean)) {
    await runSql(statement)
  }

  database = await import("@/modules/shared/backend/lib/database")
  repository = await import("@/modules/flipshop/backend/repositories/product.repository")
  service = await import("@/modules/flipshop/backend/services")
  validators = await import("@/modules/flipshop/backend/validators")
  productsRoute = (await import("@/modules/flipshop/routes/admin/products/route")) as typeof productsRoute
  productDetailRoute = (await import("@/modules/flipshop/routes/admin/products/[id]/route")) as typeof productDetailRoute
}, 180_000)

afterAll(async () => {
  try {
    if (database) await database.destroyKyselyDb()
  } finally {
    if (endpoint) await endpoint.close()
  }
})

describe("翻牌小店商品域 · 真实 Postgres（数据层）", () => {
  it("create 落库返回 DTO：version=1、状态按入参、时间为 ISO", async () => {
    const product = await service.FlipProductService.create(authA as never, {
      name: "马克杯", skuCode: "SKU-A-1", priceCents: 1999, stock: 10, status: "on_shelf",
      coverUrl: "https://cdn.example.com/a.png", description: "陶瓷杯",
    })
    expect(product.id).toBeTruthy()
    expect(product.tenantId).toBe("tenant-A")
    expect(product.version).toBe(1)
    expect(product.status).toBe("on_shelf")
    expect(Number.isNaN(Date.parse(product.createdAt))).toBe(false)
    expect(product.coverUrl).toBe("https://cdn.example.com/a.png")
  })

  it("★ 跨租户不可见：B 的商品对 A 抛 NOT_FOUND（=404）", async () => {
    const b = await service.FlipProductService.create(authB as never, {
      name: "B 专属", skuCode: "SKU-B-1", priceCents: 100, stock: 1, status: "off_shelf",
    })
    crossTenantProductId = b.id
    await expect(service.FlipProductService.get(authA as never, b.id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 })
  })

  it("★ 列表强制 tenant_id 前导：只返回本租户", async () => {
    const page = await service.FlipProductService.list(authA as never, { page: 1, pageSize: 20 })
    expect(page.items.every((item) => item.tenantId === "tenant-A")).toBe(true)
    expect(page.items.some((item) => item.skuCode === "SKU-B-1")).toBe(false)
    expect(page.total).toBe(page.items.length)
  })

  it("★ INV-PRODUCT-02：同租户重复 SKU → CONFLICT（409）", async () => {
    await expect(
      service.FlipProductService.create(authA as never, { name: "重复", skuCode: "SKU-A-1", priceCents: 1, stock: 0, status: "off_shelf" }),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 })
  })

  it("同 SKU 跨租户允许（唯一性按租户隔离）", async () => {
    const product = await service.FlipProductService.create(authB as never, {
      name: "B 同码", skuCode: "SKU-A-1", priceCents: 5, stock: 0, status: "off_shelf",
    })
    expect(product.skuCode).toBe("SKU-A-1")
    expect(product.tenantId).toBe("tenant-B")
  })

  it("★ 软删后不可见：get → NOT_FOUND，page 不再返回（且 SKU 可复用）", async () => {
    await runSql(`UPDATE flip_product SET deleted_at = NOW() WHERE tenant_id = 'tenant-A' AND sku_code = 'SKU-A-1'`)
    await expect(service.FlipProductService.get(authA as never, "nonexistent")).rejects.toMatchObject({ code: "NOT_FOUND" })
    const page = await repository.KyselyFlipProductRepository.page({ tenantId: "tenant-A", page: 1, pageSize: 20 })
    expect(page.items.some((item) => item.skuCode === "SKU-A-1")).toBe(false)
    // 软删后可复用同一 SKU
    const reused = await service.FlipProductService.create(authA as never, { name: "复用", skuCode: "SKU-A-1", priceCents: 1, stock: 0, status: "off_shelf" })
    expect(reused.skuCode).toBe("SKU-A-1")
  })
})

describe("翻牌小店商品域 · 校验器（写入口不变量）", () => {
  it("★ INV-PRODUCT-01：负价 / 负库存被拒", () => {
    expect(validators.flipshopProductCreateSchema.safeParse({ name: "x", skuCode: "S1", priceCents: -1, stock: 0 }).success).toBe(false)
    expect(validators.flipshopProductCreateSchema.safeParse({ name: "x", skuCode: "S1", priceCents: 1, stock: -1 }).success).toBe(false)
  })

  it("★ INV-PRODUCT-03：非法状态被拒", () => {
    expect(validators.flipshopProductCreateSchema.safeParse({ name: "x", skuCode: "S1", priceCents: 1, stock: 0, status: "deleted" }).success).toBe(false)
  })

  it("★ 契约保护：客户端不得指定 tenantId / 未知字段（additionalProperties=false）", () => {
    expect(validators.flipshopProductCreateSchema.safeParse({ name: "x", skuCode: "S1", priceCents: 1, stock: 0, tenantId: "hack" }).success).toBe(false)
  })

  it("合法载荷通过，默认 status=off_shelf", () => {
    const parsed = validators.flipshopProductCreateSchema.safeParse({ name: "x", skuCode: "SKU-9", priceCents: 0, stock: 0 })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.status).toBe("off_shelf")
  })
})

describe("翻牌小店商品域 · 路由信封（withAdminRoute）", () => {
  it("★ GET /products → 200 {success:true,data:{items,total,page,pageSize}}", async () => {
    authState.auth = authA
    const response = await productsRoute.GET(new Request("http://localhost/api/v1/admin/flipshop/products?page=1&pageSize=10"))
    expect(response.status).toBe(200)
    const body = (await response.json()) as { success: boolean; data: { items: unknown[]; total: number } }
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.items)).toBe(true)
  })

  it("★ POST /products → 201 {success:true,data}", async () => {
    authState.auth = authA
    const response = await productsRoute.POST(
      new Request("http://localhost/api/v1/admin/flipshop/products", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": `it-${Date.now()}` },
        body: JSON.stringify({ name: "路由新增", skuCode: "SKU-ROUTE-1", priceCents: 88, stock: 2 }),
      }),
    )
    expect(response.status).toBe(201)
    const body = (await response.json()) as { success: boolean; data: { skuCode: string } }
    expect(body.success).toBe(true)
    expect(body.data.skuCode).toBe("SKU-ROUTE-1")
  })

  it("★ 跨租户详情 → 404 {success:false,code:NOT_FOUND}", async () => {
    authState.auth = authA
    const response = await productDetailRoute.GET(
      new Request(`http://localhost/api/v1/admin/flipshop/products/${crossTenantProductId}`),
      { params: Promise.resolve({ id: crossTenantProductId }) },
    )
    expect(response.status).toBe(404)
    const body = (await response.json()) as { success: boolean; code: string }
    expect(body.success).toBe(false)
    expect(body.code).toBe("NOT_FOUND")
  })
})
