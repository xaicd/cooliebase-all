"use client"

/**
 * 翻牌小店 · 商品新增表单（可复用控件）。
 *
 * 极端态覆盖（HLD §6）：
 *   - 提交中：`submitting` 期间禁用输入与提交按钮（data-agent-state="submitting"）；
 *   - 客户端校验：名称必填 / SKU 规则 / 售价非负 / 库存非负整数，逐字段行内提示；
 *   - 409 SKU 冲突：行内红字提示并高亮 SKU 字段（不弹窗、不吞错）；
 *   - 网络异常：表单顶部错误条 + 可重试。
 */
import React, { useState } from "react"
import { FlipProductApi } from "../api/product.api"
import type { ProductDTO, ProductStatus } from "@/modules/flipshop/backend/types/product.types"
import type { FlipshopProductCreateInput } from "@/modules/flipshop/backend/validators"
import { isSkuConflict } from "../lib/product.view"

type FormState = {
  name: string
  skuCode: string
  priceYuan: string
  stock: string
  status: ProductStatus
  coverUrl: string
  description: string
}

const INITIAL_FORM: FormState = {
  name: "",
  skuCode: "",
  priceYuan: "",
  stock: "0",
  status: "off_shelf",
  coverUrl: "",
  description: "",
}

const SKU_PATTERN = /^[A-Za-z0-9_-]+$/

export function FlipProductForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (product: ProductDTO) => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [skuConflict, setSkuConflict] = useState(false)

  const patch = (input: Partial<FormState>) => setForm((prev) => ({ ...prev, ...input }))

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = "商品名称不能为空"
    else if (form.name.trim().length > 120) errors.name = "商品名称不能超过 120 字"
    if (!form.skuCode.trim()) errors.skuCode = "SKU 不能为空"
    else if (form.skuCode.trim().length > 64) errors.skuCode = "SKU 不能超过 64 字"
    else if (!SKU_PATTERN.test(form.skuCode.trim())) errors.skuCode = "SKU 仅允许字母、数字、下划线和连字符"

    const price = Number(form.priceYuan)
    if (form.priceYuan.trim() === "" || !Number.isFinite(price) || price < 0) errors.priceYuan = "售价不能为空且必须为非负数"

    const stock = Number(form.stock)
    if (form.stock.trim() === "" || !Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      errors.stock = "库存必须为非负整数"
    }
    return errors
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return // 防连击：提交中直接短路

    setError(null)
    setSkuConflict(false)
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload: FlipshopProductCreateInput = {
      name: form.name.trim(),
      skuCode: form.skuCode.trim(),
      priceCents: Math.round(Number(form.priceYuan) * 100),
      stock: Math.trunc(Number(form.stock)),
      status: form.status,
      coverUrl: form.coverUrl.trim() ? form.coverUrl.trim() : null,
      description: form.description.trim() ? form.description.trim() : null,
    }

    setSubmitting(true)
    try {
      const res = await FlipProductApi.create(payload)
      if (res.success && res.data) {
        onSuccess(res.data)
        return
      }
      if (isSkuConflict({ code: res.code, error: res.error, message: res.message })) {
        setSkuConflict(true)
        setFieldErrors((prev) => ({ ...prev, skuCode: "该 SKU 已存在，请更换" }))
        setError(`SKU「${payload.skuCode}」在当前租户下已存在，请更换后再提交`)
      } else {
        setError(res.message || res.error || "提交失败，请稍后重试")
      }
    } catch (err: any) {
      setError(err?.message || "网络异常，请检查连接后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="flipshop-product-form"
      data-agent-scope="flipshop-product:form"
      data-agent-state={submitting ? "submitting" : error ? "error" : "open"}
      aria-label="新增商品"
      className="bg-white rounded-xl border border-slate-200 shadow-xs"
    >
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-800">商品信息</h2>
        <p className="text-xs text-slate-500 mt-0.5">带 * 为必填，SKU 在同租户内唯一</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {error && (
          <div
            data-testid="flipshop-product-form-error"
            role="alert"
            className="p-2.5 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="flipshop-product-field-name" className="block text-xs text-slate-600 mb-1">商品名称 *</label>
          <input
            id="flipshop-product-field-name"
            type="text"
            data-testid="field-name"
            data-agent-target="flipshop-product:field:name"
            data-agent-state={form.name ? "filled" : "empty"}
            aria-label="商品名称"
            disabled={submitting}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="请输入商品名称"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          {fieldErrors.name && <p data-testid="field-name-error" className="mt-1 text-xs text-rose-500">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="flipshop-product-field-skuCode" className="block text-xs text-slate-600 mb-1">SKU 编码 *</label>
          <input
            id="flipshop-product-field-skuCode"
            type="text"
            data-testid="field-skuCode"
            data-agent-target="flipshop-product:field:skuCode"
            data-agent-state={skuConflict ? "error" : form.skuCode ? "filled" : "empty"}
            aria-label="SKU 编码"
            aria-invalid={skuConflict ? true : undefined}
            disabled={submitting}
            value={form.skuCode}
            onChange={(e) => { setSkuConflict(false); patch({ skuCode: e.target.value }) }}
            placeholder="例如 FLIP-0001"
            className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 ${skuConflict ? "border-rose-400" : "border-slate-300"}`}
          />
          {fieldErrors.skuCode && <p data-testid="field-skuCode-error" className="mt-1 text-xs text-rose-500">{fieldErrors.skuCode}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="flipshop-product-field-priceYuan" className="block text-xs text-slate-600 mb-1">售价（元）*</label>
            <input
              id="flipshop-product-field-priceYuan"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              data-testid="field-priceYuan"
              data-agent-target="flipshop-product:field:priceYuan"
              data-agent-state={form.priceYuan ? "filled" : "empty"}
              aria-label="售价（元）"
              disabled={submitting}
              value={form.priceYuan}
              onChange={(e) => patch({ priceYuan: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {fieldErrors.priceYuan && <p data-testid="field-priceYuan-error" className="mt-1 text-xs text-rose-500">{fieldErrors.priceYuan}</p>}
          </div>
          <div>
            <label htmlFor="flipshop-product-field-stock" className="block text-xs text-slate-600 mb-1">库存 *</label>
            <input
              id="flipshop-product-field-stock"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              data-testid="field-stock"
              data-agent-target="flipshop-product:field:stock"
              data-agent-state={form.stock ? "filled" : "empty"}
              aria-label="库存"
              disabled={submitting}
              value={form.stock}
              onChange={(e) => patch({ stock: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
            {fieldErrors.stock && <p data-testid="field-stock-error" className="mt-1 text-xs text-rose-500">{fieldErrors.stock}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="flipshop-product-field-status" className="block text-xs text-slate-600 mb-1">上架状态</label>
          <select
            id="flipshop-product-field-status"
            data-testid="field-status"
            data-agent-target="flipshop-product:field:status"
            data-agent-state={form.status ? "filled" : "empty"}
            aria-label="上架状态"
            disabled={submitting}
            value={form.status}
            onChange={(e) => patch({ status: e.target.value as ProductStatus })}
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="off_shelf">已下架</option>
            <option value="on_shelf">已上架</option>
          </select>
        </div>

        <div>
          <label htmlFor="flipshop-product-field-coverUrl" className="block text-xs text-slate-600 mb-1">封面图 URL</label>
          <input
            id="flipshop-product-field-coverUrl"
            type="text"
            data-testid="field-coverUrl"
            data-agent-target="flipshop-product:field:coverUrl"
            data-agent-state={form.coverUrl ? "filled" : "empty"}
            aria-label="封面图 URL"
            disabled={submitting}
            value={form.coverUrl}
            onChange={(e) => patch({ coverUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <div>
          <label htmlFor="flipshop-product-field-description" className="block text-xs text-slate-600 mb-1">商品描述</label>
          <textarea
            id="flipshop-product-field-description"
            rows={3}
            data-testid="field-description"
            data-agent-target="flipshop-product:field:description"
            data-agent-state={form.description ? "filled" : "empty"}
            aria-label="商品描述"
            disabled={submitting}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="可选，最多 2000 字"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          data-testid="flipshop-product-form-cancel"
          data-agent-target="flipshop-product:cancel"
          className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          data-testid="flipshop-product-form-submit"
          data-agent-target="flipshop-product:submit"
          data-agent-state={submitting ? "submitting" : "idle"}
          className="px-4 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-xs disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {submitting ? "提交中..." : "提交"}
        </button>
      </div>
    </form>
  )
}

export default FlipProductForm
