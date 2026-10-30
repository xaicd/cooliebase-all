import { execSync } from "node:child_process"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { createHash } from "node:crypto"

import { INIT_DEPTS } from "../prisma/data/depts.seed-data"
import { INIT_DICT_DATA } from "../prisma/data/dict-data.seed-data"
import { INIT_DICT_TYPES } from "../prisma/data/dict-types.seed-data"
import { withCompanionMenuCatalogs, withCompanionPackageMenuIds } from "@/modules/shared/backend/constants/companion-menu"
import { INIT_MENUS } from "../prisma/data/menus.seed-data"
import { INIT_POSTS } from "../prisma/data/posts.seed-data"
import { INIT_ROLES } from "../prisma/data/roles.seed-data"
import { INIT_TENANT_PACKAGES } from "../prisma/data/tenant-packages.seed-data"

function escapeSql(str: any): string {
  if (str === null || str === undefined) return "NULL"
  if (typeof str === "boolean") return str ? "TRUE" : "FALSE"
  if (typeof str === "number") return String(str)
  return "'" + String(str).replace(/'/g, "''") + "'"
}

/** 从 DATABASE_URL 派生影子库连接串（库名后加 _shadow），供 migrate diff 重放迁移。 */
function deriveShadowUrl(databaseUrl: string | undefined): string {
  const raw = databaseUrl?.trim()
  if (!raw) return ""
  try {
    const url = new URL(raw)
    const database = url.pathname.replace(/^\//, "")
    if (!database) return ""
    url.pathname = `/${database}_shadow`
    return url.toString()
  } catch {
    return ""
  }
}

async function main() {
  console.log("[BUILD-V1-INIT] Generating V1 PostgreSQL full initialization SQL...")

  // 1. 获取纯净 DDL
  //
  // **必须从 migrations 推导, 不能从 prisma/schema.prisma 推导。**
  // 两者并不一致: 有 23 张表只存在于 migrations(15 张 ys_* 应算通业务表、5 张 aigw 表、
  // 3 张 system_tenant_package_ai_*)，从 schema 生成的 init SQL 会**少建这 23 张表**
  // （实测 57 表 vs migrations 的 78 表），于是拆分栈/容器初始化出来的库缺表。
  // `--to-migrations` 需要影子库重放迁移, 故这里派生一个 <库名>_shadow。
  const shadowUrl = process.env.SHADOW_DATABASE_URL?.trim() || deriveShadowUrl(process.env.DATABASE_URL)
  if (!shadowUrl) {
    throw new Error(
      "build:init-sql 需要 DATABASE_URL（或显式 SHADOW_DATABASE_URL）：DDL 由 migrations 推导，" +
        "prisma 需要影子库重放迁移。本地可先 `docker compose -f deploy/docker-compose.dev.yml up -d postgres`。",
    )
  }
  const ddl = execSync("pnpm exec prisma migrate diff --from-empty --to-migrations prisma/migrations --script", {
    encoding: "utf-8",
    env: { ...process.env, SHADOW_DATABASE_URL: shadowUrl },
  })

  // 2. 组装全量纯净 SEED 数据
  const fullMenus = withCompanionMenuCatalogs((INIT_MENUS)))

  // 拓扑排序 Menus
  const ids = new Set(fullMenus.map((m) => m.id))
  const pending = fullMenus.map((m) => ({ ...m, parentId: m.parentId && ids.has(m.parentId) ? m.parentId : null }))
  const orderedMenus: typeof pending = []
  const inserted = new Set<string>()
  while (pending.length) {
    const index = pending.findIndex((m) => !m.parentId || inserted.has(m.parentId))
    if (index < 0) break
    const [m] = pending.splice(index, 1)
    orderedMenus.push(m)
    inserted.add(m.id)
  }
  if (pending.length > 0) orderedMenus.push(...pending)

  let seedSql = `\n\n-- ==============================================================================\n-- SEED DATA (第一版全量初始数据 - 全部 4 字符工整菜单与系统初始配置)\n-- ==============================================================================\n\n`

  // 租户套餐（必须先于租户插入：system_tenant.package_id 外键指向它）
  //
  // 注意：套餐与菜单的绑定**不在本表**（menu_ids 列已不存在），而在
  // system_tenant_package_menu 关联表，且必须在菜单插入之后写 —— 见下面 "6b"。
  seedSql += `-- 1. 租户套餐\n`
  const pkgValues = INIT_TENANT_PACKAGES.map((pkg: any) =>
    `(${escapeSql(pkg.id)}, ${escapeSql(pkg.name)}, ${escapeSql(pkg.status)}, ${escapeSql(pkg.remark)}, NOW(), NOW())`
  ).join(",\n")
  seedSql += `INSERT INTO "system_tenant_package" ("id", "name", "status", "remark", "created_at", "updated_at") VALUES\n${pkgValues}\nON CONFLICT ("id") DO NOTHING;\n\n`

  // 租户 (ID=1 默认系统租户)
  //
  // 这段曾经用 contact_user_name / contact_mobile / account_count 三个**已不存在的列名**，
  // 且 package_id 写成 '1'（套餐实际是 '111'）、又插在套餐之前 —— 三者叠加导致
  // 生成的 init SQL 在全新库上必然失败（column "contact_user_name" does not exist）。
  // 列名与取值以迁移 20260821000000（id='1' -> tenant_code='default'）和
  // packages/domains/system/backend/repositories/tenant.repository.ts 的内存种子为准。
  seedSql += `-- 2. 默认系统租户（package_id='111'，须在上面的套餐之后）\n`
  seedSql += `INSERT INTO "system_tenant" ("id", "tenant_code", "name", "contact_name", "contact_phone", "package_id", "status", "effective_at", "expire_time", "account_limit", "created_at", "updated_at") VALUES\n`
  seedSql += `('1', 'default', '系统默认租户', '管理员', '13800000000', '111', 'ACTIVE', NOW(), '2099-12-31 23:59:59', 100, NOW(), NOW())\nON CONFLICT ("id") DO NOTHING;\n\n`

  // 部门
  seedSql += `-- 3. 组织部门\n`
  const deptValues = INIT_DEPTS.map((d: any) =>
    `(${escapeSql(d.id)}, ${escapeSql(d.name)}, ${escapeSql(d.parentId)}, ${escapeSql(d.sort)}, ${escapeSql(d.leaderUserId)}, ${escapeSql(d.phone)}, ${escapeSql(d.email)}, ${escapeSql(d.status)}, NOW(), NOW())`
  ).join(",\n")
  seedSql += `INSERT INTO "system_dept" ("id", "name", "parent_id", "sort", "leader_id", "phone", "email", "status", "created_at", "updated_at") VALUES\n${deptValues}\nON CONFLICT ("id") DO NOTHING;\n\n`

  // 岗位
  seedSql += `-- 4. 岗位信息\n`
  const postValues = INIT_POSTS.map((p: any) =>
    `(${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.code)}, ${escapeSql(p.sort)}, ${escapeSql(p.status)}, ${escapeSql(p.remark)}, NOW(), NOW())`
  ).join(",\n")
  seedSql += `INSERT INTO "system_post" ("id", "name", "code", "sort", "status", "remark", "created_at", "updated_at") VALUES\n${postValues}\nON CONFLICT ("id") DO NOTHING;\n\n`

  // 角色
  seedSql += `-- 5. 角色信息 (含超级管理员、平台运营、渠道代理商)\n`
  const roleValues = INIT_ROLES.map((r: any) =>
    `(${escapeSql(r.id)}, ${escapeSql(r.name)}, ${escapeSql(r.code)}, ${escapeSql(r.sort)}, ${escapeSql(r.dataScope)}, ${escapeSql(r.status)}, ${escapeSql(r.remark)}, NOW(), NOW())`
  ).join(",\n")
  seedSql += `INSERT INTO "system_role" ("id", "name", "code", "sort", "data_scope", "status", "remark", "created_at", "updated_at") VALUES\n${roleValues}\nON CONFLICT ("id") DO NOTHING;\n\n`

  // 菜单 (工整 4 字符)
  seedSql += `-- 6. 系统菜单与权限点 (已全面工整为 4 字符)\n`
  const menuValues = orderedMenus.map((m: any) =>
    `(${escapeSql(m.id)}, ${escapeSql(m.name)}, ${escapeSql(m.permission)}, ${escapeSql(m.type)}, ${escapeSql(m.parentId)}, ${escapeSql(m.path)}, ${escapeSql(m.component)}, ${escapeSql(m.icon)}, ${escapeSql(m.sort)}, ${escapeSql(m.status)}, ${m.visible ? 'TRUE' : 'FALSE'}, ${m.keepAlive ? 'TRUE' : 'FALSE'}, NOW(), NOW())`
  ).join(",\n")
  seedSql += `INSERT INTO "system_menu" ("id", "name", "permission", "type", "parent_id", "path", "component", "icon", "sort", "status", "visible", "keep_alive", "created_at", "updated_at") VALUES\n${menuValues}\nON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "path" = EXCLUDED."path", "component" = EXCLUDED."component", "permission" = EXCLUDED."permission";\n\n`

  // 套餐与菜单的绑定（menu_ids 列已不存在，改为关联表）。
  // 必须放在菜单插入之后：menu_id 外键指向 system_menu(id)。
  seedSql += `-- 6b. 租户套餐菜单绑定\n`
  const pkgMenuValues = INIT_TENANT_PACKAGES.flatMap((pkg: any, packageIndex: number) =>
    (pkg.menuIds ?? []).map(
      (menuId: string, menuIndex: number) =>
        `('tpm-${packageIndex + 1}-${menuIndex + 1}', ${escapeSql(pkg.id)}, ${escapeSql(menuId)})`,
    ),
  ).join(",\n")
  if (pkgMenuValues) {
    seedSql += `INSERT INTO "system_tenant_package_menu" ("id", "package_id", "menu_id") VALUES\n${pkgMenuValues}\nON CONFLICT ("id") DO NOTHING;\n\n`
  }

  // 字典类型
  seedSql += `-- 7. 数据字典类型\n`
  const dictTypeValues = INIT_DICT_TYPES.map((dt: any) =>
    `(${escapeSql(dt.id)}, ${escapeSql(dt.name)}, ${escapeSql(dt.type)}, ${escapeSql(dt.status)}, ${escapeSql(dt.remark)}, NOW(), NOW())`
  ).join(",\n")
  seedSql += `INSERT INTO "system_dict_type" ("id", "name", "type", "status", "remark", "created_at", "updated_at") VALUES\n${dictTypeValues}\nON CONFLICT ("id") DO NOTHING;\n\n`

  // 字典数据
  seedSql += `-- 8. 数据字典项\n`
  const dictDataValues = INIT_DICT_DATA.map((dd: any) =>
    `(${escapeSql(dd.id)}, ${escapeSql(dd.dictTypeId)}, ${escapeSql(dd.label)}, ${escapeSql(dd.value)}, ${escapeSql(dd.sort)}, ${escapeSql(dd.status)}, ${escapeSql(dd.colorType)}, ${escapeSql(dd.remark)}, NOW(), NOW())`
  ).join(",\n")
  seedSql += `INSERT INTO "system_dict_data" ("id", "dict_type_id", "label", "value", "sort", "status", "color_type", "remark", "created_at", "updated_at") VALUES\n${dictDataValues}\nON CONFLICT ("id") DO NOTHING;\n\n`

  // 初始超级管理员与系统运维用户 (vps_adm 与 roma_ops)
  seedSql += `-- 9. 平台超级管理员与系统运维用户 (vps_adm & roma_ops)\n`
  const salt = "ce51297c3af216ee"
  const md5 = (value: string) => createHash("md5").update(value).digest("hex")
  const encPwd = md5(md5("Vps_Admin159&w") + salt)

  seedSql += `INSERT INTO "system_user" ("id", "username", "password", "salt", "nickname", "remark", "dept_id", "email", "phone", "avatar", "status", "login_ip", "login_date", "created_at", "updated_at") VALUES\n`
  seedSql += `('1', 'vps_adm', '${encPwd}', '${salt}', '平台超级管理员', '系统首创平台管理员', '100', 'vps_adm@roma.vip', '13800138000', '', 'ACTIVE', '127.0.0.1', NOW(), NOW(), NOW()),\n`
  seedSql += `('2', 'roma_ops', '${encPwd}', '${salt}', '系统运维管理员', '系统内置高安全运维账号', '100', 'roma_ops@roma.vip', '13800138001', '', 'ACTIVE', '127.0.0.1', NOW(), NOW(), NOW())\n`
  seedSql += `ON CONFLICT ("id") DO UPDATE SET "username" = EXCLUDED."username", "password" = EXCLUDED."password", "nickname" = EXCLUDED."nickname";\n\n`

  // 用户与角色关联 (给 vps_adm 和 admin 绑定 super_admin 角色)
  seedSql += `-- 10. 用户角色关联\n`
  seedSql += `INSERT INTO "system_user_role" ("id", "user_id", "role_id") VALUES\n`
  seedSql += `('ur-1', '1', '1'),\n`
  seedSql += `('ur-2', '2', '1')\n`
  seedSql += `ON CONFLICT ("id") DO NOTHING;\n\n`

  // 角色与所有菜单绑定
  seedSql += `-- 11. 超级管理员角色绑定全部菜单权限\n`
  const roleMenuValues = orderedMenus.map((m: any, idx: number) =>
    `('rm-${idx + 1}', '1', ${escapeSql(m.id)})`
  ).join(",\n")
  seedSql += `INSERT INTO "system_role_menu" ("id", "role_id", "menu_id") VALUES\n${roleMenuValues}\nON CONFLICT ("id") DO NOTHING;\n\n`

  // 写入第一版完整初始化 SQL 文件
  const initDir = resolve(__dirname, "../sql/init")
  if (!existsSync(initDir)) mkdirSync(initDir, { recursive: true })

  const finalSql = `-- ==============================================================================\n-- cooliebase-all 第一版权威全量初始化 SQL (V1.0.0 PostgreSQL)\n-- 生成时间: ${new Date().toISOString()}\n-- 包含: 全 15 域完整 DDL + 工整 4 字符系统菜单 + 平台超管 + 完整业务种子数据\n-- ==============================================================================\n\n` + ddl + seedSql

  const targetPath = resolve(initDir, "cooliebase_all_next_v1.0.0_postgresql.sql")
  writeFileSync(targetPath, finalSql, "utf-8")
  console.log(`[BUILD-V1-INIT] Successfully generated: ${targetPath}`)
}

main().catch((err) => {
  console.error("[BUILD-V1-INIT] Failed:", err)
  process.exit(1)
})
