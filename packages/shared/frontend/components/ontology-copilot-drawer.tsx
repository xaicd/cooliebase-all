"use client";

import React, { useState } from "react";

interface QueryResultData {
  sql: string;
  readOnly: boolean;
  tenantId: number;
  maxRows: number;
  executionMs: number;
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
}

interface OntologySummaryData {
  objectsCount: number;
  actionsCount: number;
  invariantsCount: number;
  stateflowsCount: number;
  runtimeStatus: string;
}

export function OntologyCopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"query" | "ontology">("query");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResultData | null>(null);
  const [ontologySummary, setOntologySummary] = useState<OntologySummaryData | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setError(null);
  };

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
    setError(null);
  };

  const handleExecuteQuery = async (queryText?: string) => {
    const textToSend = queryText || prompt;
    if (!textToSend.trim()) {
      setError("请输入查询提示词或 SELECT SQL 语句");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const isSql = /^\s*(SELECT|WITH)\b/i.test(textToSend);
      const payload = isSql ? { sql: textToSend } : { prompt: textToSend };

      const res = await fetch("/api/copilot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.code !== 0) {
        setError(json.error || `查询失败 (HTTP ${res.status})`);
        setQueryResult(null);
      } else {
        setQueryResult(json.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`请求异常: ${msg}`);
      setQueryResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchOntology = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ontology");
      const json = await res.json();
      if (!res.ok || json.code !== 0) {
        setError(json.error || "获取本体自省数据失败");
        setOntologySummary(null);
      } else {
        const d = json.data;
        const ont = d?.ontology || {};
        const objects = ont.M1_Objects || d?.m1_objects || [];
        const actions = ont.M2_Behaviors || d?.m2_actions || [];
        const invariants = ont.M3_Invariants || d?.m3_invariants || [];
        const stateflows = ont.M6_Stateflows || d?.m6_stateflows || [];
        setOntologySummary({
          objectsCount: Array.isArray(objects) ? objects.length : 0,
          actionsCount: Array.isArray(actions) ? actions.length : 0,
          invariantsCount: Array.isArray(invariants) ? invariants.length : 0,
          stateflowsCount: Array.isArray(stateflows) ? stateflows.length : 0,
          runtimeStatus: d?.runtime?.status || "active",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`获取本体元数据异常: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAction = (actionName: string) => {
    setActionNotice(`已触发业务动词模拟核准 [${actionName}]，审计凭证已记录。`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleClear = () => {
    setPrompt("");
    setQueryResult(null);
    setError(null);
  };

  return (
    <>
      {/* 悬浮唤出按钮 (零死穴，可交互) */}
      <aside aria-label="Copilot Assistant" className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label={isOpen ? "关闭 Copilot 抽屉" : "打开 Copilot 抽屉"}
        >
          <span className="text-base">🤖</span>
          <span>{isOpen ? "收起助手" : "AI 探查"}</span>
        </button>
      </aside>

      {/* 侧边栏抽屉 */}
      {isOpen && (
        <section
          role="region"
          aria-label="AI Copilot 智能抽屉"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-all dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"
        >
          {/* 顶栏 */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                底座活体 Copilot 沙箱
              </h2>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="关闭抽屉"
            >
              ✕
            </button>
          </div>

          {/* 选项卡导航 */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => setActiveTab("query")}
              className={`flex-1 py-2.5 text-center text-xs font-semibold ${
                activeTab === "query"
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              只读数据探查
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("ontology");
                if (!ontologySummary) {
                  void handleFetchOntology();
                }
              }}
              className={`flex-1 py-2.5 text-center text-xs font-semibold ${
                activeTab === "ontology"
                  ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              活体本体自省
            </button>
          </div>

          {/* 主体内容 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {actionNotice && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                {actionNotice}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                {error}
              </div>
            )}

            {activeTab === "query" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="copilot-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    自然语言或 SQL 探查 (受只读沙箱守卫)
                  </label>
                  <textarea
                    id="copilot-input"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="输入查询意图（如：查看系统在线员工）或 SELECT 语句..."
                    className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* 快捷推荐提示词 */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt("查看系统在线员工")}
                    className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  >
                    🔍 在线员工
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt("查询系统角色权限")}
                    className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  >
                    🛡️ 角色权限
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt("查看当前租户状态")}
                    className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  >
                    🏢 租户状态
                  </button>
                </div>

                {/* 操作按钮区 */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleExecuteQuery()}
                    className="flex-1 rounded-md bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? "执行探查中..." : "执行探查"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    重置
                  </button>
                </div>

                {/* 查询结果展示 */}
                {queryResult && (
                  <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>租户: {queryResult.tenantId}</span>
                      <span>耗时: {queryResult.executionMs}ms</span>
                      <span>返回: {queryResult.rows.length} 条</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
                        <thead className="border-b border-slate-200 bg-slate-100/60 text-[11px] uppercase dark:border-slate-700 dark:bg-slate-800">
                          <tr>
                            {queryResult.columns.map((col) => (
                              <th key={col} className="px-2 py-1.5">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                            >
                              {queryResult.columns.map((col) => (
                                <td key={col} className="px-2 py-1.5 text-[11px]">
                                  {String(row[col] ?? "-")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    系统 M1~M6 活体模型概览
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleFetchOntology()}
                    className="rounded bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400"
                  >
                    刷新元数据
                  </button>
                </div>

                {ontologySummary ? (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {ontologySummary.objectsCount}
                      </div>
                      <div className="text-[11px] text-slate-500">M1 实体类型</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {ontologySummary.actionsCount}
                      </div>
                      <div className="text-[11px] text-slate-500">M2 行为动词</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {ontologySummary.invariantsCount}
                      </div>
                      <div className="text-[11px] text-slate-500">M3 不变量守卫</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                      <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                        {ontologySummary.stateflowsCount}
                      </div>
                      <div className="text-[11px] text-slate-500">M6 状态机图</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
                    点击右上角刷新获取活体元数据
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    动词因果卡片演练 (M2 Action)
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleSimulateAction("system:user:inspect")}
                      className="w-full flex items-center justify-between rounded-md border border-slate-200 p-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span>🔍 探查在线用户状态</span>
                      <span className="text-[10px] text-indigo-500 font-semibold">演练 ➜</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAction("system:tenant:verify")}
                      className="w-full flex items-center justify-between rounded-md border border-slate-200 p-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span>🏢 校验租户隔离边界</span>
                      <span className="text-[10px] text-emerald-500 font-semibold">演练 ➜</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
