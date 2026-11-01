import { z } from "zod"

/**
 * 翻牌小店 (flipshop) · 商品校验器
 *
 * **真源**：COO-32 冻结 OpenAPI `components.schemas`（ProductStatus / ProductCreateInput / Product）。
 * 字段与约束必须与其 100% 一致；新增字段须三处同改（OpenAPI / Prisma 迁移 / 本文件）。
 *
 * 不变量在写入口拦截：
 *   INV-PRODUCT-01 priceCents >= 0 且 stock >= 0 —— 由 `min(0)` 保证
 *   INV-PRODUCT-02 (tenant_id, sku_code) 唯一 —— 由 service + 部分唯一索引保证
 *   INV-PRODUCT-03 status ∈ {on_shelf, off_shelf} —— 由 `z.enum` 保证
 */
export const productStatusSchema = z.enum(["on_shelf", "off_shelf"])

export const flipshopProductPageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    keyword: z.string().trim().max(200).optional(),
    status: productStatusSchema.optional(),
  })
  .strict()

export const flipshopProductCreateSchema = z
  .object({
    name: z.string().trim().min(1, "name 不能为空").max(120),
    skuCode: z.string().trim().min(1, "skuCode 不能为空").max(64).regex(/^[A-Za-z0-9_-]+$/, "skuCode 仅允许字母、数字、下划线和连字符"),
    priceCents: z.coerce.number().int().min(0),
    stock: z.coerce.number().int().min(0).default(0),
    status: productStatusSchema.default("off_shelf"),
    coverUrl: z.string().max(500).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
  })
  .strict()

export type ProductStatusInput = z.infer<typeof productStatusSchema>
export type FlipshopProductPageQueryInput = z.infer<typeof flipshopProductPageQuerySchema>
export type FlipshopProductCreateInput = z.infer<typeof flipshopProductCreateSchema>
