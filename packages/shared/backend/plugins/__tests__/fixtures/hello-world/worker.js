/**
 * 参考插件 worker：实现三个必选方法（initialize / health / shutdown）。
 *
 * 刻意保持最小 —— 新作者应当能照着它写出自己的第一个插件。
 * 注意 stdout 只走协议，诊断信息一律写 stderr（宿主只从 stdout 解析 JSON-RPC）。
 */
import { definePlugin, runWorker } from "@cooliebase/plugin-sdk"

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info(`ready (host api v${ctx.hostApiVersion})`)
  },

  async onHealth() {
    return { status: "ok", message: "hello-world plugin ready" }
  },

  async onShutdown() {
    // 只需快速收尾；宿主给 10s，超时会升级到 SIGTERM/SIGKILL
  },

  // 路由处理器: key 对应 manifest 的 apiRoutes[].routeKey。
  // isolated 形态下宿主通过 worker 协议的 invokeRoute 派发到这里（逐行 JSON-RPC）。
  // 没有这段，插件"在跑"但对外路由不可达 —— 等于空转。
  routes: {
    async hello(input) {
      return {
        status: 200,
        body: {
          message: "hello from plugin (isolated)",
          pluginKey: input.pluginKey,
          query: input.query,
        },
      }
    },
  },
})

runWorker(plugin)
