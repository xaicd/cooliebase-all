/**
 * 宿主挂载层：把插件 manifest 里声明的 `apiRoutes` 变成真实可访问的路由。
 *
 * 这是「路由跟着包走」的关键一步 —— 插件把路由声明写在 manifest 里、处理器写在包内，
 * 由宿主统一挂载，因此插件目录可以完全自包含（不必把路由文件塞进 app/）。
 *
 * 挂载前缀: `/api/v1/plugins/<pluginKey>/api<path>`
 *   为什么**不**放在 /api/v1/admin 下: admin 前缀由 proxy 的 perimeter 统一要求管理员鉴权，
 *   而插件的 auth 是**运行期按 manifest 声明**的（operator/company/public），静态的
 *   "精确路径+方法"白名单表达不了。放在非 admin 前缀下，proxy 直接放行，
 *   由**本挂载点**按声明鉴权 —— 也与 Paperclip 的 /api/plugins/* 形态一致。
 *
 * 支撑范围:
 *   - 运行形态: merged（同进程）与 isolated（worker）**都支持**。声明判定完全一致，
 *     差别只在派发时走 worker 还是同进程（见 runtime-manager.invokeRoute）。
 *   - auth: `operator` / `company` / `public` 三种声明都支持，由本挂载点按声明执行守卫
 *     （挂载点在非 admin 前缀下，proxy 不施加管理员鉴权）。
 */
import type { PluginApiRouteDeclaration, PluginManifest } from "./types"

export const PLUGIN_ROUTE_PREFIX = "/api/v1/plugins"

export function pluginRoutePath(pluginKey: string, declarationPath: string): string {
  const suffix = declarationPath.startsWith("/") ? declarationPath : `/${declarationPath}`
  return `${PLUGIN_ROUTE_PREFIX}/${pluginKey}/api${suffix}`
}

/**
 * 注意形状: 本仓 tsconfig 未开严格模式, 判别联合(strictNullChecks)的窄化不生效
 * （同类问题在 package-scanner 的 readJson 上已出现过）。因此这里用可选字段而不是联合,
 * 避免调用方需要依赖窄化。
 */
export type RouteMountResolution = {
  ok: boolean
  declaration?: PluginApiRouteDeclaration
  params?: Record<string, string>
  status?: number
  error?: string
}

function matchDeclarationPath(pattern: string, actual: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean)
  const actualParts = actual.split("/").filter(Boolean)
  if (patternParts.length !== actualParts.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i += 1) {
    const p = patternParts[i]
    const a = actualParts[i]
    if (p.startsWith("[") && p.endsWith("]") && p.length > 2) {
      params[p.slice(1, -1)] = decodeURIComponent(a)
      continue
    }
    if (p !== a) return null
  }
  return params
}

/**
 * 判定一次请求能否落到插件的某个处理器上。
 * 未声明、方法不符、能力缺失、运行形态不支持 —— 每一种都给出**不同的**明确原因。
 */
export function resolvePluginRoute(input: {
  manifest: PluginManifest | null
  capabilities: readonly string[]
  method: string
  pathname: string
  pluginKey: string
}): RouteMountResolution {
  const { manifest, capabilities, method, pathname, pluginKey } = input

  if (!manifest) return { ok: false, status: 404, error: `未找到插件: ${pluginKey}` }
  if (!capabilities.includes("api.routes.register")) {
    return { ok: false, status: 403, error: `插件未声明 api.routes.register 能力` }
  }
  // 说明: 这里**不再**按形态拒绝。isolated 形态的路由转发已由 worker 协议的
  // invokeRoute（可选方法）承载，声明判定与 merged 完全一致 —— 声明什么就认什么，
  // 差别只在派发时走 worker 还是同进程（见 runtime-manager.invokeRoute）。

  const want = pathname.slice(`${PLUGIN_ROUTE_PREFIX}/${pluginKey}/api`.length) || "/"
  const routes = manifest.apiRoutes ?? []

  if (want.startsWith("/app/") || want.startsWith("/open/")) {
    const surface = want.startsWith("/app/") ? "app" : "open"
    const subWant = want.slice(`/${surface}`.length) || "/"
    const surfaceExact = routes.find(
      (route) => route.routeKey.startsWith(`${surface}:`) && route.method === method && route.path === subWant,
    )
    if (surfaceExact) {
      return { ok: true, declaration: surfaceExact, params: {} }
    }
    for (const route of routes) {
      if (!route.routeKey.startsWith(`${surface}:`) || route.method !== method || !route.path.includes("[")) continue
      const matchedParams = matchDeclarationPath(route.path, subWant)
      if (matchedParams) {
        return { ok: true, declaration: route, params: matchedParams }
      }
    }
  }

  const exact = routes.find((route) => route.method === method && route.path === want)
  if (exact) {
    return { ok: true, declaration: exact, params: {} }
  }

  for (const route of routes) {
    if (route.method !== method || !route.path.includes("[")) continue
    const matchedParams = matchDeclarationPath(route.path, want)
    if (matchedParams) {
      return { ok: true, declaration: route, params: matchedParams }
    }
  }

  return { ok: false, status: 404, error: `插件未声明该路由: ${method} ${want}` }
}
