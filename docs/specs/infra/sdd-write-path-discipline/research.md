# Research & Decision Analysis (DAR): 吸收 SDD 四重铁律：写链路闭环 / 统一请求契约 / 红绿对抗 E2E / 无深度测试不发布

> **Spec-Kit 概念研判与加权决策分析 (Idea Assessment & Tech Selection)**
> 所属领域：`infra` | 规格标识：`sdd-write-path-discipline`
> 对应项目宪法：`.specify/memory/constitution.md` (Rule 0.3 开源成熟方案优先与竞品最高性价比选型)

---

## 1. 业务痛点与技术诉求阐述 (Background & Objectives)
把外部项目验证过的四条 SDD 硬约束，按**本仓的真实形态**改写后落成可失败的机检：即使有人只改文案、只写静态断言、或绕开统一请求层，也能在提交前被拦住。

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


## T1 实测清单（2026-10-28）

### ① 写路由规模

```bash
find src/app/api packages/*/*/routes -name route.ts | wc -l          # 1105
grep -rlE 'export (async )?function (POST|PUT|PATCH|DELETE)' ...      # 955
```

**955 / 1105** 含写方法。→ 任何"每个写路由都必须有深度测试"的一刀切都会立刻全仓红，
必须棘轮。

### ② 页面规模

```
*.page.tsx           768
含 <form / onSubmit    360
```

### ③ 页面内裸 `fetch(` —— 9 个文件，**全部在 `frontend/pages/`**

```
packages/plugins/plugin-online/frontend/pages/online-definitions-list.page.tsx
packages/plugins/plugin-online/frontend/pages/online-definition-designer.page.tsx
packages/plugins/plugin-report/frontend/pages/report-boards.page.tsx
packages/domains/infra/frontend/pages/codegen.page.tsx
packages/domains/infra/frontend/pages/api-access-log.page.tsx
packages/domains/infra/frontend/pages/template-engine.page.tsx
packages/domains/infra/frontend/pages/api-error-logs.page.tsx
packages/domains/infra/frontend/pages/page-builder.page.tsx
packages/domains/system/frontend/pages/login.page.tsx
```

**这决定了门禁的扫描面**：只扫 `frontend/pages/**` 与 `frontend/components/**`，
不扫 `frontend/api/**`（那里本就该用 `request.*`）。9 条作为棘轮基线冻结。

### ④ E2E 深度（现状 = 空壳）

```
test/e2e/admin-flow.spec.ts   20 行 / 2 个用例
  → 只断言 page.goto('/login') 与 '/' 的 status < 500
  → 0 处真实 API 调用、0 处写库断言、0 处对抗性用例
```

按本仓铁律「骨架不算完成」，这**不能算 E2E 覆盖**。本规格只交付**标准 + 模板 + 一条真实样例**，
并给 report-only 的深度度量；**不声称** 955 个写路由有测试。

### ⑤ 统一请求层的真源

`packages/shared/frontend/lib/request.ts` —— 带结构化错误（`code` / `message` / `messageKey` /
`details`）与 401 跳转。页面裸 `fetch(` 会绕过这些，错误码与跳转全部拿不到。
