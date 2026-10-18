import { request } from "../../shared/request"

export interface MallTradeOrder {
  id: number
  no?: string
  status?: number
  total_price?: number
  pay_price?: number
  pay_status?: boolean
  product_count?: number
  logistics_no?: string
  created_at: string
}

export const MallTradeOrderApi = {
  list(query?: { page?: number; pageSize?: number; status?: number }) {
    const params = new URLSearchParams()
    if (query?.page) params.set("page", String(query.page))
    if (query?.pageSize) params.set("pageSize", String(query.pageSize))
    if (query?.status !== undefined) params.set("status", String(query.status))
    const qs = params.toString() ? `?${params.toString()}` : ""
    return request<{ items: MallTradeOrder[]; total: number }>({
      url: `/api/v1/plugins/cooliebase.mall/api/admin/trade-order${qs}`,
      method: "GET",
      auth: true,
    })
  },

  get(id: number | string) {
    return request<MallTradeOrder>({
      url: `/api/v1/plugins/cooliebase.mall/api/admin/trade-order/${id}`,
      method: "GET",
      auth: true,
    })
  },

  create(data: { no?: string; total_price: number; pay_price: number; product_count?: number; remark?: string }) {
    return request<MallTradeOrder>({
      url: "/api/v1/plugins/cooliebase.mall/api/admin/trade-order",
      method: "POST",
      data,
      auth: true,
      showLoading: true,
      loadingMsg: "提交订单中...",
      showSuccess: true,
      successMsg: "订单创建成功",
    })
  },
}
