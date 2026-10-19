/**
 * `pnpm-lock.yaml` 的**窄解析器**（共享 lib）。
 *
 * 从 `scripts/check-deps-audit.cjs` 提取而来 —— 依赖分层的真源与 SBOM 的包清单真源
 * 都是同一份锁文件，解析逻辑只应存在一份。
 *
 * 解析策略刻意做得极窄（不追求解析完整 YAML），只认三个缩进层：
 *   importers:  项目键 2 空格 / 依赖段键 4 空格 / 包名 6 空格
 *   snapshots:  快照键 2 空格 / 依赖段键 4 空格 / `name: version` 6 空格
 * 认不出的行一律忽略（不猜）。锁文件缺失或推导出空集合时 **throw** ——
 * 否则会退化成"全部 client-toolchain"这种看起来正常、实际全错的答案。
 *
 * 多文档 YAML：第一份是 pnpm 自身的 packageManagerDependencies 段，
 * 真正的 workspace 锁在**最后一份**。
 */

const fs = require("fs")
const path = require("path")

const LOCKFILE_REL = "pnpm-lock.yaml"
const DEP_SECTION_KEYS = new Set(["dependencies", "devDependencies", "optionalDependencies"])

/** 快照键形如 `@scope/name@1.2.3(peer@4.5.6)`：先去 peer 后缀，再按最后一个 @ 切版本。 */
function splitSnapshotKey(key) {
  const withoutPeers = key.replace(/\(.*$/, "")
  const at = withoutPeers.lastIndexOf("@")
  if (at <= 0) return { name: withoutPeers, version: "" }
  return { name: withoutPeers.slice(0, at), version: withoutPeers.slice(at + 1) }
}

function packageNameOfSnapshot(key) {
  return splitSnapshotKey(key).name
}

function unquote(value) {
  return value.replace(/^['"]|['"]$/g, "")
}

function readWorkspaceDocument(root) {
  const full = path.join(root, LOCKFILE_REL)
  if (!fs.existsSync(full)) {
    throw new Error(`lockfile missing: ${LOCKFILE_REL}; cannot derive dependency graph deterministically`)
  }
  const raw = fs.readFileSync(full, "utf8")
  const documents = raw.split(/^---\s*$/m)
  const doc = documents[documents.length - 1]
  if (!doc || !/^importers:/m.test(doc)) {
    throw new Error(`${LOCKFILE_REL}: could not locate the workspace document (multi-document split failed)`)
  }
  return doc
}

/**
 * @returns {{
 *   declaredByProject: Map<string, Set<string>>,
 *   edgesByName: Map<string, Set<string>>,
 *   snapshots: Map<string, { name: string, version: string }>,
 * }}
 */
function parseLockfile(root) {
  const doc = readWorkspaceDocument(root)
  const declaredByProject = new Map()
  const edgesByName = new Map()
  const snapshots = new Map()

  let section = null
  let project = null
  let snapshotName = null
  let inDependencySection = false

  for (const line of doc.split("\n")) {
    if (!line.trim()) continue
    const indent = line.length - line.trimStart().length
    const text = line.trim()

    if (indent === 0) {
      section = text === "importers:" || text === "snapshots:" ? text.replace(":", "") : null
      project = null
      snapshotName = null
      inDependencySection = false
      continue
    }
    if (!section) continue

    if (section === "importers") {
      if (indent === 2 && text.endsWith(":")) {
        project = unquote(text.slice(0, -1))
        inDependencySection = false
      } else if (indent === 4 && text.endsWith(":")) {
        inDependencySection = DEP_SECTION_KEYS.has(text.slice(0, -1))
      } else if (indent === 6 && inDependencySection && project) {
        const name = unquote(text.split(":")[0])
        if (!name) continue
        if (!declaredByProject.has(project)) declaredByProject.set(project, new Set())
        declaredByProject.get(project).add(name)
      }
      continue
    }

    if (indent === 2 && text.endsWith(":")) {
      const key = unquote(text.slice(0, -1))
      const parsed = splitSnapshotKey(key)
      snapshotName = parsed.name
      if (snapshotName) {
        snapshots.set(key, parsed)
        if (!edgesByName.has(snapshotName)) edgesByName.set(snapshotName, new Set())
      }
      inDependencySection = false
    } else if (indent === 4 && text.endsWith(":")) {
      inDependencySection = DEP_SECTION_KEYS.has(text.slice(0, -1))
    } else if (indent === 6 && inDependencySection && snapshotName) {
      const name = unquote(text.split(":")[0])
      if (name) edgesByName.get(snapshotName).add(name)
    }
  }

  return { declaredByProject, edgesByName, snapshots }
}

/**
 * 本仓自己（host）可达的包名集合。
 *
 * host = 根 `.` 与 `packages/**`；`clients/**` 属客户端，**不计入** ——
 * 客户端工具链漏洞不该被算成服务端运行时风险。
 */
function hostReachablePackageNames(root) {
  const { declaredByProject, edgesByName } = parseLockfile(root)

  const roots = []
  for (const [name, declared] of declaredByProject) {
    if (name === "." || name.startsWith("packages/")) roots.push(...declared)
  }

  const reachable = new Set()
  const queue = [...roots]
  while (queue.length > 0) {
    const name = queue.pop()
    if (reachable.has(name)) continue
    reachable.add(name)
    for (const dep of edgesByName.get(name) || []) if (!reachable.has(dep)) queue.push(dep)
  }

  if (reachable.size === 0) {
    throw new Error(
      `${LOCKFILE_REL}: derived an empty host-reachable set — refusing to label everything client-toolchain`,
    )
  }
  return reachable
}

module.exports = {
  LOCKFILE_REL,
  DEP_SECTION_KEYS,
  splitSnapshotKey,
  packageNameOfSnapshot,
  readWorkspaceDocument,
  parseLockfile,
  hostReachablePackageNames,
}
