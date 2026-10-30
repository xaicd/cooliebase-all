"use client"

import React, { useEffect, useState } from "react"
import {
  fetchAppearance,
  appearanceStyle,
  memberLogin,
  memberRegister,
  DEMO_CREDENTIALS,
  isDemoMode,
  type Appearance,
} from "./portal-shared"
import { apiPath } from "@/modules/shared/frontend/lib/request"

/** C 端登录/注册页。预览（demo）模式下默认预填 demo/demo123，点"登录"即进，无需输入。 */
export default function PortalLoginPage() {
  const [appearance, setAppearance] = useState<Appearance | null>(null)
  const [mode, setMode] = useState<"login" | "register">("login")
  const demo = isDemoMode()
  const [account, setAccount] = useState(demo ? DEMO_CREDENTIALS.account : "")
  const [password, setPassword] = useState(demo ? DEMO_CREDENTIALS.password : "")
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAppearance().then(setAppearance).catch(() => {})
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (mode === "register") {
        await memberRegister({ account, password, nickname: nickname || undefined })
      }
      await memberLogin(account, password)
      window.location.href = apiPath("/portal/profile")
    } catch (err: any) {
      setError(err?.message || "操作失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={appearanceStyle(appearance)} className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 p-6 shadow-sm" style={{ borderRadius: "var(--radius)" }}>
        <div className="flex items-center gap-2 mb-6 justify-center">
          {appearance?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={apiPath(appearance.logoUrl)} alt="logo" className="h-8 w-8" />
          )}
          <span className="text-xl font-bold">{appearance?.siteName ?? "商城"}</span>
        </div>

        <div className="flex mb-4 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 ${mode === "login" ? "font-bold border-b-2" : "text-slate-400"}`}
            style={mode === "login" ? { borderColor: "var(--brand)", color: "var(--brand)" } : {}}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 ${mode === "register" ? "font-bold border-b-2" : "text-slate-400"}`}
            style={mode === "register" ? { borderColor: "var(--brand)", color: "var(--brand)" } : {}}
          >
            注册
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="账号"
            className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            style={{ borderRadius: "var(--radius)" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            style={{ borderRadius: "var(--radius)" }}
          />
          {mode === "register" && (
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="昵称（可选）"
              className="w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              style={{ borderRadius: "var(--radius)" }}
            />
          )}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white font-medium disabled:opacity-60"
            style={{ background: "var(--brand)", borderRadius: "var(--radius)" }}
          >
            {loading ? "处理中…" : mode === "login" ? "登录" : "注册并登录"}
          </button>
        </form>

        {demo && mode === "login" && (
          <p className="mt-3 text-center text-[11px] text-slate-400">演示账号已预填（demo / demo123），点「登录」即可进入</p>
        )}
      </div>
    </div>
  )
}
