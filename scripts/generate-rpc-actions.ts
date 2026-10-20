/**
 * 由各域的 `contract/rpc-contract.ts`（**代码**）生成 `rpc-actions.json`（派生物）。
 *
 * 动机（学自 yudao-cloud）: 上游把跨域契约写成 `@FeignClient` 接口 + DTO，
 * 放在提供方的 `-api` 模块 —— **编译期可检查**。本仓原先只有手工维护的 JSON，
 * 加方法忘登记、写错 module/target 都要到运行时才炸。
 *
 * 渐进迁移: 已声明契约的域 → 由契约派生；未声明的域 → 原样保留，
 * 并在输出里列出（这样"还有哪些域没改造"永远是可见的，不会烂在暗处）。
 *
 * 用法:
 *   pnpm exec tsx scripts/generate-rpc-actions.ts            # dry-run，打印统计
 *   pnpm exec tsx scripts/generate-rpc-actions.ts --write
 *   pnpm exec tsx scripts/generate-rpc-actions.ts --check    # 门禁: 是否漂移
 */
import fs from "node:fs"
import path from "node:path"

import type { RpcContract, RpcActionDeclaration } from "../packages/shared/backend/lib/rpc-contract"

const ROOT = path.resolve(__dirname, "..")
const CATALOG = path.join(ROOT, "packages/shared/backend/constants/rpc-actions.json")
const write = process.argv.includes("--write")
const check = process.argv.includes("--check")

/** 找到所有声明了契约的域。 */
function declaredContracts(): Array<{ domain: string; contract: RpcContract }> {
  const found: Array<{ domain: string; contract: RpcContract }> = []
  const roots = [path.join(ROOT, "packages/plugins"), path.join(ROOT, "packages/domains")]
  for (const root of roots) {
    if (!fs.existsSync(root)) continue
    for (const entry of fs.readdirSync(root)) {
      const file = path.join(root, entry, "contract", "rpc-contract.ts")
      if (!fs.existsSync(file)) continue
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(file) as Record<string, RpcContract>
      for (const value of Object.values(mod)) {
        if (value && typeof value === "object" && "domain" in value && "actions" in value) {
          found.push({ domain: (value as RpcContract).domain, contract: value as RpcContract })
        }
      }
    }
  }
  return found.sort((a, b) => a.domain.localeCompare(b.domain))
}

/**
 * 从 zod schema **推导** fields（原型/gRPC 生成要用）。
 *
 * 为什么不沿用 catalog 里手写的那份: 那就等于同一个事实两处维护 ——
 * 而 schema 才是唯一真源（契约里已经点名了它）。
 * zod -> { name, type, optional } 的映射与既有手写条目的形态保持一致。
 */
/**
 * 组装单条 action。
 *
 * `previous` 是同一方法在既有 catalog 里的条目 —— 用于**保留 `fields`**。
 * 为什么不在这里从 zod 推导: 试过，zod 的类型节点有包装链（`.int().positive()`），
 * 我推出来的 `quantity` 是 `string` 而不是 `int32` —— **错的类型比没有类型更危险**
 * （proto/gRPC 会跟着错）。所以先保留既有手写值，把"从 schema 可靠推导"记为待办。
 */
function toAction(method: string, declaration: RpcActionDeclaration, previous?: Record<string, unknown>) {
  const action: Record<string, unknown> = { method }
  if (declaration.service) action.service = declaration.service
  if (declaration.module) action.module = declaration.module
  if (declaration.target && declaration.target !== method) action.target = declaration.target
  if (declaration.schema) action.schema = declaration.schema
  if (declaration.fieldsRef) action.fieldsRef = declaration.fieldsRef
  // 保留既有 fields（待办: 改为从 schema 可靠推导，见函数注释）
  if (previous?.fields) action.fields = previous.fields
  return action
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8")) as {
    domains: Record<string, { actions: Array<Record<string, unknown>> }>
  }
  const declared = declaredContracts()
  const declaredDomains = new Set(declared.map((item) => item.domain))
  const notMigrated: string[] = []

  for (const [domain, entry] of Object.entries(catalog.domains)) {
    if (!declaredDomains.has(domain)) {
      notMigrated.push(domain)
      continue
    }
    const contract = declared.find((item) => item.domain === domain)!.contract
    const previousByMethod = new Map((entry.actions ?? []).map((item) => [String(item.method), item]))
    entry.actions = contract.methods.map((method) => toAction(method, contract.actions[method], previousByMethod.get(method)))
  }

  const content = JSON.stringify(catalog, null, 2) + "\n"
  console.log(`[rpc-actions] 已声明契约的域: ${declaredDomains.size}（${[...declaredDomains].join(", ")}）`)
  console.log(`[rpc-actions] 仍读手写条目: ${notMigrated.length} 个 — ${notMigrated.join(", ")}`)

  if (check) {
    if (fs.readFileSync(CATALOG, "utf8") !== content) {
      console.error("[rpc-actions] FAIL: rpc-actions.json 与契约代码不一致 —— 跑 pnpm exec tsx scripts/generate-rpc-actions.ts --write")
      process.exit(1)
    }
    console.log("[rpc-actions] PASS: 与契约代码一致")
    return
  }
  if (!write) {
    console.log("  (dry-run: 加 --write 写入)")
    return
  }
  fs.writeFileSync(CATALOG, content)
  console.log("  ✓ 已写 packages/shared/backend/constants/rpc-actions.json")
}

main()
