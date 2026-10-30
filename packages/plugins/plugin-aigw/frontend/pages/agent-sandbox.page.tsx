"use client"

import { useState } from "react"
import { request } from "@/modules/shared/frontend/lib/request"
import { AIGW_UNIMPLEMENTED_MESSAGE } from "../lib/unimplemented"

interface PresetUser {
  name: string
  phone: string
  org: string
  role: string
  appCode: string
  appName: string
  targetModel: string
  expectedMcp: string
}

const PRESET_USERS: PresetUser[] = [
  {
    name: "李总 (处长)",
    phone: "13800000001",
    org: "广东省政务服务和数据管理局",
    role: "信息化处长 / IT管理员",
    appCode: "workbuddy",
    appName: "腾讯 WorkBuddy (公文与协同)",
    targetModel: "deepseek-v3-moma (671B 满血公文版)",
    expectedMcp: "国家标准红头公文排版 + 企微会议纪要",
  },
  {
    name: "张工 (首席架构师)",
    phone: "13911112222",
    org: "广东省交通数智科技集团",
    role: "首席研发架构师",
    appCode: "qoder",
    appName: "阿里 Qoder (数智研发助手)",
    targetModel: "deepseek-r1-moma (满血深度推理版)",
    expectedMcp: "国央企内网 GitLab 审计 + 招投标审查",
  },
  {
    name: "陈科长 (政策科长)",
    phone: "13600009999",
    org: "深圳市住房公积金管理中心",
    role: "政策法规科长",
    appCode: "workbuddy",
    appName: "腾讯 WorkBuddy",
    targetModel: "deepseek-v3-moma",
    expectedMcp: "政务 12345 市民热线与工单分派",
  },
]

export default function AgentSandboxPage() {
  const [phone, setPhone] = useState("13800000001")
  const [appCode, setAppCode] = useState("workbuddy")
  const [loading, setLoading] = useState(false)
  const [authResponse, setAuthResponse] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 模拟交互会话
  const [prompt, setPrompt] = useState("请帮我起草一份关于广东省政务大模型算力平台二期建设的请示公文，严格遵循国家红头公文排版标准。")
  const [chatLog, setChatLog] = useState<Array<{ role: string; content: string; mcpUsed?: string; tokens?: number }>>([])
  const [runningInference, setRunningInference] = useState(false)

  // 执行鉴权探测
  const handleVerify = async (testPhone = phone, testApp = appCode) => {
    setLoading(true)
    setErrorMsg(null)
    setAuthResponse(null)
    try {
      // aigw **没有** /auth/agent-verify 后端（已知缺口）：不发起必 404 的请求，如实返回未开通
      const res: any = { success: false, error: AIGW_UNIMPLEMENTED_MESSAGE }
      if (res.success && res.data) {
        setAuthResponse(res.data)
      } else {
        setErrorMsg(res.error || "鉴权失败")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "请求异常")
    } finally {
      setLoading(false)
    }
  }

  // 点击预置角色快捷测试
  const handleSelectPreset = (preset: PresetUser) => {
    setPhone(preset.phone)
    setAppCode(preset.appCode)
    handleVerify(preset.phone, preset.appCode)
  }

  // 模拟客户端内交互
  const handleSimulateChat = () => {
    if (!prompt.trim()) return
    setRunningInference(true)
    const userMsg = prompt
    setPrompt("")

    const newLogs = [...chatLog, { role: "user", content: userMsg }]
    setChatLog(newLogs)

    setTimeout(() => {
      setRunningInference(false)
      const assistantReply = {
        role: "assistant",
        content: `【广东省政务服务和数据管理局 请示公文】\n\n发文字号：粤政数〔2026〕88号\n签发人：李局长\n\n关于推进广东省政务大模型算力中枢二期扩容的请示\n\n省人民政府：\n  根据全省政务数字化转型总体规划，我局依托中国移动 MOMA 智算集群建设的政企智能体中枢平台已全面接入腾讯 WorkBuddy 与阿里 Qoder 客户端。为进一步支撑全省 21 个地市 12345 热线智能派单与机关红头公文标准化排版，拟申请扩容 5 亿 Tokens 满血 DeepSeek-R1 算力池。\n\n妥否，请批示。\n\n广东省政务服务和数据管理局\n2026年8月24日`,
        mcpUsed: "mcp-gov-document (国家标准红头公文排版与合规审计)",
        tokens: 2850,
      }
      setChatLog([...newLogs, assistantReply])
    }, 800)
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* 顶部 Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>⚡</span> 智能体客户端联调沙箱 (Agent Sandbox)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          模拟 WorkBuddy / Qoder / Trae 客户端通过手机号进行 SSO 鉴权、获取 MOMA 算力指向与免密自动挂载政企私有 MCP 工具
        </p>
      </div>

      {/* 预置政企客户角色快捷卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESET_USERS.map((u, idx) => (
          <div
            key={idx}
            onClick={() => handleSelectPreset(u)}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
              phone === u.phone ? "bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-400" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-slate-900">{u.name}</span>
              <span className="font-mono text-[11px] text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-200">
                {u.phone}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium">{u.org}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{u.role}</div>
            <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
              <span className="text-purple-600 font-semibold">{u.appName}</span>
              <span className="text-slate-400">点击一键测通 ➔</span>
            </div>
          </div>
        ))}
      </div>

      {/* 鉴权控制栏 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">员工手机号 (SSO 凭据)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="如 13800000001"
              className="w-48 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">模拟接入的智能体应用</label>
            <select
              value={appCode}
              onChange={(e) => setAppCode(e.target.value)}
              className="w-56 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="workbuddy">腾讯 WorkBuddy 协同办公助手</option>
              <option value="qoder">阿里 Qoder 智能研发助手</option>
              <option value="trae">字节 Trae 智能工作流</option>
              <option value="cherry-studio">Cherry Studio 聚合桌面端</option>
            </select>
          </div>

          <div className="pt-5">
            <button
              onClick={() => handleVerify(phone, appCode)}
              disabled={loading}
              className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              {loading ? "正在验权..." : "发起客户端 SSO 鉴权探测"}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            ❌ 鉴权被拒绝: {errorMsg}
          </div>
        )}
      </div>

      {/* 鉴权成功全貌与客户端连接状态 */}
      {authResponse && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左侧：客户端鉴权报文与配额 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>📱 客户端握手状态</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">200 OK 已授权</span>
            </h3>

            {/* 用户与机构 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">授权员工:</span>
                <span className="font-bold text-slate-800">{authResponse.member.name} ({authResponse.member.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">所属部门:</span>
                <span className="text-slate-700">{authResponse.member.deptName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">客户端应用:</span>
                <span className="text-purple-700 font-semibold">{authResponse.app.name} ({authResponse.app.vendor})</span>
              </div>
            </div>

            {/* 算力与移动豆余额 */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-600">剩余算力额度:</span>
                <span className="text-lg font-extrabold text-blue-700 font-mono">
                  {(authResponse.member.remainTokens / 10_000).toLocaleString()} 万 Token
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>折合移动豆余额:</span>
                <span className="font-mono text-amber-700 font-semibold">
                  {authResponse.member.momaBeansBalance?.toLocaleString() || "18,000"} 粒 移动豆
                </span>
              </div>
            </div>

            {/* MOMA 节点指向 */}
            <div className="space-y-1 text-xs font-mono">
              <div className="text-slate-400 text-[11px]">MOMA 集群节点指向:</div>
              <div className="p-2 bg-slate-900 text-emerald-400 rounded-lg text-[11px] break-all">
                {authResponse.momaRouting.carrierCluster} ➔ {authResponse.momaRouting.targetModel}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                SessionToken: {authResponse.momaRouting.sessionToken}
              </div>
            </div>

            {/* 挂载的私有 MCP 资产 */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-900">🏛️ 已自动注入的政企私有 MCP 连接器:</div>
              <div className="space-y-1.5">
                {(authResponse.injectedMcps || []).map((mcp: any, idx: number) => (
                  <div key={idx} className="p-2 bg-purple-50/70 rounded-lg border border-purple-100 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-purple-900">{mcp.name}</div>
                      <div className="text-[10px] font-mono text-purple-600">{mcp.code} ({mcp.version})</div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[9px] font-bold">
                      {mcp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：模拟客户端实际使用与 Tool Calling 演练 */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>💬</span> 客户端原生交互与 MCP 工具调用演练
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  耗时预估: 24ms • 移动豆实时结算
                </span>
              </div>

              {/* 消息历史 */}
              <div className="space-y-3 min-h-[220px] max-h-[360px] overflow-y-auto p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                {chatLog.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p>💡 当前已挂载「中国移动 MOMA 算力」与「政企私有 MCP 资产」</p>
                    <p className="mt-1 text-[11px]">在下方输入提示词，体验政企红头公文排版或内网代码审计的自动 Tool Calling 流程！</p>
                  </div>
                ) : (
                  chatLog.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className="text-[10px] text-slate-400 mb-0.5">{msg.role === "user" ? "政企员工 (张工/李总)" : "MOMA DeepSeek-V3 智算中枢"}</div>
                      <div className={`p-3 rounded-2xl max-w-[90%] whitespace-pre-wrap ${
                        msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs"
                      }`}>
                        {msg.content}
                      </div>
                      {msg.mcpUsed && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono">
                          <span>⚡ 成功触发私有 MCP:</span> {msg.mcpUsed} • 消耗 {msg.tokens} Tokens (扣减 3 粒移动豆)
                        </div>
                      )}
                    </div>
                  ))
                )}
                {runningInference && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    正在调用 MOMA DeepSeek-R1 智算集群并执行政务公文格式合规校验...
                  </div>
                )}
              </div>
            </div>

            {/* 输入栏 */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入提示词进行公文起草、政策解读或代码审计..."
                  onKeyDown={(e) => { if (e.key === "Enter") handleSimulateChat() }}
                  className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleSimulateChat}
                  disabled={runningInference || !prompt.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  发送推理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
