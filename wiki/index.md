# cooliebase-all OpenWiki (LLM 知识大脑)

> **面向 AI Agent 的核心索引**：本知识库由底座真实元数据（`domain-catalog`、`seam-graph`、`contracts.json`）**自动化编译生成与动态自愈**。AI 编程助手（Cursor / Claude / Copilot）应优先检索对应词条，严禁全盘盲扫代码。

---

## ⚡ 核心架构铁律 (Rule 0 ~ 3)

1. **零 Token 浪费 & Schema 驱动**：严禁人肉手写几百行重复 CRUD。必须复用 `BaseMapper<T>`、`QueryWrapper<T>` 与 `BaseService<T>`，自动继承 8 大审计字段与行级租户隔离。
2. **第一方插件规范 (First-Party Plugins)**：业务域一律落在 `packages/plugins/plugin-<domain>/`，平台地基落在 `packages/domains/{system,infra}/`。严禁在 `src/` 堆放平铺代码。
3. **真实数据库驱动 (Zero Fake Mock)**：测试 100% 由嵌入式 SQLite (`better-sqlite3`) 或真实 PostgreSQL 驱动，严禁前端伪造 Mock。
4. **全链路 Agent 契约闭环**：全仓已收敛 **342 份机器可读契约**，由 `agent-device` (接口运营/造数) 与 `agent-browser` (Playwright 探针) 统一驱动。

---

## 🧭 17 原生领域全景图 (Domain Directory)

| 领域 (Domain) | 架构分层 | 演进阶段 | 独立端口 | Agent 实体数 | Facade 方法数 | 公开 API 前缀 |
|---|---|---|---|---|---|---|
| [system](domains/system.md) | 🏛️ 平台地基 | 阶段 A | 3210 | 1 | 119 | `/api/v1/admin/system` |
| [infra](domains/infra.md) | 🏛️ 平台地基 | 阶段 A | 3211 | 1 | 47 | `/api/v1/admin/infra` |
| [online](domains/online.md) | 🧩 第一方插件 | 阶段 B | 3212 | 0 | 9 | `/api/v1/admin/online` |
| [bpm](domains/bpm.md) | 🧩 第一方插件 | 阶段 A | 3213 | 8 | 4 | `/api/v1/admin/bpm` |
| [pay](domains/pay.md) | 🧩 第一方插件 | 阶段 B | 3214 | 14 | 5 | `/api/v1/admin/pay`, `/api/v1/app/pay`, `/api/v1/open/pay` |
| [report](domains/report.md) | 🧩 第一方插件 | 阶段 A | 3215 | 1 | 3 | `/api/v1/admin/report` |
| [mp](domains/mp.md) | 🧩 第一方插件 | 阶段 B | 3216 | 8 | 4 | `/api/v1/admin/mp` |
| [mall](domains/mall.md) | 🧩 第一方插件 | 阶段 B | 3217 | 49 | 4 | `/api/v1/admin/mall`, `/api/v1/app/mall` |
| [member](domains/member.md) | 🧩 第一方插件 | 阶段 A | 3218 | 11 | 7 | `/api/v1/admin/member`, `/api/v1/app/member` |
| [crm](domains/crm.md) | 🧩 第一方插件 | 阶段 B | 3219 | 21 | 4 | `/api/v1/admin/crm` |
| [erp](domains/erp.md) | 🧩 第一方插件 | 阶段 B | 3220 | 33 | 4 | `/api/v1/admin/erp` |
| [wms](domains/wms.md) | 🧩 第一方插件 | 阶段 B | 3221 | 16 | 7 | `/api/v1/admin/wms` |
| [mes](domains/mes.md) | 🧩 第一方插件 | 阶段 B | 3222 | 133 | 3 | `/api/v1/admin/mes` |
| [ai](domains/ai.md) | 🧩 第一方插件 | 阶段 B | 3223 | 14 | 8 | `/api/v1/admin/ai`, `/api/v1/open/ai` |
| [aigw](domains/aigw.md) | 🧩 第一方插件 | 阶段 B | 3226 | 0 | 9 | `/api/v1/admin/aigw`, `/api/v1/open/aigw` |
| [iot](domains/iot.md) | 🧩 第一方插件 | 阶段 B | 3224 | 15 | 5 | `/api/v1/admin/iot` |
| [im](domains/im.md) | 🧩 第一方插件 | 阶段 B | 3225 | 17 | 3 | `/api/v1/admin/im` |

---

## 🏛️ CMMI 01~09 全生命周期工程规范 (CMMI Standards)

- [CMMI 01~09 全生命周期工程过程与 7 类交付物理资产](cmmi/cmmi-lifecycle.md)
- [38 大工业级原生 Agent 技能矩阵与真源管理](architecture/skills-matrix.md)

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
