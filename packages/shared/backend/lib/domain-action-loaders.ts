/**
 * 各域 contract/actions 的**静态** loader 映射（同 domain-service-loaders 的理由）。
 * 模板字符串动态 import 在 Turbopack 下无法解析，必须显式列出每个域。
 */

export const DOMAIN_ACTION_LOADERS: Record<string, () => Promise<Record<string, unknown>>> = {
  "system": () => import("@/modules/system/contract/actions"),
  "infra": () => import("@/modules/infra/contract/actions"),
  "online": () => import("@/modules/online/contract/actions"),
  "bpm": () => import("@/modules/bpm/contract/actions"),
  "pay": () => import("@/modules/pay/contract/actions"),
  "report": () => import("@/modules/report/contract/actions"),
  "mp": () => import("@/modules/mp/contract/actions"),
  "mall": () => import("@/modules/mall/contract/actions"),
  "member": () => import("@/modules/member/contract/actions"),
  "crm": () => import("@/modules/crm/contract/actions"),
  "erp": () => import("@/modules/erp/contract/actions"),
  "wms": () => import("@/modules/wms/contract/actions"),
  "mes": () => import("@/modules/mes/contract/actions"),
  "ai": () => import("@/modules/ai/contract/actions"),
  "iot": () => import("@/modules/iot/contract/actions"),
  "im": () => import("@/modules/im/contract/actions"),
  "oa": () => import("@/modules/oa/contract/actions"),
  "hrm": () => import("@/modules/hrm/contract/actions"),
  "fms": () => import("@/modules/fms/contract/actions"),
  "pms": () => import("@/modules/pms/contract/actions"),
}
