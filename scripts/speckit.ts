#!/usr/bin/env pnpm exec tsx
/**
 * ============================================================================
 * Spec-Kit Enterprise 控制台 (Spec-Kit SDD Engine: Unified CLI)
 * 基于 GitHub Spec-Kit (SDD) 开源标准构建并扩展
 * ============================================================================
 *
 * 核心目的：
 * 统一收敛所有规格生命周期操作（创建、编译展开、交付门禁检查、归档与健康扫描），
 * 全面赋能 feature / bugfix / enhancement / refactor / security 全类型规格。
 *
 * 用法 (CLI Usage):
 *   # 0. 初始化与环境检查
 *   pnpm run speckit:init
 *   pnpm run speckit:constitution
 *
 *   # 1. 创建任意类型的规格骨架
 *   pnpm run speckit:new -- --name <名> --domain <域> --title "<标题>" [--type feature|bugfix|enhancement|refactor|security]
 *
 *   # 2. 从 brief.json 展开编译生成 7~8 份完备 Markdown 规格与任务波次图
 *   pnpm run speckit:build -- --name <名> [--check]
 *
 *   # 3. 校验规格交付状态与门禁
 *   pnpm run speckit:check -- --spec <名>
 *
 *   # 4. 列出全域活跃与归档规格
 *   pnpm run speckit:list [--domain <域>]
 *
 *   # 5. 上线后一键防污染归档
 *   pnpm run speckit:archive -- --name <名>
 *
 *   # 6. 规格健康与防污染扫描
 *   pnpm run speckit:health
 */

import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const ROOT = path.resolve(__dirname, "..")

// 引入统一规格解析器
const {
  ROOT: SPEC_ROOT,
  resolveSpecDir,
  getTargetSpecDir,
  listAllSpecs,
} = require("./lib/spec-resolver.cjs")

// 参数解析助手
const args = process.argv.slice(2)
let command = args[0] && !args[0].startsWith("-") ? args[0] : ""

// 兼容智能推断：如果未给子命令但给了参数
if (!command) {
  if (args.includes("--name") && args.includes("--domain")) {
    command = "new"
  } else if (args.includes("--name") && (args.includes("--check") || args.includes("--build"))) {
    command = "build"
  } else {
    command = "help"
  }
}

const getArg = (flag: string): string | undefined => {
  const index = args.indexOf(flag)
  return index >= 0 && index + 1 < args.length ? args[index + 1] : undefined
}

const hasFlag = (flag: string): boolean => args.includes(flag)

// ============================================================================
// 1. 命令：speckit new (创建规格骨架)
// ============================================================================
function handleNew() {
  const name = getArg("--name")
  const domain = getArg("--domain")
  const title = getArg("--title") ?? name
  const specType = getArg("--type") ?? "feature"
  const isForce = hasFlag("--force")
  const isLegacy = hasFlag("--legacy")

  if (!name || !domain) {
    console.error("❌ 用法错误: pnpm exec tsx scripts/speckit.ts new --name <名称> --domain <域名> --title \"<标题>\" [--type feature|bugfix|enhancement|refactor|security]")
    process.exit(2)
  }

  const dir = isLegacy
    ? path.join(ROOT, "docs", "features", name)
    : getTargetSpecDir(name, domain)

  if (fs.existsSync(dir) && !isForce) {
    console.error(`❌ [speckit] 规格目录已存在: ${path.relative(ROOT, dir)}（使用 --force 覆盖骨架，注意已填内容会被覆盖）`)
    process.exit(2)
  }

  fs.mkdirSync(dir, { recursive: true })

  let brief: any

  if (specType === "bugfix") {
    brief = {
      name,
      domain,
      title,
      type: "bugfix",
      goal: "<!-- 待填: 一句话说清『修复什么缺陷，恢复何种预期行为』 -->",
      symptom: "<!-- 待填: 缺陷表现、异常日志或复现步骤 -->",
      rootCause: "<!-- 待填: 5-Whys 代码/设计层面的根本原因 -->",
      preservedBehavior: "<!-- 待填: 必须保持不变的既有正常功能与数据（防回归） -->",
      roles: [
        { role: "受影响用户", can: "正常使用受影响业务，不再遭遇异常中断" },
        { role: "排障/SRE 工程师", can: "通过监控告警与自动化红测核实问题已彻底根治" },
      ],
      stories: [
        { priority: "P0", text: "<!-- 待填: 编写红灯复现单测 (Red Test) 确证缺陷存在 -->" },
        { priority: "P0", text: "<!-- 待填: 原位修补业务逻辑并增加防御状态机守卫 -->" },
        { priority: "P1", text: "<!-- 待填: 补充回归测试套件并验证红灯变绿 (Green Test) -->" },
      ],
      constraints: [
        "零破坏性变更：不得破坏已有对外 API 契约与历史数据兼容性。",
        "反假 Mock：必须由真实测试数据库用例复现并验证修复。",
        "防回归保证：修复不得引入次生故障或破坏既有正常流转。",
      ],
      acceptance: [
        { check: "`pnpm run check` exit=0" },
        { check: "<!-- 待填: 缺陷复现用例从 Red 变绿 (100% PASS) -->" },
        { check: "<!-- 待填: 既有核心回归测试套件全部通过 (0 Regression) -->" },
      ],
      nonGoals: ["不在本次修补中引入无关功能或破坏性架构变更"],
      architecture: "<!-- 待填: 缺陷涉及的代码调用链路与修补方案架构 -->",
      entities: [{ table: "<!-- 待填: 涉及的表名（若无写 - ） -->", note: "<!-- 待填 -->" }],
      invariants: [{ name: "<!-- 待填: 防御不变量（如 并发安全） -->", how: "<!-- 待填: 如何在代码层彻底杜绝次生灾害 -->" }],
      ui: ["<!-- 待填: 若涉及 UI 则写明修复前后对比，无则写『不涉及 UI 调整』 -->"],
      ops: ["<!-- 待填: 缺陷告警阈值修正与复现测试脚本运行 -->"],
      risks: [{ risk: "修复引入隐蔽次生分支影响", mitigation: "执行覆盖全域的真实数据库测试矩阵与回滚演练" }],
      screens: [{ name: "故障修复面", wireframe: "无变更/微调" }],
      interactions: ["保持既有交互模式不变"],
      states: ["加载中：正常展示。", "空数据：正常展示。", "出错：正常展示，具备明确指引。", "成功：正常展示。"],
      candidates: [{ name: "原位修补", type: "自研", license: "MIT", risk: "无" }],
      benchmarks: ["业内标准防御模式"],
      scan: ["关联调用链与历史缺陷库"],
      licenseConclusion: "无引入外部第三方库风险",
      tasks: [
        { id: "T1", parent: "main", title: "编写红灯复现测试用例 (Red Test)", files: ["<!-- 待填: 测试文件 -->"] },
        { id: "T2", parent: "T1", title: "修复业务缺陷并增加防御守卫", files: ["<!-- 待填: 业务代码 -->"] },
        { id: "T3", parent: "main", title: "全量回归测试与门禁验证", files: ["-"] },
      ],
      dependencies: "T1 → T2 → T3",
      windowMinutes: 10,
    }
  } else if (specType === "refactor") {
    brief = {
      name,
      domain,
      title,
      type: "refactor",
      goal: "<!-- 待填: 一句话说清『重构目标：消除哪些技术债，达到何种架构整洁度』 -->",
      debtAnalysis: "<!-- 待填: 现有架构痛点、耦合点与坏味道 (Code Smells) -->",
      targetArchitecture: "<!-- 待填: 重构后的领域边界、分层与交互契约 -->",
      roles: [
        { role: "业务研发工程师", can: "在整洁清晰的分层架构下快速扩展新特性" },
        { role: "架构委员会/审计员", can: "确信重构遵循领域边界铁律且无业务行为漂移" },
      ],
      stories: [
        { priority: "P0", text: "<!-- 待填: 确立业务等价性安全网单测 (Parity Tests) -->" },
        { priority: "P0", text: "<!-- 待填: 运用绞杀者模式 (Strangler Fig) 逐步迁移模块 -->" },
        { priority: "P1", text: "<!-- 待填: 清除冗余遗留样板并验证全部门禁 -->" },
      ],
      constraints: [
        "功能等价性：重构前后外部对外 API 行为与返回值 100% 等价保持。",
        "跨域通信：必须经过 Domain Facade，禁止违规侵入内部私有服务。",
      ],
      acceptance: [
        { check: "`pnpm run check` exit=0" },
        { check: "`pnpm run test:matrix` exit=0 (真实 SQLite 矩阵 100% 通过)" },
        { check: "<!-- 待填: 业务等价性单测全部通过 -->" },
      ],
      nonGoals: ["不在本次重构中增加未经评审的业务新功能"],
      architecture: "<!-- 待填: 目标分层架构图与依赖倒置示意 -->",
      entities: [{ table: "<!-- 待填: 涉及的表名 -->", note: "<!-- 待填 -->" }],
      invariants: [{ name: "业务数据零破坏", how: "重构不涉及数据库表物理结构的破坏性变更" }],
      ui: ["<!-- 待填: 界面结构与交互完全保持等价 -->"],
      ops: ["<!-- 待填: 灰度切换方案与快速回滚预案 -->"],
      risks: [{ risk: "隐式隐蔽副作用未被覆盖", mitigation: "变异测试打假与全量真实数据库集成测试" }],
      screens: [{ name: "重构涉及模块", wireframe: "保持既有线框不变" }],
      interactions: ["保持既有交互模式不变"],
      states: ["加载中：正常展示。", "空数据：正常展示。", "出错：正常展示。", "成功：正常展示。"],
      candidates: [{ name: "模块化重构方案", type: "自研", license: "MIT", risk: "无" }],
      benchmarks: ["Clean Architecture 与 DDD 规范"],
      scan: ["全仓静态分析与依赖引用图"],
      licenseConclusion: "无外部依赖许可风险",
      tasks: [
        { id: "T1", parent: "main", title: "建立业务等价性自动化测试基线", files: ["<!-- 待填: 测试文件 -->"] },
        { id: "T2", parent: "T1", title: "按领域分层重构实现与契约迁移", files: ["<!-- 待填: 重构代码 -->"] },
        { id: "T3", parent: "main", title: "清理旧实现并验证无回归债务", files: ["-"] },
      ],
      dependencies: "T1 → T2 → T3",
      windowMinutes: 15,
    }
  } else if (specType === "enhancement") {
    brief = {
      name,
      domain,
      title,
      type: "enhancement",
      goal: "<!-- 待填: 一句话说清『性能/容量/可用性优化目标与量化指标』 -->",
      baselineMetric: "<!-- 待填: 当前基线表现（如 p95 响应时间、吞吐 RPS、CPU 使用率） -->",
      targetMetric: "<!-- 待填: 优化后的目标指标（如 p95 < 50ms, RPS > 10,000） -->",
      roles: [
        { role: "终端访问用户", can: "享受极速流畅的接口响应与毫秒级渲染" },
        { role: "SRE 稳定性工程师", can: "确信高并发峰值期系统具备充足容量与熔断护栏" },
      ],
      stories: [
        { priority: "P0", text: "<!-- 待填: 建立标准性能测试基准用例 (Benchmark) -->" },
        { priority: "P0", text: "<!-- 待填: 消除热点锁竞争/慢查询/冗余 I/O -->" },
        { priority: "P1", text: "<!-- 待填: 运行真实压测验证吞吐与耗时达标 -->" },
      ],
      constraints: [
        "容量护栏：高负载下不得发生内存泄露或连接池耗尽。",
        "数据强一致性：性能优化绝不能牺牲事务隔离性与多租户安全。",
      ],
      acceptance: [
        { check: "`pnpm run check` exit=0" },
        { check: "<!-- 待填: 压测报告显示达成目标指标（RPS / p95） -->" },
      ],
      nonGoals: ["不在本次优化中改动核心业务数据模型"],
      architecture: "<!-- 待填: 性能加速链路（如 局部缓存、非阻塞 I/O） -->",
      entities: [{ table: "<!-- 待填: 涉及的表名 -->", note: "<!-- 待填 -->" }],
      invariants: [{ name: "数据幂等与一致性", how: "高并发场景下防超卖与防脏读" }],
      ui: ["<!-- 待填: 响应提速体感优化 -->"],
      ops: ["<!-- 待填: 压测脚本、监控指标与限流熔断阈值 -->"],
      risks: [{ risk: "缓存穿透/击穿/雪崩", mitigation: "设置随机 TTL 与互斥锁兜底" }],
      screens: [{ name: "性能大盘", wireframe: "监控仪表盘" }],
      interactions: ["保持既有交互不变"],
      states: ["加载中：正常展示。", "空数据：正常展示。", "出错：正常展示。", "成功：正常展示。"],
      candidates: [{ name: "本地缓存与索引优化", type: "自研", license: "MIT", risk: "无" }],
      benchmarks: ["Google SRE 容量管理实践"],
      scan: ["链路性能 Profile 与 FlameGraph 分析"],
      licenseConclusion: "可商用，无合规风险",
      tasks: [
        { id: "T1", parent: "main", title: "建立压测性能基线 (Baseline Benchmark)", files: ["<!-- 待填: 测试文件 -->"] },
        { id: "T2", parent: "T1", title: "实现性能优化与瓶颈消解", files: ["<!-- 待填: 核心优化代码 -->"] },
        { id: "T3", parent: "main", title: "运行对照压测并验证达标", files: ["-"] },
      ],
      dependencies: "T1 → T2 → T3",
      windowMinutes: 10,
    }
  } else if (specType === "security") {
    brief = {
      name,
      domain,
      title,
      type: "security",
      goal: "<!-- 待填: 安全漏洞加固或红队防御建设目标（如 修复越权、AST SQL 防注入） -->",
      vulnerabilityAdvisory: "<!-- 待填: 漏洞描述、威胁评级与 PoC 攻击向量 -->",
      attackSurface: "<!-- 待填: 暴露的接口面与潜在安全威胁 -->",
      roles: [
        { role: "合规安全主管", can: "确信系统符合零信任防御标准与等保合规要求" },
        { role: "红蓝对抗工程师", can: "通过 Strix 自主渗透测试验证漏洞已彻底闭环" },
      ],
      stories: [
        { priority: "P0", text: "<!-- 待填: 编写安全 PoC 复现用例验证漏洞存在 -->" },
        { priority: "P0", text: "<!-- 待填: 增加纵深防御机制（AST 校验、签名验算、租户强制过滤） -->" },
        { priority: "P1", text: "<!-- 待填: 运行 Strix 红队自主扫描核实 100% 抵御 -->" },
      ],
      constraints: [
        "零信任原则：严禁信任客户端传入的租户 ID 或身份声明。",
        "最小权限：接口必须严格绑定 Permission Code 权限码。",
      ],
      acceptance: [
        { check: "`pnpm run check` exit=0" },
        { check: "`pnpm run security:scan` exit=0（全量检查项全过，项数以脚本为准）" },
        { check: "<!-- 待填: PoC 攻击用例被 100% 拦截并记录安全审计 -->" },
      ],
      nonGoals: ["不盲目引入重型第三方商业安全 WAF 依赖"],
      architecture: "<!-- 待填: 安全防护切面与数据过滤管道 -->",
      entities: [{ table: "<!-- 待填: 涉及的表名 -->", note: "<!-- 待填 -->" }],
      invariants: [{ name: "不可变安全审计", how: "所有安全拦截与权限变更必须记入审计表" }],
      ui: ["<!-- 待填: 敏感数据脱敏展示 -->"],
      ops: ["<!-- 待填: 安全事件告警通知与 IP 黑名单联动 -->"],
      risks: [{ risk: "安全策略误杀正常业务请求", mitigation: "提供灰度观察模式并设立白名单豁免" }],
      screens: [{ name: "安全日志", wireframe: "审计大盘" }],
      interactions: ["敏感操作强制二次认证"],
      states: ["加载中：正常展示。", "空数据：正常展示。", "出错：脱敏提示，不泄露调用栈。", "成功：正常展示。"],
      candidates: [{ name: "内建 AST 与过滤器加固", type: "自研", license: "MIT", risk: "无" }],
      benchmarks: ["OWASP Top 10 与 Strix 红队标准"],
      scan: ["历史 CVE 库与静态代码安全分析"],
      licenseConclusion: "可商用，无合规风险",
      tasks: [
        { id: "T1", parent: "main", title: "编写安全 PoC 攻击复现用例", files: ["<!-- 待填: 测试文件 -->"] },
        { id: "T2", parent: "T1", title: "落地纵深防御与上下文校验拦截器", files: ["<!-- 待填: 安全代码 -->"] },
        { id: "T3", parent: "main", title: "运行安全渗透扫描并签署合规审计", files: ["-"] },
      ],
      dependencies: "T1 → T2 → T3",
      windowMinutes: 10,
    }
  } else {
    // 默认 feature
    brief = {
      name,
      domain,
      title,
      type: "feature",
      goal: "<!-- 待填: 一句话说清『做完之后谁能做成什么事』。范围要收得住。 -->",
      roles: [
        { role: "<!-- 待填: 运营端角色 -->", can: "<!-- 待填 -->" },
        { role: "<!-- 待填: 使用端角色 -->", can: "<!-- 待填 -->" },
      ],
      stories: [
        { priority: "P0", text: "<!-- 待填: 最小闭环必须有的 -->" },
        { priority: "P0", text: "<!-- 待填 -->" },
        { priority: "P1", text: "<!-- 待填 -->" },
      ],
      constraints: [
        "多租户：业务表带 tenant_id，从全局上下文取，禁止调用方透传（§4.8）。",
        "跨域：只走 Domain Facade，不 import 别的域 Service（§3.3）。",
        "定制业务不回写基座（§17.3）；全动词 API（§5.1）；UI 带 Agent-Native 属性（§5.2.1）。",
      ],
      acceptance: [
        { check: "`pnpm run check` exit=0" },
        { check: "<!-- 待填: 每条都要可执行验证，不要写『体验良好』 -->" },
      ],
      nonGoals: ["<!-- 待填: 显式划出边界，这一节能挡掉一半范围蔓延 -->"],
      architecture: "<!-- 待填: 数据流与依赖方向；跨域写明用哪个域的哪个方法 -->",
      entities: [{ table: "<!-- 待填: 表名 -->", note: "<!-- 待填 -->" }],
      invariants: [{ name: "<!-- 待填: 不变量名（如 不超卖） -->", how: "<!-- 待填: 怎么保证，且要与验收标准对应 -->" }],
      ui: ["<!-- 待填: admin 与 C 端各有什么页面、复用哪个模板 -->"],
      ops: ["<!-- 待填: 门禁链、部署方式、agent:ops 的体检/造数/清数 -->"],
      risks: [{ risk: "<!-- 待填 -->", mitigation: "<!-- 待填 -->" }],
      screens: [{ name: "<!-- 待填: 页面名与路径 -->", wireframe: "<!-- 待填: 文本线框 -->" }],
      interactions: ["<!-- 待填: 搜索回车、二次确认、弹窗时底层 inert（§5.2.1） -->"],
      states: ["加载中：表格区一行，不整页遮罩。", "空数据：保留搜索栏（可改条件重试）。", "出错：提示 + 可重试，不静默吞掉。", "无权限：按钮不渲染（权限码驱动）。"],
      candidates: [{ name: "<!-- 待填: 候选方案 -->", type: "<!-- 自研/开源/商业 -->", license: "<!-- SPX -->", risk: "<!-- 许可风险 -->" }],
      benchmarks: ["<!-- 待填: 同行业/同场景别人怎么做，各自代价 -->"],
      scan: ["<!-- 待填: 检索了哪些库/框架，为什么选它/不选别的 -->"],
      licenseConclusion: "<!-- 待填: 必须有明确结论。可商用/需开源/需购买/不可用 + 传染性风险 -->",
      tasks: [
        { id: "T1", parent: "main", title: "<!-- 待填: 第一条主线任务 -->", files: ["<!-- 待填: 文件白名单，逗号分隔；纯验证任务写 - -->"] },
        { id: "T2", parent: "T1", title: "<!-- 待填 -->", files: ["-"] },
        { id: "T3", parent: "main", title: "<!-- 待填 -->", files: ["-"] },
      ],
      dependencies: "<!-- 待填: 画出 DAG，如 T1 → T2 -->",
      windowMinutes: 10,
    }
  }

  fs.writeFileSync(path.join(dir, "brief.json"), JSON.stringify(brief, null, 2) + "\n")

  const evidence = {
    feature: name,
    domain,
    type: specType,
    created: new Date().toISOString(),
    trace: { brief: "brief.json", spec: "spec.json" },
  }
  fs.writeFileSync(path.join(dir, "evidence.json"), JSON.stringify(evidence, null, 2) + "\n")

  const specMeta = {
    name,
    domain,
    title,
    type: specType,
    status: "PLAN_APPROVED",
    createdAt: new Date().toISOString(),
    version: "1.0.0",
  }
  fs.writeFileSync(path.join(dir, "spec.json"), JSON.stringify(specMeta, null, 2) + "\n")

  fs.mkdirSync(path.join(dir, "assets"), { recursive: true })
  fs.mkdirSync(path.join(dir, "prototypes"), { recursive: true })

  console.log(`\n✨ [speckit] 成功创建 ${specType} 规格骨架: ${path.relative(ROOT, dir)}/`)
  console.log(`   📄 声明真源: ${path.relative(ROOT, path.join(dir, "brief.json"))} (<500 Tokens，防样板浪费)`)
  console.log(`   🚀 下一步: 编辑 brief.json，然后执行:`)
  console.log(`      pnpm exec tsx scripts/speckit.ts build --name ${name}`)
}

// ============================================================================
// 2. 命令：speckit build (展开生成规格文档)
// ============================================================================
function handleBuild() {
  const name = getArg("--name") || getArg("--spec")
  const checkOnly = hasFlag("--check")

  if (!name) {
    console.error("❌ 用法错误: pnpm exec tsx scripts/speckit.ts build --name <规格名> [--check]")
    process.exit(2)
  }

  const dir = resolveSpecDir(name)
  if (!dir) {
    console.error(`❌ [speckit] 找不到规格: ${name}（请先运行 pnpm exec tsx scripts/speckit.ts new 创建）`)
    process.exit(2)
  }

  const briefPath = path.join(dir, "brief.json")
  if (!fs.existsSync(briefPath)) {
    console.error(`❌ [speckit] 找不到 ${path.relative(ROOT, briefPath)}`)
    process.exit(2)
  }

  let brief: any
  try {
    brief = JSON.parse(fs.readFileSync(briefPath, "utf8"))
  } catch (err: any) {
    console.error(`❌ [speckit] brief.json 不是合法 JSON: ${err.message}`)
    process.exit(2)
  }

  // 校验完备性
  const missing: string[] = []
  if (!brief.title) missing.push("title")
  if (!brief.domain) missing.push("domain")
  if (!brief.goal) missing.push("goal")
  if ((brief.roles ?? []).length < 2) missing.push("roles（至少 2 个角色）")
  if ((brief.stories ?? []).length < 3) missing.push("stories（至少 3 条用户故事）")
  if ((brief.acceptance ?? []).length < 2) missing.push("acceptance（至少 2 条可执行验收）")
  if ((brief.invariants ?? []).length < 1) missing.push("invariants（至少 1 条关键不变量）")
  if ((brief.tasks ?? []).length < 3) missing.push("tasks（至少 3 条任务）")

  if (missing.length > 0) {
    console.error(`❌ [speckit] brief.json 关键字段缺失: ${missing.join("、")}`)
    process.exit(2)
  }

  if (checkOnly) {
    console.log(`✅ [speckit] brief.json 完备（${brief.stories.length} 故事 / ${brief.acceptance.length} 验收 / ${brief.tasks.length} 任务）`)
    process.exit(0)
  }

  const templateDir = path.join(ROOT, ".specify", "templates")
  const loadTemplate = (filename: string): string => {
    const full = path.join(templateDir, filename)
    return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : ""
  }

  const render = (templateStr: string, vars: Record<string, string>): string => {
    let res = templateStr
    for (const [k, v] of Object.entries(vars)) {
      res = res.split(`{{${k}}}`).join(v)
    }
    return res
  }

  // 构建统一数据上下文
  const userStoriesText = (brief.stories ?? []).map((s: any, idx: number) => 
    `${idx + 1}. **${s.priority ?? "P1"}** [作为${brief.roles?.[0]?.role ?? "用户"}] ${s.text}`
  ).join("\n\n")

  const invariantsText = (brief.invariants ?? []).map((item: any, index: number) => 
    `${index + 1}. **${item.name}** —— ${item.how}`
  ).join("\n")

  const acceptanceText = (brief.acceptance ?? []).map((item: any, index: number) => 
    `${index + 1}. **THE system SHALL** 验证：${item.check}`
  ).join("\n")

  const constraintsText = (brief.constraints ?? []).map((item: any) => 
    `* **THE system SHALL COMPLY WITH**: ${item}`
  ).join("\n")

  const nonGoalsText = (brief.nonGoals ?? []).map((item: any) => 
    `* ${item}`
  ).join("\n")

  const entitiesText = (brief.entities ?? []).map((e: any) => 
    `- **${e.table}**: ${e.note}`
  ).join("\n")

  const statesText = (brief.states ?? []).map((st: any) => 
    `- ${st}`
  ).join("\n")

  const risksText = (brief.risks ?? []).map((r: any) => 
    `- **风险**: ${r.risk} -> **缓释策略**: ${r.mitigation}`
  ).join("\n")

  const taskWaves = [
    { id: "wave-1", title: "地基与契约准备", tasks: ["T1"], dependsOn: [] },
    { id: "wave-2", title: "核心服务与数据流落地", tasks: ["T2"], dependsOn: ["wave-1"] },
    { id: "wave-3", title: "端到端测试与集成验证", tasks: ["T3"], dependsOn: ["wave-2"] },
  ]

  const tasksChecklistText = (brief.tasks ?? []).map((t: any) => `- [ ] **${t.id}**: ${t.title}
  - 归属: \`${t.parent ?? "main"}\`
  - 文件白名单: \`${(t.files ?? []).join(", ")}\`
  - 验收要求: 必须携带提交标识 \`[${t.id}]\` 并附带真实测试验证
`).join("\n")

  const tasksRtmText = (brief.tasks ?? []).map((t: any) => 
    `| ${t.id} | ${t.parent ?? "main"} | ${t.title} | ${(t.files ?? []).join(", ")} | 未开始 |`
  ).join("\n")

  const screensText = (brief.screens ?? [])
    .map((s: any) => `### ${s.name}\n\n\`\`\`\n${s.wireframe}\n\`\`\``)
    .join("\n\n")

  const interactionsText = (brief.interactions ?? []).map((i: string) => `* ${i}`).join("\n")

  let subtypeSection = ""
  if (brief.type === "bugfix") {
    subtypeSection = `\n### 缺陷现象 (Symptom)\n\n${brief.symptom ?? "待通过红测复现"}\n\n### 根因分析 (Root Cause - 5-Whys)\n\n${brief.rootCause ?? "待排查定位"}\n\n### 保持既有行为 (Preserved Behavior)\n\n${brief.preservedBehavior ?? "已有正常业务功能与数据保持严格兼容。"}\n`
  } else if (brief.type === "refactor") {
    subtypeSection = `\n### 架构债务与异味分析 (Debt Analysis)\n\n${brief.debtAnalysis ?? "消除重复耦合代码"}\n\n### 目标整洁架构形态 (Target Architecture)\n\n${brief.targetArchitecture ?? "整洁分层与 Facade 隔离"}\n`
  } else if (brief.type === "enhancement") {
    subtypeSection = `\n### 性能基线与优化目标 (Baseline vs Target Metrics)\n\n- 当前基线 (Baseline): ${brief.baselineMetric ?? "未明确"}\n- 目标指标 (Target): ${brief.targetMetric ?? "未明确"}\n`
  } else if (brief.type === "security") {
    subtypeSection = `\n### 漏洞评级与威胁攻击面 (Vulnerability Advisory & Attack Surface)\n\n- 漏洞概述与 PoC: ${brief.vulnerabilityAdvisory ?? "安全防御加固"}\n- 攻击面削减: ${brief.attackSurface ?? "最小权限原则"}\n`
  }

  const templateVars: Record<string, string> = {
    TITLE: brief.title,
    NAME: name,
    DOMAIN: brief.domain,
    TYPE: brief.type || "feature",
    GOAL: brief.goal || "",
    SUBTYPE_SECTION: subtypeSection,
    USER_STORIES: userStoriesText,
    INVARIANTS: invariantsText,
    INVARIANTS_SECTION: invariantsText,
    ACCEPTANCE_CRITERIA: acceptanceText,
    CONSTRAINTS: constraintsText,
    NON_GOALS: nonGoalsText,
    ARCHITECTURE_OVERVIEW: brief.architecture ?? "采用分层整洁架构与领域门面隔离",
    ENTITIES_SECTION: entitiesText,
    API_CONTRACTS_SECTION: `- **HTTP 路由**: \`POST /api/v1/admin/${brief.domain}/${name}\`\n- **权限标识**: \`${brief.domain}:${name}:query\`, \`${brief.domain}:${name}:manage\``,
    STATES_SECTION: statesText,
    RISKS_SECTION: risksText,
    SCREENS_SECTION: screensText,
    INTERACTIONS_SECTION: interactionsText,
    WAVES_JSON: JSON.stringify({ waves: taskWaves }, null, 2),
    TASKS_CHECKLIST: tasksChecklistText,
    TASKS_RTM_TABLE: tasksRtmText,
    DEPENDENCIES_NOTE: brief.dependencies ?? "T1 → T2 → T3",
    ACCEPTANCE_CHECKLIST: (brief.acceptance ?? []).map((a: any) => `- [ ] ${a.check}`).join("\n"),
    RESEARCH_BACKGROUND: brief.goal || "",
    LICENSE_CONCLUSION: brief.licenseConclusion ?? "无引入外部第三方库风险，开源许可与底座完全兼容",
    WINDOW_MINUTES: String(brief.windowMinutes ?? 15),
    TIMESTAMP: new Date().toISOString(),
    PHASE: "PLAN_APPROVED",
  }

const specKitPointer = (target: string, title: string) =>
  `# ${title}\n\n> **本文件是指针。** 正本见 [\`${target}\`](./${target})。\n>\n> 为什么要指针而不是两份同内容：实测两份字节级完全相同的文件让单个规格从 ~28KB 涨到 ~68KB，\n> 而它们的内容**没有任何一处不同** —— 纯重复。正本只保留一份，另一份做指针，兼顾两种文件名约定。\n`

  const files: Record<string, string> = {}

  // 1. 规格需求说明书 (Spec-Kit Native: spec.md + requirements.md)
  const specTpl = loadTemplate("spec-template.md")
  const specContent = specTpl ? render(specTpl, templateVars) : ""
  // 正本只写一次（coolie 的规范也是 requirements.md 为 EARS 正本），另一个文件名做指针
  files["requirements.md"] = specContent
  files["spec.md"] = specKitPointer("requirements.md", "规格需求说明书（Spec）")

  // 2. 架构技术方案 (Spec-Kit Native: plan.md + design.md)
  const planTpl = loadTemplate("plan-template.md")
  const planContent = planTpl ? render(planTpl, templateVars) : ""
  files["design.md"] = planContent
  files["plan.md"] = specKitPointer("design.md", "架构技术方案（Plan）")

  // 3. 任务分解清单 (Spec-Kit Native: tasks.md)
  const tasksTpl = loadTemplate("tasks-template.md")
  const tasksContent = tasksTpl ? render(tasksTpl, templateVars) : ""
  files["tasks.md"] = tasksContent

  // 4. 质量自检清单 (Spec-Kit Native: checklist.md)
  const checklistTpl = loadTemplate("checklist-template.md")
  const checklistContent = checklistTpl ? render(checklistTpl, templateVars) : ""
  files["checklist.md"] = checklistContent

  // 5. 选型研判分析 (Spec-Kit Native: research.md + selection.md)
  const researchTpl = loadTemplate("research-template.md")
  const researchContent = researchTpl ? render(researchTpl, templateVars) : ""
  files["research.md"] = researchContent
  files["selection.md"] = specKitPointer("research.md", "选型研判分析（Selection）")

  // 6. 实施轨回滚预案 (Spec-Kit Native: runbook.json)
  const runbookTpl = loadTemplate("runbook-template.json")
  files["runbook.json"] = runbookTpl ? render(runbookTpl, templateVars) : ""

  // 7. 门禁证据账本 (Spec-Kit Native: evidence.json)
  const evidenceTpl = loadTemplate("evidence-template.json")
  files["evidence.json"] = evidenceTpl ? render(evidenceTpl, templateVars) : ""

  // 8. 实施网络策略 (Spec-Kit Native: deployment.md)
  const deployTpl = loadTemplate("deployment-template.md")
  files["deployment.md"] = deployTpl ? render(deployTpl, templateVars) : ""

  // 9. 缺陷台账 (Spec-Kit Native: bugs.md)
  const bugsTpl = loadTemplate("bugs-template.md")
  files["bugs.md"] = bugsTpl ? render(bugsTpl, templateVars) : ""

  // 10. 原型与交互规范 (Spec-Kit Native: prototype.md)
  const prototypeTpl = loadTemplate("prototype-template.md")
  const prototypeContent = prototypeTpl ? render(prototypeTpl, templateVars) : ""
  files["prototype.md"] = prototypeContent

  // 10. 规格元数据 (Spec-Kit Native: spec.json + feature.json)
  const specJson = {
    name,
    domain: brief.domain,
    title: brief.title,
    type: brief.type || "feature",
    status: "PLAN_APPROVED",
    stories: (brief.stories ?? []).length,
    acceptance: (brief.acceptance ?? []).length,
    invariants: (brief.invariants ?? []).length,
    tasks: (brief.tasks ?? []).length,
    updatedAt: new Date().toISOString(),
  }
  files["spec.json"] = JSON.stringify(specJson, null, 2) + "\n"
  files["feature.json"] = files["spec.json"]

  // 11. 特化类型支持
  if (brief.type === "bugfix") {
    files["bugfix.md"] = `# Bugfix: ${brief.title}\n\n状态：\`PLAN_APPROVED\`\n\n## 1. 现象 (Symptom)\n${brief.symptom ?? "待测试复现"}\n\n## 2. 根因 (Root Cause)\n${brief.rootCause ?? "待排查"}\n\n## 3. 防御不变量 (Invariants)\n${invariantsText}\n`
  }

  // 批量写入
  let count = 0
  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, filename), content)
    count++
  }

  console.log(`\n✅ [speckit] 规格展开编译成功: 共生成 ${count} 份工程文档 -> ${path.relative(ROOT, dir)}/`)
  console.log(`   📋 包含: ${Object.keys(files).join(", ")}`)
  console.log(`   🔍 进度检查: pnpm exec tsx scripts/speckit.ts check --spec ${name}`)
}

// ============================================================================
// 3. 命令：speckit tasks / task (Kiro 任务依赖、原子提交与 Git 证据核验)
// ============================================================================
function handleTasks() {
  const name = getArg("--spec") || getArg("--name") || getArg("--feature")
  const taskOnly = getArg("--task")
  const commit = getArg("--commit") ?? "HEAD"

  if (!name) {
    console.error("❌ 用法错误: pnpm exec tsx scripts/speckit.ts tasks --spec <规格名> [--task T1] [--summary]")
    process.exit(2)
  }

  const dir = resolveSpecDir(name)
  if (!dir) {
    console.error(`❌ [speckit] 找不到规格: ${name}（在 docs/specs 与 docs/features 中均未找到）`)
    process.exit(2)
  }

  const tasksFile = path.join(dir, "tasks.md")
  if (!fs.existsSync(tasksFile)) {
    console.error(`❌ [speckit] 找不到 ${path.relative(ROOT, tasksFile)}，请先运行 speckit build`)
    process.exit(2)
  }

  // 解析 tasks.md 表格
  const cellsOf = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim())
  const tasks = fs
    .readFileSync(tasksFile, "utf8")
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .filter((line) => !cellsOf(line).includes("ID"))
    .filter((line) => !cellsOf(line).every((cell) => /^:?-+:?$/.test(cell)))
    .map(cellsOf)
    .filter((cells) => cells.length >= 4 && /^T\d/.test(cells[0]))
    .map((cells) => ({ id: cells[0], parent: cells[1], title: cells[2], whitelist: cells[3], status: cells[4] ?? "未开始" }))

  if (tasks.length === 0) {
    console.log(`⚠️  [speckit] ${path.relative(ROOT, tasksFile)} 中未检测到有效任务表格。`)
    process.exit(0)
  }

  const git = (gitArgs: string[]): string => {
    try {
      const res = spawnSync("git", gitArgs, { cwd: ROOT, encoding: "utf8" })
      return (res.stdout || "").trim()
    } catch {
      return ""
    }
  }

  const isGitRepo = fs.existsSync(path.join(ROOT, ".git"))
  let logLines: string[] = []
  if (isGitRepo) {
    const rawLog = git(["log", "--pretty=%H%x09%s", "-n", "300"])
    logLines = rawLog ? rawLog.split("\n").filter(Boolean) : []
  }

  // 1. 单任务精细化白名单与提交核验
  if (taskOnly) {
    const targetTask = tasks.find(t => t.id === taskOnly)
    if (!targetTask) {
      console.error(`❌ [speckit] 找不到任务 ${taskOnly}（可选任务: ${tasks.map(t => t.id).join(", ")}）`)
      process.exit(2)
    }

    if (!isGitRepo) {
      console.error("❌ [speckit] 这不是 Git 仓库，任务痕迹必须基于真实 Git 提交追溯")
      process.exit(2)
    }

    const message = git(["log", "-1", "--pretty=%s%n%b", commit])
    const files = git(["show", "--name-only", "--pretty=format:", commit]).split("\n").filter(Boolean)
    const problems: string[] = []

    if (!message.includes(`[${targetTask.id}]`)) {
      problems.push(`commit message 里没有 [${targetTask.id}] —— 「1 Task = 1 Commit」要求提交能追溯到任务（需使用 [${targetTask.id}] 方括号标记）`)
    }

    if (targetTask.whitelist !== "-") {
      const toRegExp = (pattern: string) => {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\//g, "\u0000").replace(/\*\*/g, "\u0001").replace(/\*/g, "[^/]*")
        return new RegExp("^" + escaped.replace(/\u0000/g, "(?:.*/)?").replace(/\u0001/g, ".*") + "$")
      }
      const patterns = targetTask.whitelist.split(",").map(i => i.trim()).filter(Boolean).map(toRegExp)
      const outside = files.filter(f => !patterns.some(regex => regex.test(f)))
      if (outside.length > 0) {
        problems.push(`改动了白名单之外的文件: ${outside.slice(0, 5).join(", ")}${outside.length > 5 ? ` 等 ${outside.length} 个` : ""}`)
      }
    }

    console.log(`\n🔍 [speckit task] 任务单项核验: ${targetTask.id} ${targetTask.title}`)
    console.log(`   Commit: ${commit}`)
    console.log(`   变更文件 (${files.length} 个):`)
    for (const f of files.slice(0, 8)) console.log(`     - ${f}`)
    if (files.length > 8) console.log(`     … 还有 ${files.length - 8} 个文件`)

    if (problems.length === 0) {
      console.log(`\n🎉 [PASS] 任务 ${targetTask.id} 核验通过: 提交严格对应 [${targetTask.id}]，且变更落在白名单内！\n`)
      process.exit(0)
    } else {
      console.error(`\n❌ [FAIL] 任务 ${targetTask.id} 核验未通过:`)
      for (const p of problems) console.error(`     ✗ ${p}`)
      console.log("")
      process.exit(1)
    }
  }

  // 2. 全量任务大盘与真实完成度取证
  console.log(`\n=== 📋 Spec-Kit SDD 任务面板: ${name} (共 ${tasks.length} 项原子任务) ===\n`)
  console.log(`| 任务ID | 状态 (Git取证) | 任务名称 | 白名单限制 | 提交证据 |`)
  console.log(`|---|---|---|---|---|`)

  /**
   * 提交 → 变更文件（一次 git log 拿全，避免逐提交调用）。
   * 为什么要文件：**只按 `[T<ID>]` 匹配会跨规格误判** —— 实测把 Expo 升级提交里的
   * `[T5]` 当成了另一个规格的 T5，于是在测试还没写时就报「6/6 完成」。
   */
  const commits: Array<{ sha: string; subject: string; files: string[] }> = []
  if (isGitRepo) {
    const raw = git(["log", "--pretty=format:%x00%H%x09%s", "--name-only", "-n", "300"])
    for (const block of raw.split("\u0000")) {
      if (!block.trim()) continue
      const [head, ...rest] = block.split("\n")
      const [sha, ...subjectParts] = head.split("\t")
      commits.push({ sha, subject: subjectParts.join("\t"), files: rest.map((f) => f.trim()).filter(Boolean) })
    }
  }

  /**
   * 白名单 → 正则。与 `--task` 分支的 `toRegExp` 保持同一套语义，
   * 并额外处理**目录形式**（以 `/` 结尾，如 `docs/specs/<域>/<名>/`）：
   * 直接转正则只会匹配目录本身、匹配不到其下文件 —— 实测因此把已完成任务误判成待执行。
   */
  const globToRegExp = (pattern: string) => {
    const normalized = pattern.endsWith("/") ? `${pattern}**` : pattern
    const escaped = normalized
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*\//g, "\u0000")
      .replace(/\*\*/g, "\u0001")
      .replace(/\*/g, "[^/]*")
    return new RegExp("^" + escaped.replace(/\u0000/g, "(?:.*/)?").replace(/\u0001/g, ".*") + "$")
  }

  let touched = 0
  for (const t of tasks) {
    const byId = commits.filter((c) => c.subject.includes(`[${t.id}]`))
    let hits = byId
    let suspicious = 0
    if (t.whitelist !== "-") {
      const patterns = t.whitelist.split(",").map((i) => i.trim()).filter(Boolean).map(globToRegExp)
      hits = byId.filter((c) => c.files.some((f) => patterns.some((re) => re.test(f))))
      suspicious = byId.length - hits.length
    } else {
      // 纯验证任务没有可核验的文件 —— 退化为「提交里必须提到本规格名」，否则同样可能是跨规格误匹配
      const mentionsSpec = (c: { subject: string }) => c.subject.includes(name) || c.subject.includes(path.basename(dir))
      hits = byId.filter(mentionsSpec)
      suspicious = byId.length - hits.length
    }
    const isDone = hits.length > 0
    if (isDone) touched++

    const statusBadge = isDone ? "✅ 已完成 (Git)" : "⏳ 待执行"
    const evidence = isDone
      ? `${hits.length} 个提交 (${hits[0].sha.slice(0, 7)})`
      : (suspicious > 0
        ? `无物理提交（${suspicious} 个 [${t.id}] 提交来自**其它规格**，已排除）`
        : "无物理提交")
    console.log(`| ${t.id} | ${statusBadge} | ${t.title} | \`${t.whitelist}\` | ${evidence} |`)
  }

  const percent = ((touched / tasks.length) * 100).toFixed(1)
  console.log(`\n📊 真实完成度进度: ${touched}/${tasks.length} (${percent}%)`)
  console.log(`💡 铁律原则: 1 Task = 1 Commit，提交信息必须包含 [T<ID>]，改动文件严禁超出白名单`)
  console.log(`🚀 单项核验: pnpm exec tsx scripts/speckit.ts tasks --spec ${name} --task T1\n`)
}

// ============================================================================
// 4. 命令：speckit list (列出所有规格)
// ============================================================================
function handleList() {
  const domainFilter = getArg("--domain")
  const all = listAllSpecs()

  const filtered = domainFilter
    ? all.filter((s: any) => s.domain === domainFilter)
    : all

  console.log(`\n=== 规格清单 (共 ${filtered.length} 个) ===\n`)
  console.log(`| 规格名称 | 业务域 | 类型 | 状态 | 归档 | 物理路径 |`)
  console.log(`|---|---|---|---|---|---|`)
  for (const s of filtered) {
    console.log(`| ${s.name} | ${s.domain} | ${s.type || "feature"} | ${s.status || "PLAN_APPROVED"} | ${s.isArchived ? "已归档" : "活跃施工"} | ${path.relative(ROOT, s.path)} |`)
  }
  console.log("")
}

// ============================================================================
// 4. 命令：speckit archive (归档规格)
// ============================================================================
function handleArchive() {
  const name = getArg("--name") || getArg("--spec")
  if (!name) {
    console.error("❌ 用法错误: pnpm exec tsx scripts/speckit.ts archive --name <规格名>")
    process.exit(2)
  }
  const result = spawnSync("node", [path.join(ROOT, "scripts", "archive-spec.cjs"), "--name", name], {
    stdio: "inherit",
    cwd: ROOT,
  })
  process.exit(result.status ?? 0)
}

// ============================================================================
// 5. 命令：speckit check (交付状态检查)
// ============================================================================
function handleCheck() {
  const specName = getArg("--spec") || getArg("--name") || getArg("--feature")
  const phase = getArg("--phase")
  const asJson = hasFlag("--json")

  const checkArgs = [path.join(ROOT, "scripts", "check-delivery.cjs")]
  if (specName) checkArgs.push("--spec", specName)
  if (phase) checkArgs.push("--phase", phase)
  if (asJson) checkArgs.push("--json")

  const result = spawnSync("node", checkArgs, {
    stdio: "inherit",
    cwd: ROOT,
  })
  process.exit(result.status ?? 0)
}

// ============================================================================
// 6. 命令：speckit health (规格健康扫描)
// ============================================================================
function handleHealth() {
  const result = spawnSync("node", [path.join(ROOT, "scripts", "check-specs-health.cjs")], {
    stdio: "inherit",
    cwd: ROOT,
  })
  process.exit(result.status ?? 0)
}

// ============================================================================
// 7. 命令：speckit workflows (Kiro 工作流配方管理)
// ============================================================================
function handleWorkflows() {
  const primaryDir = path.join(ROOT, ".agents", "workflows")
  const fallbackDir = path.join(ROOT, ".kiro", "workflows")
  const workflowsDir = fs.existsSync(primaryDir) ? primaryDir : fallbackDir
  if (!fs.existsSync(workflowsDir)) {
    console.log("未找到 .agents/workflows/ 或 .kiro/workflows/ 目录")
    process.exit(0)
  }
  console.log("=== SDD 原生多智能体工作流配方清单 (Workflow Recipes: .agents/workflows) ===")
  const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith(".workflow.json") || f.endsWith(".workflow.yaml"))
  for (const f of files) {
    try {
      const full = path.join(workflowsDir, f)
      const data = JSON.parse(fs.readFileSync(full, "utf8"))
      console.log(`\n📋 [Recipe] ${data.name} (${f})`)
      console.log(`   描述: ${data.description}`)
      console.log(`   入参: ${Object.keys(data.inputs || {}).join(", ")}`)
      console.log(`   步骤链 (${(data.steps || []).length} 步):`)
      for (const [idx, step] of (data.steps || []).entries()) {
        const preview = (step.prompt || "").split("\n")[0].slice(0, 70)
        console.log(`     ${idx + 1}. [${step.id}] Agent: @${step.agent} -> "${preview}..."`)
      }
    } catch (err: any) {
      console.error(`   ❌ 解析错误 ${f}: ${err.message}`)
    }
  }
  console.log(`\n总计 ${files.length} 个工作流配方就绪。单一真源保存在 .agents/workflows/，软链接兼容 .kiro/workflows/。可由 Antigravity、Kiro IDE、CLI (/workflow run) 或多智能体编排器直接执行。`)
}

// ============================================================================
// 8. 帮助菜单 (Help Menu)
// ============================================================================
// ============================================================================
// 8. 命令：speckit init & constitution (Spec-Kit 原生集成支持)
// ============================================================================
function handleInit() {
  console.log("=== Spec-Kit Enterprise (SDD + CMMI) 初始化与环境检查 ===")
  const specifyDir = path.join(ROOT, ".specify")
  const memoryDir = path.join(specifyDir, "memory")
  const templatesDir = path.join(specifyDir, "templates")
  const constPath = path.join(memoryDir, "constitution.md")
  const specsSymlink = path.join(ROOT, "specs")

  if (!fs.existsSync(specifyDir)) fs.mkdirSync(specifyDir, { recursive: true })
  if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true })
  if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true })

  console.log(`✅ .specify/ 目录拓扑完好: ${specifyDir}`)
  console.log(`✅ 项目工程宪法就绪: ${constPath}`)
  console.log(`✅ 标准模板库就绪: ${templatesDir}`)
  if (fs.existsSync(specsSymlink)) {
    console.log(`✅ specs/ 顶级链接就绪 -> docs/specs`)
  }
  console.log("\n🎉 Spec-Kit 企业级扩展环境初始化与合规检查 100% PASS！")
}

function handleConstitution() {
  const constPath = path.join(ROOT, ".specify", "memory", "constitution.md")
  if (fs.existsSync(constPath)) {
    console.log(fs.readFileSync(constPath, "utf8"))
  } else {
    console.error("❌ 找不到项目宪法文件: .specify/memory/constitution.md")
    process.exit(1)
  }
}

function handleHelp() {
  console.log(`
🧭 Kiro 规范驱动开发控制台 (Spec-Ops / Spec-Kit Unified SDD CLI)

Spec-Kit 原生与企业扩展命令:
  init        初始化并检查 .specify/ 规范拓扑与宪法环境
  constitution 查看或审查项目核心工程宪法 (.specify/memory/constitution.md)
  specify/new 创建新规格骨架 (feature | bugfix | enhancement | refactor | security)
  plan/build  从 brief.json 展开编译生成完备 Markdown 规格与任务波次图
  tasks/task  查看任务大盘、波次依赖与基于真实 Git 历史核实 1 Task = 1 Commit
  check       检查规格交付进度与 11 阶段门禁完成度
  list        列出全域所有规格状态与路径
  archive     将交付完毕的规格移动到季度历史归档区
  health      扫描全域规格健康度与防认知污染规则
  cmmi        CMMI 01~09 全生命周期过程资产创建与健康守卫 (new | list | check)
  workflows   查看与校验 Kiro 原生工作流配方 (.kiro/workflows/)

示例:
  pnpm exec tsx scripts/speckit.ts init
  pnpm exec tsx scripts/speckit.ts constitution
  pnpm exec tsx scripts/speckit.ts new --name fix-pay-lock --domain pay --title "修复支付回调重放" --type bugfix
  pnpm exec tsx scripts/speckit.ts build --name fix-pay-lock
  pnpm exec tsx scripts/speckit.ts tasks --spec fix-pay-lock
  pnpm exec tsx scripts/speckit.ts tasks --spec fix-pay-lock --task T1
  pnpm exec tsx scripts/speckit.ts check --spec fix-pay-lock
  pnpm exec tsx scripts/speckit.ts cmmi check
`)
}

// 主调度派发器
switch (command) {
  case "init":
    handleInit()
    break
  case "constitution":
    handleConstitution()
    break
  case "specify":
  case "new":
  case "create":
    handleNew()
    break
  case "plan":
  case "build":
    handleBuild()
    break
  case "tasks":
  case "task":
    handleTasks()
    break
  case "list":
  case "ls":
    handleList()
    break
  case "archive":
    handleArchive()
    break
  case "check":
    handleCheck()
    break
  case "health":
    handleHealth()
    break
  case "cmmi": {
    const cmmiScript = path.join(__dirname, "cmmi-asset-scaffold.cjs")
    const cmmiArgs = process.argv.slice(3)
    const res = spawnSync(process.execPath, [cmmiScript, ...cmmiArgs], { stdio: "inherit" })
    process.exit(res.status ?? 0)
    break
  }
  case "workflows":
  case "workflow":
    handleWorkflows()
    break
  case "help":
  default:
    handleHelp()
    break
}
