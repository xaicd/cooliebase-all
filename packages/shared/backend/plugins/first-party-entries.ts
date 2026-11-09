/**
 * 仓内**第一方插件**的入口静态表。
 *
 * 为什么必须有这张表（不能靠运行期 import）:
 *   - 仓内第一方插件是 **TS**，而宿主的合并运行时用的是运行期 `import(specifier)`，
 *     Node 不认识 TS；
 *   - 把路径拼成模板串再 import，Turbopack/Vite 也无法静态追踪（本仓在 broker 上踩过一次）。
 * 因此第一方插件必须**显式登记** —— 与 `domain-service-loaders.ts` 同一模式。
 *
 * 第三方插件（实例目录里装进来的）走运行期 import，因为它们产出的是编译后的 JS。
 * 两种来源用同一套 manifest/能力语义，只有"怎么把代码拿进来"这一步不同。
 *
 * 新增第一方插件时: 在下面加一行。
 */

type PluginEntryFactory = () => Promise<Record<string, unknown>>

export const FIRST_PARTY_PLUGIN_ENTRIES: Record<string, PluginEntryFactory> = {
  "cooliebase.pay": () => import("@/plugins/plugin-pay/plugin-entry"),
  "cooliebase.report": () => import("@/plugins/plugin-report/plugin-entry"),
  "cooliebase.bpm": () => import("@/plugins/plugin-bpm/plugin-entry"),
  "cooliebase.mp": () => import("@/plugins/plugin-mp/plugin-entry"),
  "cooliebase.member": () => import("@/plugins/plugin-member/plugin-entry"),
  "cooliebase.iot": () => import("@/plugins/plugin-iot/plugin-entry"),
  "cooliebase.erp": () => import("@/plugins/plugin-erp/plugin-entry"),
  "cooliebase.im": () => import("@/plugins/plugin-im/plugin-entry"),
  "cooliebase.aigw": () => import("@/plugins/plugin-aigw/plugin-entry"),
  "cooliebase.ai": () => import("@/plugins/plugin-ai/plugin-entry"),
  "cooliebase.crm": () => import("@/plugins/plugin-crm/plugin-entry"),
  "cooliebase.wms": () => import("@/plugins/plugin-wms/plugin-entry"),
  "cooliebase.online": () => import("@/plugins/plugin-online/plugin-entry"),
  "cooliebase.mall": () => import("@/plugins/plugin-mall/plugin-entry"),
  "cooliebase.mes": () => import("@/plugins/plugin-mes/plugin-entry"),
}

/** 取第一方插件入口工厂；不是第一方插件时返回 undefined（调用方回退到运行期 import）。 */
export function firstPartyPluginEntry(pluginKey: string): PluginEntryFactory | undefined {
  return FIRST_PARTY_PLUGIN_ENTRIES[pluginKey]
}
