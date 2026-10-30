import { withCompanionMenuCatalogs, withCompanionPackageMenuIds } from "@/modules/shared/backend/constants/companion-menu"
import { getKyselyDb, hasRealDatabase } from "@/modules/shared/backend/lib/database"
import { INIT_MENUS } from "@prisma/data"
import { MEMORY_BOOTSTRAP_ADMIN_ID } from "./user-memory.store"

// 内存模式也必须具备与 CoolieBase 初始化库一致的基础关联，不能只初始化菜单实体。
const defaultMenuIds = withCompanionMenuCatalogs(INIT_MENUS).map((menu) => menu.id)
const memoryUserRoles = new Map<string, string[]>([
  // 内存模式引导管理员（见 user-memory.store.ts）→ 超级管理员。
  // 缺了这条绑定，登录能成功但 `getEffectiveUserMenuIds` 返回空 → 侧栏一个菜单都没有。
  [MEMORY_BOOTSTRAP_ADMIN_ID, ["1"]],
  ["1", ["1"]], // admin → 超级管理员
  ["2", ["2"]], // test → 普通角色
])
const memoryRoleMenus = new Map<string, string[]>([
  ["1", defaultMenuIds], // 超级管理员拥有完整系统菜单和按钮权限
  ["4", defaultMenuIds], // 默认租户管理员具备初始化管理权限
])

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

export const SystemPermissionRepository = {
  async replaceUserRoles(userId: string, roleIds: string[]): Promise<void> {
    const uniqueRoleIds = uniqueIds(roleIds)
    if (!hasRealDatabase()) {
      memoryUserRoles.set(userId, uniqueRoleIds)
      return
    }

    const db = await getKyselyDb()
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("system_user_role").where("user_id", "=", userId).execute()
      if (uniqueRoleIds.length > 0) {
        await trx.insertInto("system_user_role").values(uniqueRoleIds.map((roleId) => ({ id: crypto.randomUUID(), user_id: userId, role_id: roleId }))).execute()
      }
    })
  },

  async replaceRoleMenus(roleId: string, menuIds: string[]): Promise<void> {
    const uniqueMenuIds = uniqueIds(menuIds)
    if (!hasRealDatabase()) {
      memoryRoleMenus.set(roleId, uniqueMenuIds)
      return
    }

    const db = await getKyselyDb()
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("system_role_menu").where("role_id", "=", roleId).execute()
      if (uniqueMenuIds.length > 0) {
        await trx.insertInto("system_role_menu").values(uniqueMenuIds.map((menuId) => ({ id: crypto.randomUUID(), role_id: roleId, menu_id: menuId }))).execute()
      }
    })
  },

  async findUserRoleIds(userId: string): Promise<string[]> {
    if (!hasRealDatabase()) return memoryUserRoles.get(userId) ?? []
    const db = await getKyselyDb()
    const rows = await db.selectFrom("system_user_role").select("role_id").where("user_id", "=", userId).execute()
    return rows.map((row) => row.role_id)
  },

  async findRoleMenuIds(roleId: string): Promise<string[]> {
    if (!hasRealDatabase()) return withCompanionPackageMenuIds(memoryRoleMenus.get(roleId) ?? [])
    const db = await getKyselyDb()
    const rows = await db.selectFrom("system_role_menu").select("menu_id").where("role_id", "=", roleId).execute()
    return rows.map((row) => row.menu_id)
  },



}
export const systemPermissionRepository = SystemPermissionRepository
