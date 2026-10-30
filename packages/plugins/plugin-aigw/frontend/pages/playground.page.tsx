"use client"

import { useEffect, useState } from "react"
import { request } from "@/modules/shared/frontend/lib/request"
import { AigwModelApi } from "../api/models.api"
import { AIGW_UNIMPLEMENTED_MESSAGE } from "../lib/unimplemented"

export default function AigwPlaygroundPage() {
  const [runningScenario, setRunningScenario] = useState<string | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<any | null>(null)
  const [currentScenarioName, setCurrentScenarioName] = useState<string>("")
  const [modelsList, setModelsList] = useState<any[]>([])
  const [appsList, setAppsList] = useState<any[]>([])

  // 动态编排自定义表单参数
  const [customParams, setCustomParams] = useState({
    model: "deepseek-chat",
    carrierName: "中国移动通信集团政企客户分公司",
    appCode: "workbuddy",
    phone: "13911112222",
    prompt: "请根据《党政机关公文格式》国家标准，起草关于加快推进全省政企智算基础设施建设的正式请示",
  })

  useEffect(() => {
    // 动态拉取模型目录配置
    AigwModelApi.page({ page: 1, pageSize: 100 })
      .then((res: any) => {
        if (res?.success && res?.data?.items?.length) {
          setModelsList(res.data.items)
          setCustomParams((prev) => ({
            ...prev,
            model: res.data.items[0].modelKey,
          }))
        }
      })
      .catch(() => {})

    // aigw **没有** /isv-apps 后端（已知缺口）：不发起必 404 的请求，应用列表保持为空（下拉回落内置选项）
  }, [])

  const runScenario = async (scenario: string, name: string, overrideParams?: any) => {
    setRunningScenario(scenario)
    setCurrentScenarioName(name)
    setConsoleOutput(null)

    try {
      const payload = {
        scenario,
        ...(overrideParams || customParams),
      }

      // aigw **没有** /demo/execute 后端（已知缺口）：不发起必 404 的请求，走错误展示
      const res: any = { success: false, error: AIGW_UNIMPLEMENTED_MESSAGE }
      setConsoleOutput(res)
    } catch (err: any) {
      setConsoleOutput({ error: err.message || "请求失败" })
    } finally {
      setRunningScenario(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 头部标题与描述 */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            政企核心办公智能体场景演练与联调
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            涵盖红头公文起草合规审查、会议纪要自动派单、标书智能比对、内网安全代码审计与 12345 民生工单智能答复 5 大政企高频实战场景
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            MOMA 智算底座 + WorkBuddy/Qoder 办公智能体就绪
          </span>
        </div>
      </div>

      {/* 动态编排自定义控制台 */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-blue-400">🎛️ 政企办公场景动态编排工作台</span>
            <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded">
              联动已配置的模型目录 ({modelsList.length} 个模型已接入)
            </span>
          </div>
          <button
            onClick={() => runScenario("GOV_DOC_DRAFTING", "自定义红头公文起草与合规审查")}
            disabled={runningScenario !== null}
            className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50"
          >
            {runningScenario !== null ? "正在编排与执行..." : "⚡ 触发自定义政企公文场景演练"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              MOMA 算力模型 <span className="text-blue-400 font-normal">(联动模型目录)</span>
            </label>
            <select
              value={customParams.model}
              onChange={(e) => setCustomParams({ ...customParams, model: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              {modelsList.length > 0 ? (
                modelsList.map((m) => (
                  <option key={m.id || m.modelKey} value={m.modelKey}>
                    {m.modelKey} ({m.name || m.provider})
                  </option>
                ))
              ) : (
                <>
                  <option value="deepseek-chat">deepseek-chat (DeepSeek-V3 深度思考)</option>
                  <option value="deepseek-r1">deepseek-r1 (DeepSeek-R1 深度推理)</option>
                  <option value="jiutian-gov-70b">jiutian-gov-70b (中移九天政务大模型)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              办公智能体应用 (ISV) <span className="text-blue-400 font-normal">(联动应用生态)</span>
            </label>
            <select
              value={customParams.appCode}
              onChange={(e) => setCustomParams({ ...customParams, appCode: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              {appsList.length > 0 ? (
                appsList.map((app) => (
                  <option key={app.id || app.code} value={app.code}>
                    💼 {app.name} ({app.category || "智能体"})
                  </option>
                ))
              ) : (
                <>
                  <option value="workbuddy">💼 腾讯 WorkBuddy (公文/会议/工单)</option>
                  <option value="qoder">⚡ 阿里 Qoder (数智研发/安全审计)</option>
                  <option value="trae">🚀 字节 Trae (工作流自动化 Agent)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">政企员工登录手机号</label>
            <input
              type="text"
              value={customParams.phone}
              onChange={(e) => setCustomParams({ ...customParams, phone: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-slate-300 font-medium mb-1">自定义政企办公指令 Prompt</label>
          <input
            type="text"
            value={customParams.prompt}
            onChange={(e) => setCustomParams({ ...customParams, prompt: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 5 大真实政企办公场景卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 场景 1: 红头公文起草与合规审查 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded">
                场景 1 • 公文规范
              </span>
              <span className="text-[10px] text-slate-400">WorkBuddy + 公文MCP</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">红头公文起草、格式润色与政策合规审查</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              严格按照《党政机关公文格式》生成红头请示，自动排查涉密与政策合规风险，扣减 3 粒移动豆。
            </p>
          </div>
          <button
            onClick={() => runScenario("GOV_DOC_DRAFTING", "红头公文起草与合规审查")}
            disabled={runningScenario !== null}
            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
          >
            运行场景 1 演练
          </button>
        </div>

        {/* 场景 2: 会议速记与企微待办派发 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                场景 2 • 会议协同
              </span>
              <span className="text-[10px] text-slate-400">企微连接器 MCP</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">会议录音速记 → 核心决议提炼与待办派发</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              2小时长会议录音秒级提炼核心决议，自动拆解分工责任人并一键发送至企微待办。
            </p>
          </div>
          <button
            onClick={() => runScenario("MEETING_MINUTES_DISPATCH", "会议速记与企微待办派发")}
            disabled={runningScenario !== null}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
          >
            运行场景 2 演练
          </button>
        </div>

        {/* 场景 3: 招投标技术方案与标书对比 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                场景 3 • 招采审查
              </span>
              <span className="text-[10px] text-slate-400">标书对比 MCP</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">招投标采购技术方案对比与废标风险排查</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              批量解析 3 家投标方技术方案，自动生成技术规格响应与报价矩阵，高亮负偏离与合规隐患。
            </p>
          </div>
          <button
            onClick={() => runScenario("BIDDING_PROPOSAL_AUDIT", "标书对比与偏离项审查")}
            disabled={runningScenario !== null}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition"
          >
            运行场景 3 演练
          </button>
        </div>

        {/* 场景 4: 内网代码安全审计与单测生成 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                场景 4 • 数智研发
              </span>
              <span className="text-[10px] text-slate-400">阿里 Qoder</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">内网代码安全审计、重构与 100% 单测生成</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              全程在本地 MOMA 算力运行，代码不出内网。修复高并发竞态漏洞并自动补齐 Vitest 单测。
            </p>
          </div>
          <button
            onClick={() => runScenario("DEV_CODE_AUDIT_TESTS", "内网代码审计与单测生成")}
            disabled={runningScenario !== null}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
          >
            运行场景 4 演练
          </button>
        </div>

        {/* 场景 5: 12345 工单智能分类与政策答复 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                场景 5 • 政务民生
              </span>
              <span className="text-[10px] text-slate-400">12345 工单 MCP</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">12345 市民热线工单智能分类与标准政策答复</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              秒级识别市民加装电梯与公积金提取诉求，检索最新法规条款生成权威答复并自动分派住建局。
            </p>
          </div>
          <button
            onClick={() => runScenario("HOTLINE_12345_KNOWLEDGE", "12345 工单智能派单与政策答复")}
            disabled={runningScenario !== null}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
          >
            运行场景 5 演练
          </button>
        </div>
      </div>

      {/* 控制台实时落盘与返回结果输出 */}
      {consoleOutput && (
        <div className="p-5 bg-slate-950 rounded-2xl text-white font-mono text-xs border border-slate-800 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-slate-200">
                政企场景执行成果 • {currentScenarioName}
              </span>
            </div>
            <button
              onClick={() => setConsoleOutput(null)}
              className="text-slate-500 hover:text-slate-300"
            >
              清空控制台
            </button>
          </div>

          <pre className="overflow-x-auto text-emerald-400 p-2 bg-black/40 rounded-lg max-h-96 leading-relaxed">
            {JSON.stringify(consoleOutput, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
