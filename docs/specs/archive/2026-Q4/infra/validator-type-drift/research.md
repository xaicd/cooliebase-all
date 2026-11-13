# Research & Decision Analysis (DAR): 校验器类型漂移：检测工具已能对齐，但它不是门禁、且有识别盲区

> **Spec-Kit 概念研判与加权决策分析 (Idea Assessment & Tech Selection)**
> 所属领域：`infra` | 规格标识：`validator-type-drift`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0.3 开源成熟方案优先与竞品最高性价比选型)

---

## 1. 业务痛点与技术诉求阐述 (Background & Objectives)
把「生成校验器与表元数据的字段类型一致」从『一个人工可跑的对齐工具』变成『一条会失败的机检』，并补上它看不见的写法，使漂移无法再悄悄回来。

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
结论：不引入新依赖，无许可传染风险。。方案 A 在开发 ROI、架构一致性与无外部额外运行时依赖方面表现最优，获准进入规格立项阶段。


## T4 验收记录（2026-10-27 实测）

### ① 门禁确实在 `check` 里跑

`check` 链第 27 步是 `pnpm run validators:align:check`（紧跟 `routes:validation:check`），
正常时输出 `[align-validators] ✓ 校验器与表元数据一致`。

### ② 简单注入会先被 typecheck 拦住（如实记录）

只把 validator 的 `name` 改成 `z.coerce.number()`（元数据 varchar）时，
`check` **确实红了，但红在 `typecheck`（TS2345）**，不是红在新门禁 ——
因为每个 validator 都被 route 消费，schema 类型一变，route 传参就类型不匹配。

**结论**：对这个注入用例，新门禁与 typecheck 是**纵深防御**关系，
typecheck 先挡住，新门禁是第二道。

### ③ 耦合漂移证明新门禁的**独立价值**

把 validator 与 DTO 类型**一起**改成 `number`（即「一致地错」）：

| 检查 | 结果 |
|---|---|
| `pnpm run typecheck:check` | **EXIT 0**（TS 自洽，抓不到） |
| `pnpm run validators:align:check` | **EXIT 1**，点名 `ai-api-key.name: z.coerce.number → 元数据 varchar` |
| `pnpm run check` | **EXIT 1，红在 `[align-validators]`**（不是 typecheck） |

这就是本门禁存在理由：**「生成物与真源一起走偏」时，类型系统帮不上忙，只有元数据比对能发现。**

### ④ 门禁只读

注入后跑门禁，被注入的文件**没有被改回**（`z.coerce.number` 仍在），
证明 `--check` 不落盘；`--check` 与 `--write` 同时给时 exit 2。
