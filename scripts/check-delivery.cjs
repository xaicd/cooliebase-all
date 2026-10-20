#!/usr/bin/env node
/**
 * AI-Driven 全环节交付检查器。
 *
 * 把 AGENTS §6.1/§22 的「三阶段 + 四类契约」从**散文**变成**可查询的状态**:
 * 逐阶段检查产物是否落地，输出「还缺什么」。
 * agent 要能自己判断进度并催下一步，而不是读一遍 AGENTS 再猜 —— 经 MCP
 * （cooliebase_delivery_status）暴露出去。
 *
 * 用法:
 *   node scripts/check-delivery.cjs                  # 全部阶段
 *   node scripts/check-delivery.cjs --phase testing  # 单个阶段
 *   node scripts/check-delivery.cjs --json           # 机器可读
 */
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const MANIFEST = path.join(ROOT, "packages", "shared", "contract", "delivery-phases.json")
const asJson = process.argv.includes("--json")
const strict = process.argv.includes("--strict")
const only = process.argv.includes("--phase") ? process.argv[process.argv.indexOf("--phase") + 1] : null
const feature = process.argv.includes("--feature")
  ? process.argv[process.argv.indexOf("--feature") + 1]
  : (process.argv.includes("--spec") ? process.argv[process.argv.indexOf("--spec") + 1] : null)
const SKIP = new Set(["node_modules", ".git", ".next", ".next-cooliebase", "dist", "coverage"])

/**
 * glob 展开。`**` 的语义是**零个或多个目录** ——
 * 早先实现成"递归收集文件"，于是带前导或中间双星的模式（如测试目录、features 下的 sprint-prod）
 * 都匹配不到（`**` 后面的段被当成必须紧跟的文件名）。这里按正确语义实现。
 */
function expand(pattern) {
  const segments = pattern.split("/")

  function walk(base, index) {
    if (index === segments.length) return fs.existsSync(base) ? [base] : []
    const segment = segments[index]

    if (segment === "**") {
      const results = walk(base, index + 1) // `**` 可匹配零个目录
      if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
        for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
          if (!entry.isDirectory() || SKIP.has(entry.name)) continue
          results.push(...walk(path.join(base, entry.name), index))
        }
      }
      return results
    }

    if (segment.includes("*")) {
      if (!fs.existsSync(base) || !fs.statSync(base).isDirectory()) return []
      const escaped = segment.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")
      const regex = new RegExp(`^${escaped}$`)
      return fs.readdirSync(base).filter((name) => regex.test(name)).flatMap((name) => walk(path.join(base, name), index + 1))
    }

    return walk(path.join(base, segment), index + 1)
  }

  return [...new Set(walk(ROOT, 0))]
}


/**
 * 文档是否**还只是骨架**。
 *
 * 这一条是必须的: 生成器产出的骨架如果被检查器当成"产物已存在"，就会**假绿** ——
 * 一个没写任何内容的 docs/features/x/requirements.md 不该让"需求"阶段通过。
 * 判据取**可数的硬指标**（占位符、条目数），不用主观判断。
 */
function inspectFeatureDocs(featureDir, docName) {
  const file = path.join(featureDir, docName)
  if (!fs.existsSync(file)) return { ok: false, reason: "文档不存在" }
  const text = fs.readFileSync(file, "utf8")
  const placeholders = (text.match(/<!--\s*待填/g) || []).length
  if (placeholders > 0) return { ok: false, reason: `还有 ${placeholders} 处 <!-- 待填 -->` }
  const counts = {
    "requirements.md": () => (text.match(/^\s*\d+\.\s*\*\*P[0-2]\*\*/gm) || []).length + " 条用户故事",
    "design.md": () => (text.match(/^##\s*\d+\.\s*关键不变量/gm) || []).length + " 节不变量",
    "tasks.md": () => (text.match(/^- \[ \]/gm) || []).length + " 个任务",
  }
  return { ok: true, detail: counts[docName] ? counts[docName]() : "" }
}


/**
 * 缺陷清单体检。
 *
 * 两条硬规矩（对齐 §6.1「独立测试」）:
 *  1. 未修的缺陷必须**被看到** —— 否则"修完了吗"只能靠人记
 *  2. 每条缺陷必须带**复现命令**与**验证命令** —— 没有复现步骤的描述无法被独立验证
 */
function inspectBugs(featureDir) {
  const file = path.join(featureDir, "bugs.md")
  if (!fs.existsSync(file)) return { present: false, open: 0, malformed: 0, unknown: 0 }
  const KNOWN = new Set(["未修", "已修", "不修"])
  const cellsOf = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim())
  const rows = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .filter((line) => !cellsOf(line).includes("ID"))       // 表头
    .filter((line) => !cellsOf(line).every((cell) => /^:?-+:?$/.test(cell))) // 分隔线（允许空格/对齐冒号）

  let open = 0
  let malformed = 0
  let unknown = 0
  for (const row of rows) {
    // 先剥掉**结构性的**首尾竖线，再 split —— 这样"末尾空列"不会被吞掉。
    // （早先直接 split 再删尾部空串，把 `| B1 | 现象 | cmd | cmd | |` 这样的行
    //   删成 4 列而整行跳过 —— 空状态的行会**凭空消失**，实测踩到。）
    const cells = cellsOf(row)
    if (cells.length < 5) {
      malformed += 1 // 少列: 不能当没看见
      continue
    }
    const status = cells[cells.length - 1]
    if (status === "" || status === "未修") open += 1
    if (status !== "" && !KNOWN.has(status)) {
      // 状态写错字（未休 / Fixed / OPEN…）—— 静默忽略等于把真缺陷藏起来
      unknown += 1
      malformed += 1
    }
    if (!cells[2] || !cells[3]) malformed += 1 // 复现命令 / 验证命令
  }
  return { present: true, open, malformed, unknown }
}


/**
 * 证据账本体检 —— 对齐 CMMI 的 G1-G5 与「证据不可跨角色借用」。
 *
 * 三条硬规则，都是为了治**「自报」**:
 *  1. `passed` **必须**有证据（路径或命令）—— 否则只是"我说过了"
 *  2. `not_applicable` **必须**有理由 —— 否则静默跳过会变成"没做也没事"
 *  3. 状态必须是四个已知值之一 —— 写错字等于把 gate 藏起来
 */
function inspectEvidence(featureDir, gateIds) {
  const file = path.join(featureDir, "evidence.json")
  if (!fs.existsSync(file)) return { present: false, totals: {}, problems: ["没有 evidence.json"] }
  let data
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (error) {
    return { present: true, totals: {}, problems: [`evidence.json 不是合法 JSON —— ${error.message}`] }
  }
  const KNOWN = new Set(["passed", "pending", "blocked", "not_applicable"])
  const totals = {}
  const problems = []
  // 给空 gateIds 时**遍历文件里实际登记的 gate**，而不是什么都不查 ——
  // 否则调用方传 `[]` 就等于"跳过了全部校验"，正是本仓反复栽的假绿形态
  // （本次实测：证据账本全量扫描一开始就是这么写成空操作的，被反向对照抓住）。
  const gates = gateIds.length > 0 ? gateIds : Object.keys(data.gates ?? {})
  for (const gate of gates) {
    const entry = (data.gates ?? {})[gate]
    if (!entry) {
      problems.push(`${gate} 未登记`)
      continue
    }
    const status = entry.status
    if (!KNOWN.has(status)) {
      problems.push(`${gate} 状态不认识: ${status}`) // 错字等于把 gate 藏起来，且不再往下判
      continue
    }
    totals[status] = (totals[status] ?? 0) + 1
    if (status === "passed" && (entry.evidence ?? []).length === 0) problems.push(`${gate} 标了 passed 却没有证据`)
    if (status === "not_applicable" && !String(entry.summary ?? "").trim()) problems.push(`${gate} 标了 not_applicable 却没写理由`)
  }
  // G5 说 passed ⇒ **必须**存在一份全过的 runbook 运行记录。
  // 这条是"证据不可自报"在实施轨上的落点: "回滚 10 分钟内"是声明，
  // runbook-result.json 里的耗时才是实测。没有实测记录的 passed 只是声称。
  const g5 = (data.gates ?? {}).G5_PRE
  // G5 是"上线前"：指纹一致 + 割接演练 + **安全扫描绿**，三样缺一不可。
  // 安全扫描结果由 `npm run security:scan` 落盘（自管理环境、对着跑起来的应用打真实请求）。
  if (g5?.status === "passed") {
    const secPath = path.join(ROOT, "docs", "architecture", "artifacts", "security-scan-result.json")
    if (!fs.existsSync(secPath)) {
      problems.push("G5_PRE 标了 passed 但没有 security-scan-result.json（没跑过安全扫描）")
    } else {
      try {
        const scan = JSON.parse(fs.readFileSync(secPath, "utf8"))
        if (scan.failed > 0) problems.push(`G5_PRE 标了 passed，但安全扫描有 ${scan.failed} 项失败`)
        const ageDays = (Date.now() - new Date(scan.scannedAt).getTime()) / 86400000
        if (ageDays > 7) problems.push(`安全扫描结果已过期 ${ageDays.toFixed(1)} 天（>7 天），请重跑 security:scan`)
      } catch (error) {
        problems.push(`security-scan-result.json 不是合法 JSON —— ${error.message}`)
      }
    }
  }
  // 第三条: 同条件 —— 上线前也要有一份**新鲜且过阈值**的压测结果（§3.3 第 6 条）
  if (g5?.status === "passed") {
    const loadPath = path.join(ROOT, "docs", "architecture", "artifacts", "load-test-result.json")
    if (!fs.existsSync(loadPath)) {
      problems.push("G5_PRE 标了 passed 但没有 load-test-result.json（没跑过压测）")
    } else {
      try {
        const load = JSON.parse(fs.readFileSync(loadPath, "utf8"))
        if (load.failed > 0) problems.push(`G5_PRE 标了 passed，但压测有 ${load.failed} 项未达阈值`)
        const ageDays = (Date.now() - new Date(load.ranAt).getTime()) / 86400000
        if (ageDays > 7) problems.push(`压测结果已过期 ${ageDays.toFixed(1)} 天（>7 天），请重跑 load:test`)
      } catch (error) {
        problems.push(`load-test-result.json 不是合法 JSON —— ${error.message}`)
      }
    }
  }
  // 第二条: 同条件 —— 写成裸块会让未标 passed 的特性也被要求交割接记录（实测踩到）
  if (g5?.status === "passed") {
    const resultPath = path.join(featureDir, "runbook-result.json")
    if (!fs.existsSync(resultPath)) {
      problems.push("G5_PRE 标了 passed 却没有 runbook-result.json（没有实测的割接记录）")
    } else {
      try {
        const result = JSON.parse(fs.readFileSync(resultPath, "utf8"))
        const failed = (result.steps ?? []).filter((step) => !step.ok)
        if (!result.ok || failed.length > 0) {
          problems.push(`G5_PRE 标了 passed，但运行记录显示失败（${failed.map((step) => step.id).join(", ") || "整体未通过"}）`)
        }
        // AGENTS §3.4 第 7 条要求三样"**都不超过 7 天**"，此前只对安全扫描与压测做了时效判断，
        // 割接记录漏了 —— 一条声明 passed 却拿着半年前演练记录的 gate 不该算通过。
        const raw = result.ranAt ?? result.startedAt ?? result.finishedAt
        if (raw) {
          const ageDays = (Date.now() - new Date(raw).getTime()) / 86400000
          if (ageDays > 7) problems.push(`割接记录已过期 ${ageDays.toFixed(1)} 天（>7 天），请重跑 runbook`)
        } else if (fs.existsSync(resultPath)) {
          const ageDays = (Date.now() - fs.statSync(resultPath).mtimeMs) / 86400000
          if (ageDays > 7) problems.push(`割接记录已过期 ${ageDays.toFixed(1)} 天（>7 天，按文件修改时间），请重跑 runbook`)
        }
      } catch (error) {
        problems.push(`runbook-result.json 不是合法 JSON —— ${error.message}`)
      }
    }
  }
  return { present: true, totals, problems }
}


/**
 * 任务树体检 —— 对齐 CMMI「主线-支线任务树」。
 *
 * 两条规矩:
 *  1. **不许孤儿任务**: 归属必须是 `main` 或某个**已存在**的任务 ID
 *  2. **文件白名单必填**: 没有白名单，"1 Task = 1 Commit" 就无从核对
 */
function inspectTasks(featureDir) {
  const file = path.join(featureDir, "tasks.md")
  if (!fs.existsSync(file)) return { present: false, total: 0, orphans: [], noWhitelist: 0 }
  const cellsOf = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim())
  const rows = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .filter((line) => !cellsOf(line).includes("ID"))
    .filter((line) => !cellsOf(line).every((cell) => /^:?-+:?$/.test(cell)))
    .map(cellsOf)
    .filter((cells) => cells.length >= 4)
    .filter((cells) => /^T\d/.test(cells[0]))

  const ids = new Set(rows.map((cells) => cells[0]))
  const orphans = []
  let noWhitelist = 0
  for (const cells of rows) {
    const parent = cells[1]
    if (parent !== "main" && !ids.has(parent)) orphans.push(`${cells[0]} 归属 '${parent}' 不存在`)
    // `-` = 显式的"本任务不改文件"（纯验证类任务），是合法的
    if (!cells[3] || (cells[3] !== "-" && cells[3].includes("待填"))) noWhitelist += 1
  }
  // 0 条不是"健康" —— 没有任务树等于没规划（早先误报成"无孤儿任务"，实测踩到）
  if (rows.length === 0) return { present: true, total: 0, orphans: [], noWhitelist: 0, empty: true }
  return { present: true, total: rows.length, orphans, noWhitelist }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  const phases = only ? manifest.phases.filter((phase) => phase.id === only) : manifest.phases
  const result = []
  let missingTotal = 0

  // 按特性收窄: 读 feature.json 拿到 domain，把 {domain} 占位替换掉，
  // 并**用 featureScopedArtifacts 取代**基座级模式 —— 否则 `packages/plugins/**`
  // 会把整个基座算进来，开发阶段永远是绿的（那是"假绿"，实测踩到）。
  let scoped = null
  let specDir = null
  if (feature) {
    const { resolveSpecDir } = require("./lib/spec-resolver.cjs")
    specDir = resolveSpecDir(feature)
    if (!specDir) {
      console.error(`[delivery] 找不到特性/规格: ${feature}（已在 docs/specs 与 docs/features 中检索）`)
      process.exit(2)
    }
    let descriptor = path.join(specDir, "spec.json")
    if (!fs.existsSync(descriptor)) {
      descriptor = path.join(specDir, "feature.json")
    }
    if (!fs.existsSync(descriptor)) {
      descriptor = path.join(specDir, "brief.json")
    }
    if (!fs.existsSync(descriptor)) {
      console.error(`[delivery] 找不到特性/规格描述文件: ${path.relative(ROOT, specDir)}/spec.json 或 feature.json`)
      process.exit(2)
    }
    let meta
    try {
      meta = JSON.parse(fs.readFileSync(descriptor, "utf8"))
    } catch (error) {
      console.error(`[delivery] ${path.relative(ROOT, descriptor)} 不是合法 JSON —— ${error.message}`)
      process.exit(2)
    }
    if ((!meta.domain || !meta.name) && fs.existsSync(path.join(specDir, "brief.json"))) {
      try {
        const brief = JSON.parse(fs.readFileSync(path.join(specDir, "brief.json"), "utf8"))
        meta.domain = meta.domain || brief.domain
        meta.name = meta.name || brief.name
      } catch {}
    }
    if (!meta.domain || !meta.name) {
      console.error(`[delivery] ${path.relative(ROOT, descriptor)} 缺少 name 或 domain`)
      process.exit(2)
    }
    scoped = { domain: meta.domain, name: meta.name }
  }

  for (const phase of phases) {
    const found = []
    const missing = []
    let patterns = scoped && phase.featureScopedArtifacts
      ? phase.featureScopedArtifacts.map((item) => {
          const { domainDirOf } = require("./lib/domain-catalog.cjs")
          const dDir = domainDirOf(ROOT, scoped.domain)
          return item.replace(/packages\/plugins\/plugin-\{domain\}/g, dDir).replace(/\{domain\}/g, scoped.domain)
        })
      : phase.artifacts
    if (scoped && specDir) {
      const relSpecDir = path.relative(ROOT, specDir).replace(/\\/g, "/")
      patterns = patterns.map((p) => p.replace(/^docs\/features\/\*\*\//, `${relSpecDir}/`))
    }
    for (const pattern of patterns) {
      const hits = expand(pattern)
      if (!scoped && pattern.startsWith("docs/features/**/")) {
        const specPattern = pattern.replace(/^docs\/features\/\*\*\//, "docs/specs/**/")
        hits.push(...expand(specPattern))
      }
      if (hits.length > 0) found.push({ pattern, count: hits.length, sample: path.relative(ROOT, hits[0]) })
      else missing.push(pattern)
    }
    // 文档产物存在 ≠ 写完了 —— 骨架必须暴露出来，否则就是假绿
    let skeleton = null
    if (scoped) {
      const docs = { requirement: ["requirements.md"], prototype: ["prototype.md"],
        "ui-design": ["design.md"], architecture: ["design.md"], implementation: ["tasks.md"] }[phase.id]
      if (docs) {
        const checks = docs.map((doc) => ({ doc, ...inspectFeatureDocs(specDir, doc) }))
        const bad = checks.filter((item) => !item.ok)
        if (bad.length > 0) {
          skeleton = bad.map((item) => `${item.doc}: ${item.reason}`).join("; ")
        }
      }
    }
    missingTotal += missing.length
    result.push({ id: phase.id, name: phase.name, skill: phase.skill, gate: phase.gate, found, missing, skeleton })
  }

  // 同一份文档可能同时是两个阶段的产物（design.md 之于 UI 设计与架构设计）。
  // 展示时两个阶段都要显示它（都真的依赖它），但**计数必须去重**，
  // 否则一个缺陷被报两次，`missingTotal` 虚高 —— 这是实测发现的 bug。
  const distinctSkeletons = new Set()
  for (const phase of result) {
    for (const part of (phase.skeleton ?? "").split("; ")) {
      const doc = part.split(":")[0].trim()
      if (doc) distinctSkeletons.add(doc)
    }
  }
  const missingArtifacts = result.reduce((sum, phase) => sum + phase.missing.length, 0)
  let distinctTotal = missingArtifacts + distinctSkeletons.size

  const bugs = scoped ? inspectBugs(specDir) : null
  const tasks = scoped ? inspectTasks(specDir) : null
  // 默认路径（供 check 链使用）不给 --feature，此前 evidence 恒为 null ——
  // 于是「自报 passed 必须凭证据」这条规则**在 check 链里从不触发**。
  // 实测代价：两个规格自报 G5_PRE passed，而其引用的压测产物已是 failed=3/3，
  // 没有任何门禁发现。这里改为**扫全部规格**。
  const evidenceSweep = scoped
    ? null
    : expand("docs/specs/*/*/evidence.json").map((abs) => {
        const rel = path.relative(ROOT, abs)
        const dir = path.dirname(abs)
        return { spec: path.dirname(rel), problems: inspectEvidence(dir, []).problems.map((text) => `${dir === "" ? "" : ""}${text}`) }
      }).filter((entry) => entry.problems.length > 0)

  const evidence = scoped
    ? inspectEvidence(
        specDir,
        // 去重: 多个阶段可能共用同一 gate（G4_DS 之于需求/运营/实施），
        // 不去重会把同一个问题报 3 次 —— 和 design.md 那次是同一类错。
        [...new Set(manifest.phases.map((phase) => phase.gate).filter(Boolean))],
      )
    : null
  if (bugs && bugs.malformed > 0) distinctTotal += 1
  if (evidence) distinctTotal += evidence.problems.length
  if (evidenceSweep) distinctTotal += evidenceSweep.reduce((sum, entry) => sum + entry.problems.length, 0)
  if (tasks) distinctTotal += tasks.orphans.length + (tasks.noWhitelist > 0 ? 1 : 0) + (tasks.empty ? 1 : 0)

  if (asJson) {
    console.log(JSON.stringify({ phases: result, missingTotal: distinctTotal, distinctSkeletons: [...distinctSkeletons], bugs, evidence, evidenceSweep, tasks }, null, 2))
    return
  }
  for (const phase of result) {
    const mark = phase.missing.length === 0 && !phase.skeleton ? "✅" : "⚠️"
    console.log(`\n${mark} ${phase.name}（${phase.id}）  技能: ${phase.skill}  门禁: ${phase.gate}`)
    for (const item of phase.found) console.log(`   ✓ ${item.pattern}  (${item.count} 个，如 ${item.sample})`)
    if (phase.skeleton) console.log(`   ✗ 骨架未填: ${phase.skeleton}`)
    for (const item of phase.missing) console.log(`   ✗ ${item}  —— 尚无产物`)
  }
  if (scoped) {
    // 特性目录**只有规划链**；代码落在**域**的目录里（这是故意的: 打包与拆分部署按域工作）
    const { domainDirOf } = require("./lib/domain-catalog.cjs")
    const dDir = domainDirOf(ROOT, scoped.domain)
    const fullDomainDir = path.join(ROOT, dDir)
    const created = fs.existsSync(fullDomainDir) ? fullDomainDir : null
    console.log(`\n[delivery] 规格/特性的两半:`)
    console.log(`   规划链  ${path.relative(ROOT, specDir)}/   （四件套 + spec.json）`)
    console.log(
      created
        ? `   实现    ${dDir}/   （域名 ${scoped.domain} —— 打包/拆分部署按域工作）`
        : `   实现    尚未创建（域名 ${scoped.domain}）—— npm run domain:new ${scoped.domain}`,
    )
    console.log(`   元数据  scripts/data/${scoped.domain}-tables.ts（表定义真源，AGENTS §9.5）`)
    console.log(`   注意: 一个域可以承载多个特性；特性目录里**不该**有业务代码。`)
  }
  console.log(`\n[delivery] ${result.length} 个阶段，独立缺陷 ${distinctTotal} 项（缺失产物 ${missingArtifacts} + 未填文档 ${distinctSkeletons.size}）`)
  if (tasks && tasks.present) {
    if (tasks.empty) console.log(`   ✗ 任务表是空的 —— 没有任务树等于没规划`)
    else if (tasks.orphans.length === 0 && tasks.noWhitelist === 0) console.log(`[delivery] 任务树: ${tasks.total} 条，无孤儿任务`)
    for (const orphan of tasks.orphans) console.log(`   ✗ 孤儿任务: ${orphan}`)
    if (tasks.noWhitelist > 0) console.log(`   ✗ ${tasks.noWhitelist} 条任务没有文件白名单（1 Task = 1 Commit 无从核对）`)
  }
  if (evidenceSweep) {
    if (evidenceSweep.length === 0) console.log(`[delivery] 证据账本: ${expand("docs/specs/*/*/evidence.json").length} 份规格无一自报与证据不符`)
    for (const entry of evidenceSweep) {
      for (const problem of entry.problems) console.log(`   ✗ ${entry.spec}: ${problem}`)
    }
  }
  if (evidence) {
    if (!evidence.present) console.log(`[delivery] 证据: 没有 evidence.json —— gate 无从留痕`)
    else {
      const passed = evidence.totals.passed ?? 0
      const total = new Set(manifest.phases.map((phase) => phase.gate).filter(Boolean)).size
      console.log(`[delivery] 证据: ${passed}/${total} gate 通过${
        Object.entries(evidence.totals).filter(([key]) => key !== "passed" && key !== "pending").map(([key, value]) => `，${key} ${value}`).join("")
      }`)
      for (const problem of evidence.problems) console.log(`   ✗ ${problem}`)
    }
  }
  // --strict：门禁用法。此前本脚本**永远 exit 0**（纯报告），却被挂在 check 链里 ——
  // 即那一步不可能失败。报告用法见 `delivery:status`（无 --strict）。
  if (strict && distinctTotal > 0) {
    console.log(`\n[delivery] --strict: ${distinctTotal} 项缺陷 → exit 1`)
    process.exitCode = 1
  }
  if (bugs) {
    if (!bugs.present) console.log(`[delivery] 提示: 没有 bugs.md —— 缺陷无处记录（npm run feature:new 会生成）`)
    else {
      console.log(`[delivery] 缺陷: 未修 ${bugs.open} 条${bugs.malformed > 0 ? ` —— 有 ${bugs.malformed} 条缺复现/验证命令` : ""}`)
    }
  }
}

main()
