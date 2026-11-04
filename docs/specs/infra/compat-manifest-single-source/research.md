# Research & Decision Analysis (DAR): compat-manifest 单一真源：把 deployment/apiPartitions/harness 声明并入真源并加机检堵住静默丢失

> **Spec-Kit 概念研判与加权决策分析 (Idea Assessment & Tech Selection)**
> 所属领域：`infra` | 规格标识：`compat-manifest-single-source`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0.3 开源成熟方案优先与竞品最高性价比选型)

---

## 1. 业务痛点与技术诉求阐述 (Background & Objectives)
恢复『compat-manifest 的声明只有一个真源』这一行为：COO-64 补的 deployment / apiPartitions / harness 共 35 行声明回到真源 packages/shared/contract/compat-manifest.json 并随派生进入下游工作区；此后任何『只改生成物』或『真源丢声明』都变成红灯，而不是被下一次回写静默吃掉。

## 2. 候选方案拟定 (Candidate Solutions >= 2 + 1 阴性对照)
| 方案编号 | 方案名称 | 技术路线 | 开源协议 | 维护成本与风险 |
|---|---|---|---|---|
| A | 领域复用/微内核展开 | 复用已有 BaseMapper 与 Facade 底座 | 内部专有 | 改造成本最低，零学习曲线 |
| B | 开源成熟工业级方案集成 | 引入社区经过验证的标准库进行二次封装 | MIT/Apache 2.0 | 生态成熟，但需增加包体积 |
| C | 阴性对照 (从零人肉手写) | 逐行手写 CRUD 与裸 SQL | 内部专有 | 极高 Token 浪费与违背 Rule 0，不予推荐 |

## 3. 决策分析与加权打分 (DAR Decision Matrix)
| 准则编号 | 评估维度 | 权重 | 方案 A | 方案 B | 方案 C (对照) |
|---|---|---|---|---|---|
| C1 | 业务契合度与 ROI | 30% | 5 (1.5) | 3 (0.9) | 1 (0.3) |
| C2 | 零外部重型依赖交付 | 25% | 5 (1.25) | 2 (0.5) | 3 (0.75) |
| C3 | 性能与并发抗损性 | 20% | 5 (1.0) | 4 (0.8) | 5 (1.0) |
| C4 | 架构演进与单体拆分 | 15% | 5 (0.75) | 3 (0.45) | 1 (0.15) |
| C5 | 开源许可与社区生态 | 10% | 5 (0.5) | 5 (0.5) | 2 (0.2) |
| **合计** | **综合加权得分** | **100%** | **5.00** | **3.15** | **2.40** |

## 4. 结论与立项裁决 (Decision Conclusion)
结论：无引入外部第三方库风险。方案 A 在开发 ROI、架构一致性与无外部额外运行时依赖方面表现最优，获准进入规格立项阶段。
