"use client"

/**
 * 翻牌小店 · 商品新增页（HLD §6 · 路由 /admin/flipshop/products/new）。
 *
 * 消费接口 #3 `POST /api/v1/admin/flipshop/products`。
 * 极端态：提交中禁用、409 SKU 冲突行内提示（由 FlipProductForm 承载）、网络异常、成功→列表。
 */
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ProductDTO } from "@/modules/flipshop/backend/types/product.types"
import { FlipProductForm } from "../../components/FlipProductForm"

const LIST_ROUTE = "/admin/flipshop/products"

export function FlipProductCreatePage() {
  const router = useRouter()
  const [created, setCreated] = useState<ProductDTO | null>(null)

  const handleSuccess = (product: ProductDTO) => {
    setCreated(product)
    // 成功后回到列表，让新商品立即可见（成功态 → 列表）
    router.push(LIST_ROUTE)
  }

  return (
    <div
      data-agent-scope="flipshop-product"
      data-agent-state={created ? "created" : "ready"}
      data-agent-page-ready="true"
      className="p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 data-testid="flipshop-product-create-title" className="text-xl font-bold tracking-tight text-slate-900">
            新增商品
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">填写商品信息，SKU 在当前租户内唯一</p>
        </div>
        <button
          type="button"
          onClick={() => router.push(LIST_ROUTE)}
          data-testid="flipshop-product-create-back"
          data-agent-target="flipshop-product:back"
          className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          返回列表
        </button>
      </div>

      {/* 提交成功后将表单剪枝（inert），避免跳转前被再次点击造成重复提交 */}
      <div className="max-w-2xl" inert={created ? true : undefined}>
        <FlipProductForm onSuccess={handleSuccess} onCancel={() => router.push(LIST_ROUTE)} />
      </div>
    </div>
  )
}

export default FlipProductCreatePage
