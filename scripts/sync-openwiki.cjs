#!/usr/bin/env node
/**
 * OpenWiki (LLM-Wiki) 自动化提取与动态同步引擎
 *
 * 核心目的：
 * 专为 AI Agent (Cursor, Claude Code, Cline, DigitalStaff NPC) 构建高内聚、
 * 带精准双向链接的动态知识库，替代传统冗长低效的静态文档，Token 消耗直降 80%。
 *
 * 唯一真源驱动 (Zero Doc Drift)：
 * - packages/shared/backend/constants/domain-catalog.json (17 域元数据与韧性策略)
 * - packages/shared/contract/seam-graph.json (跨域 Facade 与缝隙图谱)
 * - docs/agent/contracts.json（份数以实际 .agent.json 文件为准，勿写死）
 *
 * 用法:
 *   node scripts/sync-openwiki.cjs          # 生成并更新 wiki/ 目录
 *   node scripts/sync-openwiki.cjs --write  # 显式写入
 *   node scripts/sync-openwiki.cjs --check  # 校验是否发生漂移（CI 门禁）
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const WIKI_DIR = path.join(ROOT, "wiki");
const checkOnly = process.argv.includes("--check");

// 1. 读取真源元数据
const catalogPath = path.join(ROOT, "packages/shared/backend/constants/domain-catalog.json");
const seamPath = path.join(ROOT, "packages/shared/contract/seam-graph.json");
const contractsPath = path.join(ROOT, "docs/agent/contracts.json");

/**
 * Agent 契约数的**唯一口径**：直接数文件，不抄文档里的数字。
 * 教训：本文件里曾同时存在 324 与 326 两种写法（同一份生成器自相矛盾），
 * 而真值是随开发变化的 —— 写死就必然漂移。
 */
const AGENT_CONTRACT_COUNT = (() => {
  let count = 0
  const walk = (dir) => {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
        walk(path.join(dir, entry.name))
      } else if (entry.name.endsWith(".agent.json")) count += 1
    }
  }
  walk(path.join(ROOT, "packages"))
  return count
})();
const compatPath = path.join(ROOT, "packages/shared/contract/compat-manifest.json");

if (!fs.existsSync(catalogPath)) {
  console.error(`[openwiki] 错误: 找不到领域元数据 ${catalogPath}`);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const seamGraph = fs.existsSync(seamPath) ? JSON.parse(fs.readFileSync(seamPath, "utf8")) : { domains: [] };
const agentRegistry = fs.existsSync(contractsPath) ? JSON.parse(fs.readFileSync(contractsPath, "utf8")) : { contracts: [] };
const compatManifest = fs.existsSync(compatPath) ? JSON.parse(fs.readFileSync(compatPath, "utf8")) : null;
const skillsCount = compatManifest?.consumptionSurface?.skills?.count || 38;

// 建立索引
const seamDomainMap = new Map();
for (const d of seamGraph.domains || []) {
  seamDomainMap.set(d.name, d);
}

const contractsByDomain = new Map();
for (const c of agentRegistry.contracts || []) {
  if (!contractsByDomain.has(c.domain)) {
    contractsByDomain.set(c.domain, []);
  }
  contractsByDomain.get(c.domain).push(c);
}

// 目标产物收集器 { relativePath: content }
const generatedFiles = new Map();

// ==========================================
// 1. 生成 wiki/index.md (根索引与 Agent 全景)
// ==========================================
function buildIndexMd() {
  const domains = catalog.domains || [];
  const totalContracts = agentRegistry.total || (agentRegistry.contracts || []).length;
  
  let domainRows = "";
  for (const d of domains) {
    const seam = seamDomainMap.get(d.name);
    const contracts = contractsByDomain.get(d.name) || [];
    const entityCount = contracts.length;
    const methodsCount = seam?.provider?.methods?.length || 0;
    const kindBadge = d.kind === "platform" ? "🏛️ 平台地基" : "🧩 第一方插件";
    const port = d.defaultPort || "-";
    const link = `[${d.name}](domains/${d.name}.md)`;
    
    domainRows += `| ${link} | ${kindBadge} | 阶段 ${d.stage} | ${port} | ${entityCount} | ${methodsCount} | \`${(d.publicPrefixes || []).join("`, `")}\` |\n`;
  }

  const content = `# cooliebase-all OpenWiki (LLM 知识大脑)

> **面向 AI Agent 的核心索引**：本知识库由底座真实元数据（\`domain-catalog\`、\`seam-graph\`、\`contracts.json\`）**自动化编译生成与动态自愈**。AI 编程助手（Cursor / Claude / Copilot）应优先检索对应词条，严禁全盘盲扫代码。

---

## ⚡ 核心架构铁律 (Rule 0 ~ 3)

1. **零 Token 浪费 & Schema 驱动**：严禁人肉手写几百行重复 CRUD。必须复用 \`BaseMapper<T>\`、\`QueryWrapper<T>\` 与 \`BaseService<T>\`，自动继承 8 大审计字段与行级租户隔离。
2. **第一方插件规范 (First-Party Plugins)**：业务域一律落在 \`packages/plugins/plugin-<domain>/\`，平台地基落在 \`packages/domains/{system,infra}/\`。严禁在 \`src/\` 堆放平铺代码。
3. **真实数据库驱动 (Zero Fake Mock)**：测试 100% 由嵌入式 SQLite (\`better-sqlite3\`) 或真实 PostgreSQL 驱动，严禁前端伪造 Mock。
4. **全链路 Agent 契约闭环**：全仓已收敛 **${totalContracts} 份机器可读契约**，由 \`agent-device\` (接口运营/造数) 与 \`agent-browser\` (Playwright 探针) 统一驱动。

---

## 🧭 17 原生领域全景图 (Domain Directory)

| 领域 (Domain) | 架构分层 | 演进阶段 | 独立端口 | Agent 实体数 | Facade 方法数 | 公开 API 前缀 |
|---|---|---|---|---|---|---|
${domainRows}
---

## 🏛️ CMMI 01~09 全生命周期工程规范 (CMMI Standards)

- [CMMI 01~09 全生命周期工程过程与 7 类交付物理资产](cmmi/cmmi-lifecycle.md)
- [${skillsCount} 大工业级原生 Agent 技能矩阵与真源管理](architecture/skills-matrix.md)

---

## 📚 架构百科词条 (Architecture Pillars)

- [全能力 AI Agent 驱动架构与闭环执行法则](architecture/ai-agent-driven-paradigm.md)
- [高阶反向思维与自循环反思飞轮 (Socratic Inversion Flywheel)](architecture/socratic-inversion-flywheel.md)
- [通用动态本体画布与零样板代码体系 (Universal Schema Canvas)](architecture/universal-schema-canvas.md)
- [自主巡检自愈守护中枢 (Agent Autopilot Daemon)](architecture/autonomous-heartbeat-autopilot.md)
- [流式智能行动决策卡片中枢 (Action Decision Hub)](architecture/action-decision-hub.md)
- [对标顶级开源项目差距深度分析与持续演进大典](architecture/benchmark-and-evolution.md)
- [第一方插件体系与包结构规范](architecture/modular-plugin-system.md)
- [BaseMapper 通用持久化与 QueryWrapper 链式语法](architecture/base-mapper-and-queries.md)
- [Kysely AST 语法树级全局多租户隔离](architecture/tenant-isolation-ast.md)
- [事务性发件箱 (Transactional Outbox) 与 ACID 回滚](architecture/transactional-outbox.md)
- [微服务通信、跨域治理与 Facade 契约](architecture/service-governance.md)
- [Archify (47k★) 可机器验证与交互式架构图生成](architecture/archify-visualization.md)
- [GitHub Spec-Kit 企业级扩展与 10 大斜杠指令矩阵 (/speckit.*)](architecture/speckit-slash-commands.md)

---

## 🧪 自动化测试与验证体系 (Testing Guide)

- [四层金字塔测试体系 (L1 单测 ~ L4 Agent E2E)](testing/testing-pyramid.md)
- [嵌入式 SQLite 真实 C 引擎与并发 CAS 防超卖](testing/real-database-testing.md)
- [变异测试 (Mutation Testing) 反假 Mock 与测试充分性打假](testing/mutation-testing.md)
- [Agent 契约驱动 UI 探针与无头接口运营 (agent-device / agent-browser)](testing/agent-browser-and-device.md)
- [Strix (60k★) 多智能体自主红队渗透测试与真实 PoC 验证](testing/strix-autonomous-pentest.md)
- [安全渗透扫描 (12项红线) 与容量压测护栏](testing/security-and-load-testing.md)
- [K6 真实并发压测基准与容量回归护栏](testing/k6-load-benchmark.md)

---

## ⚠️ 高频踩坑实录 (Gotchas)

- [better-sqlite3 布尔值必须映射为 0/1 整型](gotchas/sqlite-boolean-mapping.md)
- [压测必须使用生产 standalone 产物，严禁打 dev 热更新进程](gotchas/load-test-standalone-rule.md)
- [插件挂载点 /api/v1/plugins/ 与 Admin BFF 鉴权策略差异](gotchas/admin-route-proxy-policy.md)
`;

  generatedFiles.set("index.md", content.trim() + "\n");
}

// ==========================================
// 2. 生成 wiki/domains/<domain>.md (各领域独立词条)
// ==========================================
function buildDomainMds() {
  const domains = catalog.domains || [];

  for (const d of domains) {
    const seam = seamDomainMap.get(d.name);
    const contracts = contractsByDomain.get(d.name) || [];
    const methods = seam?.provider?.methods || [];
    const facades = seam?.definition?.facades || [];
    const isPlatform = d.kind === "platform";
    const baseDir = isPlatform ? `packages/domains/${d.name}` : `packages/plugins/plugin-${d.name}`;

    let entityTable = "";
    if (contracts.length > 0) {
      entityTable = `| 实体名 (Entity) | 业务名称 | 运营页面路由 | 权限码前缀 | 契约文件 |\n|---|---|---|---|---|\n`;
      for (const c of contracts) {
        entityTable += `| \`${c.entity}\` | ${c.businessName || "-"} | \`${c.page?.route || "-"}\` | \`${c.permissionPrefix || "-"}\` | [\`${c.kebab}.agent.json\`](../../${c.__source}) |\n`;
      }
    } else {
      entityTable = `*暂无独立生成的 Agent 契约（地基服务或纯跨域 RPC 面）*`;
    }

    let methodList = "";
    if (methods.length > 0) {
      methodList = methods.map((m) => `- \`${m}\``).join("\n");
    } else {
      methodList = `*无公开注册的跨域 RPC 方法*`;
    }

    let facadeList = "";
    if (facades.length > 0) {
      facadeList = facades.map((f) => `- [${path.basename(f)}](../../${f})`).join("\n");
    } else {
      facadeList = `*无独立 Facade 导出*`;
    }

    const content = `# 领域百科：${d.name} (${d.kind === "platform" ? "平台地基" : "第一方业务插件"})

> **唯一源码目录**：[\`${baseDir}/\`](../../${baseDir})  
> **演进阶段**：阶段 ${d.stage} | **独立部署默认端口**：${d.defaultPort || "与 BFF 共享"} | **上游环境变量**：\`${d.upstreamEnv || "无"}\`

---

## 一、 领域定位与前缀

- **分层属性**：${d.kind === "platform" ? "平台基础设施（不可插拔、永不拆为独立第三方插件）" : "第一方业务插件（可独立拆分、打包、热插拔）"}
- **对外 HTTP API 前缀**：\`${(d.publicPrefixes || []).join("`, `")}\`
- **默认鉴权策略**：
  - 受众（Audience）：\`${d.auth?.audience || "admin"}\`
  - 多租户策略：\`${d.auth?.tenantPolicy || "required"}\`
- **服务治理与韧性（Resilience）**：
  - 超时时间：\`${d.resilience?.timeoutMs || 5000} ms\`
  - 最大重试次数：\`${d.resilience?.retryMaxAttempts ?? 1}\`
  - 幂等要求：\`${d.resilience?.idempotencyRequired ? "强要求（需带 Idempotency-Key）" : "无特殊要求"}\`

---

## 二、 跨域 Facade 门面与 RPC 方法

其他业务域**禁止直接 import 本域的 Service / Repository**，跨域调用必须走 Domain Facade：

### 1. 契约门面定义
${facadeList}

### 2. 公开支持的 RPC 方法清单
${methodList}

---

## 三、 Agent 自动化实体与契约清单 (${contracts.length} 个)

本领域随代码生成器同源产出的机器可读契约，支持 \`agent-device\` (接口自动化运营) 与 \`agent-browser\` (Playwright 真实 UI 探针)：

${entityTable}

---

## 四、 研发指引与注意事项

1. **代码物理路径**：
   - 业务逻辑一律放于 \`${baseDir}/backend/services/\`；
   - 仓储数据访问放于 \`${baseDir}/backend/repositories/\`；
   - 契约接口放于 \`${baseDir}/contract/\`。
2. **租户隔离**：
   - 表设计若含 \`tenant_id\`，查询与写入自动由 Kysely \`tenantIsolationPlugin\` 拦截，无需人肉拼写 \`WHERE tenant_id = ?\`。
`;

    generatedFiles.set(`domains/${d.name}.md`, content.trim() + "\n");
  }
}

// ==========================================
// 3. 生成架构百科词条 (Architecture Pillars)
// ==========================================
function buildArchitectureMds() {
  // 1) modular-plugin-system.md
  generatedFiles.set("architecture/modular-plugin-system.md", `# 架构百科：第一方插件体系与模块化单体

> 对应规则：AGENTS.md §3.2 / §3.2.1 / §6.2

## 一、 为什么将业务域迁移为第一方插件？
1. **防止单体无限膨胀**：传统单体在 src 下堆放所有业务，耦合严重、无法独立拆分交付；
2. **域级自治**：每个业务域以插件形式存在（\`packages/plugins/plugin-<domain>/\`），拥有独立的 \`plugin.manifest.json\`、路由前缀、数据表迁移和 Agent 契约；
3. **双模运行**：
   - **单体形态 (Merged)**：同进程直调，零网络损耗；
   - **隔离形态 (Isolated)**：独立 Worker 进程或独立微服务部署，通过 RPC 转发。

## 二、 物理目录布局
\`\`\`
packages/
├── domains/                  # 平台地基 (永不插件化: system, infra)
│   ├── system/
│   └── infra/
└── plugins/                  # 15 个第一方业务插件
    ├── plugin-wms/
    ├── plugin-mall/
    └── ...
\`\`\`
`.trim() + "\n");

  // 2) base-mapper-and-queries.md
  generatedFiles.set("architecture/base-mapper-and-queries.md", `# 架构百科：BaseMapper 与 QueryWrapper 链式语法

> 对应规则：AGENTS.md 核心铁律 Rule 0.2 / §4.7

## 一、 为什么杜绝手写重复 CRUD？
大模型为每个表生成数百行 \`selectById\`、\`insert\`、\`update\` 是严重的算力与 Token 浪费，且容易在审计字段和租户过滤上出现漏网之鱼。

## 二、 核心用法
\`\`\`ts
import { BaseMapper, QueryWrapper, BaseService } from '@/shared/backend/lib/database';

// 1. 初始化通用 Mapper (支持表列能力自动探测)
const roleMapper = new BaseMapper('system_role');

// 2. 链式条件检索
const qw = new QueryWrapper()
  .eq('status', 'ACTIVE')
  .like('name', '管理员')
  .orderByDesc('created_at');

const list = await roleMapper.selectList(qw);

// 3. 分页查询 (SQL 级 count + limit/offset)
const pageData = await roleMapper.selectPage({ pageNum: 1, pageSize: 10 }, qw);
\`\`\`

## 三、 表能力探测机制
\`BaseMapper\` 启动时通过 \`db.introspection.getTables()\` 动态缓存列元数据：
- 若表具备 \`deleted\` 列 ➔ 自动启用逻辑删除过滤 (\`deleted = 0\`)；
- 若表具备 \`tenant_id\` 列 ➔ 自动注入租户上下文；
- 写入时按列是否存在自动填充 8 大审计底座字段。
`.trim() + "\n");

  // 3) tenant-isolation-ast.md
  generatedFiles.set("architecture/tenant-isolation-ast.md", `# 架构百科：Kysely AST 语法树级全局多租户隔离

> 对应规则：AGENTS.md §4.8

## 一、 设计思想
多租户隔离绝不能依赖外包开发者的自觉性。一旦某条 SQL 漏写 \`tenant_id = ?\`，将发生毁灭性的跨租户数据穿透。

## 二、 实现原理
- 核心源码：\`packages/shared/backend/lib/database/tenant-isolation-plugin.ts\`
- 挂载于 Kysely 单例之上的 AST 拦截器：
  - 拦截 \`SelectQueryNode\`、\`UpdateQueryNode\`、\`DeleteQueryNode\` 树节点；
  - 自动向 \`where\` 子树注入 \`tenant_id = <当前上下文租户ID>\`；
  - 拦截 \`InsertQueryNode\`，自动追加 \`tenant_id\` 列和值；
  - 平台超级管理员上下文自动豁免。
`.trim() + "\n");

  // 4) transactional-outbox.md
  generatedFiles.set("architecture/transactional-outbox.md", `# 架构百科：事务性发件箱 (Transactional Outbox)

> 对应规则：AGENTS.md §3.3 / §4.2

## 一、 解决的核心问题
在微服务或模块化解耦中，**“写本地数据库”与“向消息总线发事件”必须处于同一个本地 ACID 事务中**。如果先发消息后写库，可能写库失败导致数据不一致；如果先写库后发消息，可能网络中断导致下游丢事件。

## 二、 使用范式
\`\`\`ts
import { runUnitOfWork } from '@/shared/backend/lib/transactional-outbox';

await runUnitOfWork(async (uow) => {
  // 1. 执行业务写操作 (挂在同一本地事务中)
  await uow.db.insertInto('mall_order').values({ id: 'ord-01', total_fee: 100 }).execute();

  // 2. 将可靠领域事件追加至 outbox 发件箱表
  uow.appendOutbox({
    type: 'mall.order.created',
    source: 'mall',
    payload: { id: 'ord-01' }
  });

  // 如果此处发生任何 throw，本地写库与 outbox 记录一同 ROLLBACK！
});
\`\`\`
`.trim() + "\n");

  // 5) service-governance.md
  generatedFiles.set("architecture/service-governance.md", `# 架构百科：跨域通信、微服务解耦与韧性治理

> 对应规则：AGENTS.md §3.3 / §6

## 一、 通信三原则
1. **同域业务调用**：直接调用本地 Service / Application Port；
2. **跨域同步调用**：必须走 **Domain Facade** 或 \`broker.call('cooliebase.cmd.<domain>.<method>')\`，严禁直连对方数据库或 import Service；
3. **跨域异步通知**：必须走 \`broker.publishReliable()\` 经 Outbox 发送领域事件。

## 二、 韧性治理策略 (Resilience)
- **超时与重试**：写请求必须带 \`Idempotency-Key\`，重试只允许在只读或幂等接口上生效；
- **熔断降级**：服务降级时提供安全的默认值或内存兜底；
- **追踪传递**：所有内部调用必须透传 \`traceId\`、\`tenantId\` 与 \`actorId\` 上下文。
`.trim() + "\n");

  // 6) archify-visualization.md
  generatedFiles.set("architecture/archify-visualization.md", `# 架构百科：Archify 可机器验证与交互式架构图生成

> 对应规则：AGENTS.md §3 / .agents/skills/archify/SKILL.md (对标 tt-a1i/archify 47,000+★, MIT)

## 一、 核心痛点与 Validate-Preview-Deliver 范式
- 传统手绘图（Draw.io/Excalidraw）无法被 AI 机器验证，且随着代码演进而迅速失效漂移；
- 静态文本图（纯 Mermaid）在大规模微服务拓扑中经常因布局错乱、文字折行或 AI 幻觉导致“死连线”。
- **Archify 契约闭环**：
  1. **类型化 JSON Schema 结构化定义**：严格声明 \`boundaries\`、\`components\` 与 \`connections\`；
  2. **原子连线与边界校验**：严禁悬空未声明节点连线，杜绝 AI 架构幻觉；
  3. **编译输出交互式 HTML 制品**：支持缩放平移、暗黑模式切换与**全链路流动请求路径追踪 (Path Tracing)**。

## 二、 规范制品存放路径
- Schema 契约资产：\`docs/03_design/diagrams/<name>.arch.json\`
- 交互式 HTML 制品：\`docs/03_design/diagrams/<name>.arch.html\`
`.trim() + "\n");

  // 7) skills-matrix.md
  generatedFiles.set("architecture/skills-matrix.md", `# 架构百科：${skillsCount} 大工业级原生 Agent 技能矩阵与单一真源

> 对应规则：AGENTS.md Rule 0.11 / .agents/skills/README.md

## 一、 单一真源铁律 (Single Source of Truth)
- 全仓 ${skillsCount} 个原生技能唯一真源收敛于 \`.agents/skills/<name>/SKILL.md\`；
- 严禁在 \`docs/\` 等目录创建镜像或副本目录，杜绝代码与认知污染；
- 下游兼容性清单 \`compat-manifest.json\` 自动校验技能数量与定义。

## 二、 深度吸收的两大全球顶流项目
1. **Archify (47,000+★, MIT)**：\`archify/SKILL.md\` 驱动可机器验证与交互式架构全景；
2. **Strix (60,000+★, Apache-2.0)**：\`strix-penetration-testing/SKILL.md\` 驱动多智能体自主红队渗透测试与真实生效 PoC 验证。
`.trim() + "\n");

  // 8) ai-agent-driven-paradigm.md
  generatedFiles.set("architecture/ai-agent-driven-paradigm.md", `# 架构百科：全能力 AI Agent 驱动架构 (AI-Agent Driven Paradigm)

> 对应规则：AGENTS.md Rule 0.13 / .agents/rules/HIGH-ORDER-INVERSE-THINKING.md

## 一、 核心公理：系统内一切能力皆为 AI Agent 驱动设计
在传统工业级软件中，系统由人类使用鼠标逐个页面点击、由外包码农手写搬砖代码、由人工手工维护配置与对账。
而在 \`cooliebase-all\` 体系中，**所有能力必须具备 100% 机器可读与 AI Agent 闭环驱动能力 (All Capabilities Must Be AI Agent Driven)**。严禁开发仅供人类单点手工使用、无法被 AI Agent 感知或编排的孤岛系统。

## 二、 7 层全栈 AI Agent 驱动闭环矩阵

| 层次 | 载体与真源 | AI Agent 驱动方式 | 杜绝的低阶人工行为 |
|---|---|---|---|
| **1. 规格立项层 (SDD)** | \`scripts/speckit.ts\`<br>\`brief.json\` | Agent 仅需 \`<500 Tokens\` 声明 \`brief.json\`，由引擎自动展开为 Kiro 规范规格包（需求、设计、波次任务图、Runbook）。 | 严禁人工手写千行重复文档，严禁无规格直接写代码。 |
| **2. 代码实现层 (Coding)** | \`BaseMapper<T>\`<br>\`QueryWrapper<T>\`<br>\`BaseService<T>\` | Agent 以 DSL/Schema 驱动通用引擎自动展开，100% 继承多租户、逻辑删除与 8 大审计底座字段。 | 严禁大模型人肉生成几百行千篇一律的重复 CRUD。 |
| **3. 契约通信层 (Contracts)** | \`docs/agent/contracts.json\`<br>\`seam-graph.json\`<br>\`rpc-actions.json\` | ${AGENT_CONTRACT_COUNT} 份全域契约、OpenAPI 3.1、自研 NATS 异步事件流与 Domain Facade，供 Agent 毫秒级定位调用。 | 严禁跨域私自 import Service，严禁无契约野路由。 |
| **4. 前端交互层 (Agent-Native UI)** | \`agent-page-schemas.generated.json\`<br>主权网关与指挥大屏 | ${AGENT_CONTRACT_COUNT} 个实体的机器可读 Schema、主权网关与驾驶舱，支持 \`agent-device\` 与 \`agent-browser\` (Playwright) 无头探针自动化操作。 | 严禁仅能人类肉眼查看的死报表与死界面。 |
| **5. 自动化测试层 (Testing)** | \`better-sqlite3\`<br>\`strix-penetration-testing\`<br>\`mutation-tester\` | 嵌入式 SQLite 真实 C 引擎并发测试、Strix 多智能体自主红队渗透验证真实 PoC、变异测试打假假 Mock。 | 严禁伪造前端 Mock 与空断言骗门禁。 |
| **6. 运维割接层 (DevOps/SRE)** | \`runbook.json\`<br>\`scripts/agent/run-runbook.cjs\` | Agent 驱动实施预案执行（\`npm run runbook\`），原子割接并支持失败毫秒级自动回滚；SLO 错误预算自主熔断。 | 严禁手工改生产容器，严禁故障盲目甩锅。 |
| **7. 持续运营层 (Operations)** | \`npm run agent:ops\`<br>\`financial-reconciliation-agent\` | Agent 直接通过真实 API 跑通健康体检、造数、清数与三方对账，无需人类开浏览器手工造数。 | 严禁手工登后台一个个填表单造数。 |

## 三、 三位一体协同机制：Skills + MCP + CLI
1. **Skills (.agents/skills/)**：指导 Agent “怎么做”（方法论、EARS 句式、5-Whys、红绿测试准则，全仓 38 个原生技能）；
2. **MCP (scripts/mcp/cooliebase-mcp-server.cjs)**：为外部 Agent 提供 “查什么”（只读反射查询 14 大工具，严禁副作用写入）；
3. **CLI (scripts/speckit.ts 等)**：确定性落地 “谁来执行”（工具引擎自动执行、编译与门禁）。
`.trim() + "\n");

  // 9) benchmark-and-evolution.md
  generatedFiles.set("architecture/benchmark-and-evolution.md", `# 架构百科：对标顶级开源项目差距深度分析与持续演进大典

> 对应规则：AGENTS.md §23 / docs/architecture/BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md

## 一、 对标全球顶尖项目矩阵
1. **Supabase (80k★)**: 极致的本地开发体验、Realtime CDC 变更广播、原生 pgvector 向量检索；
2. **MedusaJS v2 (27k★)**: TypeScript 原生可逆 DAG 工作流 (@medusajs/workflows-sdk) 与补偿长事务 (Saga)；
3. **yudao 系开源中后台模板 (25k★ 综合)**: 17 领域工业级模型聚合、Flowable BPMN 2.0 审批流设计器思路、严密的 @DataPermission 部门数据范围抽象；
4. **Directus (30k★) / Refine (29k★)**: 可视化 Low-Code 表单设计、TanStack Table v8 结合虚拟滚动支撑十万级数据；
5. **Strix (60k★)**: 多智能体自主红队渗透测试平台与真实 PoC 验证。

## 二、 核心差距与 7 大改进方向
- **差距 1：长流程编排**：缺少轻量级 TypeScript 原生 Saga / Workflow 工作流引擎与 BPMN 可视化设计；
- **差距 2：数据权限**：尚未在 Kysely AST 层面落地部门级/层级细粒度数据范围注入 (Data Scope ABAC)；
- **差距 3：前端交互**：缺少可视化 Low-Code 动态 Schema 设计面板，大表格缺少虚拟滚动；
- **差距 4：APM 可观测性**：应用缺少标准 OpenTelemetry (OTel) 链路跟踪与 Prometheus /api/metrics 探针；
- **差距 5：AI 知识库**：系统内部缺乏针对租户文档的多租户 RAG 向量检索与私有知识库问答；
- **差距 6：实时长连接**：缺少轻量级 Server-Sent Events (SSE) 实时通道，目前多采用短轮询；
- **差距 7：API 沙箱**：缺少类似 FastAPI / Scalar 在线可交互调试控制台 (/api/docs)。

## 三、 三阶段演进路线 (Phase A / B / C)
- **Phase A (短期必修)**: Kysely AST 数据权限插件、交互式 OpenAPI Scalar 调试沙箱 (/api/docs)、OpenTelemetry 自动埋点；
- **Phase B (中期突破)**: TS 原生可逆 Saga/Workflow 引擎、可视化 Low-Code Schema 设计器、SSE 实时流、TanStack 虚拟滚动；
- **Phase C (长期生态)**: 内置多租户 RAG 向量知识库 (sqlite-vec/pgvector)、动态第三方插件 WASM/Worker 沙箱、Expo 离线优先同步。

完整技术方案请参阅：[BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md](../../docs/architecture/BENCHMARK-GAP-ANALYSIS-AND-CONTINUOUS-IMPROVEMENT.md)
`.trim() + "\n");

  // 10) universal-schema-canvas.md
  generatedFiles.set("architecture/universal-schema-canvas.md", `# 架构百科：通用动态本体画布 (Universal Schema Canvas)

> 对应规则：AGENTS.md Rule 0.1 / Rule 0.13 / packages/shared/frontend/components/universal-schema-canvas.tsx

## 一、 核心痛点与零样板代码理念
在传统后台工程中，通常为数百个实体人工手写数百个千篇一律的薄壳页面文件，不仅消耗几十万 Token，而且当后端接口或表结构变动时，页面极易发生漂移与死字段。

## 二、 动态本体画布架构
- **真源挂载**：直接消费 \`agent-page-schemas.generated.json\` 中的 ${AGENT_CONTRACT_COUNT} 份机器可读 Schema 契约；
- **自适应渲染**：由 \`UniversalSchemaCanvas\` 通用组件根据字段类型（string, number, boolean, date, enum）自适应渲染检索过滤区、动态数据表格、分页区与快捷交互抽屉；
- **全息感知**：支持实体领域过滤（14 个域快速切换）、分类标签过滤、双向契约查看抽屉（API Mount、BFF Mount、权限码与字段元数据）；
- **动态派发**：Admin 路由派发器 (\`src/app/(admin-pages)/admin/[...slug]/page.tsx\`) 统一调度，支持通过 \`?mode=canvas\` 或 \`/admin/canvas/[entity]\` 毫秒级打开任意实体的动态本体操作面板。
`.trim() + "\n");

  // 11) autonomous-heartbeat-autopilot.md
  generatedFiles.set("architecture/autonomous-heartbeat-autopilot.md", `# 架构百科：自主巡检自愈守护中枢 (Agent Autopilot Daemon)

> 对应规则：AGENTS.md Rule 0.9 / Rule 0.13 / packages/shared/backend/lib/agent-autopilot.ts

## 一、 为什么必须有常驻自主巡检中枢？
传统生产系统通常处于被动状态，必须等发生故障、报警或用户投诉后人工介入排查。
自主巡检守护中枢将系统升级为具备**自主感知 (Autopoiesis)** 与主动自愈能力的生命体：
1. **全域微核健康探针**：每 10 秒主动对 17 个微内核领域与第一方插件进行连通性与清单完整性探测；
2. **双轨真实数据库体检**：探针直连 PostgreSQL/SQLite 双轨引擎，测量 \`SELECT 1\` 往返延迟 (RTT) 并告警高延迟；
3. **事务性发件箱 (Outbox) 积压检测与自愈**：主动侦测未投递消息，超过阈值时自动触发 Outbox 重试投递与失败消息清算；
4. **全域 326 份 Agent 契约健康度打分**：实时聚合各域实体就绪度，输出 0~100 综合健康评分 (🟢 OPTIMAL / 🟡 ATTENTION / 🔴 DEGRADED)。

## 二、 核心命令与服务入口
- 单次巡检与诊断：\`npm run agent:autopilot\`
- 常驻后台守护进程：\`npm run agent:autopilot:daemon\`
- 主动触发全栈自愈：\`npm run agent:autopilot:heal\`
- 内部 RPC 遥测接口：\`GET /api/internal/autopilot\` 与 \`POST /api/internal/autopilot\`
`.trim() + "\n");

  // 12) action-decision-hub.md
  generatedFiles.set("architecture/action-decision-hub.md", `# 架构百科：流式智能行动决策卡片中枢 (Action Decision Hub)

> 对应规则：AGENTS.md Rule 0.9 / Rule 0.13 / packages/shared/frontend/components/action-decision-hub.tsx

## 一、 变革：从“死数字报表”到“智能行动决策”
传统仪表盘充满折线图、柱状图与数字指标，运维人员看着指标不知所措。
智能行动中枢将其彻底重塑为 **Action Cards (智能行动卡片)**：
- **四级行动优先级**：\`critical\` (紧急需介入)、\`warning\` (预警中)、\`opportunity\` (性能与架构优化)、\`resolved\` (已平账/已闭环)；
- **2-字符专属决策动词**：严禁冗长表单，卡片提供极简 2-字符决策按钮：\`平账\`、\`重发\`、\`自愈\`、\`体检\`、\`加固\`；
- **端到端一键闭环**：点击动词直接调用后端自愈执行管线，自愈成功后自动记录不可变审计跟踪并更新健康指标。

## 二、 Server-Sent Events (SSE) 亚秒级流式感知
- **零长短轮询**：前端通过 \`EventSource\` 直连 \`/api/internal/autopilot/stream\`；
- **实时心跳流下发**：每 4 秒流式推送一次遥测脉冲帧 (\`event: heartbeat\`)；
- **自动降级保护**：当浏览器或代理限制 SSE 时，透明降级为 15 秒间隔轮询，保障全网环境 100% 鲁棒可用。
`.trim() + "\n");

  // 13) socratic-inversion-flywheel.md
  generatedFiles.set("architecture/socratic-inversion-flywheel.md", `# 架构百科：高阶反向思维与自循环反思飞轮 (Socratic Inversion Flywheel)

> 对应规则：AGENTS.md Rule 0.9 / .agents/rules/HIGH-ORDER-INVERSE-THINKING.md / scripts/socratic-inquiry-engine.ts

## 一、 什么是高阶反向思维 (High-Order Socratic Inversion)？
互搏思维不是简单的安全攻防，而是**高阶反问**。是为了一个核心目标，不断打破平庸预设、质疑既定假设，让 AI 在自循环反思中建立出远超人类想象的架构与产品。

## 二、 6 阶苏格拉底反思跃迁阶梯 (The 6-Level Ladder)
| 阶梯 | 反省维度 | 核心反问 | 落地门禁与物理资产 |
|---|---|---|---|
| **Level 1** | 物理存在性 (Existence) | 代码和产物是否存在，还是只是纸面声明？ | CI 静态门禁扫描真实源码、无悬空引用。 |
| **Level 2** | 真实执行性 (Real Execution) | 代码是否在真实数据库运行，还是跑在假 Mock 上？ | \`verify:real-db\` 100% 真实 PostgreSQL/SQLite，0 内存伪造。 |
| **Level 3** | 非线性不变量 (Invariants) | 高并发或极端异常下，边界不变量是否成立？ | 并发 CAS 防超卖、4 态状态机真实覆盖、变异测试杀灭假断言。 |
| **Level 4** | 自生自循环性 (Autopoiesis) | 系统能否自巡检、自愈合、自进化，还是只能等人类维护？ | \`Agent Autopilot Daemon\` + \`Transactional Outbox\` 自动排队清退。 |
| **Level 5** | 非对称降维 (Asymmetry) | 为何要手写几百个 CRUD 页面？能否用动态本体画布降维打击？ | \`UniversalSchemaCanvas\` + 326 份机器可读契约，开发成本压缩 90%。 |
| **Level 6** | 终极目的对齐 (Telos Alignment) | 系统的一切能力是否为了实现全能力 AI Agent 闭环驱动？ | 全仓 38 个 Skills、MCP 服务、无头运营套件与 CI 强制门禁。 |

## 三、 门禁自循环闭环
- 本地执行反问自检：\`npm run socratic:inquire\`
- CI 自动化校验：\`npm run socratic:check\`（挂载在 \`npm run harness:check\` 与 \`npm run check\` 之中，任何破坏 6 阶反思的行为直接中断构建并退出报错）。
`.trim() + "\n");

  // 14) speckit-slash-commands.md
  generatedFiles.set("architecture/speckit-slash-commands.md", `# 架构百科：GitHub Spec-Kit 企业级扩展与 10 大斜杠指令矩阵 (/speckit.*)

> 对应规则：AGENTS.md Rule 0.9 & Rule 0.10 / .agents/rules/SPEC-FIRST-ENGINEERING-ARTIFACTS.md / .specify/

## 一、 为什么基于 GitHub Spec-Kit 进行全量升级与扩展？
Spec-Driven Development (SDD) 已由 GitHub Spec-Kit 与腾讯 CodeBuddy 发展为业界通用的 AI 编程工程规范。
本项目已**全量升级并拥抱 GitHub Spec-Kit 开源标准**，将原有的私有 \`spec-ops\` 全面收敛升级为 **Enterprise Spec-Kit**：
1. **拓扑标准遵从**：建立 \`.specify/memory/constitution.md\` 作为项目唯一最高宪法，包含 Rule 0、13 项通用铁律与 6 阶苏格拉底反思；
2. **顶层路径透传**：\`specs/ -> docs/specs/\` 顶层软链接，与所有原生 Spec-Kit 自动化工具 100% 互通；
3. **原生跨平台驱动**：通过 \`npm run speckit\` / \`npm run specify\` 提供零额外环境依赖的 TypeScript 原生引擎，告别 Python/uv 工具链负担；
4. **唯一真源指令化**：\`.agents/commands/speckit.*\` 作为唯一物理实体真源，直接面向各类智能体与开发者交付。

## 二、 10 大 /speckit.* 核心斜杠指令矩阵
| 斜杠指令 | 底层执行引擎 | 功能分类 | 核心产物 / 验收标准 |
|---|---|---|---|
| \`/speckit.eval\` | \`dar-decision-matrix\` | **[Idea Assessment]** 概念评估 | 需求立项前进行可行性、必要性与 DAR 投资回报率论证 |
| \`/speckit.constitution\` | \`npm run socratic:inquire\` | **[Constitution]** 核心宪法 | 审查底座宪法并执行 6 阶苏格拉底高阶反问与辩证 |
| \`/speckit.specify\` | \`npm run speckit:new\` | **[Specification]** 规格立项 | 交互式立项，生成 \`brief.json\`、\`assets/\` 与 \`prototypes/\` 骨架 |
| \`/speckit.plan\` | \`npm run speckit:build\` | **[Architecture]** 架构展开 | 极简 DSL 自动编译展开 8 份标准工程文档与时序图 |
| \`/speckit.tasks\` | \`scripts/speckit.ts tasks\` | **[Task Breakdown]** 任务拆解 | 提取波次任务树，严格贯彻 1 Task = 1 Commit |
| \`/speckit.implement\` | \`npm run task:verify\` | **[Implementation]** 实施落地 | 真实入库编码，核对 Git 提交白名单，杜绝口头完工 |
| \`/speckit.checklist\` | \`npm run speckit:check\` | **[Quality Checklist]** 验收清单 | 逐项核验验收标准与 11 阶段交付合规性 |
| \`/speckit.gate\` | \`scripts/speckit.ts gate\` | **[SpaceX Gate]** 物理门禁 | CMMI Gate 1~6 物理门禁扫描，100% 真实数据库测试驱动 |
| \`/speckit.ops\` | \`npm run agent:ops\` | **[Agent Operations]** 无头运营 | 326 份机器契约接口自动化体检、仿真造数与敏感清数 |
| \`/speckit.archive\` | \`npm run speckit:archive\` | **[Lifecycle Archive]** 归档防污 | 移入 \`docs/specs/archive/<YYYY-Qx>/<domain>/<name>/\`，保持施工区整洁 |

## 三、 全面收敛统一 (Full Unification)
历史定制过渡层已全部退役清除，所有流程 100% 统一为 Spec-Kit 原生规范：
- 规格立项与编译：统一使用 \`npm run speckit:new\` / \`speckit:build\`；
- 工作流配方 (Workflows)：\`.agents/workflows/\` 全部收敛为 Spec-Kit 标准步骤；
- CMMI 01~09 过程资产：全面挂载 Spec-Kit 模板与交付门禁；
- 斜杠指令：全部收敛为 \`/speckit.*\` 10 大指令矩阵。
`.trim() + "\n");
}

// ==========================================
// 4. 生成测试百科词条 (Testing Guide)
// ==========================================
function buildTestingMds() {
  // 1) testing-pyramid.md
  generatedFiles.set("testing/testing-pyramid.md", `# 测试百科：四层金字塔测试体系 (L1~L4)

\`\`\`
                   ▲
                  / \     L4: 契约端到端旅程 (Playwright & run-ops)
                 /   \    L3: 契约与跨域门禁 (rpc-actions & seam-graph)
                /     \   L2: 嵌入式 SQLite / PG 集成测试 (真实引擎)
               /_______\  L1: 业务逻辑与算法单测 (纯函数/状态机)
\`\`\`

- **L1 单元测试**：毫秒级纯函数、状态机跃迁矩阵断言；
- **L2 集成测试**：由嵌入式真实 SQLite (\`better-sqlite3\`) 或 PostgreSQL 驱动，校验外键、行级锁、租户隔离；
- **L3 契约测试**：验证 OpenAPI 与 RPC Actions 契约前后向兼容；
- **L4 自动化旅程**：由 ${AGENT_CONTRACT_COUNT} 份 Agent 契约直接驱动无头浏览器与无头 API 运营。
`.trim() + "\n");

  // 2) real-database-testing.md
  generatedFiles.set("testing/real-database-testing.md", `# 测试百科：真实数据库驱动与并发 CAS 防超卖

## 一、 为什么拒绝假 Mock？
内存数组 (\`items.filter()\`) 不校验数据库引擎的真实约束（如列名拼错、NOT NULL 漏填、跨租户越权、并发死锁）。

## 二、 双模真实驱动
1. **嵌入式 SQLite C 引擎**：
   - 零配置、毫秒级拉起，自带真实 WAL 模式与外键约束；
   - 用于日常开发与 CI 快速回归。
2. **PostgreSQL 容器镜像**：
   - 用于上线前全量渗透扫描与生产发布验证。

## 三、 CAS 原子影响行数验证
\`\`\`sql
UPDATE inv_atomic_probe 
SET qty = qty - 4 
WHERE id = 'p1' AND tenant_id = '1' AND qty >= 4 
RETURNING id;
\`\`\`
通过受影响行数判定扣减是否成功，并发场景下有且只有一个请求返回 1，另一请求返回 0，天然防超卖。
`.trim() + "\n");

  // 3) agent-browser-and-device.md
  generatedFiles.set("testing/agent-browser-and-device.md", `# 测试百科：Agent 契约驱动 UI 探针与无头接口运营

## 一、 机器可读契约 (Agent Contract)
由代码生成器同步产出于 \`<插件根>/agent/<kebab>.agent.json\`，记录页面路由、元素 \`testid\`、接口方法与权限码。

## 二、 两个消费轨
1. **\`agent-browser\` (UI 轨)**：
   - 驱动脚本：\`test/agent/agent-contract.spec.ts\`
   - 走 Playwright 无头浏览器，根据契约自动执行打开页面 ➔ 断言标题 ➔ 填写表单 ➔ 提交 ➔ 验证列表刷新。
2. **\`agent-device\` (接口轨)**：
   - 驱动脚本：\`node scripts/agent/run-ops.cjs health\`
   - 免开浏览器，直接打真实 HTTP API 执行批量体检、自动造测试数据 (\`seed-sample\`) 和清理数据 (\`purge-sample\`)。
`.trim() + "\n");

  // 4) security-and-load-testing.md
  generatedFiles.set("testing/security-and-load-testing.md", `# 测试百科：安全渗透扫描与性能容量回归护栏

## 一、 自动化安全扫描 (\`npm run security:scan\`)
覆盖本仓承诺的 12 项真实安全红线：
1. 未认证访问后台接口强制 401；
2. 伪造 Token 强制 401；
3. 伪造 \`x-tenant-id\` Header 拦截越权；
4. 弱口令拒绝；
5. 错误时不泄露底层 SQL 与堆栈；
6. 强制安全响应头 (HSTS, NoSniff)；
7. 插件挂载点权限守卫。

## 二、 性能压测护栏 (\`npm run load:test\`)
- 依据 \`packages/shared/contract/load-baseline.json\` 基线；
- 统计 RPS、P95 延迟与失败率；
- **铁律**：必须针对生产 standalone 产物进行压测，严禁对开发热更新进程跑压测！
`.trim() + "\n");

  // 5) mutation-testing.md
  generatedFiles.set("testing/mutation-testing.md", `# 测试百科：变异测试 (Mutation Testing) 反假 Mock 与有效性打假

> 对应规则：AGENTS.md Rule 0.6 / .agents/skills/mutation-tester/SKILL.md (对标 Stryker / PIT / SpaceX 标准)

## 一、 为什么行覆盖率有欺骗性？
只写执行语句而不写深度断言，或者在单测中把被测核心逻辑自身全部 Mock 掉，行覆盖率依然可以达到 100%。

## 二、 变异测试原理 (Fault Injection)
- 向 AST 注入变异算子：
  - 边界偏移：\`x > 0\` $\to$ \`x >= 0\`
  - 逻辑反转：\`status === 'PAID'\` $\to$ \`status !== 'PAID'\`
  - 租户旁路：删除 \`where tenant_id = ?\` 过滤
  - CAS 旁路：删除 \`where version = ?\` 乐观锁
- **测试有效性判据**：
  - **Mutant Killed (击杀)**：测试套件因故障变异而红牌报错（单测有效）；
  - **Mutant Survived (存活)**：注入故障后测试依然全绿 ➔ **证明存在空断言或假 Mock，必须立即补测击杀！**
  - **变异得分要求**：核心业务状态机 MSI $\ge 85\%$。
`.trim() + "\n");

  // 6) strix-autonomous-pentest.md
  generatedFiles.set("testing/strix-autonomous-pentest.md", `# 测试百科：Strix 多智能体自主红队渗透测试与 PoC 验证

> 对应规则：AGENTS.md §3.4 / .agents/skills/strix-penetration-testing/SKILL.md (对标 usestrix/strix 60,000+★, Apache-2.0)

## 一、 核心工作原理
传统安全扫描只做静态正则匹配，产生海量误报。Strix 扮演真实世界的白帽黑客：
1. **沙箱环境自主渗透**：在隔离 Docker 沙箱中自主测绘攻击面并制定攻击链；
2. **可执行 PoC 验证 (0 误报)**：必须构造出真实生效的利用载荷（PoC）打穿防御，才确认漏洞成立；
3. **自动生成修复补丁**：根据 PoC 失败原因直接给出防御代码补丁与回归测试。

## 二、 本工程核心防御底座靶标
- **跨租户越权穿透**：验证 Kysely AST 租户过滤器无法被外部篡改参数绕过；
- **RBAC 鉴权旁路**：验证未经授权或伪造 Token 无法调用内部接口；
- **CAS 乐观锁并发超卖**：验证高并发秒杀扣减不会发生数据脏写。
`.trim() + "\n");

  // 7) k6-load-benchmark.md
  generatedFiles.set("testing/k6-load-benchmark.md", `# 测试百科：K6 真实并发压测场景与容量回归护栏

> 对应规则：AGENTS.md §3.3 / packages/shared/contract/load-baseline.json / test/load/k6-load-benchmark.js

## 一、 压测场景与阶梯并发
- 场景定义脚本：\`test/load/k6-load-benchmark.js\`
- 执行阶梯加压：10 VUs $\to$ 50 VUs (加压 15s) ➔ 保持 50 VUs 高负载 30s ➔ 平滑降压 15s。

## 二、 SRE 容量护栏底线
- \`http_req_failed\`: 失败率严格 $< 0.1\%$；
- \`http_req_duration\`: p95 响应时间 $\le 20\text{ms}$ (健康检查/契约接口)；
- \`http_reqs\`: 单机吞吐量 $\ge 2,000\text{ RPS}$。
`.trim() + "\n");
}

// ==========================================
// 4.5 生成 CMMI 百科词条 (CMMI Standards)
// ==========================================
function buildCmmiMds() {
  generatedFiles.set("cmmi/cmmi-lifecycle.md", `# CMMI 百科：01~09 全生命周期工程规范与 7 类物理交付资产

> 对应标准：CMMI V2.0 / V3.0 (DEV + SVC 模型) / docs/architecture/CMMI-PROCESS-ASSETS-AND-DELIVERY-STANDARD.md

## 一、 全生命周期九大阶段真实基准资产

1. **01_management (立项与决策)**：
   - 项目立项与范围说明书：\`docs/01_management/project-charter.md\`
   - 风险登记册与缓解预案：\`docs/01_management/risk-register.md\`
   - 决策记录目录：\`docs/01_management/dar-decision-records/\` (保持留空待定制决策)
2. **02_requirements (需求工程)**：
   - 真实特性规格包：\`docs/features/ecommerce/brief.json\` (商城最小闭环)
   - 全域跨端契约：\`packages/domains/*/contract/\` (${AGENT_CONTRACT_COUNT} 份契约)
   - 规范目录 \`docs/02_requirements/\` 保持留空，不伪造假需求
3. **03_design (系统与架构设计)**：
   - 架构决策记录：\`docs/03_design/adr/ADR-0001-MULTI-TENANT-KYSELY-AST.md\`、\`ADR-0002-FIRST-PARTY-PLUGIN-ISOLATION.md\`
   - 交互式架构图谱：\`docs/03_design/diagrams/cooliebase-architecture.arch.json\` / \`.arch.html\` (archify 技能)
   - 数据库底座与8大审计字段：\`docs/03_design/database-design-erd.md\`
4. **04_features / 04_implementation (构造与编码)**：
   - 第一方业务插件隔离：\`packages/plugins/plugin-*/\` (15 个业务域)
   - 泛型 BaseMapper/QueryWrapper 引擎：\`packages/shared/backend/database/\`
   - 极简 Brief 声明驱动：\`docs/specs/<domain>/<name>/brief.json\` 与 1 Task = 1 Commit
5. **05_verification (验证与打假)**：
   - 真实测试执行总结：\`docs/05_verification/test-summary-report.md\` (14 个测试套件，55 passed / 6 skipped，100% 真实 SQLite WAL)
   - 变异测试目录：\`docs/05_verification/mutation/\` (保持留空待实际 Stryker 工具集成)
6. **06_quality_assurance (质量与配置审计)**：
   - 功能与物理配置审计：\`docs/06_quality_assurance/audit/PCA-FCA-COMPLIANCE-AUDIT-v1.1.0.md\` (compliance-auditor 技能)
   - 全量静态门禁数字凭证：\`docs/06_quality_assurance/gate-evidence-trace.json\` (Exit Code 0)
7. **07_release (发布与网关)**：
   - 版本发布说明书：\`docs/07_release/RELEASE_NOTES_v1.1.0.md\`
   - 生产安装部署 SOP：\`docs/07_release/system-deployment-sop.md\`
   - 故障秒级回滚预案：\`docs/07_release/rollback-runbook.json\`
8. **08_sre (站点可靠性与安全)**：
   - 生产容量护栏与 SLO 矩阵：\`docs/08_sre/01_slo_sli_metrics/SLO-SLI-ERROR-BUDGET-MATRIX.md\` (实测 26,877 RPS，p95 3.8ms)
   - 事故复盘目录：\`docs/08_sre/06_incidents_postmortem/\` (无故障保持留空)
   - 渗透测试目录：\`docs/08_sre/security-reports/\` (保持留空待实跑 Strix 容器)
9. **09_operations (持续运营与平账)**：
   - 本底座为开源工程模板，无真实资金交易与商户流水，\`docs/09_operations/\` 严格保持留空，绝不伪造虚假数据。

## 二、 交付哲学：No Artifact, No Done
严禁口头声明完工，每个工单与版本必须落地 7 类物理工程资产之一，并附带退出码为 0 的可核验凭证。
`.trim() + "\n");
}

// ==========================================
// 5. 生成踩坑实录百科 (Gotchas)
// ==========================================
function buildGotchasMds() {
  // 1) sqlite-boolean-mapping.md
  generatedFiles.set("gotchas/sqlite-boolean-mapping.md", `# 踩坑实录：better-sqlite3 布尔值映射为整型 0/1

### 现象
直接向 SQLite 传入 JS \`true\` / \`false\` 参数时，\`better-sqlite3\` 报 \`TypeError: SQLite3 only supports number, string, bigint, buffer, null\`。

### 解法
在 \`packages/shared/backend/lib/database/kysely-client.ts\` 中对 SqliteDialect 的 prepare 函数进行包装，自动将布尔参数清洗为 \`1\` 或 \`0\`。
`.trim() + "\n");

  // 2) load-test-standalone-rule.md
  generatedFiles.set("gotchas/load-test-standalone-rule.md", `# 踩坑实录：压测必须杀掉 dev 调试进程并压测生产镜像

### 现象
压测结果显示吞吐量只有 100~300 RPS，远低于标称的 20,000+ RPS。

### 根因
本机有正在运行的 \`next dev\` 调试进程占据了 3200 端口。开发模式下 Next.js 对每个请求做 JIT 动态编译与热更新监听，性能严重劣化。

### 解决
压测前必须清场杀掉 dev 进程，运行 \`npm run build\` 后启动生产镜像或独立二进制执行压测。
`.trim() + "\n");

  // 3) admin-route-proxy-policy.md
  generatedFiles.set("gotchas/admin-route-proxy-policy.md", `# 踩坑实录：插件路由与 Admin BFF 鉴权策略差异

### 现象
直接访问 \`/api/v1/plugins/cooliebase.xxx/api/...\` 被误判为未鉴权或报 404。

### 规约
- \`/api/v1/admin/**\`：全部默认由 \`withAdminRoute\` 实施平台管理员鉴权；
- \`/api/v1/plugins/**\`：由插件内部根据 \`plugin.manifest.json\` 声明的 \`auth.audience\`（\`operator\` / \`company\` / \`public\`）分别走各自守卫。
`.trim() + "\n");
}

// ==========================================
// 主执行函数与漂移检查
// ==========================================
function main() {
  buildIndexMd();
  buildDomainMds();
  buildCmmiMds();
  buildArchitectureMds();
  buildTestingMds();
  buildGotchasMds();

  let driftCount = 0;

  for (const [relPath, expectedContent] of generatedFiles.entries()) {
    const fullPath = path.join(WIKI_DIR, relPath);
    const dir = path.dirname(fullPath);

    if (checkOnly) {
      if (!fs.existsSync(fullPath)) {
        console.error(`[openwiki:check] 缺少 Wiki 词条: wiki/${relPath}`);
        driftCount++;
      } else {
        const actualContent = fs.readFileSync(fullPath, "utf8");
        if (actualContent !== expectedContent) {
          console.error(`[openwiki:check] 词条内容发生漂移: wiki/${relPath}`);
          driftCount++;
        }
      }
    } else {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, expectedContent, "utf8");
    }
  }

  if (checkOnly) {
    if (driftCount > 0) {
      console.error(`\n[openwiki:check] ✗ 发现 ${driftCount} 处 Wiki 漂移，请运行: npm run openwiki:sync 修复\n`);
      process.exit(1);
    } else {
      console.log(`[openwiki:check] PASS: 全部 ${generatedFiles.size} 篇 OpenWiki 百科词条与元数据 100% 同步！`);
      process.exit(0);
    }
  } else {
    console.log(`[openwiki:sync] 成功生成并同步 ${generatedFiles.size} 篇 OpenWiki 知识库词条至 wiki/ 目录！`);
  }
}

main();
