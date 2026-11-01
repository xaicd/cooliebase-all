/**
 * 翻牌小店 (flipshop) · 商品 DTO
 *
 * 字段与 COO-32 冻结的 OpenAPI `components.schemas.Product` 一一对应。
 * 所有时间字段对外一律为 ISO-8601 字符串；金额单位为「分」（整数，杜绝浮点误差）。
 */

export type ProductStatus = "on_shelf" | "off_shelf"

export type ProductDTO = {
  id: string
  tenantId: string
  name: string
  skuCode: string
  priceCents: number
  stock: number
  status: ProductStatus
  coverUrl: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export type ProductPageDTO = {
  items: ProductDTO[]
  total: number
  page: number
  pageSize: number
}
