
/**
 * 可选域提供的套餐菜单 ID 扩展。
 *
 * **不能用静态 import**: 新工程默认只要 `system` + `infra`（加载/运行/预览都快），
 * 此时 online/aigw/ai 会被裁掉 —— 静态导入会让本文件在模块加载期直接崩。
 * 这三个域只是"往套餐菜单里追加自己的菜单 ID"，域不在时应退化为**原样返回**。
 */
function optionalMenuIds(modulePath: string, exportName: string): (ids: string[]) => string[] {
  try {
    // tsx/Next 都会处理 TS 路径；域不存在时 require 抛错 -> 退化为恒等函数
    const mod = require(modulePath) as Record<string, unknown>
    const fn = mod[exportName]
    return typeof fn === "function" ? (fn as (ids: string[]) => string[]) : (ids) => ids
  } catch {
    return (ids) => ids
  }
}

const withOnlinePackageMenuIds = optionalMenuIds("@/modules/online/contract/menu-catalog", "withOnlinePackageMenuIds")
const withAigwPackageMenuIds = optionalMenuIds("@/modules/aigw/contract/menu-catalog", "withAigwPackageMenuIds")
const withAiPackageMenuIds = optionalMenuIds("@/modules/ai/contract/menu-catalog", "withAiPackageMenuIds")

export type TenantPackageSeed = {
  id: string
  name: string
  status: "ACTIVE" | "DISABLED"
  menuIds: string[]
  remark: string | null
  createdAt: string
  updatedAt: string
}

// 1. 系统管理通用基础菜单 ID 集合
const SYSTEM_BASE_MENU_IDS = [
  "1",     // 系统管理目录
  "100",   // 用户管理
  "1001", "1002", "1003", "1004", "1005", "1006",
  "101",   // 角色管理
  "1007", "1008", "1009", "1010",
  "102",   // 菜单管理
  "103",   // 部门管理
  "1011", "1012", "1013", "1014",
  "104",   // 岗位管理
  "1015", "1016", "1017", "1018",
  "105",   // 字典管理
  "106",   // 参数设置
  "107",   // 通知公告
  "108",   // 日志管理
  "500", "501", // 操作日志、登录日志
]

// 2. 旗舰套餐菜单全集（系统基础 + AI 智汇应用 + 模型中台/算力调度 + 在线建模）
const ROMA_FLAGSHIP_MENU_IDS = withAiPackageMenuIds(
  withAigwPackageMenuIds(
    withOnlinePackageMenuIds(SYSTEM_BASE_MENU_IDS)
  )
)

// 3. 政企自服务套餐菜单（AI 协同工作台 + 智汇应用 + 基础用户）
const ENTERPRISE_SELF_MENU_IDS = withAiPackageMenuIds([
  "1", "100", "103", "107", "aigw-dir", "aigw-tokens", "aigw-usages"
])

export const INIT_TENANT_PACKAGES: TenantPackageSeed[] = [
  {
    id: "111",
    name: "RoMA 智算运营旗舰套餐",
    status: "ACTIVE",
    menuIds: ROMA_FLAGSHIP_MENU_IDS,
    remark: "默认租户旗舰套餐：开通系统管理、智汇应用、模型中台与算力调度、在线建模等全套核心业务能力",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
  },
  {
    id: "112",
    name: "政企算力自服务专区套餐",
    status: "ACTIVE",
    menuIds: ENTERPRISE_SELF_MENU_IDS,
    remark: "面向政企客户内网挂载：开通算力资产大盘、员工管理、AI 协同工作台与私有 MCP 挂载",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
  },
  {
    id: "113",
    name: "极简体验套餐",
    status: "ACTIVE",
    menuIds: ["ai-app-dir", "ai-app-chat-conversation", "ai-app-chat-role"],
    remark: "轻量体验套餐：仅开通 AI 对话聊天与智能角色",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
  },
]
