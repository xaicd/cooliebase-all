import { request } from "../../shared/request"

export interface MallProductSpu {
  id: number
  name: string
  pic_url?: string
  introduction?: string
  price?: number
  market_price?: number
  cost_price?: number
  stock?: number
  sales_count?: number
}

export interface MallProductSku {
  id: number
  spu_id: number
  properties?: string
  price: number
  market_price?: number
  stock: number
  pic_url?: string
}

export const MallProductApi = {
  list(query?: { page?: number; pageSize?: number; keyword?: string }) {
    const params = new URLSearchParams()
    if (query?.page) params.set("page", String(query.page))
    if (query?.pageSize) params.set("pageSize", String(query.pageSize))
    if (query?.keyword) params.set("keyword", query.keyword)
    const qs = params.toString() ? `?${params.toString()}` : ""
    return request<{ items: MallProductSpu[]; total: number }>({
      url: `/api/v1/plugins/cooliebase.mall/api/admin/product-spu${qs}`,
      method: "GET",
    })
  },

  getSpu(id: number | string) {
    return request<MallProductSpu>({
      url: `/api/v1/plugins/cooliebase.mall/api/admin/product-spu/${id}`,
      method: "GET",
    })
  },

  listSkus(spuId: number | string) {
    return request<{ items: MallProductSku[]; total: number }>({
      url: `/api/v1/plugins/cooliebase.mall/api/admin/product-sku?spu_id=${spuId}`,
      method: "GET",
    })
  },
}
