#!/usr/bin/env node
/**
 * 路由校验覆盖门禁（棘轮）—— AGENTS §4.1「禁止绕过 Validator 直连 Service」。
 *
 * 为什么需要：全仓 855 个「写路由且读 body」的路由里，**794 个没有调用任何校验器**
 * （`const body = await request.json()` 之后直接 `Service.create(body)`）。
 * 内存回退不校验任何约束，所以裸传 body 在测试里几乎不会暴露；真实库上则表现为
 * 约束错误（NOT NULL / 类型 / 长度）**在 Service 深处抛出**，而不是在边界被拦下。
 *
 * **棘轮语义**：既有欠债冻结在基线里（冻结 ≠ 已修），**只拦新增**。
 * 新增一个裸传 body 的写路由会直接失败。
 *
 * **与 RSK-011 的先后关系（重要）**：那批校验器自身存在「元数据 vs Zod 类型」漂移
 * （`npm run validator:reachability` 显示 780 处目前不可达 —— 恰恰因为路由没在调它们）。
 * 因此**补接线必须与对齐校验器同时做**，否则接线的一瞬间就把漂移变成真实缺陷。
 *
 * 用法:
 *   node scripts/check-route-validation.cjs            # 门禁（棘轮，只拦新增）
 *   node scripts/check-route-validation.cjs --audit    # 全量盘点（report-only）
 *   node scripts/check-route-validation.cjs --write-baseline
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const BASELINE = path.join(ROOT, "docs", "architecture", "artifacts", "route-validation-baseline.json")
const PARSE = /\.(?:safe)?[Pp]arse\(/

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue
      walk(full, out)
    } else if (entry.name === "route.ts") {
      out.push(full)
    }
  }
  return out
}

/** 扫描全部路由，返回「写 + 读 body + 无校验」的违规项 */
function scan() {
  const roots = [
    path.join(ROOT, "packages", "plugins"),
    path.join(ROOT, "src", "app", "api"),
  ]
  const violations = []
  let total = 0
  let compliant = 0

  for (const root of roots) {
    for (const file of walk(root)) {
      const source = fs.readFileSync(file, "utf8")
      const methods = new Set(
        [...source.matchAll(/export (?:const|async function) (GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]),
      )
      const writes = ["POST", "PUT", "PATCH", "DELETE"].filter((method) => methods.has(method))
      if (writes.length === 0) continue
      const readsBody = /\.json\(\)/.test(source)
      if (!readsBody) continue
      total += 1
      const relative = path.relative(ROOT, file)
      if (PARSE.test(source)) {
        compliant += 1
      } else {
        const domain = relative.match(/plugin-([a-z]+)\//)?.[1] ?? (relative.startsWith("src/") ? "src" : "?")
        violations.push({ id: relative, domain, methods: writes })
      }
    }
  }
  violations.sort((a, b) => (a.id < b.id ? -1 : 1))
  return { violations, total, compliant }
}

function main() {
  const audit = process.argv.includes("--audit")
  const writeBaseline = process.argv.includes("--write-baseline")
  const { violations, total, compliant } = scan()

  const byDomain = {}
  for (const item of violations) byDomain[item.domain] = (byDomain[item.domain] ?? 0) + 1

  if (writeBaseline) {
    const payload = {
      note:
        "AGENTS §4.1「禁止绕过 Validator 直连 Service」的既有欠债冻结名单（冻结 ≠ 已修）。" +
        "只拦新增：不在此名单里的裸传路由会直接失败。补接线时必须**同时**对齐该域的校验器，" +
        "否则接线瞬间会把 RSK-011 的类型漂移变成真实缺陷（见 npm run validator:reachability）。",
      frozenAt: new Date().toISOString().slice(0, 10),
      totalWriteRoutes: total,
      violations: violations.map((item) => item.id),
    }
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true })
    fs.writeFileSync(BASELINE, `${JSON.stringify(payload, null, 2)}\n`)
    console.log(`[route-validation] 基线已写入: ${payload.violations.length} 条（写路由共 ${total}）`)
    return
  }

  if (audit) {
    console.log(`[route-validation] 审计: 写且读 body 的路由 ${total}，其中已接校验器 ${compliant}、裸传 ${violations.length}`)
    console.log(`[route-validation] 裸传按域: ${JSON.stringify(byDomain)}`)
    return
  }

  if (!fs.existsSync(BASELINE)) {
    console.error(
      "[route-validation] FAIL: 缺少基线文件。请先跑 `node scripts/check-route-validation.cjs --write-baseline`" +
        "并**人工复核**冻结名单（fail-loud，不做静默放行）。",
    )
    process.exit(1)
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"))
  const frozen = new Set(baseline.violations ?? [])
  const added = violations.filter((item) => !frozen.has(item.id))
  const fixed = [...frozen].filter((id) => !violations.some((item) => item.id === id))

  if (added.length > 0) {
    console.error(
      `[route-validation] FAIL: 新增 ${added.length} 个「绕过 Validator 直连 Service」的写路由（§4.1）\n`,
    )
    for (const item of added) console.error(`  ${item.id}  [${item.methods.join(", ")}]`)
    console.error(
      "\n修法: 在路由里接上本资源的 Zod schema，例如\n" +
        "  const body = await request.json()\n" +
        "  const data = xxxCreateSchema.parse(body)   // 不要把裸 body 直传 Service\n" +
        "注意（顺序）: 接线前先跑 `npm run validator:reachability` 对齐该域校验器的字段类型，\n" +
        "否则接线会把 RSK-011 的类型漂移变成真实缺陷。\n",
    )
    process.exit(1)
  }

  console.log(
    `[route-validation] PASS: 无新增裸传写路由（写且读 body 共 ${total}，已接校验器 ${compliant}，` +
      `冻结欠债 ${violations.length}）`,
  )
  if (fixed.length > 0) {
    console.log(`[route-validation] 提示: ${fixed.length} 条已修复，可跑 --write-baseline 收紧棘轮`)
  }
}

main()
