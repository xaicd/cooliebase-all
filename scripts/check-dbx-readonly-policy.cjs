#!/usr/bin/env node
/**
 * `dbx:readonly:check` —— 本仓发布的 DBX MCP 配置**必须是只读的**。
 *
 * ## 为什么需要它
 *
 * DBX 自己有权限模型（Read only / Data read-write / Full access），但那是在
 * **DBX 设置界面**里配的 —— 属于"某台机器上某个人的状态"，**不是仓库里的约定**。
 * 我们要保证的是：**无论那台机器怎么配，本仓产出的配置都只能读**。
 *
 * 官方提供正好这个语义的开关：
 *
 * ```
 * DBX_MCP_ALLOW_WRITES=0   → 强制本次运行只读，且覆盖已保存的
 *                            group / connection / database 级写权限
 * ```
 *
 * 所以本门禁只有一条硬约束：
 * **凡是我们发布的、包含 `mcp-dbx`（serverName: dbx）的配置，必须带 `DBX_MCP_ALLOW_WRITES=0`。**
 *
 * ## 它**不**检查什么（写清楚，别误以为守住了全部）
 *
 * - 不检查 DBX 界面里那个人到底开了哪一档权限（读不到，也不该读别人的机器状态）；
 * - 不检查连接范围（connection scope）—— 那需要知道真实连接名，属于部署侧；
 * - 不检查数据库账号的自身权限（那是 DB 层的最后边界）。
 *
 * 也就是说：本门禁守的是**配置层的下限**，不是完整的安全边界。
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
/** 我们发布 DBX 配置的地方（新增位置请一并登记） */
const SCAN_DIRS = [path.join(ROOT, "deploy", "dsh")]

/** 该文件是否包含 DBX MCP 条目 */
function hasDbxEntry(src) {
  return /\bserverName:\s*['"]?dbx['"]?\b/.test(src) || /\bmcp-dbx\b/.test(src)
}

/** 只读开关是否被正确设置（0 / false，允许带引号） */
/** 去掉 YAML 注释行 —— **必须**：否则注释里提到的 `DBX_MCP_ALLOW_WRITES=0` 会让门禁假绿（实测踩到） */
function stripComments(src) {
  return src
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n")
}

function hasReadonlyFlag(rawSrc) {
  const src = stripComments(rawSrc)
  // 逐个 `DBX_MCP_ALLOW_WRITES:` 出现处检查，避免"某处写了 0、另一处写了 1"被漏掉
  const hits = [...src.matchAll(/DBX_MCP_ALLOW_WRITES\s*[:=]\s*['"]?([A-Za-z0-9]+)['"]?/g)].map((m) => m[1].toLowerCase())
  if (hits.length === 0) return { ok: false, reason: "缺少 DBX_MCP_ALLOW_WRITES" }
  const bad = hits.filter((v) => v !== "0" && v !== "false")
  if (bad.length) return { ok: false, reason: `DBX_MCP_ALLOW_WRITES 取值不是只读：${bad.join(", ")}` }
  return { ok: true }
}

function collect() {
  const files = []
  for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (/\.ya?ml$/.test(name)) files.push(path.join(dir, name))
    }
  }
  return files
}

function main() {
  const files = collect()
  const checked = []
  const violations = []

  for (const file of files) {
    const src = fs.readFileSync(file, "utf8")
    if (!hasDbxEntry(src)) continue
    const rel = path.relative(ROOT, file)
    checked.push(rel)
    const verdict = hasReadonlyFlag(src)
    if (!verdict.ok) violations.push(`  · ${rel} —— ${verdict.reason}`)
  }

  if (violations.length) {
    console.error("[dbx-readonly] ✗ 本仓发布的 DBX MCP 配置必须是只读的：")
    for (const v of violations) console.error(v)
    console.error("")
    console.error("  修：在该条目的 env 里加 `DBX_MCP_ALLOW_WRITES: '0'`")
    console.error("      —— 它会强制只读并覆盖已保存的 group/connection/database 级写权限。")
    console.error("  理由：DBX 的权限是**那个人在那台机器上**配的，不是仓库约定；")
    console.error("        本仓要给 agent 的是「无论怎么配都只能读」的下限。")
    return 1
  }

  if (checked.length === 0) {
    console.log(`[dbx-readonly] 扫描 ${files.length} 个配置文件，未发现 DBX MCP 条目 —— 无需检查（打印出来是为了可见，不是静默通过）`)
    return 0
  }
  console.log(`[dbx-readonly] ✓ ${checked.length} 个 DBX MCP 配置均已强制只读：${checked.join(", ")}`)
  return 0
}

if (require.main === module) process.exit(main())
module.exports = { hasDbxEntry, hasReadonlyFlag, collect, SCAN_DIRS }
