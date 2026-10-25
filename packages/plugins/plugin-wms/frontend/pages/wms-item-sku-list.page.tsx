"use client"

import React, { useState, useEffect, useCallback } from "react"
import { WmsItemSkuApi } from "../api/wms-item-sku.api"
import { WmsItemSkuForm } from "../components/WmsItemSkuForm"
import { Pagination } from "@/modules/shared/frontend/components/pagination"
import type { WmsItemSkuVO, WmsItemSkuPageQuery } from "@/modules/wms/backend/types/wms-item-sku.types"

export function WmsItemSkuListPage() {
  const [data, setData] = useState<WmsItemSkuVO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [searchForm, setSearchForm] = useState<Record<string, any>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<WmsItemSkuVO | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await WmsItemSkuApi.page({ page, pageSize, ...searchForm })
      setData(res.data?.items || [])
      setTotal(res.data?.total || 0)
    } catch (err) {
      console.error("加载数据失败:", err)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchForm])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    setSearchForm({})
    setPage(1)
  }

  const handleAdd = () => {
    setEditItem(null)
    setFormOpen(true)
  }

  const handleEdit = (item: WmsItemSkuVO) => {
    setEditItem(item)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定要删除该记录吗？")) return
    try {
      await WmsItemSkuApi.delete(id)
      fetchData()
    } catch (err: any) {
      alert(err?.message || "删除失败")
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 data-testid="wms-item-sku-title" className="text-xl font-bold tracking-tight text-slate-900">物料SKU管理</h1>
          <p className="text-xs text-slate-500 mt-0.5">物料SKU列表与配置管理</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            刷新
          </button>
          <button
            onClick={handleAdd}
            className="px-3.5 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-xs"
          >
            + 新增物料SKU
          </button>
        </div>
      </div>

      {/* 搜索工具栏 */}
      <form onSubmit={handleSearch} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 whitespace-nowrap">物料ID:</label>
          <input
            type="text"
            value={searchForm.item_id ?? ""}
            onChange={(e) => setSearchForm((prev) => ({ ...prev, item_id: e.target.value }))}
            placeholder="搜索物料ID"
            className="w-36 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 whitespace-nowrap">SKU编码:</label>
          <input
            type="text"
            value={searchForm.sku_code ?? ""}
            onChange={(e) => setSearchForm((prev) => ({ ...prev, sku_code: e.target.value }))}
            placeholder="搜索SKU编码"
            className="w-36 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 whitespace-nowrap">规格名称:</label>
          <input
            type="text"
            value={searchForm.sku_name ?? ""}
            onChange={(e) => setSearchForm((prev) => ({ ...prev, sku_name: e.target.value }))}
            placeholder="搜索规格名称"
            className="w-36 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
          <button type="submit" className="px-3 py-1 text-xs text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">查询</button>
          <button type="button" onClick={handleReset} className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">重置</button>
        </div>
        <div className="text-xs text-slate-500">共 <span className="font-semibold text-slate-700">{total}</span> 条记录</div>
      </form>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">物料ID</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SKU编码</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">规格名称</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">条形码</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">参考单价</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[140px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">加载中...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">暂无数据</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[200px] truncate" title={String(item.item_id ?? "-")}>{String(item.item_id ?? "-")}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[200px] truncate" title={String(item.sku_code ?? "-")}>{String(item.sku_code ?? "-")}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[200px] truncate" title={String(item.sku_name ?? "-")}>{String(item.sku_name ?? "-")}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[200px] truncate" title={String(item.barcode ?? "-")}>{String(item.barcode ?? "-")}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[200px] truncate" title={String(item.price ?? "-")}>{String(item.price ?? "-")}</td>
                    <td className="px-4 py-2.5 text-xs text-right whitespace-nowrap space-x-2">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium">编辑</button>
                      <button onClick={() => handleDelete(String(item.id))} className="text-rose-600 hover:text-rose-800 font-medium">删除</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页组件 */}
        <div className="p-3 border-t border-slate-200">
          <Pagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(ps) => setPageSize(ps)}
          />
        </div>
      </div>

      {/* 弹窗表单 */}
      <WmsItemSkuForm
        open={formOpen}
        initialData={editItem}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}
