"use client"

import { useCallback, useEffect, useState } from "react"
import { API, request } from "@/modules/shared/frontend/lib/request"
import { Pagination } from "@/modules/shared/frontend/components/pagination"

type Row = {
  id: string
  traceId: string | null
  requestMethod: string
  requestUrl: string
  resultCode: number
  duration: number
  userId: string | null
  userIp: string | null
  operation: string | null
  createdAt: string
}

type Page = {
  items: Row[]
  total: number
  page: number
  pageSize: number
}

async function download(url: string) {
  const token = localStorage.getItem("cooliebase_token")
  const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })  // request-contract-exempt: 导出 CSV 需要原始 Response.blob()，统一请求层只解 JSON
  if (!response.ok) throw new Error("导出失败")
  const link = document.createElement("a")
  link.href = URL.createObjectURL(await response.blob())
  link.download = "api-access-logs.csv"
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function ApiAccessLogPage() {
  const [data, setData] = useState<Page>({ items: [], total: 0, page: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<Row>()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const load = useCallback(
    async (p = page, ps = pageSize, kw = keyword) => {
      setLoading(true)
      try {
        const res = await request.get<Page>(API.API_ACCESS_LOGS, {
          page: p,
          pageSize: ps,
          keyword: kw || undefined,
        })
        if (res.success && res.data) {
          setData(res.data)
        } else {
          setError(res.message || res.error || "加载失败")
        }
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize, keyword]
  )

  useEffect(() => {
    void load(page, pageSize, keyword)
  }, [load, page, pageSize])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">API 访问日志</h1>
          <p className="mt-0.5 text-xs text-slate-500">按 Trace ID、路径或请求方法检索；请求参数已脱敏</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-4">
        <input
          className="h-9 w-80 rounded-md border px-3 text-xs"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Trace ID、路径或请求方法..."
        />
        <button
          className="h-9 rounded-md bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-800 transition"
          onClick={() => {
            setPage(1)
            void load(1, pageSize, keyword)
          }}
        >
          查询
        </button>
        <button
          className="h-9 rounded-md border px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
          onClick={() => {
            setKeyword("")
            setPage(1)
            void load(1, pageSize, "")
          }}
        >
          重置
        </button>
        <button
          className="h-9 rounded-md border border-blue-200 bg-blue-50 px-4 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
          onClick={() =>
            void download(`${API.API_ACCESS_LOGS}/export?keyword=${encodeURIComponent(keyword)}`).catch((e) =>
              setError(e.message)
            )
          }
        >
          导出 CSV
        </button>
        <span className="ml-auto text-xs text-slate-500">
          共 <span className="font-semibold text-slate-900">{data?.total || 0}</span> 条记录
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="p-3">Trace ID</th>
                <th className="p-3">请求</th>
                <th className="p-3">状态</th>
                <th className="p-3">耗时</th>
                <th className="p-3">用户 / IP</th>
                <th className="p-3">时间</th>
                <th className="p-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-slate-400">
                    正在加载日志...
                  </td>
                </tr>
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-slate-400">
                    暂无访问日志
                  </td>
                </tr>
              ) : (
                data.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono text-xs text-slate-500">{row.traceId || "—"}</td>
                    <td className="p-3 font-medium text-slate-800">
                      <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                        {row.requestMethod}
                      </span>
                      {row.requestUrl}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          row.resultCode < 400
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {row.resultCode}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{row.duration}ms</td>
                    <td className="p-3">
                      {row.userId || "匿名"}
                      <br />
                      <span className="font-mono text-[10px] text-slate-400">{row.userIp || "—"}</span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => setSelected(row)}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 通用底部分页控件 */}
      <Pagination
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => {
          setPage(p)
          void load(p, pageSize, keyword)
        }}
        onPageSizeChange={(ps) => {
          setPageSize(ps)
          setPage(1)
          void load(1, ps, keyword)
        }}
      />

      {selected && (
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">访问日志详情</h2>
            <button
              className="text-xs text-slate-400 hover:text-slate-700"
              onClick={() => setSelected(undefined)}
            >
              关闭
            </button>
          </div>
          <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100">
            {JSON.stringify(selected, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}
