#!/usr/bin/env node
/**
 * 运营动作 runner（agent-device 风格: **走接口，不开浏览器**）。
 *
 * 读 Agent 契约执行动作 —— 契约由 codegen 随代码产出，所以新域**天然**可被运营。
 *
 * 用法:
 *   node scripts/agent/run-ops.cjs health                     # 全量体检（所有契约的 list 接口）
 *   node scripts/agent/run-ops.cjs mes.MesCalHoliday health   # 单实体体检
 *   node scripts/agent/run-ops.cjs mes.MesCalHoliday seed-sample
 *   node scripts/agent/run-ops.cjs mes.MesCalHoliday purge-sample
 *   node scripts/agent/run-ops.cjs list                       # 列出可用动作
 *
 * 环境变量:
 *   COOLIEBASE_AGENT_BASE_URL   默认 http://localhost:3200
 *   COOLIEBASE_AGENT_USERNAME   默认 admin
 *   COOLIEBASE_AGENT_PASSWORD   必填（不设则跳过鉴权，适合公开接口）
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..", "..")
const REGISTRY = path.join(ROOT, "docs", "agent", "contracts.json")

const baseUrl = (process.env.COOLIEBASE_AGENT_BASE_URL || "http://localhost:3200").replace(/\/$/, "")
const username = process.env.COOLIEBASE_AGENT_USERNAME || "admin"
const password = process.env.COOLIEBASE_AGENT_PASSWORD || ""

function loadRegistry() {
  if (!fs.existsSync(REGISTRY)) {
    console.error("契约注册表不存在，请先运行: node scripts/agent/collect-contracts.cjs")
    process.exit(2)
  }
  return JSON.parse(fs.readFileSync(REGISTRY, "utf8"))
}

/**
 * 预检: 运营轨跑的是**真实接口**，所以应用必须在跑。
 * 裸 `fetch failed` 对使用者毫无信息（实测踩到）—— 这里直接说清"没在跑"和"怎么起"。
 */
async function preflight() {
  try {
    await fetch(baseUrl, { method: "GET" })
  } catch (error) {
    console.error(
      `[agent:ops] 连不上应用 ${baseUrl}\n` +
        `  运营轨跑的是真实接口，需要应用在运行。先 \`pnpm run dev\`，或设置 COOLIEBASE_AGENT_BASE_URL。\n` +
        `  原始错误: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exit(2)
  }
}

async function login() {
  if (!password) return null
  const response = await fetch(`${baseUrl}/api/v1/admin/system/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) throw new Error(`登录失败: HTTP ${response.status}`)
  const payload = await response.json()
  const token = payload?.data?.token
  if (!token) throw new Error(`登录响应里没有 data.token: ${JSON.stringify(payload).slice(0, 200)}`)
  return token
}

function headers(token) {
  const result = { "Content-Type": "application/json" }
  if (token) result.Authorization = `Bearer ${token}`
  return result
}

/** 展开契约里的接口地址（`$VAR` 换成环境变量/默认值）。 */
function apiUrl(contract, opPath, query) {
  const url = new URL(`${baseUrl}${contract.api.pluginMount}${opPath}`)
  for (const [key, value] of Object.entries(query || {})) url.searchParams.set(key, String(value))
  return url.toString()
}

/** 按契约的字段声明造一条合法样例（必填字段给类型合适的值）。 */
function samplePayload(contract) {
  const payload = {}
  for (const field of contract.accessibility.fields) {
    if (!field.required) continue
    payload[field.name] = field.type === "number" ? 1 : field.type === "boolean" ? true : `${contract.kebab}-agent-sample`
  }
  return payload
}

/** 三个标准动作。返回 { ok, detail }。 */
async function runOp(contract, op, token) {
  const { kebab } = contract
  if (op === "health") {
    const response = await fetch(apiUrl(contract, contract.api.methods.list.path, { page: 1, pageSize: 1 }), { headers: headers(token) })
    const body = await response.json().catch(() => null)
    const ok = response.ok && body?.success !== false
    // 返回结构断言: 契约承诺 items/total，实际不符就是契约漂移
    const shape = body?.data?.data ?? body?.data
    const shapeOk = !ok || (shape && Array.isArray(shape.items) && typeof shape.total === "number")
    return { ok: ok && shapeOk, detail: ok ? (shapeOk ? `HTTP ${response.status} items=${shape.items.length} total=${shape.total}` : `返回结构不符契约: ${JSON.stringify(body).slice(0, 160)}`) : `HTTP ${response.status} ${JSON.stringify(body).slice(0, 160)}` }
  }

  if (op === "seed-sample") {
    const payload = samplePayload(contract)
    const response = await fetch(apiUrl(contract, contract.api.methods.create.path), {
      method: contract.api.methods.create.http,
      headers: headers(token),
      body: JSON.stringify(payload),
    })
    const body = await response.json().catch(() => null)
    const created = body?.data?.data ?? body?.data
    const id = created?.id ?? created?.data?.id ?? body?.data?.id
    return { ok: response.ok && !!id, detail: response.ok ? `已创建 id=${id ?? "(未返回 id)"}` : `HTTP ${response.status} ${JSON.stringify(body).slice(0, 200)}` }
  }

  if (op === "purge-sample") {
    // 只清本契约造的样例: 先按样例标识查，再逐条删（不做"删全表"这种危险动作）
    const listUrl = apiUrl(contract, contract.api.methods.list.path, { page: 1, pageSize: 50 })
    const listed = await (await fetch(listUrl, { headers: headers(token) })).json().catch(() => null)
    const shape = listed?.data?.data ?? listed?.data
    const items = Array.isArray(shape?.items) ? shape.items : []
    const marker = `${contract.kebab}-agent-sample`
    const targets = items.filter((item) => Object.values(item).includes(marker) || String(item.name ?? "") === marker || String(item.subject ?? "") === marker)
    let removed = 0
    for (const item of targets) {
      if (!item.id) continue
      const response = await fetch(apiUrl(contract, `${contract.api.methods.delete.path.replace(":id", item.id)}`), {
        method: contract.api.methods.delete.http,
        headers: headers(token),
      })
      if (response.ok) removed++
    }
    return { ok: true, detail: `扫描 ${items.length} 条，命中样例 ${targets.length} 条，已删 ${removed} 条` }
  }

  return { ok: false, detail: `未知动作: ${op}` }
}

async function main() {
  const [target, op = "health"] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"))
  await preflight()
  const registry = loadRegistry()

  if (target === "list" || (!target && !op)) {
    console.log("可用动作: health | seed-sample | purge-sample\n")
    for (const item of registry.domains) console.log(`  ${item.domain}: ${item.count} 个实体`)
    return
  }

  const targets = target === "health"
    ? registry.contracts
    : registry.contracts.filter((contract) => `${contract.domain}.${contract.entity}` === target || contract.kebab === target)

  if (targets.length === 0) {
    console.error(`找不到契约: ${target}（用 list 看可选项）`)
    process.exit(2)
  }

  const token = await login()
  let failed = 0
  for (const contract of targets) {
    const label = `${contract.domain}.${contract.entity}`
    try {
      const result = await runOp(contract, target === "health" ? "health" : op, token)
      if (!result.ok) failed++
      console.log(`  ${result.ok ? "✓" : "✗"} ${label} ${op === "health" ? "health" : op} — ${result.detail}`)
      if (targets.length > 1 && !result.ok) console.log(`    ↑ 契约: ${contract.__source}`)
    } catch (error) {
      failed++
      console.log(`  ✗ ${label} ${op} — ${error.message}`)
    }
  }
  if (failed > 0) {
    console.error(`\n[agent:ops] ${failed}/${targets.length} 失败`)
    process.exit(1)
  }
  console.log(`\n[agent:ops] ${targets.length} 项全部通过`)
}

main().catch((error) => {
  console.error(`[agent:ops] ${error.message}`)
  process.exit(1)
})
