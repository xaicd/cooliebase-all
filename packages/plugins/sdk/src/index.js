/**
 * 插件作者入口：`definePlugin()` 声明生命周期钩子，`runWorker()` 把它接到宿主协议上。
 *
 * 覆盖面说明（不夸大）：本文件只实现**三个必选方法**（initialize / health / shutdown）
 * 与一个极小的 `ctx`。完整 SDK 面（ctx.config / events / jobs / http / secrets / state /
 * entities 等）与对应的可选方法（onEvent / runJob / handleWebhook / getData /
 * performAction / executeTool）留待后续增量 —— 在实现之前不在此声明，
 * 避免给出"声明了但没人兑现"的 API。
 *
 * 用法：
 *   import { definePlugin, runWorker } from "@cooliebase/plugin-sdk"
 *   const plugin = definePlugin({ setup(ctx) { ctx.logger.info("ready") } })
 *   runWorker(plugin)
 */
import { RPC_ERROR, decode, encode } from "./protocol.js"

/** 只读上下文。刻意保持极小 —— 每多一个字段就是宿主的一个对外承诺。 */
function createContext(pluginKey, initialize) {
  return {
    pluginKey,
    hostApiVersion: initialize?.hostApiVersion,
    instance: initialize?.instance,
    config: initialize?.config ?? {},
    logger: {
      info: (message) => process.stderr.write(`[plugin:${pluginKey}] ${message}\n`),
      error: (message) => process.stderr.write(`[plugin:${pluginKey}] ERROR ${message}\n`),
    },
  }
}

export function definePlugin(handlers) {
  if (!handlers || typeof handlers !== "object") {
    throw new Error("definePlugin() 需要一个钩子对象")
  }
  return handlers
}

export function runWorker(plugin, options = {}) {
  const input = options.input ?? process.stdin
  const output = options.output ?? process.stdout

  let pluginKey = "unknown"
  let started = false
  let buffer = ""

  const reply = (id, payload) => output.write(encode({ jsonrpc: "2.0", id, ...payload }))
  const replyError = (id, code, message) => reply(id, { error: { code, message } })

  const dispatch = async (request) => {
    switch (request.method) {
      case "initialize": {
        const initialize = request.params ?? {}
        pluginKey = initialize?.instance?.pluginKey ?? pluginKey
        const ctx = createContext(pluginKey, initialize)
        await plugin.setup?.(ctx)
        started = true
        reply(request.id, { result: { ok: true } })
        return
      }
      case "health": {
        if (!started) {
          reply(request.id, { result: { status: "error", message: "worker 尚未 initialize" } })
          return
        }
        const result = (await plugin.onHealth?.()) ?? { status: "ok" }
        reply(request.id, { result })
        return
      }
      case "shutdown": {
        // 停机阶梯第 1-2 步：先回应，再自行退出；宿主等不到就升级到 SIGTERM/SIGKILL
        reply(request.id, { result: { ok: true } })
        try {
          await plugin.onShutdown?.()
        } finally {
          process.exit(0)
        }
        return
      }
      case "invokeRoute": {
        // 可选方法: 插件声明了 `routes` 才支持。宿主按 manifest 的 apiRoutes 声明
        // 先做判定，这里只负责把 routeKey 派发到对应处理器。
        const { routeKey, request: routeRequest } = request.params ?? {}
        const handler = plugin.routes?.[routeKey]
        if (typeof handler !== "function") {
          replyError(request.id, RPC_ERROR.methodNotFound, `插件未实现路由: ${routeKey}`)
          return
        }
        const result = (await handler(routeRequest)) ?? {}
        reply(request.id, { result })
        return
      }
      default:
        replyError(request.id, RPC_ERROR.methodNotFound, `未实现的方法: ${request.method}`)
    }
  }

  input.setEncoding?.("utf8")
  // 严格按到达顺序处理。
  //
  // 早期版本对每个请求独立 dispatch（不 await），实测会错序：initialize 里有
  // `await setup()`，而 health/shutdown 同步完成，于是后两者的响应会**先于**
  // initialize 返回，health 还会因 started 未置位而误报 "尚未 initialize"。
  // 生命周期方法（initialize 必须最先、shutdown 必须最后）决定了这里不能并发。
  // 待 §13 的 onEvent/runJob 落地后，再在"同一插件内的独立任务"层面单独引入并发。
  let chain = Promise.resolve()
  input.on("data", (chunk) => {
    const { messages, rest } = decode(buffer + chunk)
    buffer = rest
    for (const message of messages) {
      chain = chain
        .then(() => dispatch(message))
        .catch((error) => {
          replyError(message.id, RPC_ERROR.internalError, error?.message ?? String(error))
        })
    }
  })
}
