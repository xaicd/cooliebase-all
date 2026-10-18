import { createHash, randomUUID } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { Client } from "pg"
import { SEED_DEPTS } from "../prisma/data/depts.seed-data"
import { SEED_DICT_DATA } from "../prisma/data/dict-data.seed-data"
import { SEED_DICT_TYPES } from "../prisma/data/dict-types.seed-data"
import { withCompanionPackageMenuIds } from "@/modules/shared/backend/constants/companion-menu"
import { SIDEBAR_COMPONENT_ROUTES } from "@/modules/system/backend/services/sidebar-component-routes"
import { SEED_MENUS } from "../prisma/data/menus.seed-data"
import { INFRA_CONFIG_DEFAULTS } from "@/modules/infra/backend/repositories/config.repository"
import { SEED_POSTS } from "../prisma/data/posts.seed-data"
import { SEED_ROLES } from "../prisma/data/roles.seed-data"
import { SEED_TENANT_PACKAGES } from "../prisma/data/tenant-packages.seed-data"
import { projectProfile } from "../packages/shared/contract/project-profile"
import { overlayPackageName } from "../packages/shared/contract/project-profile-overlay"
import { TenantMenuScope } from "../packages/domains/system/backend/services/tenant-menu-scope.service"
import { SEED_USERS } from "../prisma/data/users.seed-data"

function localEnvironment(): Record<string, string> {
  const values: Record<string, string> = {}
  for (const file of [".env", ".env.local"]) {
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?([^\r\n"']*)/)
      if (match) values[match[1]] = match[2].trim()
    }
  }
  return values
}

const environment = localEnvironment()
function requiredEnvironment(name: string): string {
  const value = process.env[name] ?? environment[name]
  if (!value) throw new Error(`${name} is required in .env.local for PostgreSQL bootstrap.`)
  return value
}
function passwordHash(password: string, salt: string): string {
  const md5 = (value: string) => createHash("md5").update(value).digest("hex")
  return md5(md5(password) + salt)
}
function assertStrongBootstrapPassword(password: string): void {
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password) || password === "admin123") {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters and include uppercase, lowercase, number, and symbol; admin123 is forbidden.")
  }
}
/**
 * 菜单目录 = 基座菜单 + **各"平台伴生域"自己的菜单**（域若存在才并入）。
 *
 * 为什么动态加载: 新工程默认只要 `system` + `infra`（加载/运行/预览都快），
 * 此时 online/ai/aigw 会被裁掉。静态 import 会让裁剪后的种子直接崩，
 * 而"该域在不在"只有运行时才知道。
 */
async function fullMenuCatalog(): Promise<Array<{ id: string }>> {
  const companions: Array<[string, string]> = [
    ["online", "withOnlineMenuCatalog"],
    ["aigw", "withAigwMenuCatalog"],
    ["ai", "withAiMenuCatalog"],
  ]
  let catalog: Array<{ id: string }> = SEED_MENUS
  for (const [domain, exportName] of companions) {
    try {
      const mod = (await import(`@/modules/${domain}/contract/menu-catalog`)) as Record<string, (menus: never) => never>
      const wrap = mod[exportName]
      if (typeof wrap === "function") catalog = wrap(catalog as never) as never
    } catch {
      // 该域不在本工程内 —— 跳过它的菜单，属于预期情况
    }
  }
  return catalog
}
async function insertableMenus() {
  const catalog = await fullMenuCatalog()
  const ids = new Set(catalog.map((menu) => menu.id))
  const pending = catalog.map((menu) => ({ ...menu, parentId: menu.parentId && ids.has(menu.parentId) ? menu.parentId : null }))
  const ordered: typeof pending = []
  const inserted = new Set<string>()
  while (pending.length) {
    const index = pending.findIndex((menu) => !menu.parentId || inserted.has(menu.parentId))
    if (index < 0) throw new Error("Menu seed data contains a parent cycle")
    const [menu] = pending.splice(index, 1)
    ordered.push(menu)
    inserted.add(menu.id)
  }
  return ordered
}

async function main() {
  const client = new Client({ connectionString: requiredEnvironment("DATABASE_URL") })
  await client.connect()
  try {
    await client.query("BEGIN")

    for (const pkg of SEED_TENANT_PACKAGES) {
      await client.query(`INSERT INTO system_tenant_package (id, name, status, account_limit, remark, created_at, updated_at, deleted) VALUES ($1,$2,$3,NULL,$4,$5,$6,false) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, remark = EXCLUDED.remark, updated_at = EXCLUDED.updated_at, deleted = false`, [pkg.id, overlayPackageName(pkg.id, pkg.name), pkg.status, pkg.remark, pkg.createdAt, pkg.updatedAt])
    }

    const tenantLifecycle: Record<string, { effectiveAt: string; expireTime: string; accountLimit: number }> = {
      "1": { effectiveAt: "2026-01-01T00:00:00.000Z", expireTime: "2030-12-31T23:59:59.000Z", accountLimit: 999 },
      "2": { effectiveAt: "2026-03-01T00:00:00.000Z", expireTime: "2027-06-30T23:59:59.000Z", accountLimit: 50 },
    }
    for (const tenant of projectProfile.tenants) {
      const lifecycle = tenantLifecycle[tenant.id] ?? tenantLifecycle["1"]
      await client.query(`INSERT INTO system_tenant (id, tenant_code, name, contact_name, contact_phone, domain, package_id, status, effective_at, expire_time, account_limit, created_at, updated_at, deleted) VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8,$9,$10,$11,$11,false) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, contact_name = EXCLUDED.contact_name, contact_phone = EXCLUDED.contact_phone, domain = EXCLUDED.domain, package_id = EXCLUDED.package_id, updated_at = EXCLUDED.updated_at, deleted = false`, [tenant.id, tenant.code, tenant.name, tenant.contactName ?? null, tenant.contactPhone ?? null, tenant.domain ?? null, tenant.packageId, lifecycle.effectiveAt, lifecycle.expireTime, lifecycle.accountLimit, "2026-01-01T00:00:00.000Z"])
      await client.query(`INSERT INTO system_tenant_subscription (id, tenant_id, package_id, effective_at, expire_at, account_limit, status, change_type, remark) VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE','MIGRATION',$7) ON CONFLICT (id) DO NOTHING`, [`initial-${tenant.id}`, tenant.id, tenant.packageId, lifecycle.effectiveAt, lifecycle.expireTime, lifecycle.accountLimit, `初始化${tenant.name}权益`])
    }

    for (const dept of SEED_DEPTS) {
      await client.query(`INSERT INTO system_dept (id, name, parent_id, sort, leader_id, phone, email, status, tenant_id, created_at, updated_at, deleted) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false) ON CONFLICT (id) DO NOTHING`, [dept.id, dept.name, dept.parentId, dept.sort, dept.leaderId, dept.phone, dept.email, dept.status, dept.tenantId, dept.createdAt, dept.updatedAt])
    }
    for (const role of SEED_ROLES) {
      await client.query(`INSERT INTO system_role (id, name, code, sort, status, remark, data_scope, tenant_id, created_at, updated_at, deleted) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false) ON CONFLICT (code) DO NOTHING`, [role.id, role.name, role.code, role.sort, role.status, role.remark, role.dataScope, role.tenantId, role.createdAt, role.updatedAt])
    }
    for (const post of SEED_POSTS) {
      await client.query(`INSERT INTO system_post (id, name, code, sort, status, remark, tenant_id, created_at, updated_at, deleted) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false) ON CONFLICT (code) DO NOTHING`, [post.id, post.name, post.code, post.sort, post.status, post.remark, post.tenantId, post.createdAt, post.updatedAt])
    }

    const typeIds = new Set(SEED_DICT_TYPES.map((item) => item.id))
    const missingTypeIds = [...new Set(SEED_DICT_DATA.filter((item) => !typeIds.has(item.dictTypeId)).map((item) => item.dictTypeId))]
    for (const type of SEED_DICT_TYPES) {
      await client.query(`INSERT INTO system_dict_type (id, name, type, status, remark, created_at, updated_at, deleted) VALUES ($1,$2,$3,$4,$5,$6,$7,false) ON CONFLICT (type) DO NOTHING`, [type.id, type.name, type.type, type.status, type.remark, type.createdAt, type.updatedAt])
    }
    for (const id of missingTypeIds) {
      await client.query(`INSERT INTO system_dict_type (id, name, type, status, created_at, updated_at, deleted) VALUES ($1,$2,$3,'ACTIVE',$4,$4,false) ON CONFLICT (id) DO NOTHING`, [id, `补充字典类型：${id}`, `bootstrap_${id.replace(/[^A-Za-z0-9_]/g, "_")}`, new Date().toISOString()])
    }
    const seenDictDataIds = new Set<string>()
    for (const item of SEED_DICT_DATA) {
      const id = seenDictDataIds.has(item.id) ? `${item.id}-${item.dictTypeId}` : item.id
      seenDictDataIds.add(item.id)
      await client.query(`INSERT INTO system_dict_data (id, dict_type_id, label, value, sort, status, color_type, remark, created_at, updated_at, deleted) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false) ON CONFLICT (id) DO NOTHING`, [id, item.dictTypeId, item.label, item.value, item.sort, item.status, item.colorType, item.remark, item.createdAt, item.updatedAt])
    }

    const bootstrapUsername = requiredEnvironment("ADMIN_BOOTSTRAP_USERNAME")
    const bootstrapPassword = requiredEnvironment("ADMIN_BOOTSTRAP_PASSWORD")
    const bootstrapSalt = requiredEnvironment("ADMIN_BOOTSTRAP_SALT")
    assertStrongBootstrapPassword(bootstrapPassword)
    const legacyDefaultHash = "9486c0e4d342d7b250ac3b27d3f211aa"
    // infra 默认配置: 取自**内存回退用的同一份常量**（INFRA_CONFIG_DEFAULTS）。
    // 此前只存在于内存侧，于是同一批用例内存模式全绿、连真实库必挂
    // （`配置项不存在: sys.application.name`）—— 两条路径必须同一来源。
    for (const item of INFRA_CONFIG_DEFAULTS) {
      await client.query(
        `INSERT INTO infra_config (id, category, name, config_key, value, visible, remark, created_at, updated_at, deleted)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false)
         ON CONFLICT (config_key) DO UPDATE SET name = EXCLUDED.name, value = EXCLUDED.value, updated_at = EXCLUDED.updated_at, deleted = false`,
        [item.id, item.category, item.name, item.configKey, item.value, item.visible, item.remark, item.createdAt, item.updatedAt],
      )
    }

    await client.query(`UPDATE "system_user" SET status = 'DISABLED', updated_at = $1 WHERE username IN ('admin', 'cooliebase_local_operator') AND username <> $2`, [new Date().toISOString(), bootstrapUsername])
    await client.query(`DELETE FROM system_user_role AS ur USING "system_user" AS u WHERE ur.user_id = u.id AND u.username IN ('admin', 'cooliebase_local_operator') AND u.username <> $1`, [bootstrapUsername])
    const templateUser = SEED_USERS[0]
    const adminResult = await client.query<{ id: string }>(`INSERT INTO "system_user" (id, username, nickname, password, salt, phone, email, avatar, status, dept_id, remark, tenant_id, created_at, updated_at, deleted) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE',$9,$10,$11,$12,$13,false) ON CONFLICT (username) DO UPDATE SET nickname = EXCLUDED.nickname, password = EXCLUDED.password, salt = EXCLUDED.salt, status = 'ACTIVE', deleted = false, updated_at = EXCLUDED.updated_at RETURNING id`, [randomUUID(), bootstrapUsername, projectProfile.bootstrapAdmin.nickname, passwordHash(bootstrapPassword, bootstrapSalt), bootstrapSalt, templateUser.phone, templateUser.email, templateUser.avatar, templateUser.deptId, "本地环境专用管理员", templateUser.tenantId, templateUser.createdAt, new Date().toISOString()])
    const adminId = adminResult.rows[0].id
    await client.query(`UPDATE system_menu SET deleted = true WHERE id LIKE 'ys-%' OR id LIKE 'ai-gateway-%' OR id IN ('9000', '9004', '9005', '9100', '9101', '9103', '9104', '9200', '9201', '9203', '9300', '9400', '9402')`)
    await client.query(`DELETE FROM system_role_menu WHERE menu_id LIKE 'ys-%' OR menu_id LIKE 'ai-gateway-%' OR menu_id LIKE '90%' OR menu_id LIKE '91%' OR menu_id LIKE '92%' OR menu_id LIKE '93%' OR menu_id LIKE '94%'`)
    await client.query(`DELETE FROM system_tenant_package_menu WHERE menu_id LIKE 'ys-%' OR menu_id LIKE 'ai-gateway-%' OR menu_id LIKE '90%' OR menu_id LIKE '91%' OR menu_id LIKE '92%' OR menu_id LIKE '93%' OR menu_id LIKE '94%'`)

    for (const menu of await insertableMenus()) {
      await client.query(`INSERT INTO system_menu (id, name, permission, type, parent_id, path, component, icon, sort, status, visible, keep_alive, created_at, updated_at, deleted) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, permission = EXCLUDED.permission, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id, path = EXCLUDED.path, component = EXCLUDED.component, icon = EXCLUDED.icon, sort = EXCLUDED.sort, status = EXCLUDED.status, visible = EXCLUDED.visible, keep_alive = EXCLUDED.keep_alive, updated_at = EXCLUDED.updated_at, deleted = false`, [menu.id, menu.name, menu.permission, menu.type, menu.parentId, menu.path, menu.component, menu.icon, menu.sort, menu.status, menu.visible, menu.keepAlive, menu.createdAt, menu.updatedAt])
    }
    // 种子菜单来资源框架的 SQL，其中只有一部分在本仓有落地页 —— component 映射不到、
    // path 又不是绝对路由的那种，渲染出来就是点不动的死条目（侧边栏 href 为 null）。
    // 这里统一隐藏（不删，可逆），规则与 menu.service.ts 共用同一张映射表，不会漂移。
    const reachableComponents = Object.keys(SIDEBAR_COMPONENT_ROUTES)
    await client.query(
      `UPDATE system_menu SET visible = false, updated_at = NOW()
       WHERE type = 'MENU' AND component IS NOT NULL AND component <> ''
         AND NOT (component = ANY($1))
         AND (path IS NULL OR path NOT LIKE '/%')`,
      [reachableComponents],
    )
    const tenantMenuScope = new TenantMenuScope(await fullMenuCatalog())
    for (const pkg of SEED_TENANT_PACKAGES) {
      await client.query(`DELETE FROM system_tenant_package_menu WHERE package_id = $1`, [pkg.id])
      for (const menuId of tenantMenuScope.normalize(withCompanionPackageMenuIds(pkg.menuIds))) await client.query(`INSERT INTO system_tenant_package_menu (id, package_id, menu_id) VALUES ($1,$2,$3) ON CONFLICT (package_id, menu_id) DO NOTHING`, [randomUUID(), pkg.id, menuId])
    }
    // Historical all-next draft packages were not sourced from CoolieBase. Keep rows for audit,
    // but remove them from the catalog after the demo tenant is reassigned to package 111.
    // 库里可能还有**不是这次种子带来**的菜单 —— 例如按元数据生成的 `domain_rbac_menus`
    // 迁移（导入业务域时产出）。套餐只认静态种子，不补这一步的话，
    // `getRoleMenuIds` 会按套餐再过滤一道 —— 结果是「角色菜单授权了、侧边栏却看不到」，
    // 两边自相矛盾（实测: 新域菜单授权 266 条，套餐里 0 条）。
    await client.query(
      `INSERT INTO system_tenant_package_menu (id, package_id, menu_id)
       SELECT 'tm-seed-' || p.id || '-' || m.id, p.id, m.id
       FROM system_tenant_package p CROSS JOIN system_menu m
       WHERE p.deleted = false
       ON CONFLICT (package_id, menu_id) DO NOTHING`,
    )
    await client.query(`DELETE FROM system_tenant_package_menu WHERE package_id IN ('1', '2', '3')`)
    await client.query(`UPDATE system_tenant_package SET deleted = true, updated_at = $1 WHERE id IN ('1', '2', '3')`, [new Date().toISOString()])
    const roleResult = await client.query<{ id: string }>(`SELECT id FROM system_role WHERE code = 'super_admin' LIMIT 1`)
    const platformRoleResult = await client.query<{ id: string }>(`SELECT id FROM system_role WHERE code = 'platform-admin' LIMIT 1`)
    const roleId = roleResult.rows[0]?.id
    const platformRoleId = platformRoleResult.rows[0]?.id
    if (!roleId || !platformRoleId) throw new Error("super_admin and platform-admin roles must be seeded")
    for (const assignedRoleId of [roleId, platformRoleId]) {
      await client.query(`INSERT INTO system_user_role (id, user_id, role_id) VALUES ($1,$2,$3) ON CONFLICT (user_id, role_id) DO NOTHING`, [randomUUID(), adminId, assignedRoleId])
      for (const menu of await insertableMenus()) await client.query(`INSERT INTO system_role_menu (id, role_id, menu_id) VALUES ($1,$2,$3) ON CONFLICT (role_id, menu_id) DO NOTHING`, [randomUUID(), assignedRoleId, menu.id])
    }
    // 库里可能还有**不是这次种子带来**的菜单 —— 例如按元数据生成的 `domain_rbac_menus`
    // 迁移（导入业务域时产物）。种子只认识自己的静态目录，不补这一步，那些页面在侧边栏里
    // 永远点不到（`getEffectiveUserMenuIds` 按 role_menu 过滤）。管理员角色本应看到全部。
    // 放循环外用 roleId/platformRoleId（循环变量在此不可见）。
    for (const adminRoleId of [roleId, platformRoleId]) {
      await client.query(
        `INSERT INTO system_role_menu (id, role_id, menu_id)
         SELECT 'rm-seed-' || $1 || '-' || m.id, $1, m.id FROM system_menu m
         ON CONFLICT (role_id, menu_id) DO NOTHING`,
        [adminRoleId],
      )
    }
    await client.query("COMMIT")
    console.log(`[seed] PostgreSQL catalog seeded: ${SEED_ROLES.length} roles, ${SEED_DEPTS.length} departments, ${SEED_POSTS.length} posts, ${SEED_DICT_TYPES.length} dictionary types, ${SEED_DICT_DATA.length} dictionary entries, and ${(await fullMenuCatalog()).length} menus.`)
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => { console.error("[seed] Failed:", error); process.exitCode = 1 })