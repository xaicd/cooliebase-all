/**
 * 派生后自检门禁的「清洗口径」单一真源（COO-55-1-3）。
 *
 * ## 为什么要有这个模块
 *
 * 底座侧的派生自检（scripts/check-workspace-executability.cjs）原本只有**一个**口径来源：
 * 平台 `PRIVATE_SPEC_ENGINE_FILES`（6 条母港私有规约机路径）。
 * 但平台真正的清洗面是 `cleanWorkspaceLeaks` 的**全量清洗面** —— 比那 6 条宽得多，
 * 其中最危险的一条是**它会改写 package.json**：
 *
 *   · 无条件删 `scripts/harness.sh`；
 *   · 删 8 个内部角色包（`.agents/skills/<role>`，递归）+ 删母港 server/ 产品源码两个文件；
 *   · **删 package.json 的 script 键**：`harness` / `pre-commit` / `triage` / `doctor` /
 *     `gate:fast` / `gate:release` / `speckit` / `spc:audit`
 *     （条件：`motherPortEvidence` = `scripts/harness.sh` 存在 **或** 母港版
 *     `scripts/speckit.cjs` 存在），
 *     另外**任何值里引用了 `scripts/harness.sh`** 的 script 键也会被删。
 *
 * 于是出现一条**底座门禁看不见**的断链路径：派生清洗把 package.json 的 script 键
 * **整个删掉** —— 命令变成「不存在」，**不报错**，客户侧自证链**静默消失**。
 * 与 COO-55-1 原始症状同源：**公开入口静默消失，而不是给出明确报错**。
 *
 * 这个模块把「平台会清掉什么」钉成**机检真源**，并把清洗面拆成两档：
 *
 *   · **无条件删除**（删不删与来源鉴别无关）：母本**绝不能**下发、公开脚本**绝不能**依赖；
 *   · **按来源鉴别删除**（母港 fork 版才删，底座原生同名资产保留）：本门禁取**保守口径**
 *     —— 全列。偏严只会多红、不会假绿；但注释必须写清「平台已改来源鉴别」，
 *     否则下一个维护者会照着过期事实做决策。
 *
 * 单独成模块而不是塞进门禁脚本，是为了**能被单测直接调用** ——
 * 门禁脚本一 import 就会跑整个仓的校验，单测用不了（同 scripts/lib/compat-manifest-sections.cjs）。
 */

/**
 * 平台**无条件**删除的条目（cleanWorkspaceLeaks 里不看来源鉴别、见文件就删）。
 *
 * 逐条对应平台 server/src/services/harness-delivery-engine.ts：
 *   · scripts/harness.sh                                  ← L378-382
 *   · server/src/services/blueprint-profiles.ts            ← L393-399（COOA-581）
 *   · server/src/services/harness-project-provisioner.ts   ← L393-399（COOA-581）
 *   · .agents/skills/<8 个内部角色包>                       ← L401-419（递归删；空了连目录一起删）
 */
const UNCONDITIONAL_PURGE_PATHS = [
  "scripts/harness.sh",
  "server/src/services/blueprint-profiles.ts",
  "server/src/services/harness-project-provisioner.ts",
  ".agents/skills/fda",
  ".agents/skills/core-swe",
  ".agents/skills/fdse",
  ".agents/skills/ds",
  ".agents/skills/pre-sre",
  ".agents/skills/cmmi-gatekeeper",
  ".agents/skills/local-team-toolchain",
  ".agents/skills/coolie-boss-decision-log",
]

/**
 * 平台**按来源鉴别**删除的条目（母港 fork 版才删；底座原生同名资产保留）。
 *
 * 【COOA-789 / COOA-827 现状】平台已改为**按来源鉴别**：
 *   · `scripts/lib/spec-resolver.cjs` 与 `scripts/speckit.cjs` 在底座母本里**同名存在**，
 *     只有带母港独有标记的 fork 版（`setRoot` / `Coolie Edition`）才删；
 *   · 其余 4 条底座母本**不存在**，出现即是母港外泄，无需鉴别。
 *
 * 本门禁**保留偏严口径**（两条同名文件也全列）：偏严只多红、不假绿；
 * 底座母本当前**不含**这 6 个文件，所以偏严在本仓不产生任何假红。
 */
const SOURCE_DISCRIMINATED_PURGE_PATHS = [
  "scripts/speckit.cjs",
  "scripts/check-contracts.mjs",
  "scripts/lib/spec-resolver.cjs",
  "scripts/lib/spec-ontology-driver.cjs",
  "scripts/lib/speckit-issue-verifier.cjs",
  "scripts/lib/ontology-callchain-engine.cjs",
]

/** 平台 cleanWorkspaceLeaks 的**全量清洗面**镜像（本门禁的默认口径）。 */
const PLATFORM_CLEAN_SURFACE = [...UNCONDITIONAL_PURGE_PATHS, ...SOURCE_DISCRIMINATED_PURGE_PATHS]

/**
 * 平台在「母港证据」存在时**整键删除**的 package.json script 键。
 *
 * 平台侧条件（cleanWorkspaceLeaks L422-445）：
 *   `motherPortEvidence` = `scripts/harness.sh` 存在 **或** 母港版 `scripts/speckit.cjs` 存在。
 * 这些键被删掉之后，命令变成「不存在」—— **不报错**，公开入口静默消失。
 */
const PLATFORM_PURGED_SCRIPT_KEYS = [
  "harness",
  "pre-commit",
  "triage",
  "doctor",
  "gate:fast",
  "gate:release",
  "speckit",
  "spc:audit",
]

/**
 * 必须**留存**在 package.json 里的公开 script 键。
 *
 * 取的是「平台会整键删掉」∩「本仓把它当公开入口」——
 * 本仓的 `harness`（标准全流程唯一主干入口，scripts/harness.cjs）与
 * `speckit`（公开 speckit 校验链入口，scripts/speckit.ts）都在平台删除名单上。
 * 派生清洗一旦把它们删掉，客户侧的 `pnpm harness` / `pnpm speckit` 就**静默消失**。
 * 本门禁在**派生后**（平台 COO-55-1-2 接线：清洗之后自动跑冒烟）跑这条断言，
 * 于是「键被删掉」当场变红，而不是留给客户去踩。
 */
const REQUIRED_PUBLIC_SCRIPT_KEYS = ["harness", "speckit"]

/** 只有**文件**才做 package.json 值里的子串匹配（目录路径做子串匹配容易误伤）。 */
const FILE_LIKE_PATH = /\.(cjs|mjs|js|ts|tsx|json|sh)$/

function normalizeRel(rel) {
  return String(rel).trim().replace(/\\/g, "/")
}

/**
 * 解析生效的清洗口径。
 *
 * `DE_LEAK_PRIVATE_FILES`（逗号分隔）**整表替换**默认口径 —— 与既有行为一致。
 * 但替换后的口径必须**覆盖**平台已知清洗面（`PLATFORM_CLEAN_SURFACE`），
 * 否则门禁自判红「口径比平台实际清洗面窄」：
 *
 *   · 口径收窄 = 门禁变弱 = 假绿 —— 这正是本单要消灭的病根；
 *   · 平台清洗面若真的收缩了，改**常量**（本模块）才是正确出口，
 *     因为那份常量就是「平台清洗面」的机检镜像。
 *
 * @param {object} env 环境变量（默认 process.env）
 * @returns {{targets: string[], coverageGaps: string[]}}
 *   targets      生效的清洗口径（已去重、已归一化）
 *   coverageGaps 相对平台已知清洗面**缺失**的条目（非空 ⇒ 口径被收窄）
 */
function resolvePurgeTargets(env = process.env) {
  const raw = String((env && env.DE_LEAK_PRIVATE_FILES) || "").trim()
  const list = raw
    ? raw.split(",").map(normalizeRel).filter(Boolean)
    : PLATFORM_CLEAN_SURFACE.map(normalizeRel)
  const targets = [...new Set(list)]
  const set = new Set(targets)
  const coverageGaps = PLATFORM_CLEAN_SURFACE.filter((rel) => !set.has(rel))
  return { targets, coverageGaps }
}

/**
 * package.json 维度审计（本单新增的维度 —— 旧门禁**从不读 package.json**）。
 *
 * 两类断言：
 *   ① **值引用**：某个 script 的命令值引用了会被平台清洗掉的文件
 *      ⇒ 平台清洗会把**这个 script 键**整个删掉（静默消失，不是报错）；
 *   ② **键留存**：必须留存的公开 script 键不在 package.json 里
 *      ⇒ 它已经被平台清洗删掉了（派生后自检当场变红）。
 *
 * @param {object} pkg package.json 解析结果
 * @param {object} [options]
 * @param {string[]} [options.targets] 生效清洗口径（默认取平台全量清洗面）
 * @param {string[]} [options.requiredKeys] 必须留存的公开 script 键
 * @returns {Array<{kind: string, key: string, detail: string}>} 失败项（空数组 = 通过）
 */
function auditPackageJson(pkg, options = {}) {
  const failures = []
  const scripts = (pkg && pkg.scripts) || {}
  const targets = options.targets || PLATFORM_CLEAN_SURFACE
  const requiredKeys = options.requiredKeys || REQUIRED_PUBLIC_SCRIPT_KEYS
  const unconditional = new Set(UNCONDITIONAL_PURGE_PATHS)
  const fileTargets = targets.filter((rel) => FILE_LIKE_PATH.test(rel))

  for (const [key, value] of Object.entries(scripts)) {
    if (typeof value !== "string" || !value.trim()) continue
    for (const target of fileTargets) {
      if (!value.includes(target)) continue
      const how = unconditional.has(target)
        ? "平台**无条件**删除它"
        : "平台按来源鉴别删除它（母港 fork 版命中即删）"
      failures.push({
        kind: "package-json-references-purged-file",
        key,
        detail:
          `package.json 的 scripts.${key} 引用了 "${target}" —— ${how}；`
          + `派生清洗后**这个 script 键会被整个删掉**，命令变成「不存在」（静默消失，不是报错）；`
          + `必须改指向公开等价物`,
      })
      break
    }
  }

  for (const key of requiredKeys) {
    if (scripts[key] !== undefined) continue
    failures.push({
      kind: "public-script-key-missing",
      key,
      detail:
        `package.json 里没有公开 script 键 "${key}" —— `
        + `平台 cleanWorkspaceLeaks 在母港证据存在时会把「${PLATFORM_PURGED_SCRIPT_KEYS.join(" / ")}」`
        + `这类键整个删掉（静默消失，不是报错）；派生后公开入口必须仍在`,
    })
  }

  return failures
}

module.exports = {
  UNCONDITIONAL_PURGE_PATHS,
  SOURCE_DISCRIMINATED_PURGE_PATHS,
  PLATFORM_CLEAN_SURFACE,
  PLATFORM_PURGED_SCRIPT_KEYS,
  REQUIRED_PUBLIC_SCRIPT_KEYS,
  resolvePurgeTargets,
  auditPackageJson,
}
