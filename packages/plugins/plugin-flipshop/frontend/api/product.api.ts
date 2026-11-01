/**
 * 翻牌小店 (flipshop) · 商品前端 API 客户端。
 *
 * 消费 COO-32 冻结的三接口（HLD §5 / OpenAPI `flipshop-openapi.yaml`）：
 *   GET  /api/v1/admin/flipshop/products       列表（分页）
 *   GET  /api/v1/admin/flipshop/products/{id}  详情
 *   POST /api/v1/admin/flipshop/products       新增（携带 Idempotency-Key）
 *
 * 统一走 `@/modules/shared/frontend/lib/request`（401 跳登录 / 错误信封归一 / 超时）。
 * 注意：flipshop 不在 request 层的 PLUGIN_DOMAINS 重写名单里，故 BASE_URL 保持 BFF 挂载点
 * `/api/v1/admin/flipshop/products`（与后端宿主挂载一致）。
 */
import { request } from "@/modules/shared/frontend/lib/request"
import type { ProductDTO, ProductPageDTO, ProductStatus } from "@/modules/flipshop/backend/types/product.types"
import type { FlipshopProductCreateInput } from "@/modules/flipshop/backend/validators"
import { createIdempotencyKey } from "../lib/product.view"

export const FLIPSHOP_PRODUCTS_BASE_URL = "/api/v1/admin/flipshop/products"

/** 列表查询入参（与服务端 validator 的输出类型解耦，允许页面按需省略）。 */
export type FlipProductListQuery = {
  page?: number
  pageSize?: number
  keyword?: string
  status?: ProductStatus
}

export const FlipProductApi = {
  async page(params: FlipProductListQuery = {}) {
    return request.get<ProductPageDTO>(FLIPSHOP_PRODUCTS_BASE_URL, { params })
  },

  async get(id: string) {
    return request.get<ProductDTO>(`${FLIPSHOP_PRODUCTS_BASE_URL}/${encodeURIComponent(id)}`)
  },

  async create(data: FlipshopProductCreateInput, idempotencyKey?: string) {
    return request.post<ProductDTO>(FLIPSHOP_PRODUCTS_BASE_URL, data, {
      headers: { "Idempotency-Key": idempotencyKey ?? createIdempotencyKey() },
    })
  },
}
