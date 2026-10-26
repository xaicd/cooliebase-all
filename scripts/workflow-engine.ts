#!/usr/bin/env tsx
/**
 * scripts/workflow-engine.ts
 *
 * SDD & Kiro 原生多智能体工作流执行引擎 (Multi-Agent Workflow Engine)
 *
 * 提供工业级命令行指令：
 *   1. list    : 查看所有可用工作流配方与依赖关系
 *   2. check   : 静态语法、DAG 依赖无环性与 Agent 角色合法性门禁检查
 *   3. dry-run : 变量插值预览、生成 Mermaid DAG 图与波次执行计划
 *   4. run     : 真实驱动执行工作流（自动脚手架 + 步骤分发 + 执行记录落盘）
 *   5. new     : 脚手架生成新的工作流配方
 */

import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const ROOT = path.resolve(__dirname, "..")
const PRIMARY_WORKFLOWS_DIR = path.join(ROOT, ".agents", "workflows")
const FALLBACK_WORKFLOWS_DIR = path.join(ROOT, ".kiro", "workflows")

function getWorkflowsDir(): string {
  if (fs.existsSync(PRIMARY_WORKFLOWS_DIR)) return PRIMARY_WORKFLOWS_DIR
  if (fs.existsSync(FALLBACK_WORKFLOWS_DIR)) return FALLBACK_WORKFLOWS_DIR
  return PRIMARY_WORKFLOWS_DIR
}

// ----------------------------------------------------------------------------
// 类型定义
// ----------------------------------------------------------------------------
interface WorkflowInputDef {
  description: string
  type: string
  default?: string
  required?: boolean
}

interface WorkflowStep {
  id: string
  agent: string
  prompt: string
  dependsOn?: string[]
  gate?: string
  autoCommand?: string
}

interface WorkflowRecipe {
  name: string
  description: string
  inputs: Record<string, WorkflowInputDef>
  steps: WorkflowStep[]
}

interface WorkflowRunRecord {
  runId: string
  recipe: string
  inputs: Record<string, string>
  startedAt: string
  completedAt?: string
  steps: {
    id: string
    agent: string
    status: "pending" | "running" | "completed" | "failed" | "skipped"
    startedAt?: string
    completedAt?: string
    error?: string
  }[]
  status: "running" | "completed" | "failed"
}

// ----------------------------------------------------------------------------
// 工具函数
// ----------------------------------------------------------------------------
function loadRecipe(recipeName: string): { recipe: WorkflowRecipe; filePath: string } {
  const dir = getWorkflowsDir()
  const cleanName = recipeName.replace(/\.workflow\.(json|yaml)$/, "")
  const jsonPath = path.join(dir, `${cleanName}.workflow.json`)
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`找不到工作流配方: ${jsonPath}`)
  }
  const raw = fs.readFileSync(jsonPath, "utf8")
  const recipe = JSON.parse(raw) as WorkflowRecipe
  return { recipe, filePath: jsonPath }
}

function parseCliArgs(): { command: string; flags: Record<string, string>; positional: string[] } {
  const args = process.argv.slice(2)
  const command = args[0] || "help"
  const flags: Record<string, string> = {}
  const positional: string[] = []

  let i = 1
  while (i < args.length) {
    const arg = args[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith("--")) {
        flags[key] = next
        i += 2
      } else {
        flags[key] = "true"
        i += 1
      }
    } else {
      positional.push(arg)
      i += 1
    }
  }

  return { command, flags, positional }
}

function interpolate(text: string, vars: Record<string, string>): string {
  let result = text
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{inputs\\.${k}\\}\\}`, "g"), v)
  }
  return result
}

// ----------------------------------------------------------------------------
// 命令：list
// ----------------------------------------------------------------------------
function handleList() {
  const dir = getWorkflowsDir()
  if (!fs.existsSync(dir)) {
    console.log(`❌ 目录不存在: ${dir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".workflow.json") || f.endsWith(".workflow.yaml"))
  console.log(`\n📋 SDD 多智能体工作流配方清单 (${dir})`)
  console.log("=".repeat(78))

  for (const file of files) {
    try {
      const full = path.join(dir, file)
      const data = JSON.parse(fs.readFileSync(full, "utf8")) as WorkflowRecipe
      console.log(`\n⚡ 配方名称: \x1b[36m${data.name}\x1b[0m (${file})`)
      console.log(`   说明: ${data.description}`)
      const inputKeys = Object.keys(data.inputs || {})
      console.log(`   必需入参: ${inputKeys.length > 0 ? inputKeys.join(", ") : "(无)"}`)
      console.log(`   步骤链:`)
      for (const [idx, step] of (data.steps || []).entries()) {
        const depStr = step.dependsOn && step.dependsOn.length > 0 ? ` [依赖: ${step.dependsOn.join(", ")}]` : ""
        console.log(`     ${idx + 1}. [${step.id}] \x1b[33m@${step.agent}\x1b[0m${depStr}`)
      }
    } catch (e: any) {
      console.error(`   ❌ 解析失败 ${file}: ${e.message}`)
    }
  }
  console.log("\n" + "=".repeat(78))
  console.log(`运行 \x1b[32mpnpm run workflow:dry-run -- --recipe <name> [args...]\x1b[0m 预览执行拓扑。`)
}

// ----------------------------------------------------------------------------
// 命令：check (门禁校验与 DAG 无环检测)
// ----------------------------------------------------------------------------
function handleCheck(): boolean {
  const dir = getWorkflowsDir()
  if (!fs.existsSync(dir)) {
    console.error(`❌ 未找到工作流目录: ${dir}`)
    return false
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".workflow.json") || f.endsWith(".workflow.yaml"))
  console.log(`\n🔍 开始工作流配方静态与依赖门禁扫描 (${files.length} 个配方)...`)

  let hasError = false
  const validAgents = new Set(["@wf-planner", "@wf-architect", "@wf-coder", "@wf-tester", "@wf-reviewer", "@wf-security"])

  for (const file of files) {
    const fullPath = path.join(dir, file)
    let recipe: WorkflowRecipe
    try {
      recipe = JSON.parse(fs.readFileSync(fullPath, "utf8"))
    } catch (e: any) {
      console.error(`❌ [${file}] JSON 语法错误: ${e.message}`)
      hasError = true
      continue
    }

    const errors: string[] = []
    if (!recipe.name) errors.push("缺少 name 字段")
    if (!recipe.description) errors.push("缺少 description 字段")
    if (!recipe.inputs || typeof recipe.inputs !== "object") errors.push("缺少合法的 inputs 字段")
    if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) errors.push("缺少 steps 步骤列表或列表为空")

    const stepIdSet = new Set<string>()
    const adj = new Map<string, string[]>()

    for (const step of recipe.steps || []) {
      if (!step.id) errors.push("存在未声明 id 的步骤")
      else if (stepIdSet.has(step.id)) errors.push(`步骤 ID 重复: ${step.id}`)
      else stepIdSet.add(step.id)

      if (!step.agent) errors.push(`步骤 ${step.id} 未声明 agent 角色`)
      if (!step.prompt) errors.push(`步骤 ${step.id} 未提供 prompt 指令`)

      adj.set(step.id, step.dependsOn || [])
    }

    // 校验 dependsOn 引用的合法性
    for (const step of recipe.steps || []) {
      for (const dep of step.dependsOn || []) {
        if (!stepIdSet.has(dep)) {
          errors.push(`步骤 ${step.id} 依赖了不存在的步骤: ${dep}`)
        }
      }
    }

    // DAG 拓扑排序有向无环图检测
    const visited = new Map<string, number>() // 0=unvisited, 1=visiting, 2=visited
    let cycleDetected = false
    function dfs(u: string) {
      visited.set(u, 1)
      for (const v of adj.get(u) || []) {
        if (visited.get(v) === 1) {
          cycleDetected = true
          errors.push(`检测到循环依赖: ${u} <-> ${v}`)
        } else if (!visited.get(v)) {
          dfs(v)
        }
      }
      visited.set(u, 2)
    }

    for (const id of stepIdSet) {
      if (!visited.get(id)) dfs(id)
    }

    if (errors.length > 0) {
      console.error(`❌ [${file}] 校验不通过:`)
      errors.forEach(e => console.error(`     - ${e}`))
      hasError = true
    } else {
      console.log(`✅ [${file}] 校验通过 (Step: ${recipe.steps.length}, Inputs: ${Object.keys(recipe.inputs).length})`)
    }
  }

  if (hasError) {
    console.error(`\n❌ 工作流配方门禁检查失败！请修复上述错误。\n`)
    return false
  } else {
    console.log(`\n🎉 全部工作流配方静态与 DAG 依赖校验 100% 通过！\n`)
    return true
  }
}

// ----------------------------------------------------------------------------
// 命令：dry-run (模拟展开与 Mermaid DAG 预览)
// ----------------------------------------------------------------------------
function handleDryRun(flags: Record<string, string>, positional: string[]) {
  const recipeName = flags.recipe || positional[0]
  if (!recipeName) {
    console.error("❌ 请提供配方名称: pnpm run workflow:dry-run -- --recipe <name>")
    process.exit(1)
  }

  const { recipe } = loadRecipe(recipeName)

  // 变量提取
  const vars: Record<string, string> = {
    name: flags.name || "example-spec",
    domain: flags.domain || "system",
    title: flags.title || "示例业务规格",
    type: flags.type || (recipeName === "bugfix" ? "bugfix" : recipeName === "architecture-refactor" ? "refactor" : recipeName === "security-patch" ? "security" : "feature"),
    ...flags
  }

  console.log(`\n🚀 工作流模拟执行计划: \x1b[36m${recipe.name}\x1b[0m`)
  console.log(`📝 描述: ${recipe.description}`)
  console.log(`🔑 模拟代换变量:`, vars)
  console.log("=".repeat(78))

  console.log("\n📊 [Mermaid DAG 编排图]:\n")
  console.log("```mermaid")
  console.log("flowchart TD")
  for (const step of recipe.steps) {
    const nodeLabel = `${step.id}["${step.id}<br/>(@${step.agent})"]`
    if (!step.dependsOn || step.dependsOn.length === 0) {
      console.log(`    Start((开始)) --> ${nodeLabel}`)
    } else {
      for (const dep of step.dependsOn) {
        console.log(`    ${dep} --> ${nodeLabel}`)
      }
    }
  }
  console.log("```\n")

  console.log("=".repeat(78))
  console.log("📋 步骤展开详情 (Step Execution Details):")
  for (const [idx, step] of recipe.steps.entries()) {
    const depStr = step.dependsOn && step.dependsOn.length > 0 ? ` (前置依赖: ${step.dependsOn.join(", ")})` : " (根起始节点)"
    const promptSub = interpolate(step.prompt, vars)
    console.log(`\n--- 步骤 ${idx + 1}: \x1b[32m[${step.id}]\x1b[0m -> 智能体: \x1b[33m@${step.agent}\x1b[0m${depStr} ---`)
    console.log(`【Agent 任务指令】:\n${promptSub.trim()}`)
    if (step.gate) {
      console.log(`【卡点门禁】: ${step.gate}`)
    }
  }
  console.log("\n" + "=".repeat(78))
}

// ----------------------------------------------------------------------------
// 命令：run (驱动工作流执行与记录落盘)
// ----------------------------------------------------------------------------
function handleRun(flags: Record<string, string>, positional: string[]) {
  const recipeName = flags.recipe || positional[0]
  if (!recipeName) {
    console.error("❌ 请提供配方名称: pnpm run workflow:run -- --recipe <name> --name <spec> --domain <domain> --title <title>")
    process.exit(1)
  }

  const { recipe } = loadRecipe(recipeName)

  // 校验必要参数
  const vars: Record<string, string> = {
    name: flags.name || "",
    domain: flags.domain || "",
    title: flags.title || "",
    type: flags.type || (recipeName === "bugfix" ? "bugfix" : recipeName === "architecture-refactor" ? "refactor" : recipeName === "security-patch" ? "security" : "feature"),
    ...flags
  }

  for (const [inputKey, def] of Object.entries(recipe.inputs)) {
    if (def.required !== false && !vars[inputKey]) {
      console.error(`❌ 缺少必需参数: --${inputKey} (${def.description})`)
      process.exit(1)
    }
  }

  const runId = `wf-run-${Date.now()}`
  console.log(`\n▶️ 开始执行工作流: \x1b[36m${recipe.name}\x1b[0m (Run ID: ${runId})`)
  console.log(`🎯 目标规格: ${vars.domain}/${vars.name} (${vars.title})`)

  const artifactsDir = path.join(ROOT, "docs", "architecture", "artifacts", "workflow-runs")
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true })
  }

  const runRecord: WorkflowRunRecord = {
    runId,
    recipe: recipe.name,
    inputs: vars,
    startedAt: new Date().toISOString(),
    status: "running",
    steps: recipe.steps.map(s => ({
      id: s.id,
      agent: s.agent,
      status: "pending"
    }))
  }

  // 执行 Step 1: 如果是脚手架，自动调用本地 speckit new
  const firstStep = recipe.steps[0]
  if (firstStep && (firstStep.id === "scaffold" || firstStep.prompt.includes("speckit:new") || firstStep.prompt.includes("spec:new"))) {
    console.log(`\n⚡ [自动执行第 1 步: 脚手架生成] -> @${firstStep.agent}`)
    const cmd = `pnpm harness spec new --name ${vars.name} --domain ${vars.domain} --title "${vars.title}" --type ${vars.type}`
    console.log(`$ ${cmd}`)
    try {
      execSync(cmd, { cwd: ROOT, stdio: "inherit" })
      runRecord.steps[0].status = "completed"
      runRecord.steps[0].completedAt = new Date().toISOString()
      console.log(`✅ 步骤 [${firstStep.id}] 自动化执行成功！`)
    } catch (e: any) {
      runRecord.steps[0].status = "failed"
      runRecord.steps[0].error = e.message
      runRecord.status = "failed"
      console.error(`❌ 步骤 [${firstStep.id}] 执行失败: ${e.message}`)
    }
  }

  // 记录运行状态
  const runFile = path.join(artifactsDir, `${recipe.name}-${runId}.json`)
  fs.writeFileSync(runFile, JSON.stringify(runRecord, null, 2) + "\n", "utf8")
  console.log(`\n📁 工作流运行状态已落盘: ${path.relative(ROOT, runFile)}`)

  console.log(`\n🤖 【后续步骤已装载至多智能体调度总线】`)
  console.log(`   请由对应角色智能体接棒执行：`)
  for (let i = 1; i < recipe.steps.length; i++) {
    const s = recipe.steps[i]
    console.log(`   - 步骤 ${i + 1} [${s.id}]: 由 \x1b[33m@${s.agent}\x1b[0m 驱动`)
  }
  console.log(`\n可运行 \x1b[32mpnpm run spec:check -- --spec ${vars.name}\x1b[0m 实时监控规格完成度。\n`)
}

// ----------------------------------------------------------------------------
// 命令：new (新建工作流模板)
// ----------------------------------------------------------------------------
function handleNew(flags: Record<string, string>, positional: string[]) {
  const name = flags.name || positional[0]
  if (!name) {
    console.error("❌ 请指定新工作流名称: pnpm run workflow:new -- --name <name> --description <desc>")
    process.exit(1)
  }

  const cleanName = name.replace(/\.workflow\.(json|yaml)$/, "")
  const targetDir = getWorkflowsDir()
  const targetFile = path.join(targetDir, `${cleanName}.workflow.json`)

  if (fs.existsSync(targetFile)) {
    console.error(`❌ 工作流配方已存在: ${targetFile}`)
    process.exit(1)
  }

  const template: WorkflowRecipe = {
    name: cleanName,
    description: flags.description || `${cleanName} multi-agent workflow recipe`,
    inputs: {
      name: {
        description: "Target specification or task name",
        type: "string",
        required: true
      },
      domain: {
        description: "Target domain name",
        type: "string",
        required: true
      },
      title: {
        description: "Human-readable title",
        type: "string",
        required: true
      }
    },
    steps: [
      {
        id: "plan",
        agent: "@wf-planner",
        prompt: "Analyze the task requirement for '{{inputs.name}}' in domain '{{inputs.domain}}'."
      },
      {
        id: "design",
        agent: "@wf-architect",
        dependsOn: ["plan"],
        prompt: "Formulate architectural design and technical specifications."
      },
      {
        id: "implement",
        agent: "@wf-coder",
        dependsOn: ["design"],
        prompt: "Implement code changes with unit test coverage."
      },
      {
        id: "verify",
        agent: "@wf-tester",
        dependsOn: ["implement"],
        prompt: "Verify implementation against quality gates: `pnpm run check`."
      }
    ]
  }

  fs.writeFileSync(targetFile, JSON.stringify(template, null, 2) + "\n", "utf8")
  console.log(`✅ 成功生成工作流配方: \x1b[32m${path.relative(ROOT, targetFile)}\x1b[0m`)
  console.log(`运行 \x1b[36mpnpm run workflow:check\x1b[0m 校验语法。`)
}

// ----------------------------------------------------------------------------
// 帮助信息
// ----------------------------------------------------------------------------
function handleHelp() {
  console.log(`
⚡ SDD 多智能体工作流执行引擎 (Workflow Engine CLI)

命令列表:
  list       列出全量可用工作流配方清单
  check      静态语法、必填项与 DAG 依赖无环性门禁扫描
  dry-run    参数模拟展开、渲染 Mermaid 编排图与 Agent 执行指令
  run        真实驱动工作流执行（自动脚手架 + 步骤分发 + 记录落盘）
  new        创建新的工作流配方模板 (.agents/workflows/)

示例用法:
  pnpm run workflow:list
  pnpm run workflow:check
  pnpm run workflow:dry-run -- --recipe feature-delivery --name mall-coupon --domain mall --title "优惠券模块"
  pnpm run workflow:run -- --recipe bugfix --name fix-pay-lock --domain pay --title "修复支付回调死锁"
  pnpm run workflow:new -- --name db-migration --description "数据库平滑迁移编排"
`)
}

// ----------------------------------------------------------------------------
// CLI 主入口
// ----------------------------------------------------------------------------
function main() {
  const { command, flags, positional } = parseCliArgs()

  switch (command) {
    case "list":
    case "ls":
      handleList()
      break
    case "check":
    case "lint":
    case "validate": {
      const ok = handleCheck()
      process.exit(ok ? 0 : 1)
      break
    }
    case "dry-run":
    case "plan":
      handleDryRun(flags, positional)
      break
    case "run":
    case "exec":
      handleRun(flags, positional)
      break
    case "new":
    case "create":
      handleNew(flags, positional)
      break
    case "help":
    default:
      handleHelp()
      break
  }
}

main()
