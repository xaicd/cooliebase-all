# Requirements: 开源顶流技能吸收：Archify 架构可视化与 Strix 自主渗透防御

状态：`PLAN_APPROVED`　类型：`enhancement`　特性：`archify-strix-integration`　域名：`infra`
上游：一句话立项需求。任何范围调整必须先改本文件（§6.1）。

## 1. 目标与背景 (Introduction)

深度吸收开源顶流 tt-a1i/archify (47k★ MIT) 与 usestrix/strix (60k★ Apache-2.0)，生成交互式可机器验证的架构拓扑图谱，构筑基于真实数据库的四大安全渗透防御靶标。



### 性能基线与优化目标 (Baseline vs Target Metrics)

- 当前基线 (Baseline): 未明确
- 目标指标 (Target): 未明确



## 2. 术语表 (Glossary)

| 术语 | 英文 | 定义 |
|---|---|---|
| 开源顶流技能吸收：Archify 架构可视化与 Strix 自主渗透防御 | archify-strix-integration | 本规格所交付的业务与技术上下文 |

## 3. 用户故事 (User Stories)

### US-001: 作为系统架构师
- **优先级**: `P0`
- **内容**: 吸收 archify 技能规范至 .agents/skills/archify/，生成全域架构拓扑 docs/03_design/diagrams/cooliebase-architecture.arch.json 与可交互 HTML。

### US-002: 作为系统架构师
- **优先级**: `P0`
- **内容**: 吸收 strix-penetration-testing 技能规范至 .agents/skills/strix-penetration-testing/，明确四大防御靶标与宿主机穿透准则。

### US-003: 作为系统架构师
- **优先级**: `P1`
- **内容**: 编写 K6 真实压测基准脚本 test/load/k6-load-benchmark.js，与本地独立压测基线（26,877 RPS）对齐，通过 20 道门禁总检。


## 4. 关键业务不变量 (Invariants)

1. **真实防御纵深不变量** —— 无论外部如何伪造请求头或制造并发竞争，Kysely AST 租户隔离与 CAS 乐观锁防线严格不可穿透

## 5. 验收标准 (Acceptance Criteria)

1. **THE system SHALL** 验证：`npm run check` exit=0，20 道门禁全部通过
2. **THE system SHALL** 验证：docs/03_design/diagrams/cooliebase-architecture.arch.html 浏览器可交互加载并展示 17 领域拓扑
3. **THE system SHALL** 验证：`npm run skills:check` 验证 36 项技能规范且无重复目录

## 6. 约束与边界 (Constraints & Non-Goals)

* **THE system SHALL COMPLY WITH**: 宿主机穿透调用：严禁将 Strix 庞大的外部 Python 代码拷入代码库，必须通过宿主机穿透命令（host-exec）以 Docker 沙箱容器方式调度。
* **THE system SHALL COMPLY WITH**: 真实数据库支撑：所有安全渗透与压测必须依托真实数据库环境，严禁前端伪造 Mock。
* **THE system SHALL COMPLY WITH**: 零商业传染性：引入的开源技术 100% 为 MIT 与 Apache-2.0 商业友好许可。

### 明确不做 (Non-Goals)
* 不在代码仓库内直接维护 Strix 的 Python 3.12 虚拟环境与底层依赖包
