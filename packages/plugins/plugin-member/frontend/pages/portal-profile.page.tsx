"use client"

import React, { useEffect, useState } from "react"
import {
  fetchAppearance,
  appearanceStyle,
  fetchProfile,
  updateProfile,
  fetchPageSchema,
  getToken,
  clearToken,
  type Appearance,
  type MemberPublic,
  type PageSchema,
} from "./portal-shared"
import { apiPath } from "@/modules/shared/frontend/lib/request"
import { SchemaDetailView, SchemaForm } from "@/modules/member/frontend/components/SchemaFieldRenderer"

/** C 端用户中心。需登录；消费外观主题 + Schema 驱动的动态字段（后台加字段这里立刻出现）。 */
export default function PortalProfilePage() {
  const [appearance, setAppearance] = useState<Appearance | null>(null)
  const [member, setMember] = useState<MemberPublic | null>(null)
  const [schema, setSchema] = useState<PageSchema | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAppearance().then(setAppearance).catch(() => {})
    if (!getToken()) {
      window.location.href = apiPath("/portal/login")
      return
    }
    fetchProfile()
      .then((m) => {
        setMember(m)
        setDraft({ ...(m.extraFields ?? {}) })
      })
      .catch((e) => {
        setError(e?.message || "加载失败")
        if (String(e?.message || "").includes("登录") || String(e?.message || "").includes("401")) {
          clearToken()
          window.location.href = apiPath("/portal/login")
        }
      })
    // 拉取 member_user 的页面 Schema（后台加的字段）
    fetchPageSchema("member_user").then(setSchema).catch(() => {})
  }, [])

  const logout = () => {
    clearToken()
    window.location.href = apiPath("/portal")
  }

  const save = async () => {
    setSaving(true)
    setError("")
    try {
      const updated = await updateProfile({ extraFields: draft })
      setMember(updated)
      setDraft({ ...(updated.extraFields ?? {}) })
      setEditing(false)
    } catch (e: any) {
      setError(e?.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const hasDynamicFields = (schema?.fields?.length ?? 0) > 0

  return (
    <div style={appearanceStyle(appearance)} className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <a href={apiPath("/portal")} className="text-lg font-bold">{appearance?.siteName ?? "商城"}</a>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">退出登录</button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--brand)" }}>用户中心</h1>
        {error && !member && <p className="text-red-500 text-sm">{error}</p>}

        {member && (
          <div className="bg-white border border-slate-200 p-6" style={{ borderRadius: "var(--radius)" }}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ background: "var(--brand)" }}>
                {member.nickname?.slice(0, 1) || "U"}
              </div>
              <div>
                <p className="text-lg font-semibold">{member.nickname}</p>
                <p className="text-sm text-slate-500">账号：{member.account}</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-400">会员等级</dt><dd className="font-medium">{member.memberLevel}</dd></div>
              <div><dt className="text-slate-400">状态</dt><dd className="font-medium">{member.status}</dd></div>
              <div><dt className="text-slate-400">邮箱</dt><dd className="font-medium">{member.email || "—"}</dd></div>
              <div><dt className="text-slate-400">ID</dt><dd className="font-mono text-xs">{member.id}</dd></div>
            </dl>
          </div>
        )}

        {/* 🆕 Schema 驱动的动态字段区：后台在 online 加了字段，这里自动出现，可查看/编辑，真落库 */}
        {member && hasDynamicFields && (
          <div className="bg-white border border-slate-200 p-6" style={{ borderRadius: "var(--radius)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">{schema?.title || "扩展信息"}</h2>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-sm px-3 py-1.5 text-white" style={{ background: "var(--brand)", borderRadius: "var(--radius)" }}>编辑</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setDraft({ ...(member.extraFields ?? {}) }) }} className="text-sm px-3 py-1.5 border border-slate-300" style={{ borderRadius: "var(--radius)" }}>取消</button>
                  <button onClick={save} disabled={saving} className="text-sm px-3 py-1.5 text-white disabled:opacity-60" style={{ background: "var(--brand)", borderRadius: "var(--radius)" }}>{saving ? "保存中…" : "保存"}</button>
                </div>
              )}
            </div>
            {error && editing && <p className="text-red-500 text-xs mb-2">{error}</p>}
            {editing ? (
              <SchemaForm fields={schema!.fields} values={draft} onChange={(code, v) => setDraft((d) => ({ ...d, [code]: v }))} />
            ) : (
              <SchemaDetailView fields={schema!.fields} values={member.extraFields ?? {}} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
