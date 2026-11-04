/**
 * Agent Surface Synchronizer & Drift Guard.
 *
 * Keeps root-level and public-facing standard discovery files in sync with
 * internal contracts:
 * - packages/shared/contract/compat-manifest.json -> compat-manifest.json & public/compat-manifest.json
 * - packages/shared/contract/agent-profile.json   -> agent-profile.json & public/agent-profile.json
 * - llms.txt                                     -> public/llms.txt & .well-known/llms.txt
 * - .well-known/agent.json                       -> public/.well-known/agent.json
 *
 * External AI agents (Cursor, Claude Code, Windsurf, Coolie, MCP clients)
 * probe root standards (llms.txt, compat-manifest.json, .well-known/agent.json)
 * and cannot guess deep monorepo internal paths.
 */

const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")

const SYNC_PAIRS = [
  {
    src: "packages/shared/contract/compat-manifest.json",
    targets: ["compat-manifest.json", "public/compat-manifest.json"]
  },
  {
    src: "packages/shared/contract/agent-profile.json",
    targets: ["agent-profile.json", "public/agent-profile.json"]
  },
  {
    src: "llms.txt",
    targets: ["public/llms.txt", ".well-known/llms.txt"]
  },
  {
    src: "llms-full.txt",
    targets: ["public/llms-full.txt", ".well-known/llms-full.txt"]
  },
  {
    src: ".well-known/agent.json",
    targets: ["public/.well-known/agent.json"]
  }
]

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 生成物里**独有**的顶层键 —— 回写会静默丢掉它们。
 *
 * 为什么需要这个护栏：真源(src) → 生成物(target) 是单向的，可人常常反过来改生成物
 * （根 compat-manifest.json 看着像"入口文件"，最容易被当成可编辑的真源）。
 * 一旦只改了生成物，下一次同步就按真源把它**整段覆盖**掉 ——
 * 实测（COO-55-1-1）：COO-64 的 deployment / apiPartitions / harness 共 35 行声明
 * 就是这样被回写抹掉的，而 check 链里 `contracts:sync` 在前、`surface:check` 在后，
 * 漂移被自动"治好"，**没有任何门禁变红**。
 *
 * 所以：**只允许生成物缺内容，不允许生成物比真源多内容**。
 * 命中即拒绝写入并报错；确认要丢弃生成物里的独有内容时用 `--force`。
 */
function uniqueTopLevelKeys(srcContent, targetContent) {
  if (typeof srcContent !== "string" || typeof targetContent !== "string") return []
  let src
  let target
  try {
    src = JSON.parse(srcContent)
    target = JSON.parse(targetContent)
  } catch {
    return [] // 非 JSON 载荷（llms.txt / llms-full.txt）不比键
  }
  if (!src || typeof src !== "object" || Array.isArray(src)) return []
  if (!target || typeof target !== "object" || Array.isArray(target)) return []
  return Object.keys(target).filter((key) => !(key in src))
}

function syncSurface(checkOnly = false) {
  let hasDrift = false

  for (const pair of SYNC_PAIRS) {
    const srcPath = path.join(ROOT, pair.src)
    if (!fs.existsSync(srcPath)) {
      console.error(`[agent-surface] Source file missing: ${pair.src}`)
      hasDrift = true
      continue
    }

    const srcContent = fs.readFileSync(srcPath, "utf8")

    for (const targetRel of pair.targets) {
      const targetPath = path.join(ROOT, targetRel)
      const targetExists = fs.existsSync(targetPath)
      const targetContent = targetExists ? fs.readFileSync(targetPath, "utf8") : null

      if (!targetExists || targetContent !== srcContent) {
        if (checkOnly) {
          console.error(`[agent-surface] Drift detected: ${targetRel} does not match ${pair.src}`)
          hasDrift = true
        } else {
          const lost = uniqueTopLevelKeys(srcContent, targetContent)
          if (lost.length > 0 && !force) {
            console.error(
              `[agent-surface] REFUSED to write ${targetRel}: it holds top-level key(s) absent from ${pair.src}: ${lost.join(", ")}`,
            )
            console.error("[agent-surface] Overwriting would silently drop them. Merge them into the source first,")
            console.error("[agent-surface] then re-run. Use --force only if dropping them is intended.")
            hasDrift = true
            continue
          }
          ensureDirFor(targetPath)
          fs.writeFileSync(targetPath, srcContent, "utf8")
          console.log(`[agent-surface] Synced: ${pair.src} -> ${targetRel}`)
        }
      }
    }
  }

  if (checkOnly && hasDrift) {
    console.error("[agent-surface] FAILED: discovery surface has drifted. Run `node scripts/sync-agent-surface.cjs` to fix.")
    process.exit(1)
  }

  if (!checkOnly) {
    if (hasDrift) {
      console.error("[agent-surface] FAILED: refused to overwrite a discovery surface that holds unique content.")
      process.exit(1)
    }
    console.log("[agent-surface] PASS: all discovery surfaces synchronized.")
  } else {
    console.log("[agent-surface] PASS: all discovery surfaces up to date.")
  }
}

const isCheck = process.argv.includes("--check")
const force = process.argv.includes("--force")
syncSurface(isCheck)
