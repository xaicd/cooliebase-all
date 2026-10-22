#!/usr/bin/env node
/**
 * 契约治理机检（§21 API 契约第一 · §22 四类契约族）
 *
 * 背景：AGENTS §21/§22 此前**只有散文** —— 既没有 rule 文件回引，也没有任何可执行机制。
 * 本仓自己的规矩是「新增规范条款时必须同时给出机检规则或说明为何只能人工判断；
 * **禁止口头规范**」。而"说明为何只能人工判断"这条出口已被收紧：**不能靠人工判断**。
 * 于是这里的做法是：给每条能落到产物上的要求写一个**会失败**的检查。
 *
 * ## §21 检查（契约必须是"可执行的行为契约"，不是装饰）
 *  1. `api.methods.*.path` 拼上 `api.bffMount` 后，必须落在该域 manifest 的 `publicPrefixes` 之内
 *     —— 否则契约描述的是一个**不存在的端点**（照它调必然 404）
 *  2. `permissionPrefix` 必须在 `permissions.ts` 里有对应权限码
 *     —— 否则契约声明的权限是**编造的**（绑不上任何 RBAC 判定）
 *
 * ## §22 检查（预案契约 = Runbook 必须可执行）
 *  每个活跃规格的 `runbook.json` 必须有**非空**的 `steps` 与 `rollback`
 *  —— 空 steps 的 runbook 不是预案，是占位符（"骨架不算完成"）。
 *
 * 用法：
 *   node scripts/check-contract-governance.cjs            # 检查，违规即 exit 1
 *   node scripts/check-contract-governance.cjs --audit    # 打印覆盖统计
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const PLUGIN_ROOT = "packages/plugins"

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"))
}

function walk(dir, predicate, out = []) {
  const abs = path.join(ROOT, dir)
  if (!fs.existsSync(abs)) return out
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
    const rel = path.posix.join(dir, entry.name)
    if (entry.isDirectory()) walk(rel, predicate, out)
    else if (predicate(entry.name)) out.push(rel)
  }
  return out
}

// ── 真源 ────────────────────────────────────────────────────────────
function permittedPrefixes() {
  const byDomain = new Map()
  const manifests = walk(PLUGIN_ROOT, (n) => n === "plugin.manifest.json")
  for (const rel of manifests) {
    const m = readJson(rel)
    const domain = (m.domain && m.domain.name) || (m.id || "").replace(/^cooliebase\./, "")
    const prefixes = (m.domain && m.domain.publicPrefixes) || []
    if (domain && prefixes.length) byDomain.set(domain, prefixes)
  }
  return byDomain
}

function declaredPermissionCodes() {
  const rel = "packages/shared/backend/constants/permissions.ts"
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) throw new Error(`真源缺失: ${rel}`)
  const src = fs.readFileSync(abs, "utf8")
  const codes = new Set()
  for (const m of src.matchAll(/:\s*"([a-z0-9-]+(?::[a-z0-9-]+)+)"/g)) codes.add(m[1])
  if (codes.size === 0) throw new Error(`${rel} 解析出 0 个权限码（解析可能已失效）`)
  return codes
}

function main() {
  const audit = process.argv.includes("--audit")
  const violations = []
  let prefixes, codes
  try {
    prefixes = permittedPrefixes()
    codes = declaredPermissionCodes()
  } catch (error) {
    console.error(`[contract-governance] ✗ ${error.message}`)
    process.exit(1)
  }
  if (prefixes.size === 0) {
    console.error("[contract-governance] ✗ 没有解析到任何域的 publicPrefixes（真源缺失，拒绝静默通过）")
    process.exit(1)
  }

  // ── §21 ─────────────────────────────────────────────────────────
  const contracts = walk(PLUGIN_ROOT, (n) => n.endsWith(".agent.json"))
  let pathChecked = 0
  let permChecked = 0
  for (const rel of contracts) {
    const c = readJson(rel)
    const domain = c.domain
    const allowed = prefixes.get(domain)
    const mount = c.api && c.api.bffMount
    const methods = (c.api && c.api.methods) || {}

    for (const [name, def] of Object.entries(methods)) {
      const p = def && def.path
      if (!p) continue
      pathChecked += 1
      if (!p.startsWith("/")) {
        violations.push(`${rel}: api.methods.${name}.path "${p}" 不是绝对路径，无法拼上 bffMount`)
        continue
      }
      if (!allowed) {
        violations.push(`${rel}: 域 "${domain}" 在插件 manifest 中没有 publicPrefixes —— 契约挂在没有对外前缀的域上`)
        continue
      }
      const full = `${mount || ""}${p}`
      const ok = allowed.some((pre) => full.startsWith(pre)) || allowed.some((pre) => `${mount}${p}`.startsWith(pre))
      if (!ok) {
        violations.push(
          `${rel}: api.methods.${name} 拼出的路径 "${full}" 不在域 "${domain}" 的 publicPrefixes 内（${allowed.join(", ")}）—— 照此契约调用会 404`,
        )
      }
    }

    const prefix = c.permissionPrefix
    if (prefix) {
      permChecked += 1
      const hit = [...codes].some((code) => code.startsWith(`${prefix}:`))
      if (!hit) {
        violations.push(
          `${rel}: permissionPrefix "${prefix}" 在 permissions.ts 里没有任何 "${prefix}:*" 权限码 —— 契约声明的权限绑不上 RBAC`,
        )
      }
    }
  }

  // ── §22 预案契约 ─────────────────────────────────────────────────
  const runbooks = walk("docs/specs", (n) => n === "runbook.json")
  let runbookChecked = 0
  if (runbooks.length === 0) {
    violations.push("docs/specs 下没有任何 runbook.json —— 预案契约（§22）没有任何实例，无法验证（骨架不算完成）")
  }
  for (const rel of runbooks) {
    const r = readJson(rel)
    runbookChecked += 1
    const steps = Array.isArray(r.steps) ? r.steps : []
    const rollback = Array.isArray(r.rollback) ? r.rollback : []
    if (steps.length === 0) violations.push(`${rel}: 预案契约的 steps 为空 —— 空 steps 的 runbook 不是预案`)
    if (rollback.length === 0) violations.push(`${rel}: 预案契约的 rollback 为空 —— 没有回滚路径的割接不是预案`)
  }

  if (audit) {
    console.log("[contract-governance] 覆盖统计")
    console.log(`  §21 契约份数 ${contracts.length}（路径检查 ${pathChecked} 处 / 权限前缀检查 ${permChecked} 处）`)
    console.log(`  §21 有 publicPrefixes 的域 ${prefixes.size} 个；permissions.ts 权限码 ${codes.size} 条`)
    console.log(`  §22 预案契约 runbook ${runbookChecked} 份`)
  }

  // ── 棘轮：把「权限码尚未在 permissions.ts 登记」这类**既有欠债**冻在基线里，只拦新增。
  //    它不该被 silently 通过（那是"假绿"），也不该一次性让 check 全红（那会逼出豁免）。
  const isDebt = (v) => v.includes("permissionPrefix")
  const debt = violations.filter(isDebt)
  const hard = violations.filter((v) => !isDebt(v))

  const baselineRel = "docs/architecture/artifacts/contract-governance-baseline.json"
  const baselineAbs = path.join(ROOT, baselineRel)
  // 键必须带上**权限前缀取值**，不能只用文件路径 ——
  // 否则把一个已在基线里的契约改成一个新的未登记前缀，不会产生新键、也就拦不住（实测踩到过）。
  const debtKeys = debt
    .map((v) => {
      const file = v.split(": ")[0].replace(/^packages\/plugins\//, "")
      const prefix = (v.match(/permissionPrefix "([^"]+)"/) || [])[1] || "?"
      return `${file} -> ${prefix}`
    })
    .sort()

  if (process.argv.includes("--write-baseline")) {
    fs.mkdirSync(path.dirname(baselineAbs), { recursive: true })
    fs.writeFileSync(
      baselineAbs,
      JSON.stringify(
        {
          note: "「契约声明的 permissionPrefix 在 permissions.ts 里没有对应权限码」的既有欠债。只拦新增。",
          tier: "ratchet",
          count: debtKeys.length,
          entries: debtKeys,
        },
        null,
        2,
      ) + "\n",
    )
    console.log(`[contract-governance] ✓ 已写基线 ${baselineRel}（${debtKeys.length} 条欠债）`)
    return
  }

  let frozen = []
  if (fs.existsSync(baselineAbs)) frozen = JSON.parse(fs.readFileSync(baselineAbs, "utf8")).entries || []
  const frozenSet = new Set(frozen)
  const newDebt = debtKeys.filter((k) => !frozenSet.has(k))

  if (audit) {
    console.log(`  §21 权限码欠债（基线）${frozen.length} 条 · 本次新增 ${newDebt.length} 条`)
  }

  if (hard.length || newDebt.length) {
    console.error("")
    if (hard.length) {
      console.error(`[contract-governance] ✗ ${hard.length} 处硬性违规（路径/预案契约）：`)
      for (const v of hard.slice(0, 20)) console.error(`  · ${v}`)
    }
    if (newDebt.length) {
      console.error(`[contract-governance] ✗ 新增 ${newDebt.length} 处权限码欠债（基线 ${frozen.length} 条）：`)
      for (const v of newDebt.slice(0, 20)) console.error(`  · ${v}`)
      console.error("  修法：在 permissions.ts 登记该权限码，或确认后跑 --write-baseline 收紧棘轮")
    }
    process.exit(1)
  }

  console.log(
    `[contract-governance] ✓ §21 契约 ${contracts.length} 份（路径 ${pathChecked} 处 / 权限前缀 ${permChecked} 处）与 §22 预案 ${runbookChecked} 份，全部合规`,
  )
}

main()
