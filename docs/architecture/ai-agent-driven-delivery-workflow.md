# CoolieBase-All-Next AI-Driven 全链路软件工厂与交付规范
# (AI-Driven Software Delivery Foundry Blueprint)

> **版本编号**: 2026.10-FOUNDRY-V1  
> **核心吸收**: 融合 Coolie 商业级交付经验（CMMI Spec-First 交付资产、8 要素 Brief、反向五大视角）与 CoolieBase-All-Next 17 域插件化架构体系  
> **适用对象**: 所有在本项目中从事架构设计、需求派发、编码施工、代码审查与交付验收的 AI Agent 及工程师

---

## 一、 顶层定位：从“代码生成器”升维为“AI 原生商业软件交付工厂”

`cooliebase-all` 不仅是一个包含 17 个域的企业中后台模板，更是供 AI Agent 独立施工、自主进化的 **AI 原生商业软件工程工作区 (Workspace Bundle)**。

为了彻底杜绝大模型在大型复杂代码库中常见的“顺拐贴补丁、口头说完成、生成假 Mock、堆砌样板代码”四大顽疾，本项目严格推行 **AI Agent Driven 闭环流水线**：

```
                    【老板 / 业务方：一句话模糊诉求】
                                  │
                                  ▼
             ┌─────────────────────────────────────────┐
             │ Step 1. PM / 架构师：EARS Spec 规格结构化 │
             │  • 业务实体溯源 (Object) 与状态机定义   │
             │  • EARS 五种语法定义系统响应行为        │
             │  • 建立双向跟踪矩阵 (RTM)               │
             └────────────────────┬────────────────────┘
                                  │
                                  ▼
             ┌─────────────────────────────────────────┐
             │ Step 2. 8 要素 Brief 派活 (上下文锁定)   │
             │  • 文件范围绝对白名单 vs 绝对不动项黑名单│
             │  • 明确 5 选 1 物理工程资产形态         │
             │  • 单写者锁与冷却时间纪律               │
             └────────────────────┬────────────────────┘
                                  │
                                  ▼
             ┌─────────────────────────────────────────┐
             │ Step 3. 工匠 Agent 施工 (极简减法与契约) │
             │  • 复用 BaseMapper / QueryWrapper 样板  │
             │  • 跨域必须且只能走 Domain Facade       │
             │  • 编译 0 报错 (tsc / pnpm build)       │
             └────────────────────┬────────────────────┘
                                  │
                                  ▼
             ┌─────────────────────────────────────────┐
             │ Step 4. SpaceX 级自动化门禁与真实数据库验证 │
             │  • 真实 DB/SQLite 状态机 4 态流转与回滚断言│
             │  • 平台级登录冒烟与安全穿透 (smoke/sec)  │
             │  • 10 项工程标准与手写文件基线防覆盖    │
             └────────────────────┬────────────────────┘
                                  │
                                  ▼
             ┌─────────────────────────────────────────┐
             │ Step 5. No Artifact, No Done 资产结项    │
             │  • 物理交付物归档（源码SHA/契约/SOP）    │
             │  • 交付凭据与制品指纹握手               │
             └─────────────────────────────────────────┘
```

---

## 二、 8 要素 Brief 派单标准（禁止裸派活）

任何由 PM、上层 Agent 或工程师派发给执行 Agent 的任务工单，必须包含完整的 **8 大要素**，缺一不可：

```markdown
# [Task Brief]: <一句话明确目标>

## 1. 任务目标 (Measurable Goal)
<一句话可断言目标，包含具体数值、路由路径或性能/覆盖率指标>

## 2. 为什么要做 (Context & Root Cause)
<业务场景价值 + 关联的 Commit ID / 错误日志 / 契约漂移记录>

## 3. 文件操作范围白名单 (File Whitelist)
- packages/plugins/plugin-<domain>/backend/services/...
- packages/plugins/plugin-<domain>/contract/...

## 4. 绝对不动项黑名单 (Untouchable Boundaries)
- 严禁修改 packages/shared/ 核心 SDK 契约；
- 严禁私自修改 prisma/schema.prisma 原有字段；
- 严禁横向直接跨域 import 其它业务域内部实现。

## 5. 责任角色与执行工具池 (Role & Tools)
- 责任工种: 后端核心工匠 (Core SWE) / 架构守卫 (Guard) / 测试工匠 (QA)
- 工具链: tsx / vitest / prisma / schemaReader

## 6. 验收门禁 (Verification Gates)
- [ ] 编译通过：pnpm build 退出码为 0
- [ ] 契约通过：npm run check 10 项标准全绿
- [ ] 真实数据库单测：对应 domain 测试用例断言真实入库且通过
- [ ] 平台冒烟：npm run smoke:login 正常退出

## 7. 单写者与并发纪律 (Single-Writer Concurrency)
- 严格遵循单文件互斥锁，严禁两个 Agent 同时并发修改同一文件；
- 遵循工具调用冷却时间，避免并发锁死。

## 8. 物理交付资产形态 (Work Product 五选一，No Artifact No Done)
- [ ] 1. 源码库提交 (符合规范且 0 报错的 Git Commit)
- [ ] 2. 统一契约定义 (OpenAPI Swagger / Zod Schema / DTO)
- [ ] 3. 自动化测试套件与执行报告 (含 4 态状态机断言)
- [ ] 4. 生产发版制品与部署回滚 SOP (Docker 镜像 / 指纹 / 应急脚本)
- [ ] 5. 架构决策与需求规格说明书 (EARS SRS / HLD / DAR 加权选型)
```

---

## 三、 Agent 真实认知投递机制 (Knowledge Delivery Truth)

吸收 Coolie 中最关键的认知提醒：**“没有自动同步这回事！仓库里的 Markdown 不会自动流入 Agent 的脑子，不要自欺欺人。”**

在 `cooliebase-all` 中，Agent 的认知通道遵循以下 4 级可靠性阶梯：

```
【最高可靠性】 1. Assembly 分段强制注入 (.agents/context/ASSEMBLY.md)
              • 每次会话必读，优先级最高，包含 IDENTITY、RULES、ONTOLOGY。
              • 严格控制 Token 长度，拒绝将万行文档塞进 System Prompt。

【按需激活】   2. 领域专业技能 (.agents/skills/<name>/SKILL.md)
              • 通过 description 关键字触发或显式 invoke_subagent。
              • 任务匹配时加载，完成时释放。

【检索探针】   3. 确定性机器真源 (domain-catalog.json + seam-graph.json + Model-free 检索)
              • Agent 遇到跨域或契约问题时，主动读取 JSON 机器真源定位，而不是瞎猜。

【最低可靠性】 4. 普通平铺 Markdown (docs/**)
              • 仅作为人类或长篇深度调研归档，Agent 默认不会主动感知，必须由 Brief 指定路径加载！
```

---

## 四、 五大合一顶层反向审视视角

所有 AI Agent 在响应输入时，严禁佩戴“初级外包码农”的就事论事思维，统一佩戴**五大合一审视战袍**：

| 审视视角 | 核心职责边界 (管什么 / 不碰什么) | 工作方式与方法 (SOP) | 法定交付凭证 |
| :--- | :--- | :--- | :--- |
| **1. 交付公司负责人 (CEO)** | **管**：人效比、杜绝假交付、终验单签字。<br>**不碰**：底层类库口舌之争。 | 晨检大盘走查；卡片式审批；终验闭环。 | 《交付简报》<br>《客户终验核销单》 |
| **2. 平台总架构师 (Platform Lead)** | **管**：插件单体解耦、双模 SDK/RPC、多租户强隔离、单向依赖。<br>**不碰**：单个业务字段起名。 | Seam Graph 穿透分析；Domain Facade 治理；防跨域渗透。 | 《详细设计 (LLD)》<br>《API 契约清单》 |
| **3. Palantir 本体架构师 (Ontology)** | **管**：业务双核 (Object + Action) 孪生建模、状态机守恒量、消灭死报表。<br>**不碰**：运行期数据当交付物。 | 实体逆向抽象；合法 Action 矩阵；因果动词闭环。 | 《实体模型规格》<br>《状态机迁移矩阵》 |
| **4. 极简人机产品总监 (CPO)** | **管**：竞品穿透全面产品思路、极简两字交互、单行工具栏、移动防遮挡。<br>**不碰**：在管理端堆砌花哨动效。 | 全球竞品横评 (DAR)；极简减法走查；零重复入口。 | 《竞品调研分析》<br>《极简 UI 规范走查表》 |
| **5. CMMI 质量总监 (QA Lead)** | **管**：编译 0 报错、No Artifact No Done、真实 DB 状态机验证、登录冒烟。<br>**不碰**：纯空壳 Mock 单测。 | 自动化测试门禁；越权反证嗅探；秒级回滚预案。 | 《自动化测试报告》<br>《生产部署与回滚 SOP》 |

---

## 五、 缺陷修复四步穿透协议 (Four-Step Bug Resolution)

当接收到任何报错或 Bug 报告时，Agent 严禁简单顺拐加 `try-catch` 或修改局部变量，必须执行四步穿透：

1. **Step 1. 业务对象与契约溯源**：
   * 该 Bug 破坏了哪个核心业务对象（Object）？
   * 关联的状态机前置条件是否缺失？
   * API 输入输出 Schema 与真实数据是否发生漂移？
2. **Step 2. 极简减法原则**：
   * 优先审视能否通过**删除冗余的重复代码**来解决问题；
   * 坚决拒绝为了修一个 Bug 新增两倍的补丁逻辑。
3. **Step 3. 真实使用场景复现**：
   * 在真实数据库环境复现完整的调用链与状态变迁；
   * 检查多租户上下文 `getCurrentTenantId()` 是否存在断链越权风险。
4. **Step 4. 固化防退化用例与不可变证据**：
   * 修复完成后，必须编写反向防御测试用例（覆盖非法前置状态与异常参数）；
   * 执行 `npm run check` 确保未引入破坏性变更；
   * 提交带任务代号的 Git Commit（如 `[T123] fix(pay): 修复退款状态机逆向回滚失效`）。
