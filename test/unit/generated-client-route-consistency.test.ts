import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const PLATFORM_DOMAINS = new Set(["system", "infra"])

const domainBase = (domain: string) =>
  PLATFORM_DOMAINS.has(domain) ? `packages/domains/${domain}` : `packages/plugins/plugin-${domain}`

type Mismatch = { client: string; verb: string; url: string; reason: string }

/**
 * 比对「客户端调用」与「路由实现」：
 *   · 打 item 路径（含 `/ ${id}` 或 `data.id`）→ 必须有 `[id]/route.ts` 且导出该 HTTP 方法；
 *   · 打集合路径（裸 BASE_URL）→ 必须有 `route.ts` 且导出该方法。
 *
 * 为什么需要：第 13 轮我把 340 个客户端从「打集合路径」改成「打 item 路径」，
 * 而 **wms 的路由是旧模板生成的、只在集合路径上实现 PUT/DELETE** ——
 * 于是 16 个 wms 资源的更新/删除被我改成了 405，且**当时没有任何测试或门禁发现**。
 * 本测试就是补这一环。
 */
function findMismatches(): { checked: number; mismatches: Mismatch[] } {
  const clients: string[] = []
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith(".api.ts") && full.includes(`${path.sep}frontend${path.sep}api${path.sep}`)) {
        clients.push(full)
      }
    }
  }
  walk(path.join(ROOT, "packages"))

  let checked = 0
  const mismatches: Mismatch[] = []

  for (const file of clients) {
    const relFile = path.relative(ROOT, file).split(path.sep).join("/")
    const domain = relFile.split("/")[2].replace(/^plugin-/, "")
    const resource = path.basename(file).replace(".api.ts", "")
    const routeBase = path.join(ROOT, domainBase(domain), "routes", "admin", resource)
    const text = fs.readFileSync(file, "utf8")

    for (const match of text.matchAll(/request\.(get|post|put|delete|patch)<[^>]*>\(\s*([^,)]+)/g)) {
      const verb = match[1].toUpperCase()
      const url = match[2].trim()
      // `/base/${id}`、`/base/${data.id}` → item；含 `?` 的查询串不做路径判定
      const isItem = (url.includes("/${") && !url.includes("?")) || url.includes("data.id}")
      const routeFile = path.join(routeBase, ...(isItem ? ["[id]"] : []), "route.ts")
      checked += 1

      if (!fs.existsSync(routeFile)) {
        mismatches.push({ client: relFile, verb, url: url.slice(0, 60), reason: `缺少路由文件 ${path.relative(ROOT, routeFile)}` })
        continue
      }
      const body = fs.readFileSync(routeFile, "utf8")
      if (!new RegExp(`export\\s+(const|async\\s+function|function)\\s+${verb}\\b`).test(body)) {
        mismatches.push({
          client: relFile,
          verb,
          url: url.slice(0, 60),
          reason: `${path.relative(ROOT, routeFile)} 未导出 ${verb}`,
        })
      }
    }
  }

  return { checked, mismatches }
}

describe("客户端调用 ↔ 路由实现 一致性", () => {
  it("每个 api 客户端调用的路径与 HTTP 方法，都有真实路由文件实现", () => {
    const { checked, mismatches } = findMismatches()
    // 防检查器失效：本仓实测 2384 处调用；低于 1000 说明解析口径坏了
    expect(checked).toBeGreaterThan(1000)
    expect(mismatches.slice(0, 10)).toEqual([])
    expect(mismatches).toHaveLength(0)
  })

  it("★ 反向：把某个 item 路由的 DELETE 导出删掉 → 必须被发现", () => {
    // 这条守的是"检查器真的会 fire" —— 否则上面的绿是空的。
    const target = path.join(ROOT, "packages", "plugins", "plugin-wms", "routes", "admin", "wms-warehouse", "[id]", "route.ts")
    const original = fs.readFileSync(target, "utf8")
    try {
      fs.writeFileSync(target, original.replace(/export const DELETE/, "export const DELETE_DISABLED"))
      const { mismatches } = findMismatches()
      expect(mismatches.some((item) => item.verb === "DELETE" && item.client.includes("wms-warehouse"))).toBe(true)
    } finally {
      fs.writeFileSync(target, original)
      if (fs.readFileSync(target, "utf8") !== original) throw new Error("路由文件未逐字还原")
    }
  })
})
