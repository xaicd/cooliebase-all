#!/usr/bin/env node
/**
 * 把各域生成的 `contract/*.rbac.sql` 聚合成**一份迁移**，并补齐缺失的父菜单。
 *
 * 为什么需要:
 *   1. codegen 为每张表产出 rbac.sql（菜单 + 4 大动词按钮 + 角色关联 + 租户套餐），
 *      但它落在 `contract/` 下 —— **没有任何迁移或种子会执行它**。
 *      后果不是报错，而是"页面生成了，侧边栏里却点不到"。
 *   2. 每条 rbac.sql 都把自己挂在父菜单 `<域>-dir` 下，而**父菜单没人创建** ——
 *      菜单树会断。
 *
 * 输出确定性: 固定的迁移名 + 全部排序 + 幂等语句（ON CONFLICT DO NOTHING），
 * 所以"元数据没变 = 输出不变"，可以安全重跑（与 generate-table-migration 同样的原则）。
 *
 * 用法:
 *   node scripts/generate-domain-rbac-migration.cjs            # dry-run，打印统计
 *   node scripts/generate-domain-rbac-migration.cjs --write    # 写入迁移
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const MIGRATION_DIR = "prisma/migrations"
const SLUG = "domain_rbac_menus"
const write = process.argv.includes("--write")

/**
 * 输出路径: **内容变了就产出一个新的带时间戳迁移**，内容没变就复用最近那个。
 *
 * 早先这里是"固定名 + 原地重写"，为的是输出确定性 —— 但那个设计有个硬伤（实测踩到）:
 * 迁移**一旦被应用过**，再改它的内容 Prisma 不会重跑（它认为已完成），
 * 表现是"新加了域，菜单迁移里也有它，但库里就是没有菜单"。
 *
 * 现在的规则与 Prisma 自身的模型一致:
 *   * 与"最近一个"聚合迁移内容相同 -> 复用（不产生新文件，输出仍然确定）
 *   * 内容不同 -> 新建 `<时间戳>_domain_rbac_menus`（会被正常应用）
 */
function resolveOutput() {
  const base = path.join(ROOT, MIGRATION_DIR)
  const existing = fs.existsSync(base)
    ? fs.readdirSync(base).filter((name) => name.endsWith(`_${SLUG}`)).sort()
    : []
  if (existing.length > 0) return path.join(base, existing[existing.length - 1], "migration.sql")
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)
  return path.join(base, `${stamp}_${SLUG}`, "migration.sql")
}
const OUT = resolveOutput()
const MIGRATION_NAME = path.basename(path.dirname(OUT))

function collectSql() {
  const files = []
  for (const root of [path.join(ROOT, "packages", "plugins"), path.join(ROOT, "packages", "domains")]) {
    if (!fs.existsSync(root)) continue
    for (const domain of fs.readdirSync(root)) {
      const dir = path.join(root, domain, "contract")
      if (!fs.existsSync(dir)) continue
      for (const file of fs.readdirSync(dir)) {
        if (file.endsWith(".rbac.sql")) files.push({ domain, full: path.join(dir, file) })
      }
    }
  }
  return files.sort((a, b) => a.full.localeCompare(b.full))
}

/** 从 rbac.sql 里抽出它引用的父菜单 id。 */
function parentsOf(sql) {
  const parents = new Set()
  for (const match of sql.matchAll(/'([a-z0-9-]+-dir)'/g)) parents.add(match[1])
  return [...parents]
}

/** 域目录名 -> 中文菜单名（用域自己 rbac.sql 里的 body 不好取，用已知映射 + 兜底）。 */
const DOMAIN_LABEL = {
  system: "系统管理", infra: "基础设施", bpm: "工作流", pay: "支付", report: "报表",
  mp: "微信公众号", mall: "商城", member: "会员", crm: "客户关系", erp: "ERP",
  wms: "仓储", mes: "生产制造", ai: "人工智能", iot: "物联网", im: "即时通讯",
  online: "在线表单", oa: "协同办公", hrm: "人力资源", fms: "财务管理", pms: "项目管理",
}

function main() {
  const files = collectSql()
  if (files.length === 0) {
    // **没有业务域是合法状态**（base profile 只有 system + infra，没有 domain menu）。
    // 早先这里 exit 1 —— 结果孵化器把它当失败（`execSync` 抛错），
    // 于是"孵一个 base 工程"这条最基本的路径直接走不通。这不是错误，是空集。
    console.log("[domain-rbac] 没有业务域（无 *.rbac.sql）—— 跳过菜单聚合迁移")
    return
  }

  // 收集父菜单: id -> 所属域
  const parents = new Map()
  for (const file of files) {
    for (const parent of parentsOf(fs.readFileSync(file.full, "utf8"))) {
      if (!parents.has(parent)) parents.set(parent, file.domain.replace(/^plugin-/, ""))
    }
  }

  const parentSort = [...parents.keys()].sort()
  const parts = [
    `-- ${MIGRATION_NAME}`,
    `-- 由 scripts/generate-domain-rbac-migration.cjs 生成，**勿手改**（改元数据后重跑该脚本）`,
    `-- 聚合 ${files.length} 份 contract/*.rbac.sql: 菜单 + 按钮权限 + 角色关联 + 租户套餐`,
    `-- 全部语句幂等（ON CONFLICT DO NOTHING），可重复执行。`,
    "",
    "-- 1. 父菜单（各域目录节点）—— rbac.sql 会挂到这些节点下，缺了菜单树就断",
    "INSERT INTO system_menu (id, parent_id, name, path, component, icon, sort, type, status, permission, created_at, updated_at) VALUES",
    parentSort
      .map((id, index) => {
        const domain = parents.get(id)
        const label = DOMAIN_LABEL[domain] ?? domain
        return `  ('${id}', NULL, '${label}', '/admin/${domain}', NULL, 'ep:menu', ${(index + 1) * 10}, 'DIR', 'ACTIVE', NULL, NOW(), NOW())`
      })
      .join(",\n") + "\nON CONFLICT (id) DO NOTHING;",
    "",
    "-- 2. 全局提权：管理员角色可见所有新菜单（3. 里的逐条关联之外，兜一层）",
    "-- 注意: 迁移跑在**种子之前**，全新库上角色 1 还不存在 —— 所以加存在性守卫，",
    "-- 否则外键直接失败。真正的授权关联由种子侧补（见 docs/agent 说明）。",
    "INSERT INTO system_role_menu (id, role_id, menu_id)",
    "SELECT 'rm-all-' || m.id, '1', m.id FROM system_menu m",
    "WHERE (m.id LIKE 'menu-%' OR m.id LIKE '%-dir') AND EXISTS (SELECT 1 FROM system_role r WHERE r.id = '1')",
    "ON CONFLICT DO NOTHING;",
    "",
    "-- 3. 各域明细（同步自 contract/*.rbac.sql）",
  ]

  // 兼容改写: 早期模板产出的 rbac.sql 里用的是 `create_time/update_time`，
  // 而真实 system_menu 是 `created_at/updated_at`。这些域的元数据还不在
  // scripts/data/ 下（wms/system/online 等），没法用生成器重跑，所以在聚合时改写。
  // 属**已知欠债** —— 那些域补上元数据后应重生成，本改写即可删除。
  let rewritten = 0
  for (const file of files) {
    parts.push("", `-- >>> ${path.relative(ROOT, file.full)}`)
    const raw = fs.readFileSync(file.full, "utf8").trim()
    let normalized = raw.replace(/\bcreate_time\b/g, "created_at").replace(/\bupdate_time\b/g, "updated_at")
    // 关联表（system_role_menu / system_tenant_package_menu）有两个坑:
    //   1. 有**非空 text 主键 id** —— 只给 (role_id, menu_id) 的旧写法会插 null 而失败；
    //   2. 有**外键** —— 迁移跑在**种子之前**，全新库上角色/套餐还不存在，直接插会破坏外键。
    // 统一改写成「CTE + SELECT + EXISTS 守卫 + 确定性 id」一种形式，两种模板产物都覆盖。
    normalized = normalized.replace(
      /INSERT INTO (system_role_menu|system_tenant_package_menu) \((?:(role_id|package_id), menu_id|id, (?:role_id|package_id), menu_id)\) VALUES\n([\s\S]*?)\nON CONFLICT DO NOTHING;/g,
      (match, table, left, rowsRaw) => {
        const rows = rowsRaw.trim()
        const isRole = table === "system_role_menu"
        const prefix = isRole ? "rm" : "pm"
        const key = isRole ? "role_id" : "package_id"
        const guardTable = isRole ? "system_role" : "system_tenant_package"
        // 新模板的行是 (id, role_id, menu_id)，旧模板是 (role_id, menu_id) —— 统一取后两列
        const normalizedRows = rows
          .split(/\),\s*\n\s*\(/)
          .map((row) => {
            const cells = row.replace(/^\(|$|^\)|\)$/g, "").split(",").map((cell) => cell.trim())
            return `(${cells.slice(-2).join(", ")})`
          })
          .join(",\n")
        return (
          `WITH v(${key}, menu_id) AS (VALUES\n${normalizedRows}\n)\n` +
          `INSERT INTO ${table} (id, ${key}, menu_id)\n` +
          `SELECT '${prefix}-' || v.${key} || '-' || v.menu_id, v.${key}, v.menu_id FROM v\n` +
          `WHERE EXISTS (SELECT 1 FROM ${guardTable} g WHERE g.id = v.${key})\n` +
          `ON CONFLICT DO NOTHING;`
        )
      },
    )
    if (normalized !== raw) rewritten++
    parts.push(normalized)
  }
  if (rewritten > 0) console.log(`  兼容改写: ${rewritten} 份旧模板产物（create_time -> created_at）`)

  const content = parts.join("\n") + "\n"
  console.log(`[domain-rbac] ${files.length} 份 rbac.sql / ${parentSort.length} 个父菜单 / ${content.split("\n").length} 行`)
  console.log(`  父菜单: ${parentSort.join(", ")}`)

  if (!write) {
    console.log(`\n  (dry-run: 未写入。加 --write 写入 prisma/migrations/${MIGRATION_NAME}/migration.sql)`)
    return
  }
  const previous = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null
  if (previous === content) {
    console.log(`  ✓ 无变化 ${path.relative(ROOT, OUT)}`)
    return
  }
  // 内容变了 —— 如果目标已被应用过，原地改是无效的，必须换一个新迁移
  const target = previous === null ? OUT : path.join(ROOT, MIGRATION_DIR, `${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}_${SLUG}`, "migration.sql")
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
  console.log(`  ✓ 已写 ${path.relative(ROOT, target)}${previous === null ? "" : "（内容有变化 -> 新迁移，保证会被应用）"}`)
}

main()
