import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const PLATFORM_DOMAINS = new Set(["system", "infra"])

const domainBase = (domain: string) =>
  PLATFORM_DOMAINS.has(domain) ? `packages/domains/${domain}` : `packages/plugins/plugin-${domain}`

type Contract = {
  file: string
  domain: string
  resource: string
  methods: Record<string, { http: string; path: string }>
}

/** 收集所有采用「标准 5 方法 CRUD」的契约（排除 definitions / page-schema 这类定制资源）。 */
function standardContracts(): Contract[] {
  const out: Contract[] = []
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith(".agent.json")) {
        const contract = JSON.parse(fs.readFileSync(full, "utf8"))
        const methods = (contract.api?.methods ?? {}) as Record<string, { http: string; path: string }>
        const names = Object.keys(methods).sort().join(",")
        if (names !== "create,delete,get,list,update") continue
        if (!contract.domain || !contract.api?.resource) continue
        out.push({
          file: path.relative(ROOT, full).split(path.sep).join("/"),
          domain: contract.domain,
          resource: contract.api.resource,
          methods,
        })
      }
    }
  }
  walk(path.join(ROOT, "packages"))
  return out
}

/**
 * 生成式 CRUD 路由的**形状一致性**（静态，覆盖全部标准资源）。
 *
 * 为什么要有这一层：本仓此前**从不测路由层**，导致两个系统性缺陷长期全绿 ——
 *   ① 路由写成 `Service.update({ ...body, id })`（服务签名是 `(id, data)`）→ 更新必抛错；
 *   ② 客户端打集合路径 `PUT /resource` / `DELETE /resource?id=`，而路由只在 `/[id]` 上实现 → 405。
 * 这里把「契约声明的 5 个方法」与「路由文件实际导出的 HTTP 方法」逐一对齐，
 * 并把 PUT 的调用形态钉死为 `(id, …)`。
 */
describe("生成式 CRUD 路由形状（覆盖全部标准资源）", () => {
  const contracts = standardContracts()

  it("至少覆盖 300 个资源（防止选择器失效后空转）", () => {
    expect(contracts.length).toBeGreaterThan(300)
  })

  it("逐资源：集合路由导出 GET/POST，item 路由导出 GET/PUT/DELETE", () => {
    const problems: string[] = []
    for (const contract of contracts) {
      const base = `${domainBase(contract.domain)}/routes/admin/${contract.resource}`
      const collection = path.join(ROOT, base, "route.ts")
      const item = path.join(ROOT, base, "[id]", "route.ts")

      if (!fs.existsSync(collection)) {
        problems.push(`${contract.file}: 缺集合路由 ${base}/route.ts`)
        continue
      }
      const collectionBody = fs.readFileSync(collection, "utf8")
      for (const verb of ["GET", "POST"]) {
        if (!new RegExp(`export\\s+(async\\s+function|const)\\s+${verb}\\b`).test(collectionBody)) {
          problems.push(`${base}/route.ts: 未导出 ${verb}`)
        }
      }

      // 契约里只要声明了 item 级方法，就必须有 item 路由
      const hasItem = Object.values(contract.methods).some((method) => method.path.includes(":"))
      if (!hasItem) continue
      if (!fs.existsSync(item)) {
        problems.push(`${contract.file}: 缺 item 路由 ${base}/[id]/route.ts`)
        continue
      }
      const itemBody = fs.readFileSync(item, "utf8")
      for (const verb of ["GET", "PUT", "DELETE"]) {
        if (!new RegExp(`export\\s+(async\\s+function|const)\\s+${verb}\\b`).test(itemBody)) {
          problems.push(`${base}/[id]/route.ts: 未导出 ${verb}`)
        }
      }
      // PUT 必须是 (id, data) —— 单对象首参会让服务抛错（实证过）。
      // **仅对生成式路由**成立：平台域的定制路由用 `withAdminRoute` + `parseActionBody`，
      // 其服务签名本就是单对象（如 `SystemUserService.update(input)`）—— 断言它们会误报。
      const isGeneratedShape = !itemBody.includes("withAdminRoute")
      if (isGeneratedShape && !/\bupdate\(\s*id\s*,/.test(itemBody)) {
        problems.push(`${base}/[id]/route.ts: PUT 未按 (id, data) 调用 Service.update`)
      }
    }
    expect(problems.slice(0, 20)).toEqual([])
    expect(problems).toHaveLength(0)
  })
})
