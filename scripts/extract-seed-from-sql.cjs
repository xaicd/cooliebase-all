/**
 * 从上游 SQL 导出文件提取种子数据，输出为 TypeScript 内存格式
 *
 * 本脚本是 **可选导入工具**，主路径不依赖它：
 * 仓库已 commit `prisma/data/menus.seed-data.ts` / `tenant-packages.seed-data.ts` 与
 * `packages/shared/backend/seed-data/`，dev/test 链路直接消费这些已提交的 seed；
 * 本脚本仅在「需要从本地 SQL dump 重生种子」时手工触发。
 *
 * 提取表：
 * - system_menu（菜单树）
 * - system_tenant_package（租户套餐及 menu_ids）
 * - system_dict_type + system_dict_data（字典）
 * - system_dept（部门树）
 * - system_post（岗位）
 *
 * 用法:
 *   # 默认无参：什么都不做，打印提示（CI / dev 走"用已 commit 的 seed"路径）
 *   node scripts/extract-seed-from-sql.cjs
 *
 *   # 手工导入：把本地上游 SQL dump 喂进来
 *   node scripts/extract-seed-from-sql.cjs --source /path/to/upstream.sql
 *
 *   # 写入产物（默认是 dry-run）
 *   node scripts/extract-seed-from-sql.cjs --source <path> --write
 *
 * 输出: scripts/seed-output/ 目录下的 .ts 文件
 */

const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const OUTPUT_DIR = path.resolve(__dirname, "seed-output")
const RUNTIME_DATA_DIR = path.resolve(__dirname, "../prisma/data")

// === CLI 参数解析 ===
const argv = process.argv.slice(2)
function cliArg(name) {
  const flag = `--${name}`
  const withEq = argv.find((a) => a.startsWith(`${flag}=`))
  if (withEq) return withEq.slice(flag.length + 1)
  const idx = argv.indexOf(flag)
  if (idx >= 0 && idx + 1 < argv.length) return argv[idx + 1]
  return null
}

const SOURCE_ARG = cliArg("source")
const SOURCE_ENV = process.env.COOLIEBASE_SEED_SOURCE_SQL
const SOURCE_FILE = SOURCE_ARG
  ? path.resolve(SOURCE_ARG)
  : (SOURCE_ENV ? path.resolve(SOURCE_ENV) : null)
const WRITE = argv.includes("--write") || argv.includes("-w")

if (!SOURCE_FILE) {
  // 默认无参：什么都不做，提示用户如何手动触发。
  // 这是 CI 与 dev 主链期望的行为——seed 已 commit，运行时不需要重生。
  console.log("ℹ️  extract-seed-from-sql: 未传 --source <path>，跳过。")
  console.log("    dev/test 默认消费已 commit 的 prisma/data/*.seed-data.ts 与 packages/shared/backend/seed-data/。")
  console.log("    如需从本地上游 SQL dump 重生种子，请显式传参：")
  console.log("      node scripts/extract-seed-from-sql.cjs --source /path/to/upstream.sql --write")
  console.log("    或设置环境变量 COOLIEBASE_SEED_SOURCE_SQL。")
  process.exit(0)
}

if (!fs.existsSync(SOURCE_FILE)) {
  console.error("❌ SQL 文件不存在:", SOURCE_FILE)
  console.error("   请确认路径，或回退到默认无参（使用已 commit 的 seed）。")
  process.exit(1)
}

let SOURCE_HASH
try {
  SOURCE_HASH = crypto.createHash("sha256").update(fs.readFileSync(SOURCE_FILE)).digest("hex")
} catch (err) {
  console.error("❌ 无法读取 SQL 文件:", err.message)
  process.exit(1)
}

if (WRITE && !fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const sql = fs.readFileSync(SOURCE_FILE, "utf-8")

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

  if (!WRITE) {
    console.log(`[MENU] (dry-run) 未写入 — 传 --write 才会落盘`)
    return
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "menus.seed.ts"), `// Auto-generated from upstream seed SQL\n// source sha256: ${SOURCE_HASH}\n// ${output.length} menus extracted\n\nexport const SEED_MENUS = ${JSON.stringify(output, null, 2)}\n`)
  fs.writeFileSync(path.join(RUNTIME_DATA_DIR, "menus.seed-data.ts"), `// Auto-generated from upstream seed SQL\n// source sha256: ${SOURCE_HASH}\n// ${output.length} active menus; do not edit manually.\nimport type { SystemMenuRow } from "@/modules/system/backend/repositories/menu.repository"\n\nexport const SEED_MENUS: SystemMenuRow[] = ${JSON.stringify(output.map((menu) => ({ ...menu, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" })), null, 2)}\n`)
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

  if (!WRITE) {
    console.log(`[TENANT_PACKAGE] (dry-run) 解析到 ${output.length} 条，未写入`)
    return
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "tenant-packages.seed.ts"), `// Auto-generated from upstream seed SQL\n// source sha256: ${SOURCE_HASH}\n\nexport const SEED_TENANT_PACKAGES = ${JSON.stringify(output, null, 2)}\n`)
  fs.writeFileSync(path.join(RUNTIME_DATA_DIR, "tenant-packages.seed-data.ts"), `// Auto-generated from upstream seed SQL\n// source sha256: ${SOURCE_HASH}\n// Tenant package menu_ids are expanded into system_tenant_package_menu at seed time.\n\nexport type TenantPackageSeed = { id: string; name: string; status: "ACTIVE" | "DISABLED"; menuIds: string[]; remark: string | null; createdAt: string; updatedAt: string }\n\nexport const SEED_TENANT_PACKAGES: TenantPackageSeed[] = ${JSON.stringify(output, null, 2)}\n`)
  console.log(`[TENANT_PACKAGE] 写入 ${output.length} 个默认套餐`)
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

  if (!WRITE) {
    console.log(`[DICT_TYPE] (dry-run) 未写入`)
    return
  }

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

  if (!WRITE) {
    console.log(`[DICT_DATA] (dry-run) 未写入`)
    return
  }

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

  if (!WRITE) {
    console.log(`[DEPT] (dry-run) 未写入`)
    return
  }

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

  if (!WRITE) {
    console.log(`[POST] (dry-run) 未写入`)
    return
  }

  const content = `// Auto-generated\nexport const SEED_POSTS = ${JSON.stringify(output, null, 2)}\n`
  fs.writeFileSync(path.join(OUTPUT_DIR, "posts.seed.ts"), content)
  console.log(`[POST] 写入 seed-output/posts.seed.ts`)
}

// === Main ===
const mode = WRITE ? "write" : "dry-run"
console.log(`=== 提取种子上游 SQL 数据（${mode} 模式） ===\n`)
console.log("source:", SOURCE_FILE)
console.log("source sha256:", SOURCE_HASH)
console.log()
extractMenus()
extractTenantPackages()
extractDictTypes()
extractDictData()
extractDepts()
extractPosts()
if (WRITE) {
  console.log("\n✅ 提取完成，输出目录:", OUTPUT_DIR)
  console.log("下一步：将 seed-output/*.seed.ts 中的数据导入到各 Repository 的 MEMORY_STORE")
} else {
  console.log("\nℹ️  dry-run 结束，未写任何文件。传 --write 落盘。")
}
