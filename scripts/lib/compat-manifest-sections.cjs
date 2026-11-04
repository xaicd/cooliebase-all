/**
 * compat-manifest 的「必备声明」校验（COO-55-1-1）。
 *
 * ## 为什么要有这个模块
 *
 * compat-manifest 曾经有**两份**：
 *   · 真源   `packages/shared/contract/compat-manifest.json`
 *   · 生成物 `compat-manifest.json`（根）/ `public/compat-manifest.json`
 * 生成物由 `pnpm surface:sync` 从真源**单向回写**。
 *
 * 于是出现过一次典型的"改错文件"事故（COO-64）：
 *   1. 开发者改了**根生成物**，补了 deployment / apiPartitions / harness 共 35 行；
 *   2. 真源没同步 → 两份分叉；
 *   3. 下一次 `pnpm check`（链里 `contracts:sync` 在前、`surface:check` 在后）
 *      按真源把根文件**整段覆盖** → 那 35 行声明**静默丢失**，
 *      而所有门禁都是绿的 —— 没人知道声明没了。
 *
 * 根因不是"多了一份文件"，而是**没人声明"哪些节必须在真源里"**：
 * 丢了不报、漂移不报，只有人的记忆在兜底。
 *
 * 这个模块把"必须存在的声明"钉成**机检**：
 *   · 声明在真源里缺失 → 红灯（不再靠人眼）；
 *   · 声明引用的命令在 package.json 里不存在 → 红灯（悬空声明）。
 *
 * 单独成模块而不是塞进门禁脚本，是为了**能被单测直接调用**——
 * 门禁脚本一 import 就会跑整个仓的校验，单测用不了。
 */

/** 必须存在于真源里的顶层节。 */
const REQUIRED_SECTIONS = ["deployment", "apiPartitions", "harness"]

/** 三类 API 分区（admin / app / open）。 */
const REQUIRED_PARTITIONS = ["admin", "app", "open"]

function fail(message) {
  throw new Error(`[compat-manifest] ${message}`)
}

/**
 * 从命令串里取出 npm script 名。
 *   "pnpm harness:check"    → "harness:check"
 *   "pnpm harness doctor"   → "harness"（doctor 是子命令，不是 script）
 *   带 `run` 前缀的写法（npm / pnpm 两种）同样会被剥掉。
 */
function scriptNameOf(command) {
  return String(command)
    .replace(/^(?:pnpm|npm)\s+(?:run\s+)?/, "")
    .trim()
    .split(/\s+/)[0]
}

/**
 * 校验 compat-manifest 的必备声明。
 *
 * @param {object} manifest 真源解析出来的对象
 * @param {object} pkg      package.json 解析出来的对象（用于校验声明的命令真实存在）
 * @throws {Error} 任一必备声明缺失 / 非法时抛出，消息带 `[compat-manifest]` 前缀
 */
function validateRequiredSections(manifest, pkg) {
  if (!manifest || typeof manifest !== "object") fail("manifest must be an object")

  for (const section of REQUIRED_SECTIONS) {
    const value = manifest[section]
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail(`required section "${section}" is missing from packages/shared/contract/compat-manifest.json`)
    }
  }

  // ── deployment：双模部署声明 ──
  const deployment = manifest.deployment
  for (const key of ["supportedModes", "defaultMode", "basePathEnvKey"]) {
    if (deployment[key] === undefined) fail(`deployment.${key} is required`)
  }
  if (!Array.isArray(deployment.supportedModes) || deployment.supportedModes.length === 0) {
    fail("deployment.supportedModes must be a non-empty array")
  }
  if (!deployment.supportedModes.includes(deployment.defaultMode)) {
    fail(`deployment.defaultMode "${deployment.defaultMode}" is not in deployment.supportedModes`)
  }

  // ── apiPartitions：三类 API 分区 ──
  const partitions = manifest.apiPartitions
  for (const key of REQUIRED_PARTITIONS) {
    const partition = partitions[key]
    if (!partition || typeof partition !== "object") fail(`apiPartitions.${key} is required`)
    if (typeof partition.prefix !== "string" || !partition.prefix.startsWith("/api/")) {
      fail(`apiPartitions.${key}.prefix must be an absolute /api/ path`)
    }
    if (!partition.auth) fail(`apiPartitions.${key}.auth is required`)
    if (typeof partition.audit !== "boolean") fail(`apiPartitions.${key}.audit must be a boolean`)
  }
  const prefixes = Object.values(partitions).map((partition) => partition.prefix)
  if (new Set(prefixes).size !== prefixes.length) fail("apiPartitions prefixes must be unique")

  // ── harness：声明的命令必须真的存在（否则是**悬空声明**）──
  const harness = manifest.harness
  const scripts = (pkg && pkg.scripts) || {}
  for (const key of ["checkCommand", "doctorCommand"]) {
    const command = harness[key]
    if (typeof command !== "string" || !command.trim()) fail(`harness.${key} is required`)
    const script = scriptNameOf(command)
    if (!scripts[script]) {
      fail(`harness.${key} ("${command}") names npm script "${script}" which does not exist in package.json`)
    }
  }

  return true
}

module.exports = {
  REQUIRED_SECTIONS,
  REQUIRED_PARTITIONS,
  scriptNameOf,
  validateRequiredSections,
}
