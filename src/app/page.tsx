"use client"

import React, { useState } from "react"
import Link from "next/link"
import { projectProfile } from "@/shared/contract/project-profile"

const coreDomains = [
  { id: "system", name: "系统管理", path: "/admin/system/users", desc: "用户、角色、菜单权限、部门岗位、数据字典与多租户隔离", tag: "System" },
  { id: "infra", name: "基础设施", path: "/admin/infra/configs", desc: "动态参数中心、定时任务调度、代码生成引擎与审计日志", tag: "Infra" },
  { id: "ai", name: "AI 模型网关", path: "/admin/aigw/channels", desc: "多上游供应商负载均衡、Token 额度计费与 OpenAI 兼容出口", tag: "Gateway" },
  { id: "mall", name: "商城中心", path: "/admin/mall/spu", desc: "商品 SPU/SKU、类目属性、订单结算与移动端多端购物车", tag: "Commerce" },
  { id: "member", name: "会员中心", path: "/admin/member/users", desc: "C 端会员档案、成长等级、积分流水与用户画像", tag: "Member" },
  { id: "pay", name: "支付中心", path: "/admin/pay/orders", desc: "微信/支付宝聚合支付、商户应用分账与异步退款通知", tag: "Payment" },
  { id: "bpm", name: "工作流中心", path: "/admin/bpm/models", desc: "BPMN 2.0 流程建模、动态表单设计与多级审批流转", tag: "Workflow" },
  { id: "crm", name: "客户关系", path: "/admin/crm/customers", desc: "线索公海池、客户商机跟进、合同回款与销售漏斗", tag: "CRM" },
  { id: "erp", name: "企业资源", path: "/admin/erp/purchase-orders", desc: "采购入库、销售出库、多仓调拨与财务凭证管理", tag: "ERP" },
  { id: "wms", name: "仓储物流", path: "/admin/wms/wms-warehouse", desc: "库区库位建模、入库质检、出库拣货与批次条码追踪", tag: "WMS" },
  { id: "mes", name: "制造执行", path: "/admin/mes/work-orders", desc: "工单排产、工艺路线、工序报工与生产线实时看板", tag: "MES" },
  { id: "iot", name: "IoT 物联网", path: "/admin/iot/devices", desc: "设备物模型定义、遥测数据上报、在线状态与告警规则", tag: "IoT" },
  { id: "im", name: "实时通信", path: "/admin/im/conversations", desc: "WebSocket 多端长连接、单聊群聊会话与敏感词风控", tag: "IM" },
  { id: "mp", name: "微信公众号", path: "/admin/mp/accounts", desc: "多公众号接入、粉丝标签同步、自定义菜单与自动回复", tag: "WeChat" },
  { id: "report", name: "数据报表", path: "/admin/report/boards", desc: "数据大屏可视化、多维交叉报表与动态 SQL 透视分析", tag: "Report" },
]

const clientChannels = [
  { id: "admin-web", name: "管理端 PC", stack: "Next.js 15 App Router", role: "企业管理后台 (生产就绪)" },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"quick-start" | "docker" | "domain">("quick-start")
  const [copied, setCopied] = useState(false)

  const repoUrl = "https://github.com/xaicd/cooliebase-all"
  const repoCloneUrl = "https://github.com/xaicd/cooliebase-all.git"

  const commands = {
    "quick-start": `git clone ${repoCloneUrl}\ncd cooliebase-all\npnpm install\npnpm run quick-start`,
    "docker": `docker compose -f deploy/docker-compose.prod.yml up -d`,
    "domain": `# 独立提取并运行指定业务域 (如 pay 支付域)\nnpm run domain:up -- pay`
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-sm">
              R
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">{projectProfile.platformName}</span>
              <span className="hidden sm:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-mono border border-slate-200">
                MIT License
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              <svg className="h-4 w-4 fill-current text-slate-800" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub 源码</span>
            </a>

            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
            >
              登录控制台
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-medium text-blue-700 mb-6">
            <span>Next.js 15 App Router · 全功能企业级开源复用基座</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            现代化全栈业务底座
            <span className="block text-blue-600 mt-2 font-extrabold">
              模块化单体与微服务无缝双模演进
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-sm text-slate-600 sm:text-base leading-relaxed">
            基于 Next.js 15 + TypeScript + Kysely/Prisma 现代化技术栈构建。内置 <strong className="text-slate-900">15 大原生业务域</strong>、
            <strong className="text-slate-900">AI 模型网关中台（new-api 吸收）</strong>、
            <strong className="text-slate-900">多端独立客户端包（H5 / 小程序 / Flutter / 桌面端）</strong> 与
            <strong className="text-slate-900">全栈逆向代码生成器</strong>，专为实际业务系统初始化打造。
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin/system/users"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              进入管理后台
            </Link>
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              查看 GitHub 仓库
            </a>
          </div>

          {/* Clean Terminal Snippet */}
          <div className="mx-auto mt-10 max-w-2xl text-left">
            <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-lg overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span className="ml-2 text-[11px] text-slate-400">快速初始化</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("quick-start")}
                    className={`px-2 py-0.5 rounded text-[11px] ${activeTab === "quick-start" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    本地启动
                  </button>
                  <button
                    onClick={() => setActiveTab("docker")}
                    className={`px-2 py-0.5 rounded text-[11px] ${activeTab === "docker" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Docker 生产
                  </button>
                  <button
                    onClick={() => setActiveTab("domain")}
                    className={`px-2 py-0.5 rounded text-[11px] ${activeTab === "domain" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    按域拆分
                  </button>
                  <button
                    onClick={() => handleCopy(commands[activeTab])}
                    className="ml-2 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700"
                  >
                    {copied ? "已复制" : "复制"}
                  </button>
                </div>
              </div>
              <div className="p-4 text-emerald-400 overflow-x-auto">
                <pre>{commands[activeTab]}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="border-b border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">15 + 1</p>
              <p className="mt-1 text-xs text-slate-500">原生业务域 + Online 引擎</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">2,095</p>
              <p className="mt-1 text-xs text-slate-500">版本化 API 契约与 DTO</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">5 端同构</p>
              <p className="mt-1 text-xs text-slate-500">PC / H5 / 小程序 / Flutter / Desktop</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">100% TS</p>
              <p className="mt-1 text-xs text-slate-500">强类型安全与 Zod 校验</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights Grid */}
      <section className="py-14 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">企业级核心架构特性</h2>
            <p className="mt-1 text-xs text-slate-500">遵循清晰的分层规范与工业级高可用设计</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Gateway */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="text-xs font-bold text-blue-600 font-mono">01 / AI MODEL GATEWAY</div>
              <h3 className="mt-2 text-base font-bold text-slate-900">AI 模型网关中台 (new-api 吸收)</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                支持多上游渠道加权轮询、优先级调度、模型映射、调用失败自动熔断与 Token 额度计量，提供标准 OpenAI 协议转发。
              </p>
            </div>

            {/* Cross-Platform */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="text-xs font-bold text-blue-600 font-mono">02 / CROSS-PLATFORM</div>
              <h3 className="mt-2 text-base font-bold text-slate-900">全端多渠道独立客户端包</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                独立包组织（clients/expo），统一消费 /api/v1/app 面与共享 DTO 契约，避免各端逻辑分叉。
              </p>
            </div>

            {/* Dual Mode */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="text-xs font-bold text-blue-600 font-mono">03 / DUAL-MODE EVOLUTION</div>
              <h3 className="mt-2 text-base font-bold text-slate-900">模块化单体与微服务演进</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                通过 Domain Facade 实现双模调用：单体模式走同进程零开销 SDK 内存调用，拆分部署走自研 NATS/RPC 协议。
              </p>
            </div>

            {/* Multi Database */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="text-xs font-bold text-blue-600 font-mono">04 / MULTI-DATABASE</div>
              <h3 className="mt-2 text-base font-bold text-slate-900">多数据库兼容与多租户隔离</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                以 PostgreSQL 为默认主源，适配 MySQL、达梦（DM）、Oracle。仓储层基于 Kysely 构建，实现行级租户安全隔离。
              </p>
            </div>

            {/* Codegen */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="text-xs font-bold text-blue-600 font-mono">05 / FULL-STACK CODEGEN</div>
              <h3 className="mt-2 text-base font-bold text-slate-900">全栈逆向代码生成器</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                表结构一键生成后端 Entity / DTO / Zod / Repository / Service 与前端 API / Form / 列表页，支持受控热注入。
              </p>
            </div>

            {/* Service Governance */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="text-xs font-bold text-blue-600 font-mono">06 / SERVICE GOVERNANCE</div>
              <h3 className="mt-2 text-base font-bold text-slate-900">生产级服务治理与全链路安全</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Resilience4j 熔断状态机、带抖动指数重试、Redis 滑动窗口限流（429）、W3C TraceId 全链路追踪与 Traefik 自动 SSL。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 15 Domains List */}
      <section className="py-14 border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">15 大原生业务域一览</h2>
              <p className="mt-1 text-xs text-slate-500">按 Modules-First 分层组织，严格契约约束</p>
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
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{d.name}</h4>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
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
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">多端客户端支持矩阵</h2>
            <p className="mt-1 text-xs text-slate-500">全端消费同一套版本化 API 契约</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {clientChannels.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <h4 className="text-sm font-semibold text-slate-900">{c.name}</h4>
                <p className="text-xs text-blue-600 font-mono mt-1">{c.stack}</p>
                <p className="text-[11px] text-slate-500 mt-2">{c.role}</p>
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
            基于 Next.js 15 App Router · 企业级全栈开源基座
          </div>
        </div>
      </footer>
    </div>
  )
}
