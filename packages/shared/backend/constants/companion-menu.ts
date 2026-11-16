/**
 * 「平台伴生域」的菜单目录并入 —— **域存在才并入**。
 *
 * 背景：`system` / `infra` 是平台地基，而 `online` / `aigw` / `ai` 是**伴生域**
 * （分别提供低代码在线表单、AI 网关、AI 能力）。地基的菜单/权限目录需要并入
 * 伴生域自己的菜单，才能让侧边栏与套餐菜单完整。
 *
 * 为什么必须**动态**：新工程默认只要 `system` + `infra`（加载/运行/预览都快，
 * 定制扩展也快），此时伴生域会被裁掉。而这份并入发生在**模块加载期**
 * （如 MEMORY_STORE 的初值），静态 import 会让裁剪后的工程直接崩 ——
 * 这也是此前"伴生域不能从 minimal 裁掉"的真正原因。
 *
 * 约定：域不在 -> 退化为**原样返回**，而不是报错。
 */
type MenuLike = { id: string }
type MenuCatalogWrapper = (menus: never) => never
type PackageMenuIdWrapper = (ids: string[]) => string[]

/** 各伴生域提供的包装函数（模块路径 + 导出名）。 */
const COMPANION_CATALOG_WRAPPERS: Array<[string, string]> = [
  ["@/modules/online/contract/menu-catalog", "withOnlineMenuCatalog"],
  ["@/modules/ai/contract/menu-catalog", "withAiMenuCatalog"],
]

const COMPANION_PACKAGE_ID_WRAPPERS: Array<[string, string]> = [
  ["@/modules/online/contract/menu-catalog", "withOnlinePackageMenuIds"],
  ["@/modules/ai/contract/menu-catalog", "withAiPackageMenuIds"],
]

/** 取一个可选的包装函数；域不在（模块解析失败）时退化为恒等。 */
function optionalWrapper<T>(modulePath: string, exportName: string, identity: T): T {
  try {
    // tsx / Next 都能解析 TS 路径；域被裁掉时 require 抛错 -> 恒等退化
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(modulePath) as Record<string, unknown>
    const fn = mod[exportName]
    return typeof fn === "function" ? (fn as T) : identity
  } catch {
    return identity
  }
}

/** 把伴生域的菜单并入基底菜单（域不存在则跳过它）。 */
export function withCompanionMenuCatalogs<T extends MenuLike>(menus: T[]): T[] {
  let catalog = menus
  for (const [modulePath, exportName] of COMPANION_CATALOG_WRAPPERS) {
    const wrap = optionalWrapper<MenuCatalogWrapper>(modulePath, exportName, ((value: never) => value) as MenuCatalogWrapper)
    catalog = wrap(catalog as never) as never
  }
  return catalog
}

/** 把伴生域的套餐菜单 ID 并入基底列表（域不存在则跳过它）。 */
export function withCompanionPackageMenuIds(ids: Iterable<string>): string[] {
  let list = [...ids]
  for (const [modulePath, exportName] of COMPANION_PACKAGE_ID_WRAPPERS) {
    const wrap = optionalWrapper<PackageMenuIdWrapper>(modulePath, exportName, (value) => value)
    list = wrap(list)
  }
  return list
}
