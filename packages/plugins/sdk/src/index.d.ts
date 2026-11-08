export type PluginContext = {
  pluginKey: string
  hostApiVersion?: number
  instance?: { pluginKey: string; packagePath: string }
  config: Record<string, unknown>
  logger: { info: (message: string) => void; error: (message: string) => void }
}

export type PluginHandlers = {
  /** worker 启动时调用一次（宿主 initialize 请求内）。 */
  setup?: (ctx: PluginContext) => void | Promise<void>
  /** 响应宿主 health 请求。未实现时默认返回 { status: "ok" }。 */
  onHealth?: () => { status: "ok" | "degraded" | "error"; message?: string; diagnostics?: unknown } | Promise<{
    status: "ok" | "degraded" | "error"
    message?: string
    diagnostics?: unknown
  }>
  /** 响应宿主 shutdown 请求；返回后会自行 process.exit(0)。 */
  onShutdown?: () => void | Promise<void>
  /**
   * 路由处理器。key 必须与 manifest 的 apiRoutes[].routeKey 对应。
   *
   * 两种形态共用同一份 handlers —— merged 由宿主同进程直接调用，
   * isolated 由 worker 协议的 invokeRoute（**可选方法**）派发。
   * 未声明 routes 的插件，isolated 形态下路由不可达（调用会得到 methodNotFound）。
   */
  routes?: Record<string, (input: PluginRouteInvokeRequest) => PluginRouteInvokeResult | Promise<PluginRouteInvokeResult>>
}

/** 传给路由处理器的请求（两种形态同一形状）。 */
export type PluginRouteInvokeRequest = {
  method: string
  path: string
  query: Record<string, string>
  params?: Record<string, string>
  body: unknown
  headers: Record<string, string>
  pluginKey: string
}

/** 路由处理器的返回。 */
export type PluginRouteInvokeResult = { status?: number; body?: unknown }

export declare function definePlugin<T extends PluginHandlers>(handlers: T): T
export declare function runWorker(
  plugin: PluginHandlers,
  options?: { input?: NodeJS.ReadStream; output?: NodeJS.WriteStream },
): void
