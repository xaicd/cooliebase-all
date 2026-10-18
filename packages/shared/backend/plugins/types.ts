/**
 * 插件 manifest 契约 —— 本仓 **Plugin** 扩展类的声明面。
 *
 * 与 Platform Module 的声明面（`packages/domains/<domain>/contract/module.manifest.json`）
 * 是两套东西，不要混用 `module` 命名。
 *
 * 两处刻意设计（理由写在这里，不静默偏离）：
 * 1. **manifest 必须是 JSON，不是可执行模块。** 若允许 JS 模块，宿主 `import()` 它
 *    就等于在自己进程里执行第三方代码 —— 哪怕只读 manifest 也已成为任意代码执行面。
 *    JSON 让"读 manifest"退化为纯解析，宿主不承担任何插件代码执行风险。
 * 2. **capability 用白名单 + 禁忌清单双重校验。** 未知能力在安装期直接拒绝，
 *    而不是运行到某次调用才发现。
 */

/** 宿主支持的插件 API 版本。manifest.apiVersion 必须精确匹配，否则拒绝安装。 */
export const PLUGIN_API_VERSION = 1

export type PluginCategory = "connector" | "workspace" | "automation" | "ui"

/**
 * 允许插件申请的能力白名单（按本仓当前**能真实兑现**的宿主面裁剪）。
 * 只列可兑现的；未列入的一律拒绝，避免"声明了但宿主不认"的静默失效。
 */
export const KNOWN_CAPABILITIES = [
  "api.routes.register",
  "events.subscribe",
  "http.outbound",
  "jobs.schedule",
  "plugin.state.read",
  "plugin.state.write",
  "ui.page.register",
  "webhooks.receive",
] as const

/**
 * 禁忌能力：宿主**不得**暴露。
 * 单独列出（而不是单纯不在白名单里）是为了给出**明确**的拒绝理由 ——
 * "未知能力"和"这是被禁止的能力"对插件作者是完全不同的信息。
 */
export const FORBIDDEN_CAPABILITIES = [
  "auth.bypass",
  "budget.override",
  "database.direct",
  "issue.checkout_override",
] as const

export type PluginCapability = (typeof KNOWN_CAPABILITIES)[number]

export type PluginUiSlotType =
  | "page"
  | "dashboardWidget"
  | "detailTab"
  | "settingsPage"
  | "sidebar"
  | "toolbarButton"

export interface PluginUiSlotDeclaration {
  type: PluginUiSlotType
  /** 插件内唯一。**宿主会按 plugin id 自动命名空间化**，跨插件冲突结构上不可能。 */
  id: string
  displayName: string
  /** UI bundle 中提供该组件的导出名（宿主按它动态 import 并挂载）。 */
  exportName: string
  /** page / settingsPage 的单段路由。 */
  routePath?: string
}

export interface PluginApiRouteDeclaration {
  routeKey: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** 插件自有子路径，挂在 `/api/plugins/<pluginId>/api` 下。 */
  path: string
  auth: "operator" | "company" | "public"
}

export interface PluginManifest {
  id: string
  apiVersion: number
  version: string
  displayName: string
  description: string
  author: string
  categories: PluginCategory[]
  minimumHostVersion?: string
  capabilities: PluginCapability[]
  entrypoints: {
    /**
     * 独立运行入口（out-of-process worker，stdio JSON-RPC）。
     * 与 `merged` **至少声明一个** —— 两个都声明表示该插件同时支持两种形态。
     */
    worker?: string
    /**
     * 合并运行入口（in-process，宿主直接 import 该模块并调用其 handler）。
     * 代价: 失去进程隔离, 插件崩溃会带走宿主 —— 故是否合并是**运营显式选择**,
     * 由插件实例的 runtime mode 决定（见 plugins.mode），不是 manifest 单方面说了算。
     */
    merged?: string
    /** 预构建 UI bundle 目录，相对插件包根（宿主不编译，只静态分发）。 */
    ui?: string
  }
  /**
   * 第一方插件自带的迁移目录（相对插件包根，必须留在包内）。
   *
   * 只有**宿主信任**的插件才会被执行（见 COOLIEBASE_TRUSTED_PLUGIN_KEYS）—— 信任是运营的授权，
   * 不能由 manifest 自封。第三方插件仍走 plugin_state 扩展表那条路（§21.5）。
   *
   * 执行时严格隔离在插件自己的 schema（`plugin_<key>`）里，宿主表不可见 ——
   * 否则一个插件就能 DROP 宿主表。详见 plugin-migrations.ts。
   */
  migrations?: { dir: string }
  instanceConfigSchema?: Record<string, unknown>
  apiRoutes?: PluginApiRouteDeclaration[]
  ui?: { slots: PluginUiSlotDeclaration[] }
}

/** 插件包 package.json 里的入口指针（worker / merged 至少一个）。 */
export interface PluginPackagePointer {
  manifest: string
  worker?: string
  merged?: string
  ui?: string
}

/** 插件运行形态。 */
export type PluginRuntimeMode = "isolated" | "merged"
