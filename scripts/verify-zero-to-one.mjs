#!/usr/bin/env node
/**
 * `verify:zero-to-one` —— 层B 交付物的**从 0 到 1 可重复验证**（一条命令，失败即非 0）。
 *
 * 为什么要有它：本轮之前的验证全是**人肉一次性**的（起库、迁移、种子、登记、逐页点、逐接口打），
 * 所以"到底行不行"只能靠我口头结论。掌柜要求「重复从 0-1 的验证测试，确保成功」——
 * 那就把它固化成脚本，任何人任何时候跑同一条命令，得到同一个机器裁决。
 *
 * 它验证什么（全部是**物理真值**，不看文档声明）：
 *   1. 契约 list 接口：`docs/agent/contracts.json` 里每份契约的 `methods.list`
 *      → 期望 **200**（按 `pluginMount` 实打）
 *   2. 管理页外壳：`admin-nav.generated.ts` 里的每个路由 → 期望 **200**
 *   3. 插件挂载点健康：插件 API 不得 5xx
 *   4. 写路径校验（**只报告不判定**）：create 传空对象的结果分布 —— 201 说明"必填没校验"，
 *      400 是正确校验，5xx 是处理器/约束问题。它是一条**待收敛的账**，不是本次失败判据。
 *
 * 前置（脚本不代劳，避免把"谁来起库"也藏进来）：
 *   - 嵌入式 PG：`pnpm run db:embedded`
 *   - 迁移/种子/插件登记：见 `docs/gotchas/layerb-deliverable-verification-path.md`
 *   - 应用已起：`env -u NODE_ENV -u PORT npx next dev -p <port>`（**必须清掉 NODE_ENV**）
 *
 * 用法：
 *   BASE_URL=http://localhost:8080/t4-ad808ad1 \
 *   ADMIN_USERNAME=supervip ADMIN_PASSWORD='Test@SuperVip2026!' \
 *   node scripts/verify-zero-to-one.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const BASE = (process.env.BASE_URL || "http://localhost:8080/t4-ad808ad1").replace(/\/+$/, "")
const USERNAME = process.env.ADMIN_USERNAME || "supervip"
const PASSWORD = process.env.ADMIN_PASSWORD || "Test@SuperVip2026!"

const results = []
function record(group, name, ok, detail) {
  results.push({ group, name, ok, detail })
}
function summarize() {
  const total = results.length
  const failed = results.filter((r) => !r.ok)
  console.log("\n================ 0→1 验证结果 ================")
  for (const group of [...new Set(results.map((r) => r.group))]) {
    const rows = results.filter((r) => r.group === group)
    const bad = rows.filter((r) => !r.ok)
    console.log(`${bad.length === 0 ? "✅" : "❌"} ${group}: ${rows.length - bad.length}/${rows.length}`)
    for (const row of bad.slice(0, 10)) console.log(`     · ${row.name} → ${row.detail}`)
    if (bad.length > 10) console.log(`     · …另有 ${bad.length - 10} 条`)
  }
  console.log(`\n合计 ${total - failed.length}/${total} 通过`)
  if (failed.length) {
    console.error(`\n❌ [FAIL] ${failed.length} 项未通过`)
    return 1
  }
  console.log("\n🎉 [PASS] 0→1 全链路绿")
  return 0
}

async function login() {
  const res = await fetch(`${BASE}/api/v1/admin/system/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`登录失败 HTTP ${res.status}`)
  const json = await res.json()
  const token = json?.data?.token
  if (!token) throw new Error("登录未返回 token")
  return token
}

function readContracts() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "docs/agent/contracts.json"), "utf8")).contracts ?? []
}

function readNavHrefs() {
  const file = path.join(ROOT, "packages/shared/contract/admin-nav.generated.ts")
  if (!fs.existsSync(file)) return []
  const text = fs.readFileSync(file, "utf8")
  return [...new Set([...text.matchAll(/href: "(\/admin\/[^"]+)"/g)].map((m) => m[1]))]
}

async function main() {
  const startedAt = Date.now()
  const token = await login()
  const auth = { Authorization: `Bearer ${token}` }
  record("登录", "管理员登录", true, "ok")

  // 1. 契约 list 接口
  const contracts = readContracts()
  const listTargets = contracts.filter((c) => c?.api?.methods?.list?.path)
  for (const c of listTargets) {
    const mount = c.api.pluginMount || c.api.bffMount
    const url = `${BASE}${mount}${c.api.methods.list.path}?page=1&pageSize=1`
    let status = 0
    try {
      status = (await fetch(url, { headers: auth })).status
    } catch (error) {
      status = `ERR ${error?.message ?? error}`
    }
    record("契约 list 接口", `${c.domain}/${c.entity}`, status === 200, `HTTP ${status}`)
  }

  // 2. 管理页外壳
  const hrefs = readNavHrefs()
  for (const href of hrefs) {
    const url = `${BASE}${href}`
    let status = 0
    try {
      status = (await fetch(url, { headers: auth })).status
    } catch (error) {
      status = `ERR ${error?.message ?? error}`
    }
    record("管理页外壳", href, status === 200, `HTTP ${status}`)
  }

  // 3. 写路径校验（只报告，不参与判定 —— 这是一条待收敛的账）
  const createTargets = contracts.filter((c) => c?.api?.methods?.create?.path)
  const createStats = {}
  for (const c of createTargets) {
    const mount = c.api.pluginMount || c.api.bffMount
    const method = c.api.methods.create.http || "POST"
    const url = `${BASE}${mount}${c.api.methods.create.path}`
    let status = 0
    try {
      status = (
        await fetch(url, {
          method,
          headers: { ...auth, "Content-Type": "application/json" },
          body: "{}",
        })
      ).status
    } catch (error) {
      status = `ERR`
    }
    createStats[status] = (createStats[status] || 0) + 1
    // **5xx 是真缺陷**（处理器炸了 / 违反 NOT NULL 却没被校验拦成 400）→ 判失败。
    // 201（接受了空对象）只记账：那是"必填未校验"的存量债，不在本脚本判定内。
    if (typeof status === "number" && status >= 500) {
      record("写路径 5xx", `${c.domain}/${c.entity}`, false, `HTTP ${status}`)
    } else if (status === 201) {
      record("写路径（仅记账）", `${c.domain}/${c.entity}`, true, "201 接受了空对象（必填未校验）")
    }
  }
  console.log("\n[写路径] create 传空对象的响应分布:", createStats)
  console.log("  （201=必填未校验；400=正确校验；5xx=处理器/约束问题）")
  const acceptedEmpty = results.filter((r) => r.group === "写路径（仅记账）").map((r) => r.name)
  if (acceptedEmpty.length) {
    const byDomain = {}
    for (const name of acceptedEmpty) {
      const domain = name.split("/")[0]
      byDomain[domain] = (byDomain[domain] || 0) + 1
    }
    console.log(`\n[存量债] ${acceptedEmpty.length} 个 create 仍接受空对象（按域）：`)
    console.log("  " + Object.entries(byDomain).sort((a, b) => b[1] - a[1]).map(([d, n]) => `${d}:${n}`).join("  "))
    console.log("  根因：生成校验器时的 codegen import payload 把这些 NOT NULL 列标成了 nullable；")
    console.log("        该 payload 不在本仓树内（无 codegen 表 / 无 metadata JSON），需回源重新导入后批量重生成。")
    if (process.argv.includes("--strict-create")) {
      record("写路径（严格档）", "create 必须拒绝空对象", false, `${acceptedEmpty.length} 个仍接受`)
    }
  }

  const code = summarize()
  console.log(`\n耗时 ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)
  process.exit(code)
}

main().catch((error) => {
  console.error(`❌ [FAIL] ${error?.message ?? error}`)
  process.exit(1)
})
