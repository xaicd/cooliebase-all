import { NextResponse } from "next/server"

import { requireAdminAuth, requireAppAuth } from "@/modules/shared/backend/auth/guards"
import { handleApiError } from "@/modules/shared/backend/http/api-error"
import { PLUGIN_ROUTE_PREFIX, resolvePluginRoute } from "@/modules/shared/backend/plugins/route-mount"
import { PluginRepository } from "@/modules/shared/backend/plugins/plugin.repository"
import { pluginRuntimeManager } from "@/modules/shared/backend/plugins/runtime-manager"
import { pluginRegistryService } from "@/modules/shared/backend/plugins/plugin-registry.service"
import type { PluginManifest } from "@/modules/shared/backend/plugins/types"

/**
 * 插件自有 API 的挂载点：`/api/v1/plugins/<pluginKey>/api<path>`
 *
 * **为什么不挂在 /api/v1/admin 下**：admin 前缀由 proxy 的 perimeter 统一要求管理员鉴权，
 * 而插件的 auth 是**运行期按 manifest 声明**的（operator / company / public）——
 * 静态的"精确路径 + 方法"白名单表达不了动态声明。放在非 admin 前缀下，proxy 直接放行
 * （proxy 只对 /api/v1/admin/ 施压），由**本挂载点**按声明鉴权。
 *
 * 三种声明对应三个现成守卫：
 *   operator -> requireAdminAuth   company -> requireAppAuth   public -> 不鉴权
 * 这也是唯一诚实的做法：不能因为"路径在 admin 下"就给所有插件路由强加管理员鉴权，
 * 也不能因为"是插件"就默认放行。
 */
/**
 * **懒启动插件运行时**（只跑一次）。
 *
 * 全新启动的应用里没有任何东西调用 `reconcile()` —— 它只在管理端
 * `POST /api/v1/admin/plugins` 里被调用。于是 `PluginRepository` 里有记录、
 * `runtime-manager` 里却没有实例，挂载点直接 500
 * 「插件 X 未运行，无法调用其路由」（实测）。
 *
 * 这里在**首次命中插件 API** 时补一次 `reconcile()`（它会 syncFromDisk + 启停进程），
 * 之后 memo 住 promise，不会每次请求都跑；失败则清掉 memo，下次重试。
 */
let ensureRuntimesPromise: Promise<unknown> | null = null
/** 启动失败的原因（**不吞**：调试时要在后续报错里带出来，见 `invokeRoute` 那段） */
let ensureRuntimesError: unknown = null
async function ensurePluginRuntimes(): Promise<void> {
  if (!ensureRuntimesPromise) {
    ensureRuntimesPromise = pluginRegistryService
      .reconcile()
      // **失败不致命**：内存模式 / 无插件目录时 reconcile 会失败，而"调用插件路由"
      // 本来就会以「插件 X 未运行」失败 —— 不能因为自愈没成功就把它变成 500。
      // 但原因必须留着（本仓禁止静默吞异常），拼进后面的错误里。
      .catch((error) => {
        ensureRuntimesError = error
        ensureRuntimesPromise = null
      })
  }
  await ensureRuntimesPromise
}

async function handle(request: Request) {
  const url = new URL(request.url)
  const rest = url.pathname.slice(`${PLUGIN_ROUTE_PREFIX}/`.length)
  const [pluginKey, ...tail] = rest.split("/")
  const pathPart = tail.join("/").replace(/^api\/?/, "")

  const record = await PluginRepository.findByKey(pluginKey)
  const manifest = (record?.manifestJson ?? null) as unknown as PluginManifest | null

  const resolution = resolvePluginRoute({
    manifest,
    capabilities: manifest?.capabilities ?? [],
    method: request.method,
    pathname: `${PLUGIN_ROUTE_PREFIX}/${pluginKey}/api${pathPart ? `/${pathPart}` : ""}`,
    pluginKey,
  })
  if (!resolution.ok) {
    return NextResponse.json(
      { success: false, error: resolution.error ?? "插件路由不可用" },
      { status: resolution.status ?? 400 },
    )
  }

  // 按声明鉴权 —— 声明什么就查什么，不静默放宽也不一律收紧。
  // try 必须把鉴权也包进去: 守卫按声明抛的是 AuthenticationError(401) /
  // AuthorizationError(403)，落在 try 之外会直接逃逸成 Next 的 500。
  const declared = resolution.declaration!.auth
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.json().catch(() => undefined)
  try {
    if (declared === "operator") await requireAdminAuth(request)
    else if (declared === "company") requireAppAuth(request)

    // **保证运行时已启动**：注册进库 ≠ 插件在跑（见 ensurePluginRuntimes）。
    // 放在鉴权之后 —— 未通过鉴权的请求不该触发插件进程启动。
    if (!pluginRuntimeManager.get(pluginKey)) {
      await ensurePluginRuntimes()
      if (!pluginRuntimeManager.get(pluginKey) && ensureRuntimesError) {
        // 自愈没成功 —— 把**原因**带出来，否则只剩一句"未运行"，无从下手。
        console.error(
          `[plugin-mount] ${pluginKey} 自动启动失败：`,
          ensureRuntimesError instanceof Error ? ensureRuntimesError.message : String(ensureRuntimesError),
        )
      }
    }

    const result = await pluginRuntimeManager.invokeRoute(pluginKey, resolution.declaration!.routeKey, {
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body,
      headers: Object.fromEntries(request.headers),
      pluginKey,
    })
    return NextResponse.json({ success: true, data: result?.body ?? null }, { status: result?.status ?? 200 })
  } catch (error) {
    // 必须走平台统一的错误映射: 守卫按 manifest 声明抛出的是 AuthenticationError(401) /
    // AuthorizationError(403)，一律当 500 会把"未登录"报成"服务器错误"（实测踩过）。
    return handleApiError(error, { operation: `plugin.route.execute ${pluginKey}` })
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
