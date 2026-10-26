/**
 * 设计 token —— **AGENTS §5.2 的唯一可执行形式**。
 *
 * 为什么要有这个文件：§5.2 用散文规定了页面头、搜索栏、表格、操作列的样式，
 * 但实测**三处互不相同** ——
 *
 *   规范:      td `px-5 py-3`      基线页: `px-1.5 py-0.5`      模板: `px-2.5 py-1`
 *
 * 散文规范必然漂移（连"视觉基准"自己都没按规范来）。所以把它变成**可 import 的常量**：
 * 手写页面与 codegen 模板都引用这里，改一处全站生效。
 *
 * **使用约定**：
 *   ❌ 不要在列表页里裸写 `px-4 py-2.5` / `text-[11px]` 这类表格样式
 *   ✅ 用 `UI.table.cell` / `UI.table.th`
 *   （新增页面会被 `design-tokens:check` 拦下；存量走棘轮）
 *
 * **不改视觉方向**：这里只是把 §5.2 已经写下的东西变成代码，不引入新配色/新字体。
 */
export const UI = {
  /** 页面级：标题、副标题、头部容器 */
  page: {
    header: "flex flex-col md:flex-row md:items-center justify-between gap-4",
    title: "text-xl font-bold tracking-tight text-slate-900",
    subtitle: "text-xs text-slate-500 mt-0.5",
    actions: "flex items-center gap-2.5",
  },

  /** 搜索栏 */
  search: {
    container:
      "p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3",
    input:
      "w-36 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500",
    count: "text-xs text-slate-500",
  },

  /** 表格 —— 最容易漂的地方，统一收在这里 */
  table: {
    wrapper: "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden",
    th: "px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80",
    td: "px-5 py-3 text-xs text-slate-600",
    /** 操作列：固定右对齐 + 不换行 + 最小宽度，避免按钮被挤成两行 */
    actions: "px-5 py-3 text-xs text-right whitespace-nowrap min-w-[190px]",
    empty: "px-5 py-8 text-center text-xs text-slate-400",
    loading: "px-5 py-8 text-center text-xs text-slate-400",
  },

  /** 按钮 */
  button: {
    primary: "px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xs",
    ghost:
      "px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs",
    danger: "text-xs font-medium text-rose-600 hover:text-rose-800",
    warning: "text-xs font-medium text-amber-600 hover:text-amber-800",
    success: "text-xs font-medium text-emerald-600 hover:text-emerald-800",
  },

  /** 状态徽标（配合数据字典的 enumLabels 使用） */
  badge: {
    base: "inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
  },

  /** 卡片 / 分节 */
  card: {
    base: "bg-white rounded-xl border border-slate-200 shadow-sm",
    body: "p-3.5",
  },
} as const

export type UITokens = typeof UI
