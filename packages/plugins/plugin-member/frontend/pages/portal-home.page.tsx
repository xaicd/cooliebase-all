"use client"

import React, { useEffect, useState } from "react"
import { fetchAppearance, appearanceStyle, getToken, type Appearance } from "./portal-shared"
import { apiPath } from "@/modules/shared/frontend/lib/request"

/** C 端前台首页（落地）。消费外观配置呈现品牌/主题，供"C 端预览"指向 /portal。 */
export default function PortalHomePage() {
  const [appearance, setAppearance] = useState<Appearance | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    fetchAppearance().then(setAppearance).catch(() => {})
    setLoggedIn(Boolean(getToken()))
  }, [])

  return (
    <div style={appearanceStyle(appearance)} className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          {appearance?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={apiPath(appearance.logoUrl)} alt="logo" className="h-7 w-7" />
          ) : (
            <span className="h-7 w-7 rounded" style={{ background: "var(--brand)" }} />
          )}
          <span className="text-lg font-bold">{appearance?.siteName ?? "商城"}</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <a href={apiPath("/portal")} className="text-slate-600 hover:text-slate-900">首页</a>
          {loggedIn ? (
            <a href={apiPath("/portal/profile")} className="text-slate-600 hover:text-slate-900">我的</a>
          ) : (
            <a
              href={apiPath("/portal/login")}
              className="px-3 py-1.5 text-white"
              style={{ background: "var(--brand)", borderRadius: "var(--radius)" }}
            >
              登录 / 注册
            </a>
          )}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-extrabold" style={{ color: "var(--brand)" }}>
          {appearance?.siteName ?? "用户前台"}
        </h1>
        <p className="mt-4 text-slate-600">
          这是 C 端（用户端）前台首页。Logo、主色、圆角、字体、排版均由后台「外观设置」动态配置，此处实时呈现。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a
            href={apiPath("/portal/login")}
            className="px-5 py-2.5 text-white font-medium"
            style={{ background: "var(--brand)", borderRadius: "var(--radius)" }}
          >
            进入
          </a>
          <a
            href={apiPath("/portal/profile")}
            className="px-5 py-2.5 font-medium border border-slate-300"
            style={{ borderRadius: "var(--radius)" }}
          >
            用户中心
          </a>
        </div>
      </main>
    </div>
  )
}
