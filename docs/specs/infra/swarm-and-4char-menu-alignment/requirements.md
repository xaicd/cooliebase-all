# Requirements Specification: SWARM多智能体协同法典、8动词service.sh与4字菜单门禁对齐

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`swarm-and-4char-menu-alignment`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

为 CoolieBase-All 基座落地环境无关的 SWARM 多智能体协同法典、8 动词全生命周期服务入口（scripts/service.sh 与 deploy/service.sh）以及可见导航菜单 <=4 字硬门禁与冻结棘轮，满足 Coolie PMO 层 B 标准并与派生产物同源保留。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| SWARM多智能体协同法典、8动词service.sh与4字菜单门禁对齐 | swarm-and-4char-menu-alignment | 本规格所交付的真实业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 领域门面契约 | Domain Facade | 业务模块对外暴露的标准契约接口，跨域通信单向调用，内部实现自闭环 |
| 数据隔离策略 | Data Isolation Policy | 依据客户交付形态按需选择（单租户物理独立库 / 多租户行级租户隔离可选特性） |

## 3. 业务需求立项与多端建设交付范围 (Business Intake & Multi-Terminal Scope)

### 3.1 真实业务立项背景
- **交付目标**: 面向客户真实业务场景，消灭手工低效流程与断点。
- **服务对象**: 涵盖 B 端业务操作员、管理员及终端客户角色，杜绝无主需求。

### 3.2 多端建设覆盖边界
- **B端管理中台**: 负责业务运营配置、流程审核、数据对账与大盘监控。
- **C端用户门户/移动端**: 负责业务直接录入、消费结算与进度查询（按需）。
- **多端协议对齐**: 多端统一遵循 OpenAPI/REST 契约规范，共享领域状态机。

## 4. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为Swarm 协调者与工匠 Agent] 作为多智能体工匠，进场读取根级 SWARM.md 即可获知 Next.js 16 + 15 插件域 + Domain Facade + Embedded PostgreSQL 18.4 (ephemeral-pg.cjs) + Wave 0~4 单写者分片与只读 Verifier [SEALED] 铁律，且 project:init / clone-project-base 派生新项目时自动保留 SWARM.md

2. **P0** [作为Swarm 协调者与工匠 Agent] 作为 SRE 运维人员，执行 bash scripts/service.sh <install|build|start|stop|restart|status|health|logs|--help> 或 bash deploy/service.sh <verb> 即可按 .env.ports 完成全栈生命周期管控

3. **P0** [作为Swarm 协调者与工匠 Agent] 作为交付负责人，运行 pnpm run admin:nav:check 与蓝图编译器（blueprint:doctor / blueprint:compile）时，新增超 4 字可见导航菜单被确定性拦截或自愈收敛，历史存量超长菜单冻结于棘轮基线且存量单测 100% 绿灯

## 5. 关键业务不变量 (Key Business Invariants)

1. **单写者与只读独立核验** —— SWARM.md 明确规定同一波次文件白名单互斥、跨域只走 Domain Facade、Wave 4 Verifier 只读实测后签发 [SEALED]。
2. **层 B 三件套可执行闭环** —— HARNESS.md + scripts/harness.cjs + scripts/service.sh (及 deploy/service.sh) 完整覆盖 8 动词，且支持 .env.ports 动态端口。
3. **新增可见菜单 <=4 字刚性防线** —— menu-title-guard.cjs 对所有非基线冻结的新增菜单执行 <=4 字硬拦截，反向对照单测注入 5 字菜单必须返回违规。

## 6. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：根级 SWARM.md 存在且体积 < 25KB，0 处容器路径字面量、0 处裸 npm/npx，且 project:init / clone-project-base 保留 SWARM.md
2. **THE system SHALL** 验证：scripts/service.sh 与 deploy/service.sh 均具备可执行权限 (+x)，支持 install|build|start|stop|restart|status|health|logs 与 --help
3. **THE system SHALL** 验证：pnpm run admin:nav:check 校验可见菜单 <=4 字棘轮通过；向菜单或蓝图注入未登记的 >4 字新菜单标题时确定性拦截/自愈
4. **THE system SHALL** 验证：pnpm exec vitest run test/unit/swarm-and-4char-menu-alignment.test.ts exit=0（含正向与反向对照单测）
5. **THE system SHALL** 验证：pnpm run standards:check 与 pnpm run check exit=0

## 7. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 命令字符串铁律：新增或修改文档、脚本、测试一律只写 pnpm run <script> 与 pnpm exec <tool>，严禁出现裸 npm/npx 或空 catch 块。
* **THE system SHALL COMPLY WITH**: 零容器路径硬编码：严禁出现任何容器挂载绝对路径字面量，统一使用工作区相对路径与 ${COOLIE_HOME:-/opt/coolie}/blueprints/cooliebase-all。
* **THE system SHALL COMPLY WITH**: 跨域边界：15 原生业务插件域与 system/infra 平台域跨包通信必须经由 Domain Facade，严禁跨包直接 import service。
* **THE system SHALL COMPLY WITH**: 棘轮兼容：历史存量 >4 字菜单进入 menu-title-length-baseline.json 冻结只减不增，新增菜单与蓝图实体 menuTitle 严格执行 <=4 字。

### 明确不做与负向范围 (Non-Goals)
* 不在本规格内一次性批量重命名历史存量 340 张导入表的既有菜单文案（由冻结棘轮基线收敛，避免破坏既有 E2E 选择器）
* 不改动业务插件域的对外 HTTP 路由协议与数据库表结构
