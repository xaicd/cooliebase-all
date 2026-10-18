/**
 * inject-seed-to-repositories.cjs
 * 
 * 读取 scripts/seed-output/*.seed.ts 中的种子数据，
 * 生成 packages/shared/backend/seed-data/ 下的 TypeScript 文件，
 * 各 Repository 通过 import 引用这些种子数据初始化 MEMORY_STORE。
 * 
 * Usage: node scripts/inject-seed-to-repositories.cjs
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SEED_DIR = path.join(ROOT, 'scripts', 'seed-output')
const OUT_DIR = path.join(ROOT, 'packages', 'shared', 'backend', 'seed-data')

// Ensure output dir
fs.mkdirSync(OUT_DIR, { recursive: true })

const TS = '2026-01-01T00:00:00.000Z'

// ============ POSTS ============
function generatePosts() {
  const raw = require(path.join(SEED_DIR, 'posts.seed.ts').replace('.ts', '.cjs'))
  // We'll eval the TS as JS since it's simple JSON
}

// Actually, the seed files are TypeScript with `export const ...`. 
// We'll parse them as text and extract the JSON array.

function extractArray(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  // Find the array start
  const match = content.match(/=\s*(\[[\s\S]*\])/)
  if (!match) throw new Error(`Cannot extract array from ${filePath}`)
  // Use eval safely (these are trusted auto-generated files)
  const arr = eval(`(${match[1]})`)
  return arr
}

// ============ POSTS ============
function genPosts() {
  const data = extractArray(path.join(SEED_DIR, 'posts.seed.ts'))
  const rows = data.map(p => ({
    id: String(p.id),
    name: p.name,
    code: p.code,
    sort: p.sort,
    status: p.status,
    remark: p.remark || null,
    createdAt: TS,
    updatedAt: TS,
  }))
  
  const out = `// Auto-generated from seed-output/posts.seed.ts
import type { SystemPostRow } from "@/modules/system/backend/repositories/post.repository"

export const SEED_POSTS: SystemPostRow[] = ${JSON.stringify(rows, null, 2)}
`
  fs.writeFileSync(path.join(OUT_DIR, 'posts.seed-data.ts'), out)
  console.log(`✅ posts.seed-data.ts (${rows.length} rows)`)
}

// ============ DEPTS ============
function genDepts() {
  const data = extractArray(path.join(SEED_DIR, 'depts.seed.ts'))
  const rows = data.map(d => ({
    id: String(d.id),
    name: d.name,
    parentId: d.parentId ? String(d.parentId) : null,
    sort: d.sort,
    leaderId: d.leaderId ? String(d.leaderId) : null,
    phone: d.phone || null,
    email: d.email || null,
    status: d.status,
    tenantId: "1",
    createdAt: TS,
    updatedAt: TS,
  }))
  
  const out = `// Auto-generated from seed-output/depts.seed.ts
import type { SystemDeptRow } from "@/modules/system/backend/repositories/dept.repository"

export const SEED_DEPTS: SystemDeptRow[] = ${JSON.stringify(rows, null, 2)}
`
  fs.writeFileSync(path.join(OUT_DIR, 'depts.seed-data.ts'), out)
  console.log(`✅ depts.seed-data.ts (${rows.length} rows)`)
}

// ============ MENUS ============
function genMenus() {
  const data = extractArray(path.join(SEED_DIR, 'menus.seed.ts'))
  const rows = data.map(m => ({
    id: String(m.id),
    name: m.name,
    permission: m.permission || null,
    type: m.type, // DIR | MENU | BUTTON
    parentId: m.parentId ? String(m.parentId) : null,
    path: m.path || null,
    component: m.component || null,
    icon: m.icon || null,
    sort: m.sort,
    status: m.status,
    // CoolieBase convention: visible=false in SQL means "shown", visible=true means "hidden"
    // In our repo, visible=true means "shown" - so we negate
    visible: !m.visible,
    keepAlive: m.keepAlive || false,
    createdAt: TS,
    updatedAt: TS,
  }))
  
  const out = `// Auto-generated from seed-output/menus.seed.ts
// ${rows.length} menus extracted from cooliebase-vue-pro SQL
import type { SystemMenuRow } from "@/modules/system/backend/repositories/menu.repository"

export const SEED_MENUS: SystemMenuRow[] = ${JSON.stringify(rows, null, 2)}
`
  fs.writeFileSync(path.join(OUT_DIR, 'menus.seed-data.ts'), out)
  console.log(`✅ menus.seed-data.ts (${rows.length} rows)`)
}

// ============ DICT TYPES ============
function genDictTypes() {
  const data = extractArray(path.join(SEED_DIR, 'dict-types.seed.ts'))
  const rows = data.map(t => ({
    id: String(t.id),
    name: t.name,
    type: t.type,
    status: t.status,
    remark: t.remark || null,
    createdAt: TS,
    updatedAt: TS,
  }))
  
  const out = `// Auto-generated from seed-output/dict-types.seed.ts
import type { SystemDictTypeRow } from "@/modules/system/backend/repositories/dict.repository"

export const SEED_DICT_TYPES: SystemDictTypeRow[] = ${JSON.stringify(rows, null, 2)}
`
  fs.writeFileSync(path.join(OUT_DIR, 'dict-types.seed-data.ts'), out)
  console.log(`✅ dict-types.seed-data.ts (${rows.length} rows)`)
}

// ============ DICT DATA ============
function genDictData() {
  const data = extractArray(path.join(SEED_DIR, 'dict-data.seed.ts'))
  // dict-data uses dictType (string code) but repository uses dictTypeId (FK)
  // We need to map dictType -> dictTypeId using dict-types
  const types = extractArray(path.join(SEED_DIR, 'dict-types.seed.ts'))
  const typeMap = new Map() // type code -> id
  types.forEach(t => typeMap.set(t.type, String(t.id)))
  
  const rows = data.map(d => ({
    id: String(d.id),
    dictTypeId: typeMap.get(d.dictType) || d.dictType, // fallback to code if not found
    label: d.label,
    value: d.value,
    sort: d.sort,
    status: d.status,
    colorType: d.colorType || null,
    remark: d.remark || null,
    createdAt: TS,
    updatedAt: TS,
  }))
  
  // Report unmapped
  const unmapped = rows.filter(r => !typeMap.has(data.find(d => String(d.id) === r.id)?.dictType))
  if (unmapped.length > 0) {
    console.warn(`  ⚠️ ${unmapped.length} dict-data entries have unmapped dictType`)
  }
  
  const out = `// Auto-generated from seed-output/dict-data.seed.ts
import type { SystemDictDataRow } from "@/modules/system/backend/repositories/dict.repository"

export const SEED_DICT_DATA: SystemDictDataRow[] = ${JSON.stringify(rows, null, 2)}
`
  fs.writeFileSync(path.join(OUT_DIR, 'dict-data.seed-data.ts'), out)
  console.log(`✅ dict-data.seed-data.ts (${rows.length} rows)`)
}

// ============ INDEX ============
function genIndex() {
  const out = `// Seed data barrel export
export { SEED_POSTS } from "./posts.seed-data"
export { SEED_DEPTS } from "./depts.seed-data"
export { SEED_MENUS } from "./menus.seed-data"
export { SEED_DICT_TYPES } from "./dict-types.seed-data"
export { SEED_DICT_DATA } from "./dict-data.seed-data"
`
  fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), out)
  console.log(`✅ index.ts`)
}

// ============ RUN ============
console.log('🚀 Generating seed-data modules...\n')
genPosts()
genDepts()
genMenus()
genDictTypes()
genDictData()
genIndex()
console.log('\n✅ All seed-data generated in packages/shared/backend/seed-data/')
console.log('\nNext: update repositories to import from seed-data.')
