/**
 * 参考插件的**合并运行**入口（in-process）。
 *
 * 关键点：与 worker.js 是**同一份业务逻辑**，只是宿主调用方式不同 ——
 *   - worker.js 走 stdio JSON-RPC（独立进程，有失败隔离）
 *   - merged.js  被宿主直接 import 并调用 handler（同进程，无失败隔离）
 *
 * `routes` 里的处理器对应 manifest 的 apiRoutes[].routeKey；
 * 宿主把它们挂载到 /api/v1/admin/plugins/<pluginKey>/api<path>。
 * 路由声明 + 处理器都留在插件包内，所以插件目录是自包含的。
 */
import { definePlugin } from "@cooliebase/plugin-sdk"

export default definePlugin({
  async setup(ctx) {
    ctx.logger.info(`ready (merged mode, host api v${ctx.hostApiVersion})`)
  },

  async onHealth() {
    return { status: "ok", message: "hello-world plugin ready (merged)" }
  },

  async onShutdown() {
    // 合并形态下无需自我退出，宿主直接释放引用
  },

  routes: {
    async hello(input) {
      return {
        status: 200,
        body: { message: "hello from plugin", pluginKey: input.pluginKey, query: input.query },
      }
    },
  },
})
