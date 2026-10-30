export const AIGW_DIR_ID = "aigw-dir"
export const AIGW_ROUTING_DIR_ID = "aigw-routing-dir"
export const AIGW_APP_DIR_ID = "aigw-app-dir"

export const AIGW_WORKBENCH_MENU_ID = "aigw-workbench"
export const AIGW_PLAYGROUND_MENU_ID = "aigw-playground"
export const AIGW_CHANNELS_MENU_ID = "aigw-channels"
export const AIGW_MODELS_MENU_ID = "aigw-models"
export const AIGW_TOKENS_MENU_ID = "aigw-tokens"
export const AIGW_USAGES_MENU_ID = "aigw-usages"


export const AIGW_CHATS_MENU_ID = "aigw-chats"


export type AigwMenuCatalogRow = {
  id: string
  name: string
  permission: string | null
  type: string
  parentId: string | null
  path: string | null
  component: string | null
  icon: string | null
  sort: number
  status: string
  visible: boolean
  keepAlive: boolean
  createdAt: string
  updatedAt: string
}

export const AIGW_MENU_ENTRIES: AigwMenuCatalogRow[] = [
  // 1 级主目录：模型中台 (/admin/aigw)
  {
    id: AIGW_DIR_ID,
    name: "模型中台",
    permission: "aigw:channel:view",
    type: "DIR",
    parentId: null,
    path: "/admin/aigw",
    component: null,
    icon: "ep:aim",
    sort: 14,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },

  // 2 级分组 1：算力中枢
  {
    id: AIGW_ROUTING_DIR_ID,
    name: "算力中枢",
    permission: "aigw:channel:view",
    type: "DIR",
    parentId: AIGW_DIR_ID,
    path: "routing",
    component: null,
    icon: "ep:guide",
    sort: 1,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },
  {
    id: AIGW_WORKBENCH_MENU_ID,
    name: "体验中心",
    permission: "aigw:usage:view",
    type: "MENU",
    parentId: AIGW_ROUTING_DIR_ID,
    path: "workbench",
    component: "aigw/workbench/index",
    icon: "ep:service",
    sort: 1,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },
  {
    id: AIGW_PLAYGROUND_MENU_ID,
    name: "联调探测",
    permission: "aigw:playground:view",
    type: "MENU",
    parentId: AIGW_ROUTING_DIR_ID,
    path: "playground",
    component: "aigw/playground/index",
    icon: "ep:monitor",
    sort: 3,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },
  {
    id: AIGW_CHANNELS_MENU_ID,
    name: "上游渠道",
    permission: "aigw:channel:view",
    type: "MENU",
    parentId: AIGW_ROUTING_DIR_ID,
    path: "channels",
    component: "aigw/channels/index",
    icon: "ep:connection",
    sort: 4,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },
  {
    id: AIGW_MODELS_MENU_ID,
    name: "模型目录",
    permission: "aigw:model:view",
    type: "MENU",
    parentId: AIGW_ROUTING_DIR_ID,
    path: "models",
    component: "aigw/models/index",
    icon: "ep:collection",
    sort: 5,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },
  {
    id: AIGW_TOKENS_MENU_ID,
    name: "调用令牌",
    permission: "aigw:token:view",
    type: "MENU",
    parentId: AIGW_ROUTING_DIR_ID,
    path: "tokens",
    component: "aigw/tokens/index",
    icon: "fa:key",
    sort: 6,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },
  {
    id: AIGW_USAGES_MENU_ID,
    name: "用量日志",
    permission: "aigw:usage:view",
    type: "MENU",
    parentId: AIGW_ROUTING_DIR_ID,
    path: "usages",
    component: "aigw/usages/index",
    icon: "fa:tasks",
    sort: 7,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },

  // 2 级分组 2：企业管理

  // 2 级分组 3：应用生态
  {
    id: AIGW_APP_DIR_ID,
    name: "生态应用",
    permission: "aigw:channel:view",
    type: "DIR",
    parentId: AIGW_DIR_ID,
    path: "app-ecosystem",
    component: null,
    icon: "ep:app",
    sort: 3,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },
  {
    id: AIGW_CHATS_MENU_ID,
    name: "对话记录",
    permission: "aigw:chat:view",
    type: "MENU",
    parentId: AIGW_APP_DIR_ID,
    path: "chats",
    component: "aigw/chats/index",
    icon: "ep:message",
    sort: 3,
    status: "ACTIVE",
    visible: true,
    keepAlive: true,
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },

  // 2 级分组 4：资费清分
]

export const AIGW_PACKAGE_MENU_IDS = [
  AIGW_DIR_ID,
  AIGW_ROUTING_DIR_ID,
  AIGW_APP_DIR_ID,
  AIGW_WORKBENCH_MENU_ID,
  AIGW_PLAYGROUND_MENU_ID,
  AIGW_CHANNELS_MENU_ID,
  AIGW_MODELS_MENU_ID,
  AIGW_TOKENS_MENU_ID,
  AIGW_USAGES_MENU_ID,
  AIGW_CHATS_MENU_ID,
]

// 历史遗留旧 CoolieBase 模型中台树节点全量清除清单
const LEGACY_PURGE_MENU_IDS = [
  "2758", "2759", "2760", "2783", "2792", "2796", "2798", "2915", "5000",
  "9000", "9001", "9002", "9003", "9004", "9005",
  "9100", "9101", "9102", "9103", "9104",
  "9200", "9201", "9202", "9203",
  "9300", "9301",
  "9400", "9401", "9402", "9403",
  "ai-gateway-dir",
]

export function withAigwMenuCatalog<T extends { id: string }>(menus: T[]): T[] {
  const byId = new Map(menus.map((item) => [item.id, item]))
  // 1. 彻底拔除历史老旧模型中台（2758）整棵树与旧 9000 散落节点
  for (const removeId of LEGACY_PURGE_MENU_IDS) {
    byId.delete(removeId)
  }
  // 2. 注入唯一权威的全新模型中台 5 大标准化分组结构
  for (const entry of AIGW_MENU_ENTRIES) {
    byId.set(entry.id, entry as unknown as T)
  }
  return [...byId.values()]
}

export function withAigwPackageMenuIds(menuIds: Iterable<string>): string[] {
  const set = new Set(menuIds)
  for (const id of AIGW_PACKAGE_MENU_IDS) {
    set.add(id)
  }
  return [...set]
}
