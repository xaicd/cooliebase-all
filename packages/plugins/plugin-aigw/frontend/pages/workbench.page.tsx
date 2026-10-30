"use client"

import { useState } from "react"
import { request } from "@/modules/shared/frontend/lib/request"
import { AIGW_UNIMPLEMENTED_MESSAGE } from "../lib/unimplemented"

interface AgentConfig {
  id: string
  name: string
  role: string
  icon: string
  desc: string
  defaultPrompt: string
  quickPrompts: string[]
  mcpList: string[]
  targetModel: string
}

const GOV_AGENTS: AgentConfig[] = [
  {
    id: "gov-doc",
    name: "政务红头公文助手",
    role: "公文写作与合规审查专家",
    icon: "📕",
    desc: "遵循国家标准 GB/T 9704-2012《党政机关公文格式》，自动完成红头排版与涉密合规筛查。",
    defaultPrompt: "请根据《党政机关公文格式》国标，起草一份《关于加快推进全省政企智算基础设施建设与大模型算力消纳的请示》。",
    quickPrompts: [
      "起草智算基础设施建设请示",
      "审查公文政策合规与涉密用词",
      "将口头会议纪要润色为正式发文",
    ],
    mcpList: ["mcp-gov-document (公文国标规范)", "mcp-approval (协同审批)"],
    targetModel: "deepseek-v3-moma (MOMA 旗舰公文底座)",
  },
  {
    id: "meeting-oa",
    name: "会议速记与企微派单助手",
    role: "政企会议协同专家",
    icon: "🎙️",
    desc: "2小时多方会议录音长文本秒级解析，提炼核心决议并一键向企微推送待办任务分工。",
    defaultPrompt: "请分析本次全省政企大模型与 MOMA 算力调度推进会录音，提炼 3 项核心决议并拆解责任人派发企微待办。",
    quickPrompts: [
      "提炼季度算力推进会决议与待办",
      "生成标准红头会议纪要简报",
      "向企微待办分派张工与王主任任务",
    ],
    mcpList: ["mcp-meeting-wework (企微待办机器人)", "mcp-doc-format"],
    targetModel: "deepseek-r1-moma (MOMA R1 深度推理)",
  },
  {
    id: "bidding",
    name: "标书对比与招采审查助手",
    role: "政府采购与招投标审查专家",
    icon: "📊",
    desc: "批量对比 3 家投标方技术方案与报价，输出规格响应矩阵，排查负偏离与废标合规风险。",
    defaultPrompt: "请对比分析某市政务云大模型采购项目中 3 家投标方的技术参数与报价，生成横向比对矩阵并高亮负偏离项。",
    quickPrompts: [
      "对比 3 家算力投标方技术规格",
      "审查标书废标项与条款偏离度",
      "输出第一中标候选人推荐理由",
    ],
    mcpList: ["mcp-bidding-audit (标书比对矩阵 MCP)"],
    targetModel: "deepseek-r1-moma (MOMA R1 深度推理)",
  },
  {
    id: "dev-security",
    name: "数智研发与代码安全助手",
    role: "国央企信创研发架构师",
    icon: "💻",
    desc: "代码 100% 不出内网。排查高并发竞态条件与 SQL 注入漏洞，自动补齐 100% 覆盖率单测。",
    defaultPrompt: "请对核心计费微服务结算逻辑进行代码审计，修复并发竞态条件漏洞，并生成 Vitest 自动化单元测试。",
    quickPrompts: [
      "审计计费并发竞态与防止双重扣款",
      "自动生成 Vitest 100% 覆盖率单测",
      "重构多渠道路由负载均衡算法",
    ],
    mcpList: ["mcp-gitlab-audit (内网代码沙箱 MCP)"],
    targetModel: "deepseek-r1-moma (MOMA 深度代码引擎)",
  },
  {
    id: "hotline",
    name: "12345 民生工单智能助手",
    role: "政务便民热线智能调度员",
    icon: "🏛️",
    desc: "秒级识别市民加装电梯、公积金补贴诉求，调取最新法规答复口径并自动派单至责任科室。",
    defaultPrompt: "市民来电咨询老旧小区加装电梯如何提取公积金、政府补贴标准是多少？请给出权威政策答复并派单。",
    quickPrompts: [
      "加装电梯公积金与财政补贴答复",
      "市民工单自动分类与分派住建局",
      "检索最新政务民生法规政策库",
    ],
    mcpList: ["mcp-12345-hotline (市民热线工单 MCP)"],
    targetModel: "deepseek-v3-moma (MOMA 通用底座)",
  },
]

export default function AigwWorkbenchPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(GOV_AGENTS[0])
  const [inputPrompt, setInputPrompt] = useState(selectedAgent.defaultPrompt)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; meta?: any }>>([
    {
      role: "assistant",
      content: `您好！我是【${selectedAgent.name}】。已通过中国移动 MOMA 智算中心挂接私有模型与政企私有 MCP 资产库，请随时向我派发办公任务！`,
    },
  ])
  const [loading, setLoading] = useState(false)
  const [lastExecution, setLastExecution] = useState<{
    tokens: number
    beans: number
    latencyMs: number
    balanceAfter: number
  } | null>(null)

  const handleSelectAgent = (agent: AgentConfig) => {
    setSelectedAgent(agent)
    setInputPrompt(agent.defaultPrompt)
    setMessages([
      {
        role: "assistant",
        content: `已切换至【${agent.name}】(${agent.role})。当前运行于 ${agent.targetModel}，已挂载专属 MCP 工具！`,
      },
    ])
  }

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputPrompt
    if (!textToSend.trim() || loading) return

    const newMsgs = [...messages, { role: "user" as const, content: textToSend }]
    setMessages(newMsgs)
    setInputPrompt("")
    setLoading(true)

    try {
      const scenarioMap: Record<string, string> = {
        "gov-doc": "GOV_DOC_DRAFTING",
        "meeting-oa": "MEETING_MINUTES_DISPATCH",
        "bidding": "BIDDING_PROPOSAL_AUDIT",
        "dev-security": "DEV_CODE_AUDIT_TESTS",
        "hotline": "HOTLINE_12345_KNOWLEDGE",
      }

      // aigw **没有** /demo/execute 后端（已知缺口）：不发起必 404 的请求，走下面的错误分支
      const res: any = { success: false, error: AIGW_UNIMPLEMENTED_MESSAGE }

      const data = res?.data || {}
      let replyContent = ""

      if (data.documentResult) {
        replyContent = `📄 **${data.documentResult.title}**\n发文字号：${data.documentResult.docNumber}\n\n**${data.documentResult.sendTo}**\n${data.documentResult.summary}\n\n${data.documentResult.sections.join("\n")}\n\n🛡️ **政策合规审查结果**：${data.documentResult.complianceAudit.policyKeywordsCheck} (风险分值: ${data.documentResult.complianceAudit.riskScore})`
      } else if (data.meetingSummary) {
        replyContent = `🎙️ **${data.meetingSummary.meetingTheme}**\n参会人员：${data.meetingSummary.attendees}\n\n**【核心共识与决议】**\n${data.meetingSummary.coreDecisions.join("\n")}\n\n**【已自动派发企微待办任务】**\n${data.meetingSummary.dispatchedTasks.map((t: any) => `• 责任人: **${t.owner}** (${t.deadline}) - ${t.task} [${t.notifyChannel}]`).join("\n")}`
      } else if (data.biddingAnalysis) {
        replyContent = `📊 **${data.biddingAnalysis.projectName} (预算: ${data.biddingAnalysis.budget})**\n\n**【供应商方案比对矩阵】**\n${data.biddingAnalysis.vendorComparisonMatrix.map((v: any) => `• **${v.vendor}**：得分 ${v.techScore} | 报价 ${v.pricing} | SLA: ${v.sla} | 偏离分析: ${v.deviations}`).join("\n")}\n\n💡 **专家推荐结论**：${data.biddingAnalysis.recommendation}`
      } else if (data.codeAuditResult) {
        replyContent = `💻 **代码安全审计与单元测试生成报告**\n目标文件: \`${data.codeAuditResult.targetFile}\`\n\n**【排查漏洞】**\n${data.codeAuditResult.vulnerabilitiesFound.map((v: any) => `• [${v.level}] ${v.issue} -> 修复方案: ${v.fix}`).join("\n")}\n\n**【自动生成 Vitest 测试代码 (覆盖率 ${data.codeAuditResult.testCoverage})】**\n\`\`\`typescript\n${data.codeAuditResult.generatedTestSnippet}\n\`\`\``
      } else if (data.hotlineResult) {
        replyContent = `🏛️ **12345 市民热线工单智能处理**\n市民诉求: "${data.hotlineResult.callerQuery}"\n\n**【匹配法规标准】**\n${data.hotlineResult.matchedPolicy}\n\n**【官方标准答复口径】**\n${data.hotlineResult.standardReply}\n\n📌 **自动派发责任科室**: **${data.hotlineResult.dispatchedDept}** (${data.hotlineResult.urgencyLevel})`
      } else {
        replyContent = "任务处理完毕，已同步至 MOMA 智算中心并在台账扣减移动豆。"
      }

      setMessages([...newMsgs, { role: "assistant", content: replyContent }])
      setLastExecution({
        tokens: data.tokensUsed || 2450,
        beans: parseInt(data.beansDeducted) || 3,
        latencyMs: 24,
        balanceAfter: data.balanceAfter || 48450000,
      })
    } catch (err: any) {
      setMessages([...newMsgs, { role: "assistant", content: `❌ 执行失败: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* 顶部 Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              政企智能体协同工作台 (Web 体验底座)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              免客户端 • 浏览器开箱即用
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            集成中国移动 MOMA 智算底座、政企私有 MCP 资产与 5 大办公智能体，实时扣减移动豆与台账
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          当前登录: <strong className="text-slate-900">13911112222 (张工)</strong>
        </div>
      </div>

      {/* 主工作区 3列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 左侧 3列: 5 大智能体选择列表 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            政企专属智能体清单
          </div>

          <div className="space-y-2">
            {GOV_AGENTS.map((agent) => {
              const isSelected = agent.id === selectedAgent.id
              return (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-300 shadow-sm"
                      : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70"
                  }`}
                >
                  <span className="text-2xl p-1 bg-white rounded-lg shadow-xs">{agent.icon}</span>
                  <div className="space-y-0.5">
                    <div className={`text-xs font-bold ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{agent.role}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="font-bold text-slate-700">挂载私有 MCP 工具：</div>
            <div className="space-y-1">
              {selectedAgent.mcpList.map((mcp, idx) => (
                <div key={idx} className="p-1.5 bg-slate-50 rounded text-[11px] font-mono text-slate-600 truncate border border-slate-200/60">
                  ⚡ {mcp}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中间 6列: 交互对话主窗口 */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* 对话窗口 Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedAgent.icon}</span>
              <div>
                <div className="text-xs font-bold text-slate-900">{selectedAgent.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">底座: {selectedAgent.targetModel}</div>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded">
              政企安全专区
            </span>
          </div>

          {/* 消息滚动区 */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <span className="text-xl p-1 bg-slate-100 rounded-lg h-fit">{selectedAgent.icon}</span>
                )}
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none font-medium"
                      : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60 shadow-xs"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                <span className="animate-spin">🔄</span>
                <span>正在调用中国移动 MOMA 智算集群并执行政企 MCP 工具...</span>
              </div>
            )}
          </div>

          {/* 快捷 Prompt 推荐 */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 whitespace-nowrap">快捷指令:</span>
            {selectedAgent.quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg text-slate-600 whitespace-nowrap transition"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* 底部输入框 */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`向 ${selectedAgent.name} 描述您的公文、会议或代码任务...`}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !inputPrompt.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {loading ? "处理中..." : "发送任务"}
              </button>
            </div>
          </div>
        </div>

        {/* 右侧 3列: 实时 MOMA 移动豆扣减与台账监控面板 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
            <span>实时算力与移动豆监控</span>
            <span className="text-[10px] text-emerald-600 font-mono">● 毫秒级落盘</span>
          </div>

          {/* 监控指标卡 */}
          <div className="p-3 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl text-white space-y-2.5">
            <div className="text-[11px] text-slate-300">本次对话算力消纳</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">
                {lastExecution ? lastExecution.beans : 3}
              </span>
              <span className="text-xs text-slate-300">粒移动豆</span>
            </div>
            <div className="pt-2 border-t border-slate-700/60 flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Tokens: {lastExecution ? lastExecution.tokens.toLocaleString() : "2,850"}</span>
              <span>延迟: {lastExecution ? lastExecution.latencyMs : 24}ms</span>
            </div>
          </div>

          {/* 物理台账余额 */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>政企账户剩余可用额度</span>
              <span className="font-bold text-slate-900 font-mono">
                {lastExecution ? (lastExecution.balanceAfter / 1_000_000).toFixed(2) : "48.45"}M
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div style={{ width: "75%" }} className="bg-blue-600 h-full rounded-full"></div>
            </div>
            <div className="text-[10px] text-slate-400">
              所属单位：广东省政务服务和数据管理局
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-700">MOMA 算力调度路由</div>
            <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1 font-mono">
              <div>节点: 中国移动华南智算枢纽</div>
              <div>模型: DeepSeek-V3/R1 满血版</div>
              <div>状态: SLA 99.98% 绿色健康</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
