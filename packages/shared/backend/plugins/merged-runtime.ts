/**
 * 合并运行（in-process）运行时。
 *
 * 与 worker 形态的关系：插件作者**只写一份 handler**（SDK 的 `definePlugin`）。
 *   - worker 形态：SDK 把 handler 接到 stdio JSON-RPC 上（`entrypoints.worker`）
 *   - 合并形态：本文件直接函数调用（`entrypoints.merged`）
 * 接口一致，差别只在**传输**。这与域的双模 Facade（同进程 SDK ↔ 跨进程 RPC）是同一个原则。
 *
 * 代价必须显式承认：**没有进程隔离**。插件里未捕获的异常或死循环会直接带走宿主
 * （worker 形态下只会带走它自己，这正是 worker 做停机阶梯与失败隔离的原因）。
 * 因此"是否合并"由插件实例的 runtime mode 决定，属**运营显式选择**，而不是插件单方面声明。
 */
import { existsSync } from "node:fs"
import { pathToFileURL } from "node:url"

import type { WorkerHealthResult, WorkerInitializeInput } from "./worker-protocol"

type PluginRouteHandler = (input: {
  method: string
  path: string
  query: Record<string, string>
  body: unknown
  headers: Record<string, string>
  pluginKey: string
  routeKey?: string
}) => Promise<{ status?: number; body?: unknown }> | { status?: number; body?: unknown }

type MergedHandlers = {
  setup?: (ctx: Record<string, unknown>) => void | Promise<void>
  onHealth?: () => WorkerHealthResult | Promise<WorkerHealthResult>
  onShutdown?: () => void | Promise<void>
  /** 插件自带的 API 路由处理器，键为 manifest 里 apiRoutes[].routeKey。 */
  routes?: Record<string, PluginRouteHandler>
}

/**
 * 按绝对路径动态加载合并入口。
 *
 * 这里**必须用普通动态 import**，不能为了躲开打包器静态分析去用
 * `new Function("return import(specifier)")` —— 那样在 Vitest/Vite 的模块运行时下会
 * 直接报 "A dynamic import callback was not specified."（脱离上下文的 import 拿不到回调）。
 * 本仓已有大量"变量式动态 import"的先例（如按域名加载 backend/services），运行时可用。
 */
import { firstPartyPluginEntry } from "./first-party-entries"

async function importFromPath(specifier: string): Promise<Record<string, unknown>> {
  return import(/* webpackIgnore: true */ /* @vite-ignore */ specifier) as Promise<Record<string, unknown>>
}

export class MergedPlugin {
  private handlers: MergedHandlers | null = null
  private started = false
  private lastError: string | null = null

  constructor(
    readonly pluginKey: string,
    private readonly entryPath: string,
    private readonly cwd: string,
  ) {}

  get running(): boolean {
    return this.started
  }

  get diagnostics(): { mode: "merged"; entry: string; lastError: string | null } {
    return { mode: "merged", entry: this.entryPath, lastError: this.lastError }
  }

  /** 加载模块并完成 initialize。任一环节失败都抛出，由调用方标记该插件 error。 */
  async start(input: WorkerInitializeInput): Promise<void> {
    if (!existsSync(this.entryPath)) {
      throw new Error(`合并入口不存在: ${this.entryPath}`)
    }

    let loaded: Record<string, unknown>
    try {
      // 仓内第一方插件是 TS: 运行期 import 加载不了（Node 不认 TS），必须走静态表；
      // 第三方插件是已编译的 JS，走运行期 import。两者语义相同, 只有"怎么拿进来"不同。
      const firstParty = firstPartyPluginEntry(this.pluginKey)
      loaded = firstParty ? await firstParty() : await importFromPath(pathToFileURL(this.entryPath).href)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.lastError = message
      throw new Error(`加载合并入口失败: ${message}`)
    }

    // 接受 default / plugin 具名导出两种写法；不额外规定第三种。
    const handlers = (loaded.default ?? loaded.plugin ?? loaded) as MergedHandlers
    if (!handlers || typeof handlers !== "object") {
      throw new Error("合并入口必须导出插件对象（export default definePlugin({...})）")
    }

    const context = {
      pluginKey: this.pluginKey,
      hostApiVersion: input.hostApiVersion,
      instance: input.instance,
      config: input.config,
      // 插件可据此区分形态（例如合并形态不需要给日志加进程前缀）
      mode: "merged" as const,
      cwd: this.cwd,
      logger: {
        info: (message: string) => console.info(`[plugin:${this.pluginKey}] ${message}`),
        error: (message: string) => console.error(`[plugin:${this.pluginKey}] ${message}`),
      },
    }

    try {
      await handlers.setup?.(context)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.lastError = message
      throw new Error(`插件 setup 失败: ${message}`)
    }

    this.handlers = handlers
    this.started = true
  }

  async health(): Promise<WorkerHealthResult> {
    if (!this.started) return { status: "error", message: "插件尚未 initialize" }
    return (await this.handlers?.onHealth?.()) ?? { status: "ok" }
  }

  async stop(): Promise<void> {
    try {
      await this.handlers?.onShutdown?.()
    } finally {
      this.started = false
      this.handlers = null
    }
  }

  /**
   * 调用插件声明的 API 路由处理器（由宿主挂载层调用）。
   *
   * 与 worker 形态的关系: 合并形态下就是一次普通函数调用; 独立形态应当走
   * worker 协议转发（该能力尚未实现 —— 见宿主挂载层对非 merged 形态的明确报错，
   * 不静默降级、也不假装支持）。
   */
  async invokeRoute(routeKey: string, input: Parameters<PluginRouteHandler>[0]) {
    if (!this.started) throw new Error("插件尚未 initialize")
    const handler = this.handlers?.routes?.[routeKey]
    if (!handler) throw new Error(`插件未导出路由处理器: ${routeKey}`)
    return handler(input)
  }
}
