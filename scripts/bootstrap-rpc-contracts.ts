/**
 * 一次性把**已有 catalog 条目**反向生成为 `contract/rpc-contract.ts`（声明即代码）。
 *
 * 为什么用"反向生成"而不是手写: 手写 16 个域、几十个方法，必然抄错。
 * 反向生成保证**逐字等价**，然后用 `generate-rpc-actions.ts` 再跑一遍，
 * 比对 catalog 是否**完全不变** —— 变了一行都算迁移有问题。
 *
 * 之后 `rpc-actions.json` 就是派生物，加方法只需改这个声明文件。
 *
 * 用法: pnpm exec tsx scripts/bootstrap-rpc-contracts.ts [--write]
 */
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(__dirname, "..")
const write = process.argv.includes("--write")
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/shared/backend/constants/rpc-actions.json"), "utf8")) as {
  domains: Record<string, { actions: Array<Record<string, unknown>> }>
}

function domainDir(domain: string): string | null {
  for (const root of ["packages/plugins", "packages/domains"]) {
    const candidate = path.join(ROOT, root, root.endsWith("plugins") ? `plugin-${domain}` : domain)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

let created = 0
for (const [domain, entry] of Object.entries(catalog.domains)) {
  const already = Object.keys(catalog.domains).length // 占位，逐域判断见下
  void already
  const dir = domainDir(domain)
  if (!dir) { console.log(`  ${domain}: 找不到目录，跳过`); continue }
  const target = path.join(dir, "contract", "rpc-contract.ts")
  if (fs.existsSync(target)) { console.log(`  ${domain}: 已有契约声明，跳过`); continue }

  const lines = entry.actions.map((action) => {
    const method = String(action.method)
    const parts: string[] = []
    if (action.service) parts.push(`service: ${JSON.stringify(action.service)}`)
    if (action.module) parts.push(`module: ${JSON.stringify(action.module)}`)
    if (action.target && action.target !== method) parts.push(`target: ${JSON.stringify(action.target)}`)
    if (action.schema) parts.push(`schema: ${JSON.stringify(action.schema)}`)
    if (action.fieldsRef) parts.push(`fieldsRef: ${JSON.stringify(action.fieldsRef)}`)
    return `  ${method}: { ${parts.join(", ")} },`
  })

  const content = `/**
 * ${domain} 域的跨域 RPC 契约（**代码**，由 scripts/bootstrap-rpc-contracts.ts 从既有 catalog 反向生成）。
 *
 * 之后 \`rpc-actions.json\` 是**派生物** —— 加方法请改这里，再跑
 * \`pnpm exec tsx scripts/generate-rpc-actions.ts --write\`（门禁 \`rpc:actions:check\` 会拦漂移）。
 */
import { defineRpcContract } from "@/modules/shared/backend/lib/rpc-contract"

export const ${domain.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_RPC_CONTRACT = defineRpcContract(${JSON.stringify(domain)}, {
${lines.join("\n")}
})
`
  if (write) {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  created += 1
}
console.log(`  ${write ? "已生成" : "可生成"} ${created} 个域的契约声明`)
