#!/usr/bin/env node
/**
 * 层B 活体本体门禁（G8）—— docs/ontology 是唯一真源，本脚本把它变成机检。
 *
 * 为什么需要：`docs/ontology/README.md` 一直写着 `node scripts/ontology-gate.mjs`，
 * 但这个脚本**从未被提交**（悬空引用）—— 于是"实体可回指 / 动词不悬空"两条硬约束
 * 只靠人记，本体里的臆造条目无人拦。本脚本补上 G8-1/G8-2/G8-3 三项检查。
 *
 * 检查项：
 *   G8-1 实体可回指：M1_Objects 的每个实体键必须能在真实代码目录找到来源
 *        （packages/domains/*、packages/plugins/*、apps/*），禁止臆造。
 *   G8-2 动词不悬空：M_ActionTypes 的每个动词必须回指真实实体；
 *        若声明了 `http`（"METHOD /path"），则该路由文件必须真实存在并导出该动词。
 *   G8-3 零软链：docs/ontology 下不得有软链（README 硬约束 1）。
 *
 * 用法: node scripts/ontology-gate.mjs
 * 退出码: 0 = PASS；1 = 有违规。
 */
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
const ONTOLOGY_DIR = path.join(ROOT, "docs", "ontology")
const ONTOLOGY_YAML = path.join(ONTOLOGY_DIR, "ontology.yaml")

const ALLOWED_VERBS = new Set(["list", "get", "create", "update", "delete", "read", "archive", "publish"])
const SOURCE_ROOTS = ["packages/domains", "packages/plugins", "apps"]

const violations = []

/** 逐行解析 "  - key: \"x\"" 形式的列表项；值统一按双引号/裸量去除引号。 */
function parseListItems(source, sectionName) {
  const lines = source.split("\n")
  const start = lines.findIndex((line) => new RegExp(`^${sectionName}:\\s*$`).test(line))
  if (start < 0) return []
  const items = []
  let current = null
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (/^[A-Za-z_]/.test(line)) break // 下一个顶层键
    const itemStart = /^\s{2}-\s+([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (itemStart) {
      if (current) items.push(current)
      current = { [itemStart[1]]: unquote(itemStart[2]) }
      continue
    }
    const prop = /^\s{4}([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (prop && current) current[prop[1]] = unquote(prop[2])
  }
  if (current) items.push(current)
  return items
}

function unquote(value) {
  const trimmed = (value ?? "").trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function collectSymlinks(dir) {
  const found = []
  if (!fs.existsSync(dir)) return found
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) found.push(path.relative(ROOT, full))
    else if (entry.isDirectory()) found.push(...collectSymlinks(full))
  }
  return found
}

function resolveEntitySource(item) {
  const candidates = []
  if (item.source) candidates.push(item.source)
  if (item.domain) {
    candidates.push(`packages/domains/${item.domain}`, `packages/plugins/plugin-${item.domain}`)
  }
  for (const candidate of candidates) {
    const normalized = candidate.replace(/\/+$/, "")
    if (!SOURCE_ROOTS.some((root) => normalized === root || normalized.startsWith(`${root}/`))) continue
    if (fs.existsSync(path.join(ROOT, normalized))) return normalized
  }
  return null
}

function routeFileFor(httpPath) {
  const [method, target] = httpPath.trim().split(/\s+/)
  if (!method || !target) return { error: `http "${httpPath}" 不是 "METHOD /path" 形式` }
  const segments = target.split("?")[0].split("/").filter(Boolean)
  if (segments[0] !== "api" || segments[1] !== "v1") return { error: `http 路径 "${target}" 不以 /api/v1 开头` }
  const surface = segments[2]
  const domain = segments[3]
  const rest = segments.slice(4).map((segment) => segment.replace(/^\{(.+)\}$/, "[$1]"))
  if (!["admin", "app", "open"].includes(surface) || !domain) return { error: `http 路径 "${target}" 缺少 surface/域段` }
  const bases = [
    `packages/plugins/plugin-${domain}/routes/${surface}`,
    `packages/domains/${domain}/routes/${surface}`,
    "src/app/api/v1",
  ]
  for (const base of bases) {
    const rel = base.startsWith("src/")
      ? path.join(base, ...segments.slice(2), "route.ts")
      : path.join(base, ...rest, "route.ts")
    const abs = path.join(ROOT, rel)
    if (fs.existsSync(abs)) {
      const body = fs.readFileSync(abs, "utf8")
      if (new RegExp(`export\\s+(?:const|async\\s+function|function)\\s+${method}\\b`).test(body)) {
        return { method, rel: rel.replace(/\\/g, "/") }
      }
      return { error: `route 文件 ${rel} 未导出 ${method}（动词悬空）` }
    }
  }
  return { error: `找不到承载 "${method} ${target}" 的 route 文件（动词悬空）` }
}

function main() {
  if (!fs.existsSync(ONTOLOGY_YAML)) {
    console.error(`[ontology-gate] ✗ 缺少真源 ${path.relative(ROOT, ONTOLOGY_YAML)}`)
    process.exit(1)
  }
  const yaml = fs.readFileSync(ONTOLOGY_YAML, "utf8")
  const objects = parseListItems(yaml, "M1_Objects")
  const actions = parseListItems(yaml, "M_ActionTypes")

  // G8-1 实体可回指
  const entityKeys = new Set()
  for (const object of objects) {
    if (!object.key) {
      violations.push("M1_Objects 存在缺少 key 的实体")
      continue
    }
    entityKeys.add(object.key)
    const source = resolveEntitySource(object)
    if (!source) {
      violations.push(`G8-1 实体 "${object.key}" 无法回指真实代码目录（source=${object.source ?? "(未声明)"}）`)
    }
  }

  // G8-2 动词不悬空
  let httpChecked = 0
  for (const action of actions) {
    if (!action.key) {
      violations.push("M_ActionTypes 存在缺少 key 的动词")
      continue
    }
    if (!action.object || !entityKeys.has(action.object)) {
      violations.push(`G8-2 动词 "${action.key}" 的 object="${action.object ?? ""}" 不在 M1_Objects 中（悬空）`)
    }
    if (!action.verb || !ALLOWED_VERBS.has(action.verb)) {
      violations.push(`G8-2 动词 "${action.key}" 的 verb="${action.verb ?? ""}" 不在允许集内`)
    }
    if (action.http) {
      httpChecked += 1
      const resolved = routeFileFor(action.http)
      if (resolved.error) violations.push(`G8-2 动词 "${action.key}" —— ${resolved.error}`)
    }
  }

  // G8-3 零软链
  for (const link of collectSymlinks(ONTOLOGY_DIR)) violations.push(`G8-3 软链不允许存在于本体真源内: ${link}`)

  if (violations.length > 0) {
    console.error(`[ontology-gate] ✗ 本体门禁未通过：${violations.length} 处违规`)
    for (const violation of violations) console.error(`  - ${violation}`)
    process.exit(1)
  }

  console.log(
    `[ontology-gate] PASS: 实体 ${objects.length} 个（全部可回指）/ 动词 ${actions.length} 个（object 全部命中，`
    + `${httpChecked} 个声明 http 的动词已回指真实 route）/ 本体目录零软链`,
  )
}

main()
