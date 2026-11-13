# Requirements Specification: 派生工程是否应携带示例插件 hello-world

> **Spec-Kit 标准需求规格说明书 (SRS: Software Requirements Specification)**
> 遵循 IEEE 29148 与 EARS (Easy Approach to Requirements Syntax) 严谨需求工程标准。
> 状态：`PLAN_APPROVED` | 规格类型：`feature` | 所属领域：`infra` | 规格标识：`example-plugin-shipping`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0 ~ 13 项不可动摇工程铁律)

---

## 1. 业务目标与愿景 (Introduction & Business Goal)

让用基座孵化出来的业务工程不再携带与本业务无关的示例插件内容，同时不破坏框架自身的回归测试；框架包的 author/url 等归属信息保持不变（那不是白标泄漏）。



## 2. 术语定义与领域边界 (Glossary & Domain Scope)

| 术语 / 概念 | 英文标识 | 领域定义与所属模块 |
|---|---|---|
| 派生工程是否应携带示例插件 hello-world | example-plugin-shipping | 本规格所交付的业务与技术上下文，严格收敛于 `infra` 领域边界 |
| 行级租户隔离 | Multi-Tenant AST | 基于 Kysely AST 自动在 SQL 注入 `tenant_id` 过滤条件，严禁跨租户越权 |
| 审计底座字段 | Audit Base Columns | 实体必须自动继承 8 大审计字段，严禁业务层手工更新审计元数据 |

## 3. 用户故事与角色矩阵 (User Stories & Personas)

1. **P0** [作为业务工程开发者] 作为拿产物开工的开发者，目录里不该出现与我的业务无关的示例插件，否则我要先判断它能不能删。

2. **P0** [作为业务工程开发者] 作为框架维护者，裁剪示例插件不能打断基座自己的运行时测试 —— 现在 runtime-manager 与 plugin-sources 都把 hello-world 当夹具。

3. **P1** [作为业务工程开发者] 作为后来的维护者，我需要一眼看出这个目录是基座示例、不进产物，以及它被谁引用，而不是靠 grep。

## 4. 关键业务不变量 (Key Business Invariants)

1. **基座测试不因裁剪而失守** —— 基座仓内 hello-world 仍在，runtime-manager 与 plugin-sources 两组测试继续覆盖它；由 pnpm run test:unit 验证。
2. **产物无悬空引用** —— 裁剪后对产物运行 pnpm harness check 与 pnpm run test:unit；任何引用被裁文件的地方都会直接失败。

## 5. 验收标准清单 (Acceptance Criteria)

1. **THE system SHALL** 验证：`pnpm run check` exit=0
2. **THE system SHALL** 验证：实测清单：`grep -rl 'examples/hello-world' packages scripts test` 的每一处都被显式处置（保留并写明理由，或随裁剪改掉）
3. **THE system SHALL** 验证：孵化产物后 `ls <产物>/packages/plugins/` 的输出与设计结论一致（含或不含 examples 都行，但必须与结论一致并写进验收）
4. **THE system SHALL** 验证：产物自身的 `pnpm run test:unit` 与 `pnpm run check` 全绿，证明裁剪没留下悬空引用
5. **THE system SHALL** 验证：反向对照：把示例插件按设计放回去，产物门禁必须能发现不一致（否则这条验收是空的）

## 6. 约束条件与技术边界 (Constraints & Non-Goals)

### 系统必须满足的架构约束 (The System SHALL Comply With)
* **THE system SHALL COMPLY WITH**: 多租户：业务表带 tenant_id，从全局上下文取，禁止调用方透传（§4.8）。
* **THE system SHALL COMPLY WITH**: 跨域：只走 Domain Facade，不 import 别的域 Service（§3.3）。
* **THE system SHALL COMPLY WITH**: 基座只建原生域（§17.3）：examples/hello-world 不是域而是示例与夹具，所以处理方式不能是注册成域。
* **THE system SHALL COMPLY WITH**: 不得改动框架包的 author / url / 包名 —— 那是归属与来源信息，派生工程保留正确的归属不是泄漏。
* **THE system SHALL COMPLY WITH**: 裁剪必须落在孵化链或目录结构上，不得让产物自己跑一次清理脚本才算干净。

### 明确不做与负向范围 (Non-Goals)
* 不改框架包名、author、repository url —— 用户已明确这属于归属信息，不是泄漏。
* 不做运行期自动清理脚本：干净必须在生成时成立，不是靠事后跑一遍。
* 不重写插件系统架构，不动 worker 协议与 manifest 形态。
* 不顺手清理其它非示例内容（历史文档里的反例字样等）。
