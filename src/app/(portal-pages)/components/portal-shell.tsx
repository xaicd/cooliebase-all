"use client"

import React from "react"
import Link from "next/link"
import { projectProfile } from "@/shared/contract/project-profile"

export interface PortalNavItem {
  key: string
  label: string
  href: string
}

export interface PortalHeroMetric {
  label: string
  value: string | number
  tone?: "indigo" | "emerald" | "amber"
}

export interface PortalShellProps {
  activeNav: string
  navItems?: PortalNavItem[]
  subtitleTag?: string
  badge: string
  title: string
  subtitle: string
  metrics?: PortalHeroMetric[]
  adminHref?: string
  primaryActionLabel?: string
  primaryActionHref?: string
  children: React.ReactNode
}

const DEFAULT_NAV_ITEMS: PortalNavItem[] = [
  { key: "home", label: "门户首页", href: "/2c" },
  { key: "portal", label: "业务工作台", href: "/portal" },
]

export function PortalShell({
  activeNav,
  navItems = DEFAULT_NAV_ITEMS,
  subtitleTag = "ENTERPRISE SERVICE PORTAL",
  badge,
  title,
  subtitle,
  metrics,
  adminHref = "/admin",
  primaryActionLabel = "进入工作台",
  primaryActionHref = "/2c",
  children,
}: PortalShellProps) {
  const brandMark = projectProfile.branding?.mark || "C"
  const shortName = projectProfile.shortName || projectProfile.platformName || "数字化门户"
  const platformName = projectProfile.platformName || "数字化业务服务平台"

  return (
    <div
      data-portal-shell="cooliebase-portal-v1"
      className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white flex flex-col"
    >
      {/* Top Glassmorphism Navigation (Blueprint C-End Standard) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link href="/2c" className="flex items-center gap-2.5 shrink-0">
              <span className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm text-sm">
                {brandMark}
              </span>
              <div className="hidden sm:block">
                <span className="font-bold text-slate-900 tracking-tight block leading-tight text-sm sm:text-base">
                  {shortName}
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight font-mono uppercase">
                  {subtitleTag}
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-600">
              {navItems.map((item) => {
                const isActive = activeNav === item.key
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 font-semibold border border-indigo-200/80"
                        : "hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={adminHref}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            >
              <span>⚙️</span>
              <span>管理后台</span>
            </Link>
            <Link
              href={primaryActionHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <span>{primaryActionLabel}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Blueprint Indigo-Slate Radial Grid Hero Banner */}
      <section className="bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white py-8 sm:py-10 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 mb-3">
              <span>✦</span>
              <span>{badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              {title}
            </h1>
            <p className="mt-2.5 text-slate-300 text-xs sm:text-sm leading-relaxed">
              {subtitle}
            </p>
          </div>

          {metrics && metrics.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              {metrics.map((m) => {
                const valueColor =
                  m.tone === "amber"
                    ? "text-amber-300"
                    : m.tone === "emerald"
                      ? "text-emerald-300"
                      : "text-indigo-200"
                return (
                  <div
                    key={m.label}
                    className="rounded-xl bg-white/5 border border-white/10 backdrop-blur px-3.5 py-2.5 min-w-[92px] sm:min-w-[116px]"
                  >
                    <div className="text-[11px] text-slate-400">{m.label}</div>
                    <div className={`mt-0.5 text-lg sm:text-xl font-extrabold font-mono ${valueColor}`}>
                      {m.value}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {children}
      </main>

      {/* Blueprint Standard Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
              {brandMark}
            </span>
            <span className="font-semibold text-slate-700">{platformName}</span>
            <span>·</span>
            <span>{projectProfile.copyright}</span>
          </div>
          <div className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="hover:text-indigo-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href={adminHref} className="hover:text-indigo-600 transition-colors">
              管理后台
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
