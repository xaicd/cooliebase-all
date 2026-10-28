#!/usr/bin/env node
/**
 * `write:path:depth:check` —— 触及写链路的规格，必须**声明**深度测试。
 *
 * ## 它检查什么（以及**不**检查什么）
 *
 * ✅ 检查**声明**：规格的 `brief.json` 里若任务触及「写路由」或「表单页」，
 *    则 acceptance 必须有一条**深度测试**类声明，否则失败。
 * ❌ **不**检查测试是否真的写了 —— 本仓目前没有可跑的 E2E 基建
 *    （`test/e2e/admin-flow.spec.ts` 只有 2 个 `status<500` 占位）。
 *    这条边界写在这里，是为了**不把它吹成"深度测试门禁"**。
 *
 * ## 判据
 *
 * 「触及写链路」= 任一任务的 `files` 命中：
 *   · `** / routes /** / route.ts`（写路由，需同时含 POST/PUT/PATCH/DELETE 才计入）
 *   · `** / frontend/pages /** / *.page.tsx`（表单页，需含 form/onSubmit 才计入）
 *
 * 「声明了深度测试」= acceptance[].check 命中下列任一标记（大小写不敏感）：
 *   `E2E` / `真实` / `落库` / `数据库` / `对抗` / `API 拦截`
 *   或 brief 顶层写了非空的 `depthTestExempt`（豁免理由）。
 *
 * ## 棘轮
 *
 * 存量规格（历史遗留，brief 里没有这些声明）冻结在
 * `docs/architecture/artifacts/write-path-depth-baseline.json`，**只减不增**。
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const BASELINE_REL = "docs/architecture/artifacts/write-path-depth-baseline.json"
const BASELINE = path.join(ROOT, BASELINE_REL)

const DEPTH_MARKERS = /(E2E|真实|落库|数据库|对抗|API 拦截)/i

function listSpecs() {
  const base = path.join(ROOT, "docs", "specs")
  const out = []
  if (!fs.existsSync(base)) return out
  for (const domain of fs.readdirSync(base)) {
    const dir = path.join(base, domain)
    if (!fs.statSync(dir).isDirectory()) continue
    for (const name of fs.readdirSync(dir)) {
      const brief = path.join(dir, name, "brief.json")
      if (fs.existsSync(brief)) out.push({ domain, name, brief })
    }
  }
  return out
}

/** 该文件算不算「写链路」 */
function isWritePath(rel) {
  if (!rel) return false
  if (/routes\/.*route\.ts$/.test(rel)) return true
  if (/frontend\/pages\/.*\.page\.tsx$/.test(rel)) return true
  return false
}

/** 路由文件是否真的导出写方法（读内容确认，避免把只读路由算进去） */
function routeHasWrite(rel) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) return false
  return /export\s+(async\s+)?(function\s+)?(POST|PUT|PATCH|DELETE)\b/.test(fs.readFileSync(abs, "utf8"))
}

/** 表单页是否真的含提交动作 */
function pageHasForm(rel) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) return false
  return /(<form|onSubmit|handleSubmit)/.test(fs.readFileSync(abs, "utf8"))
}

function analyzeBrief(briefPath) {
  let brief
  try {
    brief = JSON.parse(fs.readFileSync(briefPath, "utf8"))
  } catch {
    return { ok: true, reason: "brief 解析失败（由 specs:health 负责）" }
  }
  const touchesWrite = []
  for (const t of brief.tasks || []) {
    for (const f of t.files || []) {
      if (!isWritePath(f)) continue
      if (routeHasWrite(f) || pageHasForm(f)) touchesWrite.push(`${t.id}:${f}`)
    }
  }
  if (touchesWrite.length === 0) return { ok: true }

  const accepts = (brief.acceptance || []).map((a) => String(a.check || "")).join("\n")
  const exempt = String(brief.depthTestExempt || "").trim()
  if (DEPTH_MARKERS.test(accepts) || exempt.length > 0) {
    return { ok: true, touchesWrite }
  }
  return { ok: false, touchesWrite }
}

/**
 * `--report`：**只度量、永不失败**。目的是看趋势，不是造"覆盖率达标"的假象。
 */
function report() {
  const count = (dir, filter) => {
    let n = 0
    const walk = (d) => {
      if (!fs.existsSync(d)) return
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name)
        if (e.isDirectory()) walk(full)
        else if (filter(e.name)) n++
      }
    }
    walk(dir)
    return n
  }
  const writeRoutes = count(path.join(ROOT, "src/app/api"), (n) => n === "route.ts") +
    count(path.join(ROOT, "packages"), (n) => n === "route.ts")
  const e2eDir = path.join(ROOT, "test/e2e")
  const e2eFiles = count(e2eDir, (n) => n.endsWith(".spec.ts"))
  let e2eTests = 0
  let deepTests = 0
  let gatedTests = 0
  const walkE2E = (d) => {
    if (!fs.existsSync(d)) return
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walkE2E(full)
      else if (e.name.endsWith(".spec.ts")) {
        const src = fs.readFileSync(full, "utf8")
        const tests = (src.match(/\btest\s*\(/g) || []).length
        e2eTests += tests
        // **条件 skip 的用例不计入深度覆盖** —— 否则"写了但默认不跑"会被算成覆盖率，
        // 那是假绿（本仓明令禁止）。实测：模板文件 `test.skip(!ENABLED)` 就是这种。
        const isGated = /test\.skip\(\s*!/.test(src)
        if (isGated) {
          gatedTests += tests
          continue
        }
        const isDeep = /waitForResponse|request\.(get|post|put|delete)|toBe\(\d{3}\)/.test(src)
        if (isDeep) deepTests += tests
      }
    }
  }
  walkE2E(e2eDir)
  console.log("[write-path-depth] E2E 深度度量（report-only，永不失败）")
  console.log(`  写路由（route.ts）总数      : ${writeRoutes}`)
  console.log(`  E2E 文件 / 用例数          : ${e2eFiles} / ${e2eTests}`)
  console.log(`  含真实 API 断言且会跑的用例 : ${deepTests}`)
  console.log(`  条件 skip（不计入覆盖）      : ${gatedTests}`)
  console.log(`  写路由 : 深度用例           = ${writeRoutes} : ${deepTests}`)
  console.log("")
  console.log("  说明：这个数字不是「覆盖率」。本仓写链路 E2E 覆盖 ≈ 0，")
  console.log("        本度量用于观察它是否在增长，不作为发布门槛。")
  return 0
}

function main() {
  if (process.argv.includes("--report")) return report()
  const writeBaseline = process.argv.includes("--write-baseline")
  const specs = listSpecs()
  if (specs.length === 0) {
    console.error("[write-path-depth] ✗ 解析出 0 个规格 —— 扫描面失效，不允许静默通过")
    process.exit(1)
  }

  const violations = []
  for (const s of specs) {
    const r = analyzeBrief(s.brief)
    if (!r.ok) violations.push({ spec: s.name, touchesWrite: r.touchesWrite })
  }

  if (writeBaseline) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true })
    fs.writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          note: "触及写链路但未声明深度测试的规格（棘轮：只减不增）。收紧：pnpm run write:path:depth:baseline",
          specs: violations.map((v) => v.spec).sort(),
        },
        null,
        2,
      ) + "\n",
    )
    console.log(`[write-path-depth] 已写入 ${BASELINE_REL}（${violations.length} 个规格）`)
    return 0
  }

  if (!fs.existsSync(BASELINE)) {
    console.error(`[write-path-depth] ✗ 缺少基线 ${BASELINE_REL}（不允许"找不到基线 ⇒ 静默通过"）`)
    console.error("  生成：pnpm run write:path:depth:baseline")
    return 1
  }
  const accepted = new Set(JSON.parse(fs.readFileSync(BASELINE, "utf8")).specs || [])
  const newOnes = violations.filter((v) => !accepted.has(v.spec))

  console.log(`[write-path-depth] 扫描 ${specs.length} 个规格；触及写链路但未声明深度测试的 ${violations.length} 个（基线 ${accepted.size} 个）`)

  if (newOnes.length === 0) {
    console.log("[write-path-depth] ✓ 无新增未声明深度测试的规格")
    return 0
  }

  console.error("")
  console.error(`[write-path-depth] ✗ ${newOnes.length} 个规格触及写链路，但没声明深度测试：`)
  for (const v of newOnes) {
    console.error(`  · ${v.spec}`)
    for (const t of v.touchesWrite.slice(0, 3)) console.error(`      触及：${t}`)
  }
  console.error("")
  console.error("  在 brief.json 的 acceptance 里加一条，至少包含其一：")
  console.error("    「正向：真实账户写库 → 断言落库流水」")
  console.error("    「对抗：越权/竞态 → 4xx 拦截 + 弹窗自愈」")
  console.error("    含 E2E / 真实 / 落库 / 数据库 / 对抗 / API 拦截 任一标记")
  console.error("  确实不需要时，在 brief.json 顶层写 depthTestExempt: \"<理由>\"")
  console.error("")
  console.error("  注意：本门禁只校验**声明**，不证明测试真写了 —— 后者靠 test/e2e 的深度度量观察。")
  return 1
}

if (require.main === module) process.exit(main())
module.exports = { listSpecs, isWritePath, analyzeBrief, DEPTH_MARKERS }
