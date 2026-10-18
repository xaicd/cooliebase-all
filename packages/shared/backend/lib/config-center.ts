/**
 * Config Center - 统一配置中心
 *
 * 设计目标：
 * - 阶段A（当前）：本地 JSON/环境变量 读取
 * - 阶段B：加入配置变更监听、热更新
 * - 阶段C：替换为 Nacos / Apollo / etcd
 *
 * 规范：
 * - 每个域有独立的 namespace
 * - 公共配置放 shared namespace
 * - 敏感配置（密钥、连接串）走环境变量，不入库
 */

// ============ Types ============

export type ConfigNamespace = string

export type ConfigValue = string | number | boolean | null

export type ConfigChangeEvent = {
  namespace: string
  key: string
  oldValue: ConfigValue
  newValue: ConfigValue
  changedAt: string
}

type ConfigListener = (event: ConfigChangeEvent) => void

// ============ State ============

const configStore = new Map<string, Map<string, ConfigValue>>()
const listeners: ConfigListener[] = []

// ============ Core ============

function getNamespaceStore(namespace: string): Map<string, ConfigValue> {
  if (!configStore.has(namespace)) {
    configStore.set(namespace, new Map())
  }
  return configStore.get(namespace)!
}

export const configCenter = {
  /**
   * 获取配置值
   *
   * @example
   * const dbUrl = configCenter.get("shared", "DATABASE_URL", "postgresql://localhost:5432/cooliebase")
   * const payTimeout = configCenter.get("pay", "CHANNEL_TIMEOUT_MS", 5000)
   */
  get<T extends ConfigValue = string>(namespace: ConfigNamespace, key: string, defaultValue: T): T {
    // 优先从环境变量读取：格式 COOLIEBASE_{NAMESPACE}_{KEY}
    const envKey = `COOLIEBASE_${namespace.toUpperCase()}_${key.toUpperCase().replace(/[.-]/g, "_")}`
    const envValue = process.env[envKey]
    if (envValue !== undefined) {
      // 尝试类型转换
      if (typeof defaultValue === "number") return Number(envValue) as T
      if (typeof defaultValue === "boolean") return (envValue === "true") as unknown as T
      return envValue as T
    }

    // 从内存 store 读取
    const store = getNamespaceStore(namespace)
    if (store.has(key)) return store.get(key) as T

    return defaultValue
  },

  /**
   * 设置配置值（运行时热更新）
   *
   * @example
   * configCenter.set("pay", "CHANNEL_TIMEOUT_MS", 10000)
   */
  set(namespace: ConfigNamespace, key: string, value: ConfigValue) {
    const store = getNamespaceStore(namespace)
    const oldValue = store.get(key) ?? null

    store.set(key, value)

    // 触发变更通知
    if (oldValue !== value) {
      const event: ConfigChangeEvent = {
        namespace,
        key,
        oldValue,
        newValue: value,
        changedAt: new Date().toISOString(),
      }
      listeners.forEach((fn) => { try { fn(event) } catch {} })
    }
  },

  /**
   * 批量加载配置
   */
  load(namespace: ConfigNamespace, config: Record<string, ConfigValue>) {
    const store = getNamespaceStore(namespace)
    for (const [key, value] of Object.entries(config)) {
      store.set(key, value)
    }
  },

  /**
   * 监听配置变更
   *
   * @example
   * configCenter.onChange((event) => {
   *   if (event.namespace === "pay" && event.key === "CHANNEL_TIMEOUT_MS") {
   *     PayChannelService.updateTimeout(event.newValue)
   *   }
   * })
   */
  onChange(listener: ConfigListener) {
    listeners.push(listener)
  },

  /** 获取某个 namespace 的所有配置（调试用） */
  getAll(namespace: ConfigNamespace): Record<string, ConfigValue> {
    const store = getNamespaceStore(namespace)
    const result: Record<string, ConfigValue> = {}
    store.forEach((v, k) => { result[k] = v })
    return result
  },

  /** 列出所有 namespace */
  listNamespaces(): string[] {
    return [...configStore.keys()]
  },
}
