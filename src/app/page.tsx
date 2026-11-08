"use client"

import React, { useState } from "react"
import Link from "next/link"
import { projectProfile } from "@/shared/contract/project-profile"
import { readExtendedFacade } from "@/shared/contract/facade"
import {
  readDomainShowcase,
  readPortalBlueprint,
  readMultiClientBlueprint,
} from "@/shared/contract/blueprint-vars"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"quick-start" | "blueprint" | "domains">("quick-start")
  const [copied, setCopied] = useState(false)

  const facade = readExtendedFacade(projectProfile)
  const portal = readPortalBlueprint(projectProfile)
  const coreDomains = readDomainShowcase(projectProfile)
  const multiClient = readMultiClientBlueprint(projectProfile)

  const clientChannels = [
    {
      id: "consumer-web",
      name: `${portal.title} (C端)`,
      stack: "Next.js 15 App Router",
      role: `${portal.previewCta} · ${portal.primaryCta} · ${portal.profileLabel} (/2c)`,
      link: "/2c",
    },
    {
      id: "admin-web",
      name: `${facade.bEndEntry.label} (B端)`,
      stack: "Next.js 15 + PageBlockDSL v2",
      role: `指标大盘 · 状态看板 · 联动表单 (${facade.bEndEntry.href})`,
      link: facade.bEndEntry.href,
    },
    {
      id: "miniapp",
      name: `${multiClient.expoAppName} · 微信小程序 / H5`,
      stack: "Expo Universal + PageBlockDSL",
      role: `${multiClient.tabHomeLabel} · ${multiClient.tabStudioLabel} · ${multiClient.tabMemberLabel}`,
      link: "/portal",
    },
    {
      id: "native-app",
      name: `${multiClient.expoAppName} · 原生 App`,
      stack: `iOS (${multiClient.iosBundleId}) / Android`,
      role: "模块化 modules/<domain> 同源渲染 · 响应式表单联动",
      link: null,
    },
  ]

  const commands = {
    "quick-start": `# 1. 启动全栈开发服务 (${projectProfile.platformName})\npnpm run dev\n# 2. 访问 C 端业务门户: http://localhost:${facade.devPort}/2c\n# 3. 访问 B 端运营中台: http://localhost:${facade.devPort}${facade.bEndEntry.href}`,
    blueprint: `# Coolie工坊 / 27B 本地模型一键渲染新业务动态变量\nnode scripts/blueprint-engine.cjs render --preset ${projectProfile.industryPreset || "general-enterprise"} --set PLATFORM_TITLE="${projectProfile.platformName}"\n# 校验全栈 62 项模板变量与门面零硬编码泄漏\nnode scripts/blueprint-engine.cjs check`,
    domains: `# 独立拉起指定业务域沙箱 (如商城 Mall 域与支付 Pay 域)\npnpm run domain:up -- mall pay`,
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-sm"
              style={
                projectProfile.branding.primaryColor
                  ? { backgroundColor: projectProfile.branding.primaryColor }
                  : undefined
              }
            >
              {projectProfile.branding.mark}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">
                {projectProfile.platformName}
              </span>
              <span className="hidden sm:inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 font-semibold border border-blue-200">
                {facade.domainTagline}
              </span>
              <span className="hidden md:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono border border-slate-200">
                Blueprint v{projectProfile.version}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/2c"
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              <span>🌐 {portal.title} (C端)</span>
            </Link>

            <Link
              href={facade.bEndEntry.href}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span>⚙️ {facade.bEndEntry.label} (B端)</span>
            </Link>

            <Link
              href="/admin/login"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
            >
              登录控制台
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              {facade.heroBadge}
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
              {facade.heroTitle}{" "}
              <span className="text-blue-600 font-mono">{facade.heroHighlight}</span>
              <br />
              <span className="text-2xl sm:text-4xl text-slate-700 font-bold">
                {facade.heroSubtitle}
              </span>
            </h1>

            <p className="mt-4 text-base text-slate-600 leading-relaxed sm:text-lg">
              {facade.heroDescription}
            </p>

            {/* 双驱直通车 */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/2c"
                className="group relative rounded-xl border-2 border-blue-500 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌐</span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600">
                      {facade.cEndCardTitle}
                    </h3>
                  </div>
                  <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                    {facade.cEndCardCta}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {facade.cEndCardDesc}
                </p>
              </Link>

              <Link
                href={facade.bEndEntry.href}
                className="group relative rounded-xl border border-slate-300 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-400"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-950">
                      {facade.bEndCardTitle}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-600 font-semibold group-hover:translate-x-1 transition-transform">
                    {facade.bEndCardCta}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {facade.bEndCardDesc}
                </p>
              </Link>
            </div>
          </div>

          {/* Interactive Shell / Commands */}
          <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  blueprint.template.json / 27b-agent-ready
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(["quick-start", "blueprint", "domains"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 text-xs rounded transition ${
                      activeTab === tab
                        ? "bg-blue-600 text-white font-medium"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {tab === "quick-start"
                      ? "快速启动"
                      : tab === "blueprint"
                        ? "模板变量注入"
                        : "业务域沙箱"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start justify-between font-mono text-xs">
              <pre className="overflow-x-auto text-emerald-400 leading-relaxed">
                {commands[activeTab]}
              </pre>
              <button
                onClick={() => handleCopy(commands[activeTab])}
                className="ml-4 shrink-0 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:bg-slate-700 active:scale-95 transition"
              >
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 15 Domains List: 动态行业词包与业务域矩阵 */}
      <section id="domains" className="py-14 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold text-blue-600 font-mono tracking-wider">
                BLUEPRINT DOMAIN MATRIX
              </div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl mt-1">
                {coreDomains.length} 大核心业务域 · {projectProfile.shortName} 赋能矩阵
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                支持 Coolie工坊与 27B 本地模型按行业预设动态映射术语并按需裁剪插件域与客户端模块
              </p>
            </div>
            <Link
              href="/admin/system/menus"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              查看全部系统菜单 →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {coreDomains.map((d) => (
              <Link
                key={d.id}
                href={d.path}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white hover:border-blue-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{d.name}</h4>
                  <span className="text-[11px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    {d.tag}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {d.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Client Channels */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8">
            <div className="text-xs font-bold text-blue-600 font-mono tracking-wider">
              MULTI-CHANNEL TERMINALS
            </div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl mt-1">
              多端同源客户端支持矩阵
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              全端共享同一套版本化 API 契约、PageBlockDSL v2 画布与 blueprint.template.json 变量槽位
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {clientChannels.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                  <p className="text-xs text-blue-600 font-mono mt-1">{c.stack}</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{c.role}</p>
                </div>
                {c.link && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link
                      href={c.link}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      立即访问终端 →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-700">
              {projectProfile.platformName}
            </span>{" "}
            · {projectProfile.copyright} · MIT License
          </div>
          <div>{projectProfile.loginTagline}</div>
        </div>
      </footer>
    </div>
  )
}
