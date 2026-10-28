#!/usr/bin/env node
/**
 * `write:path:depth:check` —— 触及写链路的规格，必须**声明**深度测试。
 *
 * ## 它检查什么（以及**不**检查什么）
 *
 * ✅ 检查**声明**：规格的 `brief.json` 里若任务触及「写路由」或「表单页」，
 *    则 acceptance 必须有一条**深度测试**类声明，否则失败。
 * ✅ **检查证据**（2026-10-28 升级）：`brief.depthTestFiles` 列出的测试文件必须
 *    **真的存在于磁盘**、含 `test(...)`，且**不是带 skip 的空壳模板**
 *    （带 `test.skip(!…)` 却**不真发请求**——就是 `write-path.sample.spec.ts` 那种）。
 *
 *    为什么判据这么窄：实测踩过一次误报 —— 会员写链路用例里写的是
 *    `test.skip(!up, "服务不可达")`（**运行时存活守卫**），它**真跑**（2 passed）。
 *    用「出现 `test.skip(!` 就拒」会把真证据判成模板。静态判不出"会不会跑"，
 *    就只拒**可判定**的空壳，不为了一条好看的规则去冤枉真用例。
 * ❌ **仍不**检查「测试是否覆盖了那条写路由」：这需要逐路由的覆盖映射，
 *    本门禁给不出，不假装给得出。它保证的是**证据存在且会跑**，不是**覆盖充分**。
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
/** 「已声明深度测试、但还没有结构化证据」的存量规格（棘轮：只减不增）。 */
const EVIDENCE_BASELINE_REL = "docs/architecture/artifacts/write-path-depth-evidence-baseline.json"
const EVIDENCE_BASELINE = path.join(ROOT, EVIDENCE_BASELINE_REL)

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
  if (!DEPTH_MARKERS.test(accepts) && exempt.length === 0) {
    return { ok: false, touchesWrite, evidence: "n/a" }
  }

  // ── 证据判定：声明了就要拿得出文件，且那个文件得会跑
  const files = Array.isArray(brief.depthTestFiles) ? brief.depthTestFiles.map(String) : []
  if (files.length === 0) return { ok: true, touchesWrite, evidence: "missing" }

  for (const rel of files) {
    const abs = path.join(ROOT, rel)
    if (!fs.existsSync(abs)) {
      return { ok: true, touchesWrite, evidence: "bad", detail: `${rel} 不存在` }
    }
    const src = fs.readFileSync(abs, "utf8")
    if (!/\btest\s*\(/.test(src)) {
      return { ok: true, touchesWrite, evidence: "bad", detail: `${rel} 里没有 test(...) 用例` }
    }
    // **只拒「可判定的空壳」**：既不真发请求、又带 skip 条件的文件 —— 那就是
    // `write-path.sample.spec.ts` 那种"写了但默认不跑"的模板。
    //
    // 不拒什么：`test.skip(!up, "服务不可达")` 这类**运行时存活守卫**。
    // 实测踩过：会员写链路用例正是这样写的，它**真跑**（2 passed），
    // 用「出现 test.skip(! 就拒」会把真证据误判成模板。
    const makesRealCalls = /(request\.(get|post|put|patch|delete)|waitForResponse|fetch\()/.test(src)
    const hasSkipGate = /test\.skip\(\s*!|describe\.skip\(/.test(src)
    if (hasSkipGate && !makesRealCalls) {
      return { ok: true, touchesWrite, evidence: "bad", detail: `${rel} 是带 skip 的空壳模板（不真发请求），不会跑` }
    }
  }
  return { ok: true, touchesWrite, evidence: "ok", detail: files.join(", ") }
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
  const noEvidence = [] // 声明了，但还没有结构化证据（depthTestFiles）
  const badEvidence = [] // 声明了，证据却不存在 / 不会跑
  for (const s of specs) {
    const r = analyzeBrief(s.brief)
    if (!r.ok) violations.push({ spec: s.name, touchesWrite: r.touchesWrite })
    else if (r.evidence === "missing") noEvidence.push(s.name)
    else if (r.evidence === "bad") badEvidence.push({ spec: s.name, detail: r.detail })
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
    fs.writeFileSync(
      EVIDENCE_BASELINE,
      JSON.stringify(
        {
          note: "已声明深度测试、但还没给出结构化证据（depthTestFiles）的存量规格（棘轮：只减不增）。收紧：pnpm run write:path:depth:baseline",
          specs: noEvidence.sort(),
        },
        null,
        2,
      ) + "\n",
    )
    console.log(`[write-path-depth] 已写入 ${EVIDENCE_BASELINE_REL}（${noEvidence.length} 个规格）`)
    return 0
  }

  if (!fs.existsSync(BASELINE)) {
    console.error(`[write-path-depth] ✗ 缺少基线 ${BASELINE_REL}（不允许"找不到基线 ⇒ 静默通过"）`)
    console.error("  生成：pnpm run write:path:depth:baseline")
    return 1
  }
  if (!fs.existsSync(EVIDENCE_BASELINE)) {
    console.error(`[write-path-depth] ✗ 缺少证据基线 ${EVIDENCE_BASELINE_REL}（不允许"找不到基线 ⇒ 静默通过"）`)
    console.error("  生成：pnpm run write:path:depth:baseline")
    return 1
  }
  const accepted = new Set(JSON.parse(fs.readFileSync(BASELINE, "utf8")).specs || [])
  const acceptedNoEvidence = new Set(JSON.parse(fs.readFileSync(EVIDENCE_BASELINE, "utf8")).specs || [])
  const newNoEvidence = noEvidence.filter((s) => !acceptedNoEvidence.has(s))
  const newOnes = violations.filter((v) => !accepted.has(v.spec))

  console.log(
    `[write-path-depth] 扫描 ${specs.length} 个规格；未声明深度测试的 ${violations.length} 个（基线 ${accepted.size} 个）；` +
      `已声明但无结构化证据的 ${noEvidence.length} 个（基线 ${acceptedNoEvidence.size} 个）；证据无效的 ${badEvidence.length} 个`,
  )

  // **证据无效 = 直接失败**（enforce）：写了路径却不存在、或文件是默认 skip 的模板 ——
  // 这正是"假绿"的两种长相，不设基线、不冻结。
  if (badEvidence.length > 0) {
    console.error("")
    console.error(`[write-path-depth] ✗ ${badEvidence.length} 个规格声明的深度测试证据无效：`)
    for (const b of badEvidence) console.error(`  · ${b.spec}：${b.detail}`)
    console.error("")
    console.error("  depthTestFiles 必须是**真实存在、且会真跑**的测试文件：")
    console.error("    · 文件不存在 → 写对路径；")
    console.error("    · 默认 skip 的模板（test.skip(!…)）→ 换成真用例，或先别声明。")
    return 1
  }

  if (newNoEvidence.length > 0) {
    console.error("")
    console.error(`[write-path-depth] ✗ ${newNoEvidence.length} 个规格声明了深度测试，但没给结构化证据：`)
    for (const s of newNoEvidence) console.error(`  · ${s}`)
    console.error("")
    console.error('  在 brief.json 顶层写 depthTestFiles: ["test/e2e/xxx.spec.ts"]（真实存在的用例文件）。')
    return 1
  }

  if (newOnes.length === 0) {
    console.log("[write-path-depth] ✓ 无新增未声明深度测试的规格，且新增规格都带结构化证据")
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
  console.error("  注意：本门禁校验「声明 + 证据存在且会跑」；它**不**证明覆盖了那条具体写路由。")
  return 1
}

if (require.main === module) process.exit(main())
module.exports = { listSpecs, isWritePath, analyzeBrief, DEPTH_MARKERS }
