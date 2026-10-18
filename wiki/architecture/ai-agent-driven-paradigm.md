# 架构百科：全能力 AI Agent 驱动架构 (AI-Agent Driven Paradigm)

> 对应规则：AGENTS.md Rule 0.13 / .agents/rules/HIGH-ORDER-INVERSE-THINKING.md

## 一、 核心公理：系统内一切能力皆为 AI Agent 驱动设计
在传统工业级软件中，系统由人类使用鼠标逐个页面点击、由外包码农手写搬砖代码、由人工手工维护配置与对账。
而在 `cooliebase-all` 体系中，**所有能力必须具备 100% 机器可读与 AI Agent 闭环驱动能力 (All Capabilities Must Be AI Agent Driven)**。严禁开发仅供人类单点手工使用、无法被 AI Agent 感知或编排的孤岛系统。

## 二、 7 层全栈 AI Agent 驱动闭环矩阵

| 层次 | 载体与真源 | AI Agent 驱动方式 | 杜绝的低阶人工行为 |
|---|---|---|---|
| **1. 规格立项层 (SDD)** | `scripts/speckit.ts`<br>`brief.json` | Agent 仅需 `<500 Tokens` 声明 `brief.json`，由引擎自动展开为 Kiro 规范规格包（需求、设计、波次任务图、Runbook）。 | 严禁人工手写千行重复文档，严禁无规格直接写代码。 |
| **2. 代码实现层 (Coding)** | `BaseMapper<T>`<br>`QueryWrapper<T>`<br>`BaseService<T>` | Agent 以 DSL/Schema 驱动通用引擎自动展开，100% 继承多租户、逻辑删除与 8 大审计底座字段。 | 严禁大模型人肉生成几百行千篇一律的重复 CRUD。 |
| **3. 契约通信层 (Contracts)** | `docs/agent/contracts.json`<br>`seam-graph.json`<br>`rpc-actions.json` | 324 份全域契约、OpenAPI 3.1、自研 NATS 异步事件流与 Domain Facade，供 Agent 毫秒级定位调用。 | 严禁跨域私自 import Service，严禁无契约野路由。 |
| **4. 前端交互层 (Agent-Native UI)** | `agent-page-schemas.generated.json`<br>主权网关与指挥大屏 | 324 个实体的机器可读 Schema、主权网关与驾驶舱，支持 `agent-device` 与 `agent-browser` (Playwright) 无头探针自动化操作。 | 严禁仅能人类肉眼查看的死报表与死界面。 |
| **5. 自动化测试层 (Testing)** | `better-sqlite3`<br>`strix-penetration-testing`<br>`mutation-tester` | 嵌入式 SQLite 真实 C 引擎并发测试、Strix 多智能体自主红队渗透验证真实 PoC、变异测试打假假 Mock。 | 严禁伪造前端 Mock 与空断言骗门禁。 |
| **6. 运维割接层 (DevOps/SRE)** | `runbook.json`<br>`scripts/agent/run-runbook.cjs` | Agent 驱动实施预案执行（`npm run runbook`），原子割接并支持失败毫秒级自动回滚；SLO 错误预算自主熔断。 | 严禁手工改生产容器，严禁故障盲目甩锅。 |
| **7. 持续运营层 (Operations)** | `npm run agent:ops`<br>`financial-reconciliation-agent` | Agent 直接通过真实 API 跑通健康体检、造数、清数与三方对账，无需人类开浏览器手工造数。 | 严禁手工登后台一个个填表单造数。 |

## 三、 三位一体协同机制：Skills + MCP + CLI
1. **Skills (.agents/skills/)**：指导 Agent “怎么做”（方法论、EARS 句式、5-Whys、红绿测试准则，全仓 38 个原生技能）；
2. **MCP (scripts/mcp/cooliebase-mcp-server.cjs)**：为外部 Agent 提供 “查什么”（只读反射查询 14 大工具，严禁副作用写入）；
3. **CLI (scripts/speckit.ts 等)**：确定性落地 “谁来执行”（工具引擎自动执行、编译与门禁）。
