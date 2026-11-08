#!/usr/bin/env node
/**
 * E2E 页面拟人操作运营配置执行器与反 Seed 门禁 (Rule 0.8)
 *
 * 核心职责：
 * 1. `--check` 模式（静态契约与反 Seed 门禁）：
 *    - 校验 `test/agent/e2e-human-ops.spec.ts` 拟人运营配置剧本存在且完整；
 *    - 校验 `docs/agent/contracts.json` 中运营实体均具备完整的页面拟人操作选择器（createButton / form / formSubmit / table / fields）；
 *    - 校验 `MallSolutionService` 严禁包含 `ensureMallSeedData` / `deriveDynamicSeedCatalog` 等后台静默灌数逻辑；
 *    - 校验 `speckit` 引擎与交付工作流 (`feature-delivery.workflow.json`、`runbook-template.json`) 已内置 E2E 页面拟人运营配置步骤。
 * 2. 实跑模式（`pnpm run e2e:ops [--domain <domain>]`）：
 *    - 先执行静态反 Seed 与选择器契约校验，随后启动 Playwright 执行 `test/agent/e2e-human-ops.spec.ts` 真实浏览器页面拟人点击填表运营配置。
 */
const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..", "..")

function parseArgs(argv) {
  const args = {
    checkOnly: false,
    domain: "mall",
    json: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === "--check") args.checkOnly = true
    else if (token === "--json") args.json = true
    else if (token === "--domain" && argv[i + 1]) {
      args.domain = argv[++i]
    }
  }
  return args
}

function runStaticVerification(targetDomain = "mall") {
  const errors = []
  const checks = []

  // 1. 检查 E2E 页面拟人操作测试规范文件
  const specRel = "test/agent/e2e-human-ops.spec.ts"
  const specAbs = path.join(ROOT, specRel)
  if (!fs.existsSync(specAbs)) {
    errors.push(`缺失 E2E 页面拟人运营配置脚本: ${specRel}`)
  } else {
    const content = fs.readFileSync(specAbs, "utf8")
    if (!content.includes("MALL_HUMAN_OPS_PLAYBOOK") || !content.includes("humanConfigureEntityOnPage")) {
      errors.push(`${specRel} 缺失拟人运营配置剧本 (MALL_HUMAN_OPS_PLAYBOOK / humanConfigureEntityOnPage)`)
    } else {
      checks.push(`✓ E2E 页面拟人运营配置剧本就绪 (${specRel})`)
    }
  }

  // 2. 反 Seed 铁律检查：禁止 MallSolutionService 后台静默自动 Seed 商品/优惠券/营销活动
  const mallServiceRel = "packages/plugins/plugin-mall/backend/services/mall-solution.service.ts"
  const mallServiceAbs = path.join(ROOT, mallServiceRel)
  if (fs.existsSync(mallServiceAbs)) {
    const serviceCode = fs.readFileSync(mallServiceAbs, "utf8")
    if (serviceCode.includes("ensureMallSeedData") || serviceCode.includes("deriveDynamicSeedCatalog")) {
      errors.push(
        `违反反 Seed 铁律 (Rule 0.8): ${mallServiceRel} 仍包含后台静默 Seed 逻辑 (ensureMallSeedData / deriveDynamicSeedCatalog)，必须全量改为 E2E 页面拟人运营配置！`,
      )
    } else {
      checks.push(`✓ 反 Seed 铁律核验通过: ${mallServiceRel} 零后台静默灌数`)
    }
  }

  // 3. 核验 docs/agent/contracts.json 运营页面选择器契约
  const contractsRel = "docs/agent/contracts.json"
  const contractsAbs = path.join(ROOT, contractsRel)
  if (!fs.existsSync(contractsAbs)) {
    errors.push(`缺失 Agent 契约注册表: ${contractsRel}`)
  } else {
    const registry = JSON.parse(fs.readFileSync(contractsAbs, "utf8"))
    const contracts = Array.isArray(registry.contracts) ? registry.contracts : []
    const requiredMallKebabs = [
      "product-category",
      "product-spu",
      "product-sku",
      "coupon-template",
      "reward-activity",
      "seckill-activity",
      "delivery-express",
      "trade-order",
    ]
    for (const kebab of requiredMallKebabs) {
      const found = contracts.find((c) => c.domain === "mall" && c.kebab === kebab)
      if (!found) {
        errors.push(`mall.${kebab} 缺失 Agent 页面拟人操作契约`)
        continue
      }
      for (const selKey of ["title", "createButton", "form", "formSubmit", "table"]) {
        if (!found.selectors || !found.selectors[selKey]) {
          errors.push(`mall.${kebab} 缺失拟人操作选择器 selectors.${selKey}`)
        }
      }
    }

    const domainContracts = contracts.filter((c) => c.domain === targetDomain)
    if (domainContracts.length === 0) {
      errors.push(`目标域 ${targetDomain} 在 ${contractsRel} 中无可用页面拟人操作契约`)
    } else {
      checks.push(
        `✓ 目标域 [${targetDomain}] 共 ${domainContracts.length} 个后台页面全部具备拟人操作选择器契约 (createButton / form / formSubmit / table)`,
      )
    }
  }

  // 4. 核验 speckit 引擎与工作流模板已固化 E2E 页面拟人运营配置步骤
  const speckitRel = "scripts/speckit.ts"
  const speckitAbs = path.join(ROOT, speckitRel)
  if (fs.existsSync(speckitAbs)) {
    const speckitCode = fs.readFileSync(speckitAbs, "utf8")
    if (!speckitCode.includes("E2E") || !speckitCode.includes("拟人")) {
      errors.push(`${speckitRel} 未内置 E2E 页面拟人运营配置波次与任务模板`)
    } else {
      checks.push(`✓ Speckit 引擎已内置 E2E 页面拟人运营配置波次与反 Seed 约束 (${speckitRel})`)
    }
  }

  const workflowRel = ".agents/workflows/feature-delivery.workflow.json"
  const workflowAbs = path.join(ROOT, workflowRel)
  if (fs.existsSync(workflowAbs)) {
    const wfCode = fs.readFileSync(workflowAbs, "utf8")
    if (!wfCode.includes("e2e-human-ops")) {
      errors.push(`${workflowRel} 未包含 e2e-human-ops 拟人运营配置节点`)
    } else {
      checks.push(`✓ 交付工作流已内置 e2e-human-ops 拟人运营配置节点 (${workflowRel})`)
    }
  }

  return {
    ok: errors.length === 0,
    domain: targetDomain,
    checks,
    errors,
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const report = runStaticVerification(args.domain)

  if (args.json) {
    console.log(JSON.stringify(report, null, 2))
    process.exit(report.ok ? 0 : 1)
  }

  console.log("🤖 [e2e:ops] E2E 页面拟人运营配置与反 Seed 门禁核验")
  for (const item of report.checks) {
    console.log(`  ${item}`)
  }
  if (!report.ok) {
    for (const err of report.errors) {
      console.error(`  ✗ ${err}`)
    }
    process.exit(1)
  }

  if (args.checkOnly) {
    console.log("✅ [e2e:ops:check] 全部通过（零数据库静默 Seed，100% E2E 页面拟人操作契约就绪）")
    process.exit(0)
  }

  console.log(`🚀 [e2e:ops] 启动 Playwright 执行真实页面拟人运营配置 (domain=${args.domain})...`)
  const res = spawnSync("pnpm", ["exec", "playwright", "test", "test/agent/e2e-human-ops.spec.ts"], {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      E2E_OPS_DOMAIN: args.domain,
    },
  })
  process.exit(res.status ?? 0)
}

if (require.main === module) {
  main()
}

module.exports = {
  runStaticVerification,
}
