"use client"

import React, { useState } from "react"
import Link from "next/link"
import { projectProfile } from "@/shared/contract/project-profile"
import { apiPath } from "@/shared/frontend/lib/request"

const coreDomains = [
  { id: "mall", name: "图书商城 (Mall)", path: "/admin/mall/spu", desc: "典藏书目 SPU/SKU 管理、多级图书分类、出版专栏与读者在线购书/借阅结算", tag: "Core Business" },
  { id: "member", name: "读者会员 (Member)", path: "/admin/member/users", desc: "读者实名档案、会员等级体系、借阅积分抵扣与阅读偏好画像分析", tag: "Core Business" },
  { id: "pay", name: "聚合支付 (Pay)", path: "/admin/pay/orders", desc: "微信/支付宝聚合收银台、多渠道分账、购书发票管理与原路退款", tag: "Finance" },
  { id: "bpm", name: "版权与流程 (BPM)", path: "/admin/bpm/models", desc: "图书出版上架审批、版权合规风控流转、大额采购与下架审核", tag: "Workflow" },
  { id: "ai", name: "AI 伴读网关 (AIGW)", path: "/admin/aigw/channels", desc: "AI 伴读问答助手、典藏书目核心书评摘要、读者偏好向量推荐出口", tag: "Intelligence" },
  { id: "system", name: "系统与安全 (System)", path: "/admin/system/users", desc: "多租户行级隔离、RBAC 细粒度权限控制、操作审计流水与敏感词风控", tag: "Security" },
  { id: "infra", name: "基础设施 (Infra)", path: "/admin/infra/configs", desc: "动态参数调优中心、分布式定时任务调度、代码生成引擎与性能日志", tag: "Infra" },
  { id: "im", name: "读者书友圈 (IM)", path: "/admin/im/conversations", desc: "WebSocket 多端长连接通信、同城读者书友群聊与交流敏感词过滤", tag: "Community" },
  { id: "crm", name: "出版企划 (CRM)", path: "/admin/crm/customers", desc: "重点作家签约跟进、出版商机转化漏斗与图书分销渠道客户管理", tag: "CRM" },
  { id: "erp", name: "供应链采购 (ERP)", path: "/admin/erp/purchase-orders", desc: "实体图书纸本采购入库、库存调拨、印厂供应商往来凭证管理", tag: "ERP" },
  { id: "wms", name: "典藏物流 (WMS)", path: "/admin/wms/wms-warehouse", desc: "中央库区库位建模、纸书入库质检、出库配货与物流快递单追踪", tag: "WMS" },
  { id: "mes", name: "印刷排产 (MES)", path: "/admin/mes/work-orders", desc: "珍藏限量版图书印刷工单排产、装订工艺路线与印厂实时看板", tag: "MES" },
  { id: "iot", name: "智能书柜 (IoT)", path: "/admin/iot/devices", desc: "线下共享智能书柜物模型、读者 RFID 借还感应与离线应急告警", tag: "IoT" },
  { id: "mp", name: "微信生态 (MP)", path: "/admin/mp/accounts", desc: "微信服务号接入、读者购书消息模板推送、粉丝标签与专属福利", tag: "WeChat" },
  { id: "report", name: "书城大盘 (Report)", path: "/admin/report/boards", desc: "全站阅读与营收大屏、多维图书借阅交叉分析与销量透视看板", tag: "BI Analytics" },
]

const clientChannels = [
  { id: "reader-web", name: "读者 C 端门户", stack: "Next.js 15 App Router", role: "在线试读 · 典藏借阅 · 读者书评 (/2c)", link: "/2c" },
  { id: "admin-web", name: "企业运营中台 (B端)", stack: "Next.js 15 + Tailwind", role: "版权审核 · 订单对账 · 会员管理 (/admin)", link: "/admin" },
  { id: "miniapp", name: "微信小程序 / 移动端", stack: "Uni-App + Vue 3", role: "移动端掌上书店 · 随时随地随身畅读", link: null },
  { id: "native-app", name: "原生移动 App", stack: "Expo (React Native)", role: "6 寸屏阅读体验 · 本地离线电子书缓存", link: null },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"quick-start" | "gateway" | "domains">("quick-start")
  const [copied, setCopied] = useState(false)

  const commands = {
    "quick-start": "# 1. 启动全栈开发服务\npnpm run dev\n# 2. 访问读者 C 端书苑: http://localhost:3300/2c\n# 3. 访问企业运营中台: http://localhost:3300/admin",
    "gateway": "# 全链路 BasePath 挂载模式验证\nPREVIEW_BASE_PATH=/ebook-mall-cb pnpm run build:standalone\n# 在子路径反代下静态资源与接口自动挂载 /ebook-mall-cb 前缀",
    "domains": "# 独立拉起指定业务域沙箱 (如商城 Mall 域与支付 Pay 域)\npnpm run domain:up -- mall pay"
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-sm">
              {projectProfile.branding.mark}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">{projectProfile.platformName}</span>
              <span className="hidden sm:inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 font-semibold border border-blue-200">
                CoolieBase 蓝图驱动
              </span>
              <span className="hidden md:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono border border-slate-200">
                BasePath 双模适配
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/2c"
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              <span>📚 读者书苑 (C端)</span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              <span>⚙️ 运营中台 (B端)</span>
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
              企业级多端数字化出版与借阅平台 · 生产就绪
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
              电子书城 <span className="text-blue-600 font-mono">E-book Mall</span>
              <br />
              <span className="text-2xl sm:text-4xl text-slate-700 font-bold">基于 CoolieBase 全栈蓝图底座</span>
            </h1>

            <p className="mt-4 text-base text-slate-600 leading-relaxed sm:text-lg">
              融合 15 大企业级原生业务域，打通从 <span className="font-semibold text-slate-900">C 端读者在线试读、典藏借阅与书评互动</span>，到 <span className="font-semibold text-slate-900">B 端版权保护、聚合对账、物流调拨与流程审批</span> 的全流程闭环体系。
            </p>

            {/* 双驱直通车 */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/2c"
                className="group relative rounded-xl border-2 border-blue-500 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📚</span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600">进入读者书苑 (C 端)</h3>
                  </div>
                  <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">立即试读 →</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  精选典藏书目检索、章节试读、读者书评、即时加入书架与在线结算体验。
                </p>
              </Link>

              <Link
                href="/admin"
                className="group relative rounded-xl border border-slate-300 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-400"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-950">进入运营中台 (B 端)</h3>
                  </div>
                  <span className="text-xs text-slate-600 font-semibold group-hover:translate-x-1 transition-transform">控制台 →</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  图书 SPU/SKU 典藏管理、购书订单、读者成长等级、聚合支付对账与 BPM 流程审批。
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
                <span className="ml-2 text-xs font-mono text-slate-400">cooliebase-cli / deployment-engine</span>
              </div>
              <div className="flex items-center gap-2">
                {(["quick-start", "gateway", "domains"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 text-xs rounded transition ${activeTab === tab ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                  >
                    {tab === "quick-start" ? "快速启动" : tab === "gateway" ? "BasePath 网关" : "业务域沙箱"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start justify-between font-mono text-xs">
              <pre className="overflow-x-auto text-emerald-400 leading-relaxed">{commands[activeTab]}</pre>
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

      {/* 15 Domains List: 蓝图底座与电子书城深度结合 */}
      <section id="domains" className="py-14 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold text-blue-600 font-mono tracking-wider">COOLIEBASE BLUEPRINT MATRIX</div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl mt-1">15 大原生业务域 · 电子书城赋能矩阵</h2>
              <p className="mt-1 text-xs text-slate-500">基于 Modules-First 分层解耦设计，严格契约约束与全链路双模 BasePath 治理</p>
            </div>
            <Link href="/admin/system/menus" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
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
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">{d.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Client Channels */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8">
            <div className="text-xs font-bold text-blue-600 font-mono tracking-wider">MULTI-CHANNEL TERMINALS</div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl mt-1">多端客户端支持矩阵</h2>
            <p className="mt-1 text-xs text-slate-500">全端消费同一套版本化 API 契约与 OpenAPI 规范</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {clientChannels.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                  <p className="text-xs text-blue-600 font-mono mt-1">{c.stack}</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{c.role}</p>
                </div>
                {c.link && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link href={c.link} className="text-xs font-semibold text-blue-600 hover:underline">
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
            <span className="font-semibold text-slate-700">{projectProfile.platformName}</span> · {projectProfile.copyright} · MIT License
          </div>
          <div>
            基于 CoolieBase 企业级全栈开源基座 · Next.js 15 App Router
          </div>
        </div>
      </footer>
    </div>
  )
}
