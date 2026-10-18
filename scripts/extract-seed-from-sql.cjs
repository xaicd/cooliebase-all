/**
 * 从 cooliebase-vue-pro SQL 文件提取种子数据，输出为 TypeScript 内存格式
 *
 * 提取表：
 * - system_menu（菜单树）
 * - system_tenant_package（租户套餐及 menu_ids）
 * - system_dict_type + system_dict_data（字典）
 * - system_dept（部门树）
 * - system_post（岗位）
 *
 * 用法: node scripts/extract-seed-from-sql.cjs
 * 输出: scripts/seed-output/ 目录下的 .ts 文件
 */

const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const SQL_FILE = path.resolve(__dirname, "../../cooliebase-vue-pro/sql/mysql/cooliebase-vue-pro.sql")
const OUTPUT_DIR = path.resolve(__dirname, "seed-output")
const RUNTIME_DATA_DIR = path.resolve(__dirname, "../prisma/data")
const SOURCE_HASH = crypto.createHash("sha256").update(fs.readFileSync(SQL_FILE)).digest("hex")

if (!fs.existsSync(SQL_FILE)) {
  console.error("SQL 文件不存在:", SQL_FILE)
  process.exit(1)
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const sql = fs.readFileSync(SQL_FILE, "utf-8")

// === 通用 INSERT 解析器 ===
function extractInserts(tableName) {
  const regex = new RegExp(`INSERT INTO \`${tableName}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*\\((.+?)\\);`, "g")
  const rows = []
  let match

  while ((match = regex.exec(sql)) !== null) {
    const cols = match[1].split(",").map((c) => c.trim().replace(/`/g, ""))
    const valuesStr = match[2]

    // 简单解析值（处理引号、NULL、b'0'）
    const values = parseValues(valuesStr)
    if (values.length !== cols.length) continue

    const row = {}
    cols.forEach((col, i) => { row[col] = values[i] })
    rows.push(row)
  }

  return rows
}

function parseValues(str) {
  const values = []
  let current = ""
  let inString = false
  let stringChar = ""

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (inString) {
      if (ch === stringChar && str[i - 1] !== "\\") {
        inString = false
        values.push(current)
        current = ""
        // skip comma after quote
        while (i + 1 < str.length && (str[i + 1] === "," || str[i + 1] === " ")) i++
      } else {
        current += ch
      }
    } else if (ch === "'" || ch === '"') {
      inString = true
      stringChar = ch
      current = ""
    } else if (ch === ",") {
      const trimmed = current.trim()
      if (trimmed === "NULL") values.push(null)
      else if (trimmed === "b'0'") values.push(false)
      else if (trimmed === "b'1'") values.push(true)
      else values.push(trimmed)
      current = ""
    } else {
      current += ch
    }
  }

  // last value
  const trimmed = current.trim()
  if (trimmed === "NULL") values.push(null)
  else if (trimmed === "b'0'") values.push(false)
  else if (trimmed === "b'1'") values.push(true)
  else if (trimmed) values.push(trimmed)

  return values
}

// === 提取菜单 ===
function isEnabled(value) {
  return value === true || value === "1" || value === "b1" || value === "b'1'"
}

function extractMenus() {
  const rows = extractInserts("system_menu")
  console.log(`[MENU] 提取 ${rows.length} 条菜单`)
  const output = rows
    .filter((row) => row.deleted === false || row.deleted === "0" || row.deleted === "b0" || row.deleted === "b'0'")
    .map((row) => ({
      id: String(row.id),
      name: row.name || "",
      permission: row.permission || null,
      type: row.type === "1" ? "DIR" : row.type === "2" ? "MENU" : "BUTTON",
      parentId: row.parent_id && row.parent_id !== "0" ? String(row.parent_id) : null,
      path: row.path || null,
      component: row.component || null,
      icon: row.icon || null,
      sort: Number(row.sort) || 0,
      status: row.status === "0" ? "ACTIVE" : "DISABLED",
      visible: isEnabled(row.visible),
      keepAlive: isEnabled(row.keep_alive),
    }))
  console.log(`[MENU] 有效菜单 ${output.length} 条（不截断）`)

  fs.writeFileSync(path.join(OUTPUT_DIR, "menus.seed.ts"), `// Auto-generated from cooliebase-vue-pro SQL\n// source sha256: ${SOURCE_HASH}\n// ${output.length} menus extracted\n\nexport const SEED_MENUS = ${JSON.stringify(output, null, 2)}\n`)
  fs.writeFileSync(path.join(RUNTIME_DATA_DIR, "menus.seed-data.ts"), `// Auto-generated from ../../cooliebase-vue-pro/sql/mysql/cooliebase-vue-pro.sql\n// source sha256: ${SOURCE_HASH}\n// ${output.length} active CoolieBase menus; do not edit manually.\nimport type { SystemMenuRow } from "@/modules/system/backend/repositories/menu.repository"\n\nexport const SEED_MENUS: SystemMenuRow[] = ${JSON.stringify(output.map((menu) => ({ ...menu, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" })), null, 2)}\n`)
  console.log(`[MENU] 写入完整运行时菜单 prisma/data/menus.seed-data.ts`)
}

function extractTenantPackages() {
  const rows = extractInserts("system_tenant_package")
  const output = rows
    .filter((row) => row.deleted === false || row.deleted === "0" || row.deleted === "b0" || row.deleted === "b'0'")
    .map((row) => ({
      id: String(row.id),
      name: row.name || "",
      status: row.status === "0" ? "ACTIVE" : "DISABLED",
      menuIds: JSON.parse(row.menu_ids || "[]").map(String),
      remark: row.remark || null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }))
  fs.writeFileSync(path.join(OUTPUT_DIR, "tenant-packages.seed.ts"), `// Auto-generated from cooliebase-vue-pro SQL\n// source sha256: ${SOURCE_HASH}\n\nexport const SEED_TENANT_PACKAGES = ${JSON.stringify(output, null, 2)}\n`)
  fs.writeFileSync(path.join(RUNTIME_DATA_DIR, "tenant-packages.seed-data.ts"), `// Auto-generated from ../../cooliebase-vue-pro/sql/mysql/cooliebase-vue-pro.sql\n// source sha256: ${SOURCE_HASH}\n// CoolieBase package menu_ids are expanded into system_tenant_package_menu at seed time.\n\nexport type TenantPackageSeed = { id: string; name: string; status: "ACTIVE" | "DISABLED"; menuIds: string[]; remark: string | null; createdAt: string; updatedAt: string }\n\nexport const SEED_TENANT_PACKAGES: TenantPackageSeed[] = ${JSON.stringify(output, null, 2)}\n`)
  console.log(`[TENANT_PACKAGE] 写入 ${output.length} 个 CoolieBase 默认套餐`)
}

// === 提取字典类型 ===
function extractDictTypes() {
  const rows = extractInserts("system_dict_type")
  const active = rows.filter((r) => r.deleted === false || r.deleted === "0")
  console.log(`[DICT_TYPE] 提取 ${active.length} 条字典类型`)

  const output = active.map((r) => ({
    id: String(r.id),
    name: r.name || "",
    type: r.type || "",
    status: r.status === "0" ? "ACTIVE" : "DISABLED",
    remark: r.remark || null,
  }))

  const content = `// Auto-generated\nexport const SEED_DICT_TYPES = ${JSON.stringify(output, null, 2)}\n`
  fs.writeFileSync(path.join(OUTPUT_DIR, "dict-types.seed.ts"), content)
  console.log(`[DICT_TYPE] 写入 seed-output/dict-types.seed.ts`)
}

// === 提取字典数据 ===
function extractDictData() {
  const rows = extractInserts("system_dict_data")
  const active = rows.filter((r) => r.deleted === false || r.deleted === "0")
  console.log(`[DICT_DATA] 提取 ${active.length} 条字典数据`)

  const output = active.map((r) => ({
    id: String(r.id),
    dictType: r.dict_type || "",
    label: r.label || "",
    value: r.value || "",
    sort: Number(r.sort) || 0,
    status: r.status === "0" ? "ACTIVE" : "DISABLED",
    colorType: r.color_type || null,
    remark: r.remark || null,
  }))

  const content = `// Auto-generated\nexport const SEED_DICT_DATA = ${JSON.stringify(output, null, 2)}\n`
  fs.writeFileSync(path.join(OUTPUT_DIR, "dict-data.seed.ts"), content)
  console.log(`[DICT_DATA] 写入 seed-output/dict-data.seed.ts`)
}

// === 提取部门 ===
function extractDepts() {
  const rows = extractInserts("system_dept")
  const active = rows.filter((r) => r.deleted === false || r.deleted === "0")
  console.log(`[DEPT] 提取 ${active.length} 条部门`)

  const output = active.map((r) => ({
    id: String(r.id),
    name: r.name || "",
    parentId: r.parent_id && r.parent_id !== "0" ? String(r.parent_id) : null,
    sort: Number(r.sort) || 0,
    leaderId: r.leader_user_id ? String(r.leader_user_id) : null,
    phone: r.phone || null,
    email: r.email || null,
    status: r.status === "0" ? "ACTIVE" : "DISABLED",
  }))

  const content = `// Auto-generated\nexport const SEED_DEPTS = ${JSON.stringify(output, null, 2)}\n`
  fs.writeFileSync(path.join(OUTPUT_DIR, "depts.seed.ts"), content)
  console.log(`[DEPT] 写入 seed-output/depts.seed.ts`)
}

// === 提取岗位 ===
function extractPosts() {
  const rows = extractInserts("system_post")
  const active = rows.filter((r) => r.deleted === false || r.deleted === "0")
  console.log(`[POST] 提取 ${active.length} 条岗位`)

  const output = active.map((r) => ({
    id: String(r.id),
    name: r.name || "",
    code: r.code || "",
    sort: Number(r.sort) || 0,
    status: r.status === "0" ? "ACTIVE" : "DISABLED",
    remark: r.remark || null,
  }))

  const content = `// Auto-generated\nexport const SEED_POSTS = ${JSON.stringify(output, null, 2)}\n`
  fs.writeFileSync(path.join(OUTPUT_DIR, "posts.seed.ts"), content)
  console.log(`[POST] 写入 seed-output/posts.seed.ts`)
}

// === Main ===
console.log("=== 从 cooliebase-vue-pro SQL 提取种子数据 ===\n")
extractMenus()
extractTenantPackages()
extractDictTypes()
extractDictData()
extractDepts()
extractPosts()
console.log("\n✅ 提取完成，输出目录:", OUTPUT_DIR)
console.log("下一步：将 seed-output/*.seed.ts 中的数据导入到各 Repository 的 MEMORY_STORE")
