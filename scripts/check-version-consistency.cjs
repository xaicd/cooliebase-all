/**
 * 版本一致性门禁。
 *
 * 本仓**刻意区分**两个版本概念（依据 `docs/07_release/RELEASE_NOTES_v1.4.0-brand-shorthand.md` 的 R3 / R11）：
 *
 *   渠道/发布版本  = git tag，**可带语义后缀**（如 `v1.4.0-brand-shorthand`）
 *   模板版本       = `package.json.version` 与 `compat.framework.templateVersion`
 *
 * 二者**刻意解耦**：tag 可以高于模板版本（渠道里程碑），模板版本跟踪的是"模板基线"。
 * 因此本门禁**不要求** tag 与 package.version 相等 —— 那样会把一个已写进发布说明的决策判成失败。
 *
 * 真正要守的三条：
 *   1. 模板版本两处必须**同步**（package.json.version == compat.templateVersion）；
 *   2. 最新 tag 必须有**对应发布说明**（否则"这一版做了什么"无从追溯）；
 *   3. 当 tag 与模板版本**不同**时，该发布说明必须**显式记录版本策略**（关键词 `templateVersion`），
 *      把"刻意解耦"与"忘了 bump"区分开 —— 前者有据可查，后者必须被拦。
 *
 * Usage:
 *   node scripts/check-version-consistency.cjs
 *   node scripts/check-version-consistency.cjs --json
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const { ROOT } = require("./lib/domain-catalog.cjs")

const RELEASE_DIR = "docs/07_release"
const asJson = process.argv.includes("--json")

function abs(rel) {
  return path.join(ROOT, ...rel.split("/"))
}

function readJson(rel) {
  const full = abs(rel)
  if (!fs.existsSync(full)) throw new Error(`[version-check] missing ${rel}`)
  return JSON.parse(fs.readFileSync(full, "utf8"))
}

/** 从任意 tag / 文件名里抽出 `X.Y.Z` 语义核心；抽不出则返回 null。 */
function semverCore(value) {
  const match = String(value).match(/v?(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

/** 最新可达 tag。取不到（浅克隆/无 tag）时返回 reason 而不是抛错，交由调用方决定 fail 还是 skip。 */
function latestTag() {
  const result = spawnSync("git", ["describe", "--tags", "--abbrev=0"], {
    cwd: ROOT,
    encoding: "utf8",
  })
  const tag = (result.stdout || "").trim()
  if (result.error || result.status !== 0 || !tag) {
    return { tag: null, reason: (result.stderr || result.error?.message || "no reachable tag").trim() }
  }
  return { tag, reason: null }
}

/** 为该 tag 找发布说明：先精确匹配 tag 名，再退回按语义核心模糊匹配。 */
function findReleaseNotes(tag) {
  const dir = abs(RELEASE_DIR)
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter((name) => /^RELEASE_NOTES_.*\.md$/.test(name))
  const exact = files.find((name) => name === `RELEASE_NOTES_${tag}.md`)
  if (exact) return { file: `${RELEASE_DIR}/${exact}`, match: "exact" }
  const core = semverCore(tag)
  if (!core) return null
  const byCore = files.find((name) => name.includes(`v${core}`))
  return byCore ? { file: `${RELEASE_DIR}/${byCore}`, match: "semver-core" } : null
}

function main() {
  const findings = []

  // ① 模板版本两处必须同步
  const pkg = readJson("package.json")
  const compat = readJson("packages/shared/contract/compat-manifest.json")
  const templateVersion = compat?.framework?.templateVersion
  if (!pkg.version) findings.push({ id: "package-version-missing", detail: "package.json 缺少 version" })
  if (!templateVersion) findings.push({ id: "template-version-missing", detail: "compat.framework.templateVersion 缺失" })
  if (pkg.version && templateVersion && pkg.version !== templateVersion) {
    findings.push({
      id: "template-version-desync",
      detail: `package.json.version=${pkg.version} 与 compat.framework.templateVersion=${templateVersion} 不同步`,
    })
  }

  // ② 最新 tag 必须有发布说明
  const { tag, reason } = latestTag()
  let notes = null
  if (!tag) {
    // 取不到 tag（浅克隆/无 tag）时**不判失败**，但必须显式说明"未校验"，不得静默通过。
    findings.push({
      id: "tag-unavailable",
      severity: "skip",
      detail: `无法取得最新 tag（${reason}）—— tag 相关检查本次未执行；CI 需 fetch-depth: 0 才能覆盖`,
    })
  } else {
    notes = findReleaseNotes(tag)
    if (!notes) {
      findings.push({
        id: "release-notes-missing",
        detail: `最新 tag ${tag} 在 ${RELEASE_DIR}/ 下没有对应发布说明`,
      })
    }
  }

  // ③ tag 与模板版本不同 → 发布说明必须显式记录策略
  const tagCore = tag ? semverCore(tag) : null
  if (tag && tagCore && pkg.version && tagCore !== pkg.version) {
    const notesPath = notes ? abs(notes.file) : null
    const body = notesPath && fs.existsSync(notesPath) ? fs.readFileSync(notesPath, "utf8") : ""
    if (!body.includes("templateVersion")) {
      findings.push({
        id: "version-divergence-undocumented",
        detail:
          `tag ${tag}（核心 ${tagCore}）与模板版本 ${pkg.version} 不同，`
          + `但 ${notes ? notes.file : "发布说明缺失"} 未记录版本策略（未出现关键词 templateVersion）`,
      })
    }
  }

  const failures = findings.filter((item) => item.severity !== "skip")
  const report = {
    kind: "version-consistency-report",
    packageVersion: pkg.version ?? null,
    templateVersion: templateVersion ?? null,
    latestTag: tag,
    tagSemverCore: tagCore,
    releaseNotes: notes ? notes.file : null,
    releaseNotesMatch: notes ? notes.match : null,
    skipped: findings.filter((item) => item.severity === "skip").map((item) => item.id),
    findings,
    passed: failures.length === 0,
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2))
    process.exit(failures.length === 0 ? 0 : 1)
  }

  for (const item of findings) {
    const mark = item.severity === "skip" ? "…" : "✗"
    console.error(`  ${mark} [${item.id}] ${item.detail}`)
  }

  if (failures.length === 0) {
    const skipNote = report.skipped.length > 0 ? `（跳过: ${report.skipped.join(", ")}）` : ""
    console.log(
      `[version-check] PASS: 模板版本 ${report.packageVersion} 两处一致；`
      + `最新 tag ${report.latestTag ?? "(不可得)"} → ${report.releaseNotes ?? "(未校验)"}${skipNote}`,
    )
    process.exit(0)
  }

  console.error(`[version-check] FAIL: ${failures.length} 项`)
  process.exit(1)
}

main()
