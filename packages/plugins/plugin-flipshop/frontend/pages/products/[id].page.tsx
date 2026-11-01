"use client"

/**
 * 翻牌小店 · 商品详情页（HLD §6 · 路由 /admin/flipshop/products/[id]）。
 *
 * 消费接口 #2 `GET /api/v1/admin/flipshop/products/{id}`。
 * 极端态：loading / not-found(404) / error（网络异常可重试）/ ready。
 * `id` 由宿主动态路由传入；缺省时回退到 `useParams()`（便于在其它容器内复用）。
 */
import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { ProductDTO } from "@/modules/flipshop/backend/types/product.types"
import { FlipProductApi } from "../../api/product.api"
import { deriveDetailState, formatPriceCents, isNotFoundError, statusLabel, truncateText } from "../../lib/product.view"

export function FlipProductDetailPage({ id: idProp }: { id?: string } = {}) {
  const router = useRouter()
  const params = useParams<{ id?: string | string[] }>()
  const routeId = Array.isArray(params?.id) ? params?.id[0] : params?.id
  const id = idProp ?? routeId

  const [product, setProduct] = useState<ProductDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setLoading(true)
    setNotFound(false)
    setHasError(false)
    try {
      const res = await FlipProductApi.get(id)
      if (res.success && res.data) {
        setProduct(res.data)
      } else if (isNotFoundError({ code: res.code, error: res.error, message: res.message })) {
        setProduct(null)
        setNotFound(true)
      } else {
        setProduct(null)
        setHasError(true)
        setErrorMessage(res.message || res.error || "加载失败，请稍后重试")
      }
    } catch (err: any) {
      setProduct(null)
      setHasError(true)
      setErrorMessage(err?.message || "网络异常，请检查连接后重试")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const agentState = deriveDetailState({ loading, notFound, hasError, hasData: Boolean(product) })
  const goList = () => router.push("/admin/flipshop/products")

  return (
    <div
      data-agent-scope="flipshop-product"
      data-agent-state={agentState}
      data-agent-page-ready={String(!loading)}
      className="p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 data-testid="flipshop-product-detail-title" className="text-xl font-bold tracking-tight text-slate-900">
            商品详情
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">商品 ID：{id ?? "-"}</p>
        </div>
        <button
          type="button"
          onClick={goList}
          data-testid="flipshop-product-detail-back"
          data-agent-target="flipshop-product:back"
          className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          返回列表
        </button>
      </div>

      {/* 仅 loading 期间剪枝交互节点；404 / 异常态必须保持可点击，否则「返回 / 重试」成了假按钮 */}
      <div inert={loading ? true : undefined}>
        {loading ? (
          <div data-testid="flipshop-product-detail-loading" className="bg-white rounded-xl border border-slate-200 shadow-xs px-5 py-10 text-center text-xs text-slate-400">
            加载中...
          </div>
        ) : notFound ? (
          <div data-testid="flipshop-product-detail-notfound" className="bg-white rounded-xl border border-slate-200 shadow-xs px-5 py-10 text-center space-y-3">
            <p className="text-sm text-slate-700">商品不存在</p>
            <p className="text-xs text-slate-500">该商品可能已被删除，或不属于当前租户。</p>
            <button
              type="button"
              onClick={goList}
              data-testid="flipshop-product-detail-notfound-back"
              data-agent-target="flipshop-product:back"
              className="px-3.5 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回商品列表
            </button>
          </div>
        ) : hasError ? (
          <div data-testid="flipshop-product-detail-error" className="bg-white rounded-xl border border-slate-200 shadow-xs px-5 py-10 text-center space-y-3">
            <p className="text-sm text-rose-500">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void fetchData()}
              data-testid="flipshop-product-detail-retry"
              data-agent-target="flipshop-product:retry"
              className="px-3.5 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        ) : product ? (
          <div data-testid="flipshop-product-detail" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 data-testid="flipshop-product-detail-name" className="text-base font-semibold text-slate-900" title={product.name}>{truncateText(product.name, 80)}</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">SKU：{product.skuCode}</p>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 px-5 py-4">
              <div>
                <dt className="text-xs text-slate-500">售价</dt>
                <dd data-testid="flipshop-product-detail-price" className="text-sm text-slate-800 mt-0.5">{formatPriceCents(product.priceCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">库存</dt>
                <dd data-testid="flipshop-product-detail-stock" className="text-sm text-slate-800 mt-0.5">{product.stock}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">上架状态</dt>
                <dd data-testid="flipshop-product-detail-status" className="text-sm text-slate-800 mt-0.5">{statusLabel(product.status)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">版本号</dt>
                <dd className="text-sm text-slate-800 mt-0.5">{product.version}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">创建时间</dt>
                <dd className="text-sm text-slate-800 mt-0.5">{product.createdAt ? new Date(product.createdAt).toLocaleString("zh-CN") : "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">更新时间</dt>
                <dd className="text-sm text-slate-800 mt-0.5">{product.updatedAt ? new Date(product.updatedAt).toLocaleString("zh-CN") : "-"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">封面图</dt>
                <dd className="text-sm text-slate-800 mt-0.5 break-all">
                  {product.coverUrl ? (
                    <a href={product.coverUrl} target="_blank" rel="noreferrer" data-agent-target="flipshop-product:cover" className="text-blue-600 hover:underline">{truncateText(product.coverUrl, 80)}</a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">商品描述</dt>
                <dd className="text-sm text-slate-800 mt-0.5 whitespace-pre-wrap break-words">{product.description || <span className="text-slate-400">—</span>}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default FlipProductDetailPage
