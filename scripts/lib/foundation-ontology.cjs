/**
 * Foundation 本体扫描：从真实代码计算基础设施能力的 fanIn(被 import 计数) 与 state，
 * 与 domain-catalog.json layers.foundation.capabilities[] 对账。
 *
 * - fanIn：src/ 下 import 该能力目录/文件的 .ts/.tsx 文件数（排除测试、排除能力自身目录）。
 * - state：fanIn>0 → "load-bearing"（已承重，改=破坏性）；fanIn===0 → "provisioned"（就绪待接入）。
 * - dependents：具体被依赖文件相对路径（去重排序，最多保留 dependentsMax 条 + 溢出计数）。
 *
 * 用法：
 *   writeOntology()  —— 把最新 fanIn/state/dependents 回写 catalog（进化时刷新）。
 *   checkOntology()  —— 只对账不写；返回 { ok, drifts }（门禁用）。
 *
 * 真源勿手改 fanIn/state/dependents：改代码后跑 pnpm run foundation:ontology 刷新。
 */
const fs = require("fs")
const path = require("path")
const { ROOT, CATALOG_PATH, loadCatalog } = require("./domain-catalog.cjs")

// 扫描根：应用层在 src/，各域与 shared 已迁到 packages/（见 pnpm-workspace.yaml）。
// 只扫 src/ 会让 domain 侧的消费方全部漏掉 —— 实测表现为所有能力 fanIn 掉到 0。
const SCAN_DIRS = [path.join(ROOT, "src"), path.join(ROOT, "packages")]
const DEPENDENTS_MAX = 12

/** 递归收集 src 下所有 .ts/.tsx（排除测试与声明文件），返回 {relPosix, text}。 */
function collectSourceFiles() {
  const out = []
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        if (name === "__tests__" || name === "node_modules") continue
        walk(full)
      } else if (/\.tsx?$/.test(name) && !/\.d\.ts$/.test(name) && !/\.test\.tsx?$/.test(name)) {
        out.push({ full, rel: path.relative(ROOT, full).replace(/\\/g, "/"), text: fs.readFileSync(full, "utf8") })
      }
    }
  }
  for (const dir of SCAN_DIRS) walk(dir)
  return out
}

/** 能力目标标识：去掉扩展名的 repo 相对路径（不含 src/ 前缀差异），用于精确比对 import 目标。 */
function capabilityKey(capDir) {
  // "packages/shared/backend/lib/cache"        → "packages/shared/backend/lib/cache"
  // "packages/shared/backend/lib/domain-log.ts" → "packages/shared/backend/lib/domain-log"
  return capDir.replace(/\\/g, "/").replace(/\.tsx?$/, "")
}

/** 判断某源文件是否属于该能力自身（自引不算扇入）。 */
function isSelf(fileRelNoExt, capKey) {
  return fileRelNoExt === capKey || fileRelNoExt.startsWith(capKey + "/")
}

/** 从源码文本提取所有 import/require/export-from 的模块 specifier。 */
function extractSpecifiers(text) {
  const specs = []
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g, // import ... from "x" / export ... from "x"
    /\brequire\(\s*["']([^"']+)["']\s*\)/g, // require("x")
    /\bimport\(\s*["']([^"']+)["']\s*\)/g, // dynamic import("x")
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(text))) specs.push(m[1])
  }
  return specs
}

/** 把一个 import specifier 解析为 repo 相对(无扩展名)路径；无法解析则返回 null。 */
function resolveSpecifier(spec, fromFileFull) {
  let resolvedRel
  if (spec.startsWith("@/")) {
    // 别名 @/ → src/
    resolvedRel = path.join("src", spec.slice(2))
  } else if (spec.startsWith("./") || spec.startsWith("../")) {
    // 相对路径：相对当前文件目录解析（覆盖 lib 内部 ./event-bus 这类）
    const abs = path.resolve(path.dirname(fromFileFull), spec)
    resolvedRel = path.relative(ROOT, abs)
  } else {
    return null // 裸包名(node_modules)，与本体能力无关
  }
  return resolvedRel.replace(/\\/g, "/").replace(/\.tsx?$/, "")
}

/** 计算单个能力的真实扇入：精确解析每个源文件的 import 目标，命中能力目录/文件即计入。 */
function computeFanIn(files, cap) {
  const capKey = capabilityKey(cap.dir)
  const dependents = []
  for (const f of files) {
    const fileNoExt = f.rel.replace(/\.tsx?$/, "")
    if (isSelf(fileNoExt, capKey)) continue
    const specs = extractSpecifiers(f.text)
    let hit = false
    for (const spec of specs) {
      const target = resolveSpecifier(spec, f.full)
      if (!target) continue
      // 命中：import 目标等于能力 key，或位于能力目录下（barrel/子文件）
      if (target === capKey || target.startsWith(capKey + "/")) {
        hit = true
        break
      }
    }
    if (hit) dependents.push(f.rel)
  }
  const unique = Array.from(new Set(dependents)).sort()
  return { fanIn: unique.length, dependents: unique }
}

/** fanIn → state。 */
function deriveState(fanIn) {
  return fanIn > 0 ? "load-bearing" : "provisioned"
}

/** 计算全部能力的最新本体度量（不写文件）。 */
function computeOntology() {
  const catalog = loadCatalog()
  const caps = catalog?.layers?.foundation?.capabilities
  if (!Array.isArray(caps)) {
    throw new Error("domain-catalog.json 缺少 layers.foundation.capabilities[]，无法扫描本体。")
  }
  const files = collectSourceFiles()
  const measured = caps.map((cap) => {
    const { fanIn, dependents } = computeFanIn(files, cap)
    const trimmed = dependents.slice(0, DEPENDENTS_MAX)
    if (dependents.length > DEPENDENTS_MAX) trimmed.push(`…(+${dependents.length - DEPENDENTS_MAX} more)`)
    return { id: cap.id, tier: cap.tier, fanIn, state: deriveState(fanIn), dependents: trimmed, _cap: cap }
  })
  return { catalog, caps, measured }
}

/** 对账：比较 catalog 现值与实测值，返回漂移列表。 */
function checkOntology() {
  const { measured } = computeOntology()
  const drifts = []
  for (const m of measured) {
    const cur = m._cap
    if (Number(cur.fanIn) !== m.fanIn) {
      drifts.push({ id: m.id, field: "fanIn", from: cur.fanIn, to: m.fanIn })
    }
    if (String(cur.state) !== m.state) {
      drifts.push({ id: m.id, field: "state", from: cur.state, to: m.state, hint: m.state === "load-bearing" ? "已被接入，应跃迁为 load-bearing 并更新 fanIn/dependents" : "消费方已移除，回落 provisioned" })
    }
  }
  return { ok: drifts.length === 0, drifts, measured }
}

/** 回写：把最新 fanIn/state/dependents 写回 catalog（保留其余人工字段：contract/swappable/stability/changeRisk）。 */
function writeOntology() {
  const { catalog, caps, measured } = computeOntology()
  const byId = new Map(measured.map((m) => [m.id, m]))
  for (const cap of caps) {
    const m = byId.get(cap.id)
    if (!m) continue
    cap.fanIn = m.fanIn
    cap.state = m.state
    cap.dependents = m.dependents
  }
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n", "utf8")
  return { updated: caps.length, rel: path.relative(ROOT, CATALOG_PATH).replace(/\\/g, "/") }
}

module.exports = { computeOntology, checkOntology, writeOntology, deriveState, DEPENDENTS_MAX }
