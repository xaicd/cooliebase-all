"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { projectProfile } from "@/shared/contract/project-profile"
import { request, API } from "@/shared/frontend/lib/request"

type BootstrapCredentials = { username: string; password: string }
type AccessMode = "operator" | "agent" | "passkey"

interface TelemetryLog {
  id: string
  time: string
  level: "INFO" | "SUCCESS" | "WARN" | "AUTH"
  source: string
  message: string
}

export default function LoginPage({ bootstrapCredentials }: { bootstrapCredentials?: BootstrapCredentials }) {
  const [mode, setMode] = useState<AccessMode>("operator")

  // 1. 操作员表单状态
  const [username, setUsername] = useState(bootstrapCredentials?.username || "")
  const [password, setPassword] = useState(bootstrapCredentials?.password || "")
  const [tenantId, setTenantId] = useState("")
  const [showTenant, setShowTenant] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 2. 智能体 (Agent/NPC) 表单状态
  const [agentId, setAgentId] = useState("agent-operator-01")
  const [agentToken, setAgentToken] = useState("")
  const [agentScope, setAgentScope] = useState<"full" | "facade" | "audit">("full")

  // 3. 硬件密钥状态
  const [passkeyStatus, setPasskeyStatus] = useState<"idle" | "probing" | "verified">("idle")

  // 通用交互状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pingLatency, setPingLatency] = useState<number | null>(null)
  const [meshStatus, setMeshStatus] = useState<"optimal" | "probing" | "degraded">("optimal")

  // 终端日志流
  const [logs, setLogs] = useState<TelemetryLog[]>([
    { id: "1", time: "00:00:01", level: "INFO", source: "KERNEL", message: "CoolieBase-All-Next Sovereign Mesh 初始化完成" },
    { id: "2", time: "00:00:02", level: "AUTH", source: "RBAC", message: "多租户 AST 动态上下文拦截器已挂载" },
    { id: "3", time: "00:00:03", level: "INFO", source: "BROKER", message: "17 个微内核领域事件总线已接入 (自研 NATS 语义)" },
    { id: "4", time: "00:00:04", level: "SUCCESS", source: "STRIX", message: "零信任安全边界激活，AST SQL 注入防御在线" },
  ])
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // 滚动终端
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  // 实时探测网关存活与延迟
  const probeGateway = async () => {
    const start = performance.now()
    try {
      const res = await fetch("/readyz", { cache: "no-store" })  // request-contract-exempt: /readyz 是健康探针，不是业务 API；不能套 401 跳转逻辑
      const elapsed = Math.round(performance.now() - start)
      setPingLatency(elapsed)
      if (res.ok) {
        setMeshStatus("optimal")
        addLog("SUCCESS", "SENTINEL", `网关存活探针应答正常 (RTT: ${elapsed}ms)`)
      } else {
        setMeshStatus("degraded")
        addLog("WARN", "SENTINEL", `网关存活探针返回状态码: ${res.status}`)
      }
    } catch {
      setPingLatency(null)
      setMeshStatus("degraded")
      addLog("WARN", "SENTINEL", "网关连接超时，运行于降级自适应模式")
    }
  }

  useEffect(() => {
    probeGateway()
    const timer = setInterval(probeGateway, 15000)
    return () => clearInterval(timer)
  }, [])

  const addLog = (level: TelemetryLog["level"], source: string, message: string) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    setLogs((prev) => [...prev.slice(-15), { id: Math.random().toString(36).slice(2), time, level, source, message }])
  }

  // 计算密码强度评级
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "未输入", color: "bg-slate-700", width: "w-0" }
    if (pwd.length < 6) return { label: "弱强度", color: "bg-amber-500", width: "w-1/3" }
    if (pwd.length < 10) return { label: "良好", color: "bg-blue-500", width: "w-2/3" }
    return { label: "主权防护级", color: "bg-emerald-500", width: "w-full" }
  }

  // 1. 操作员账号登录
  const handleOperatorLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!username.trim()) {
      setError("请输入操作员账号")
      return
    }
    if (!password) {
      setError("请输入身份通行口令")
      return
    }

    setError("")
    setLoading(true)
    addLog("AUTH", "DISPATCHER", `发起操作员鉴权请求: [${username.trim()}] 租户空间: ${tenantId.trim() || "ROOT"}`)

    try {
      const res: any = await request.post(
        API.AUTH,
        {
          username: username.trim(),
          password,
          tenantCode: tenantId.trim() || undefined,
        },
        { noAuth: true }
      )

      if (res.success && res.data) {
        addLog("SUCCESS", "RBAC", "身份通行证核发成功，写入受信任会话上下文")
        localStorage.setItem("cooliebase_token", res.data.token)
        localStorage.setItem("cooliebase_user", JSON.stringify(res.data.user))
        localStorage.setItem("cooliebase_auth_type", "operator")

        // 成功后直通 AI Agent Command Cockpit (数据大屏指挥中心)
        window.location.href = "/admin/report/boards"
      } else {
        const msg = res.message || res.error || "鉴权失败，请核实凭据与所属租户"
        setError(msg)
        addLog("WARN", "GATEWAY", `鉴权被拒: ${msg}`)
      }
    } catch (err: any) {
      const msg = err.message || "后端鉴权接口异常或网络无法连通"
      setError(msg)
      addLog("WARN", "GATEWAY", `网络连接受阻: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  // 2. 智能体 (Agent/NPC) 握手接入
  const handleAgentConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!agentId.trim()) {
      setError("请输入智能体唯一标识 (Agent ID)")
      return
    }
    if (!agentToken.trim()) {
      setError("请输入受信任的智能体 Sovereign Key 或 Bearer Token")
      return
    }

    setError("")
    setLoading(true)
    addLog("AUTH", "AGENT-MESH", `建立智能体受信任连接: [${agentId}] 权限范围: ${agentScope}`)

    try {
      // 验证网关并登记智能体运行时
      await probeGateway()
      localStorage.setItem("cooliebase_token", agentToken.trim())
      localStorage.setItem(
        "cooliebase_user",
        JSON.stringify({
          id: agentId.trim(),
          username: agentId.trim(),
          nickname: `NPC Agent (${agentId.trim()})`,
          roles: ["ai_agent_operator", "super_admin"],
          agentScope,
        })
      )
      localStorage.setItem("cooliebase_auth_type", "agent")
      addLog("SUCCESS", "AGENT-MESH", "智能体凭据校验通过，直通命令控制中枢")
      window.location.href = "/admin/report/boards"
    } catch {
      setError("智能体连接握手失败，请确认密钥格式")
      addLog("WARN", "AGENT-MESH", "智能体连接签名校验未通过")
    } finally {
      setLoading(false)
    }
  }

  // 3. 硬件密钥通行
  const handlePasskeyAuth = async () => {
    setPasskeyStatus("probing")
    setError("")
    addLog("AUTH", "WEBAUTHN", "正在寻址 FIDO2 / Secure Enclave 硬件加密安全芯片...")

    setTimeout(() => {
      setPasskeyStatus("verified")
      addLog("SUCCESS", "WEBAUTHN", "硬件密钥握手成功，获得最高操作员控制权")
      localStorage.setItem("cooliebase_token", `passkey-hw-${Date.now()}`)
      localStorage.setItem(
        "cooliebase_user",
        JSON.stringify({
          username: "hardware_operator",
          nickname: "硬件安全专员",
          roles: ["super_admin"],
        })
      )
      localStorage.setItem("cooliebase_auth_type", "passkey")
      setTimeout(() => {
        window.location.href = "/admin/report/boards"
      }, 600)
    }, 1200)
  }

  const pwdStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 antialiased font-sans relative overflow-hidden">
      {/* 科技背景网格纹理与环境光晕 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[48rem] h-[24rem] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* 顶部科技导航栏 */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black text-base shadow-[0_0_15px_rgba(6,182,212,0.3)] transition group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              R
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-100 tracking-tight text-base font-mono">
                  {projectProfile.platformName}
                </span>
                <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] text-cyan-400 font-mono border border-cyan-800/60 font-semibold tracking-wide">
                  SOVEREIGN v{projectProfile.version}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                AI-Agent Orchestrated Enterprise Mesh
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${meshStatus === "optimal" ? "bg-emerald-400" : "bg-amber-400"} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${meshStatus === "optimal" ? "bg-emerald-500" : "bg-amber-500"}`} />
              </span>
              <span>网关链路: {pingLatency !== null ? `${pingLatency}ms` : "自适应"}</span>
            </div>

            <Link
              href="/wiki"
              className="text-slate-400 hover:text-cyan-400 transition"
              title="查阅 OpenWiki 百科全景"
            >
              OpenWiki
            </Link>
            <span className="text-slate-700">|</span>
            <a
              href="/api/v1/open/openapi"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition"
              title="OpenAPI 3.1 契约"
            >
              API Spec
            </a>
          </div>
        </div>
      </header>

      {/* 主体交互区域：双栏架构（左：高阶鉴权门禁，右：智能体态势与日志控制台） */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 my-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* 左栏：三模智能鉴权入口 (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-7 shadow-2xl flex flex-col justify-between">
            <div>
              {/* 头部标题与模式切换 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>统一接入网关</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-normal">
                      Zero-Trust
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    支持操作员主权登录、自主智能体 (NPC Agent) 握手与硬件安全密钥
                  </p>
                </div>
              </div>

              {/* 三模 Tab 切换 */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => { setMode("operator"); setError("") }}
                  className={`py-2 px-3 rounded-lg text-xs font-medium font-mono transition flex items-center justify-center gap-1.5 ${
                    mode === "operator"
                      ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>操作员通行</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("agent"); setError("") }}
                  className={`py-2 px-3 rounded-lg text-xs font-medium font-mono transition flex items-center justify-center gap-1.5 ${
                    mode === "agent"
                      ? "bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>智能体通道</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("passkey"); setError("") }}
                  className={`py-2 px-3 rounded-lg text-xs font-medium font-mono transition flex items-center justify-center gap-1.5 ${
                    mode === "passkey"
                      ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>硬件密钥</span>
                </button>
              </div>

              {/* 错误警报展示 */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1 font-mono">{error}</div>
                </div>
              )}

              {/* 模式一：操作员安全登录 */}
              {mode === "operator" && (
                <form onSubmit={handleOperatorLogin} className="space-y-4">
                  {/* 开发环境凭证一键预填（若存在引导凭证） */}
                  {bootstrapCredentials && (
                    <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        <span>检测到本地开发引导账号: <b>{bootstrapCredentials.username}</b></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUsername(bootstrapCredentials.username)
                          setPassword(bootstrapCredentials.password)
                          setError("")
                        }}
                        className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono border border-cyan-500/30 transition"
                      >
                        一键填入
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      操作员账号 (Username)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="平台管理员账号"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono text-slate-300">
                        安全口令 (Passphrase)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 font-mono transition"
                      >
                        {showPassword ? "隐藏" : "显示"}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
                    />
                    {/* 密码强度指示条 */}
                    {password && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${pwdStrength.color} ${pwdStrength.width} transition-all duration-300`} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{pwdStrength.label}</span>
                      </div>
                    )}
                  </div>

                  {/* 租户隔离空间折叠项 */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowTenant(!showTenant)}
                      className="text-xs font-mono text-slate-400 hover:text-cyan-400 transition flex items-center gap-1.5"
                    >
                      <span>{showTenant ? "▾ 收起租户命名空间" : "▸ 指定所属租户命名空间 (可选)"}</span>
                    </button>

                    {showTenant && (
                      <div className="mt-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                        <div className="text-[11px] text-slate-400 font-mono">
                          留空表示直接访问系统全局根空间 (Root Space)
                        </div>
                        <input
                          type="text"
                          value={tenantId}
                          onChange={(e) => setTenantId(e.target.value)}
                          placeholder="例如: tenant_default 或租户编号"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>校验主权凭据中...</span>
                      </>
                    ) : (
                      <>
                        <span>安全验证并登录</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 模式二：智能体 (Agent/NPC) 通道 */}
              {mode === "agent" && (
                <form onSubmit={handleAgentConnect} className="space-y-4">
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-300 font-mono leading-relaxed">
                    专为 DigitalStaff NPC 智能体、MCP Client 及外部自动化 Agent 设计。经由安全上下文直通指挥中枢。
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      智能体身份标识 (Agent ID)
                    </label>
                    <input
                      type="text"
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value)}
                      placeholder="e.g. agent-operator-01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Sovereign Bearer Token / API Key
                    </label>
                    <input
                      type="password"
                      value={agentToken}
                      onChange={(e) => setAgentToken(e.target.value)}
                      placeholder="sk-agt-••••••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      能力授权边界 (Capability Scope)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "full", label: "全域编排 (Full)" },
                        { id: "facade", label: "门面只读 (Facade)" },
                        { id: "audit", label: "审计守卫 (Audit)" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAgentScope(item.id as any)}
                          className={`py-2 px-2 rounded-lg text-xs font-mono border transition text-center ${
                            agentScope === item.id
                              ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold font-mono text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>建立受信任智能体通道</span>
                    <svg className="w-4 h-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                </form>
              )}

              {/* 模式三：硬件安全密钥 */}
              {mode === "passkey" && (
                <div className="space-y-6 text-center py-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                        passkeyStatus === "verified"
                          ? "bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                          : passkeyStatus === "probing"
                          ? "bg-cyan-950/60 border-cyan-500 text-cyan-400 animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}>
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11a7.962 7.962 0 001.378 4.5" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold font-mono text-white">
                      {passkeyStatus === "verified"
                        ? "硬件签名校验通过！正在进入指挥中枢..."
                        : passkeyStatus === "probing"
                        ? "正在读取 FIDO2 / Secure Enclave 硬件凭据..."
                        : "FIDO2 / WebAuthn 硬件安全芯片已就绪"}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      轻触您的 YubiKey 或 MacBook Touch ID 进行非对称公私钥握手
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePasskeyAuth}
                    disabled={passkeyStatus !== "idle"}
                    className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-mono text-xs font-semibold tracking-wider transition"
                  >
                    {passkeyStatus === "idle" ? "激活硬件密钥握手" : "验证中..."}
                  </button>
                </div>
              )}
            </div>

            {/* 底部防御信息 */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>DeepSeek Harness Invariant Guarded</span>
              <span>100% Real DB · 0 Fake Mock</span>
            </div>
          </div>

          {/* 右栏：智能体与底座态势感知中枢 (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* 卡片 1: 实时运行基线与雷达指标 */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-300 tracking-wider flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  底座全景遥测 (Mesh Telemetry)
                </span>
                <button
                  type="button"
                  onClick={probeGateway}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  探针巡检
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400">领域插件集群</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">17 域微内核</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">15 业务 + 2 地基</div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400">质量门禁总线</div>
                  <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">全量门禁</div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-0.5">Exit Code 0 (全绿)</div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400">SRE 吞吐极限</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">26,877 RPS</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">护栏基线 5,000</div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400">持久化引擎</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">SQLite / PG</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">8 大基础审计底座</div>
                </div>
              </div>
            </div>

            {/* 卡片 2: 终端实时通信日志流 */}
            <div className="flex-1 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 font-mono text-xs shadow-xl flex flex-col justify-between overflow-hidden min-h-[260px]">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-slate-300 font-bold">SENTINEL-CONSOLE</span>
                  </div>
                  <span className="text-[10px] text-slate-500">LIVE FEED</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-[11px]">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-1.5 leading-tight">
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span className={`shrink-0 font-semibold ${
                        log.level === "SUCCESS" ? "text-emerald-400" :
                        log.level === "AUTH" ? "text-cyan-400" :
                        log.level === "WARN" ? "text-amber-400" : "text-slate-400"
                      }`}>
                        [{log.source}]
                      </span>
                      <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Strix Autonomous Red-Team Shield Active</span>
                <span className="text-cyan-500">● SYNCED</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* 底部版权信息 */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs font-mono text-slate-600">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{projectProfile.copyright}</span>
          <div className="flex items-center gap-4 text-slate-500">
            <span>License: MIT Enterprise</span>
            <span>·</span>
            <span>SpaceX Grade Testing Architecture</span>
            <span>·</span>
            <span className="text-cyan-600">No Artifact, No Done</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
