/**
 * 公开规格路径解析器 (Public Spec Path Resolver)
 * ============================================================================
 * 为什么有它（真实事故，不是假想）:
 *   平台对**客户工作区**执行 de-leak 清洗时，会删除「母港私有规约机文件族」
 *   （scripts/speckit.cjs、scripts/lib/spec-resolver.cjs 等，见平台
 *     server/src/services/harness-delivery-engine.ts 的 PRIVATE_SPEC_ENGINE_FILES）。
 *   而底座母本派发到客户工作区的**公开**脚本
 *   （scripts/speckit.ts、scripts/check-specs-health.cjs、scripts/verify-task-commit.cjs …）
 *   原先硬依赖 `require("./lib/spec-resolver.cjs")`
 *   ⇒ 客户工作区里整条 speckit 校验链必然 MODULE_NOT_FOUND，客户侧自证链断裂。
 *
 * 契约（本文件是**公开**资产，必须逐条守住）:
 *   1. **纯路径解析**：只做「规格包在磁盘上的位置」求解，不含任何母港本体语义
 *      （不含本体角色表 / 不含调用链引擎 / 不含商业交付项目子包扫描）。
 *   2. **不得**依赖任何会被 de-leak 清洗的文件 —— 本文件只用 node 内置模块。
 *   3. 公开脚本只许依赖本文件；`scripts/lib/spec-resolver.cjs` 属母港私有，
 *      公开脚本一律不许再 require 它。
 *   4. 新增公开脚本后，`pnpm run workspace:executability:check` 必须仍然绿
 *      （该门禁会把「公开脚本依赖了会被清洗的文件」判红）。
 *
 * 母港（Layer A）侧若需要本体语义，用母港自己的 scripts/lib/spec-resolver.cjs，
 * 两份文件互不引用、各自演化。
 */

const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "../..")

/** 读 JSON 文件；损坏/不存在返回 null（不抛 —— 调用方决定如何降级）。 */
function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    // 说明: 元数据文件可能损坏或正在被并发写入；解析失败时按「无元数据」处理，
    // 绝不让一次坏 JSON 打断整仓规格扫描。
    return null
  }
}

/** 规格包元数据文件（按优先级取第一个存在的）。 */
function readSpecMeta(dir) {
  for (const name of ["spec.json", "feature.json", "brief.json"]) {
    const meta = readJsonSafe(path.join(dir, name))
    if (meta) return meta
  }
  return {}
}

/**
 * 智能解析规格包所在物理路径 (Spec Directory Resolver)
 * 查找优先级:
 * 1. docs/specs/<domain>/<name> (推荐: 按域隔离)
 * 2. docs/specs/<any_domain>/<name> (在 docs/specs 下任意域扫描)
 * 3. docs/specs/active/<any_domain>/<name> (若启用了 active 子目录)
 * 4. docs/specs/archive/<quarter>/<domain>/<name> (若已被归档)
 * 5. docs/features/<name> (向下兼容旧版特性目录)
 *
 * @param {string} name 规格/特性名
 * @param {string} [domain] 可选所属域
 * @returns {string|null} 绝对路径，未找到返回 null
 */
function resolveSpecDir(name, domain) {
  if (!name) return null

  // 1. 若显式指定了 domain，直接检查 docs/specs/<domain>/<name>
  if (domain) {
    const directPath = path.join(ROOT, "docs", "specs", domain, name)
    if (fs.existsSync(directPath)) return directPath
  }

  // 2. 检查 docs/specs 顶级直接子目录下的域: docs/specs/<domain>/<name>
  const specsRoot = path.join(ROOT, "docs", "specs")
  if (fs.existsSync(specsRoot)) {
    const entries = fs.readdirSync(specsRoot, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "archive" && entry.name !== "active") {
        const candidate = path.join(specsRoot, entry.name, name)
        if (fs.existsSync(candidate)) return candidate
      }
    }

    // 检查 active 目录
    const activeDir = path.join(specsRoot, "active")
    if (fs.existsSync(activeDir)) {
      const activeEntries = fs.readdirSync(activeDir, { withFileTypes: true })
      for (const entry of activeEntries) {
        if (entry.isDirectory()) {
          const candidate = path.join(activeDir, entry.name, name)
          if (fs.existsSync(candidate)) return candidate
        }
      }
    }

    // 检查 archive 目录
    const archiveDir = path.join(specsRoot, "archive")
    if (fs.existsSync(archiveDir)) {
      const quarterEntries = fs.readdirSync(archiveDir, { withFileTypes: true })
      for (const qEntry of quarterEntries) {
        if (!qEntry.isDirectory()) continue
        const domainDir = path.join(archiveDir, qEntry.name)
        const domainEntries = fs.readdirSync(domainDir, { withFileTypes: true })
        for (const dEntry of domainEntries) {
          if (!dEntry.isDirectory()) continue
          const candidate = path.join(domainDir, dEntry.name, name)
          if (fs.existsSync(candidate)) return candidate
        }
      }
    }
  }

  // 3. 回退检查 docs/features/<name> (兼容现有旧规格)
  const legacyPath = path.join(ROOT, "docs", "features", name)
  if (fs.existsSync(legacyPath)) {
    return legacyPath
  }

  return null
}

/**
 * 确定新规格包的标准创建路径
 * 规范：统一生成在 docs/specs/<domain>/<name>
 *
 * @param {string} name 规格名
 * @param {string} domain 业务域名
 * @returns {string} 绝对路径
 */
function getTargetSpecDir(name, domain) {
  if (!domain) {
    throw new Error(`[spec-path-resolver] 创建规格包必须指定 --domain 参数`)
  }
  return path.join(ROOT, "docs", "specs", domain, name)
}

/**
 * 扫描并列出全系统所有规格包（包含 docs/specs 与旧 docs/features）
 * 排除系统追加跟踪目录 sprint-prod
 *
 * @returns {Array<{ name: string, domain: string, type: string, path: string, isLegacy: boolean, isArchived: boolean }>}
 */
function listAllSpecs() {
  const specs = []
  const seen = new Set()

  // 1. 扫描 docs/specs
  const specsRoot = path.join(ROOT, "docs", "specs")
  if (fs.existsSync(specsRoot)) {
    function walkSpecs(dir, isArchived = false) {
      if (!fs.existsSync(dir)) return
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue
        const fullPath = path.join(dir, entry.name)
        if (entry.name === "archive") {
          walkSpecs(fullPath, true)
          continue
        }
        if (entry.name === "active") {
          walkSpecs(fullPath, false)
          continue
        }
        // 检查该目录是否是规格包（包含 brief.json 或 spec.json 或 feature.json）
        const hasBrief = fs.existsSync(path.join(fullPath, "brief.json"))
        const hasSpec =
          fs.existsSync(path.join(fullPath, "spec.json")) || fs.existsSync(path.join(fullPath, "feature.json"))
        if (hasBrief || hasSpec) {
          const meta = readSpecMeta(fullPath)
          const specName = meta.name || entry.name
          if (!seen.has(specName)) {
            seen.add(specName)
            specs.push({
              name: specName,
              domain: meta.domain || path.basename(dir),
              type: meta.type || "feature",
              path: fullPath,
              isLegacy: false,
              isArchived,
            })
          }
        } else {
          walkSpecs(fullPath, isArchived)
        }
      }
    }
    walkSpecs(specsRoot, false)
  }

  // 2. 扫描旧版 docs/features
  const featuresRoot = path.join(ROOT, "docs", "features")
  if (fs.existsSync(featuresRoot)) {
    const entries = fs.readdirSync(featuresRoot, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "sprint-prod") continue
      if (seen.has(entry.name)) continue
      const fullPath = path.join(featuresRoot, entry.name)
      const meta = readSpecMeta(fullPath)

      seen.add(entry.name)
      specs.push({
        name: entry.name,
        domain: meta.domain || "unknown",
        type: meta.type || "feature",
        path: fullPath,
        isLegacy: true,
        isArchived: false,
      })
    }
  }

  return specs
}

module.exports = {
  ROOT,
  resolveSpecDir,
  getTargetSpecDir,
  listAllSpecs,
}
