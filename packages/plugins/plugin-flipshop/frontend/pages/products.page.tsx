"use client"

/**
 * 翻牌小店 · 商品列表页（HLD §6 · 路由 /admin/flipshop/products）。
 *
 * 消费接口 #1 `GET /api/v1/admin/flipshop/products`。
 * 极端态：loading / empty / error（网络异常可重试）/ ready。
 * 交互：关键字搜索（防抖 300ms）、状态筛选、分页、刷新、新增跳转、行→详情。
 * Agent-Native：根节点 data-agent-scope / -state / -page-ready；交互元素 data-agent-target。
 */
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ProductDTO, ProductStatus } from "@/modules/flipshop/backend/types/product.types"
import { Pagination } from "@/modules/shared/frontend/components/pagination"
import { FlipProductApi } from "../api/product.api"
import { deriveListState, formatPriceCents, statusLabel, truncateText } from "../lib/product.view"

const STATUS_OPTIONS: Array<{ value: "" | ProductStatus; label: string }> = [
  { value: "", label: "全部状态" },
  { value: "on_shelf", label: "已上架" },
  { value: "off_shelf", label: "已下架" },
]

const COLUMN_COUNT = 7

export function FlipProductListPage() {
  const router = useRouter()

  const [items, setItems] = useState<ProductDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [keywordInput, setKeywordInput] = useState("")
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState<"" | ProductStatus>("")

  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // 搜索防抖 300ms：输入停顿后才落为查询条件，避免每次按键都打接口
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [keywordInput])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setHasError(false)
    try {
      const res = await FlipProductApi.page({
        page,
        pageSize,
        keyword: keyword || undefined,
        status: status || undefined,
      })
      if (res.success) {
        setItems(res.data?.items ?? [])
        setTotal(res.data?.total ?? 0)
      } else {
        setItems([])
        setTotal(0)
        setHasError(true)
        setErrorMessage(res.message || res.error || "加载失败，请稍后重试")
      }
    } catch (err: any) {
      setItems([])
      setTotal(0)
      setHasError(true)
      setErrorMessage(err?.message || "网络异常，请检查连接后重试")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, status])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleReset = () => {
    setKeywordInput("")
    setKeyword("")
    setStatus("")
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value as "" | ProductStatus)
    setPage(1)
  }

  const agentState = deriveListState({ loading, hasError, count: items.length })

  return (
    <div
      data-agent-scope="flipshop-product"
      data-agent-state={agentState}
      data-agent-page-ready={String(!loading)}
      className="p-6 space-y-4"
    >
      {/* loading 期间剪枝交互节点：避免 Agent 采到尚未就绪的按钮（Agent-Native §5.2）。
          注意：异常态**不能**剪枝，否则「重试 / 刷新」会变成点不动的假按钮。 */}
      <div inert={loading ? true : undefined} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 data-testid="flipshop-product-title" className="text-xl font-bold tracking-tight text-slate-900">
              翻牌小店 · 商品管理
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">商品列表 · 列表 / 详情 / 新增 最小闭环</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchData()}
              data-testid="flipshop-product-refresh"
              data-agent-target="flipshop-product:refresh"
              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              刷新
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/flipshop/products/new")}
              data-testid="flipshop-product-create"
              data-agent-target="flipshop-product:create"
              className="px-3.5 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-xs"
            >
              + 新增商品
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); void fetchData() }}
          data-testid="flipshop-product-search"
          data-agent-scope="flipshop-product:search"
          aria-label="商品搜索"
          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="flipshop-product-search-keyword" className="text-xs text-slate-500 whitespace-nowrap">关键字:</label>
              <input
                id="flipshop-product-search-keyword"
                type="text"
                data-testid="search-keyword"
                data-agent-target="flipshop-product:field:keyword"
                data-agent-state={keywordInput ? "filled" : "empty"}
                aria-label="商品名称或 SKU"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="按名称 / SKU 搜索"
                className="w-40 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="flipshop-product-search-status" className="text-xs text-slate-500 whitespace-nowrap">状态:</label>
              <select
                id="flipshop-product-search-status"
                data-testid="search-status"
                data-agent-target="flipshop-product:field:status"
                data-agent-state={status ? "filled" : "empty"}
                aria-label="商品状态"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              data-testid="flipshop-product-search-submit"
              data-agent-target="flipshop-product:search"
              className="px-3 py-1 text-xs text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              查询
            </button>
            <button
              type="button"
              onClick={handleReset}
              data-testid="flipshop-product-search-reset"
              data-agent-target="flipshop-product:reset"
              className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              重置
            </button>
          </div>
          <div className="text-xs text-slate-500">
            共 <span data-testid="flipshop-product-total" className="font-semibold text-slate-700">{total}</span> 条记录
          </div>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table data-testid="flipshop-product-table" aria-label="商品列表" className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">商品名称</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">售价</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">库存</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[100px]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={COLUMN_COUNT} data-testid="flipshop-product-loading" className="px-4 py-8 text-center text-xs text-slate-400">加载中...</td>
                  </tr>
                ) : hasError ? (
                  <tr>
                    <td colSpan={COLUMN_COUNT} data-testid="flipshop-product-error" className="px-4 py-8 text-center text-xs text-rose-500">{errorMessage}</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMN_COUNT} data-testid="flipshop-product-empty" className="px-4 py-8 text-center text-xs text-slate-400">
                      暂无商品，点击右上角「+ 新增商品」创建第一个商品
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      data-testid="flipshop-product-row"
                      data-agent-target="flipshop-product:row"
                      data-agent-state="idle"
                      data-agent-id={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[220px] truncate" title={item.name}>{truncateText(item.name, 40)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 font-mono">{item.skuCode}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-700">{formatPriceCents(item.priceCents)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-700">{item.stock}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${item.status === "on_shelf" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/flipshop/products/${encodeURIComponent(item.id)}`)}
                          data-testid="flipshop-product-view"
                          data-agent-target="flipshop-product:view"
                          data-agent-id={item.id}
                          aria-label={`查看 ${item.name}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div data-agent-target="flipshop-product:pagination" className="p-3 border-t border-slate-200">
            <Pagination
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(nextSize) => { setPageSize(nextSize); setPage(1) }}
            />
          </div>
        </div>

        {hasError && (
          <div className="flex items-center gap-2 text-xs text-rose-500">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => void fetchData()}
              data-testid="flipshop-product-retry"
              data-agent-target="flipshop-product:retry"
              className="text-blue-600 hover:underline"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FlipProductListPage
