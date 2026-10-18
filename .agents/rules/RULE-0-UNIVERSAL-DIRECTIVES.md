# RULE 0: UNIVERSAL DIRECTIVES (最高优先级通用工程铁律)

> **MANDATORY RULE 0: ZERO TOKEN WASTE, ZERO DUPLICATE CODE & TOOL-FIRST LOW-CODE ARCHITECTURE**  
> 任何 AI Agent / IDE 接入本模板与工程时，必须无条件执行以下不可动摇的底线法则：

## 1. 严禁 Token 与算力浪费 (Zero Token Waste)
- 严禁大模型人肉逐行生成千篇一律的重复 CRUD、样板代码、冗余 DDL 或静态 HTML 骨架。
- 业务开发与需求实现必须采用 **Schema / DSL 极简声明式驱动**（大模型输出压缩至 <500 Tokens），由底层通用引擎自动展开！

## 2. 架构模式极致复用 (Architectural Pattern Mastery)
- 必须复用泛型 `BaseMapper<T>`、`QueryWrapper<T>`、`BaseService<T>` 与 `createBaseSchema`。
- 自动继承多租户隔离、逻辑删除与 8 大基础审计底座字段（`tenant_id`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted`, `deleted_at`, `remark`），严禁手写重复 SQL/CRUD！

## 3. 存量低代码工具优先 (Prioritize Existing Low-Code Tooling)
- 在编写任何代码前，必须优先检索并复用模板内已有域能力、脚手架工具（`scripts/scaffold-feature`）、CRUD 生成器与内置 Skills！

## 4. 缺少工具就造工具 (Build Tools When Missing)
- 遇到可抽象的高频研发需求，必须优先沉淀为通用工具与生成脚本，让工具自动化执行，**绝不能重复手写无效无意义代码**！

## 5. 开源成熟方案优先与竞品性价比选型 (Open-Source First & Best ROI Selection)
- 若自研工具周期过长、复杂度高或 Token 消耗大，**严禁盲目从零造轮子**；必须优先检索开源成熟工业级方案，进行多维竞品横评并遴选出**最高性价比（ROI）与改造成本最小**的方案进行集成！

## 6. SpaceX 级全链路测试验证与真实数据库驱动 (SpaceX-Grade Testing & Zero Fake Mock)
- 代码变更必须跑通质量门禁（L1单测、L2集成、L3契约、L4 E2E）。
- 100% 由真实本地数据库（SQLite `data/cooliebase.db`）或真实 PostgreSQL 支撑，**严禁前端伪造 Mock 数据**！

## 7. 本体域全息导航与 API 契约第一切入 (Ontology & API-Contract-First)
- 任意需求必须先在本体域（实体网、Domain Facade、route manifest、权限码）中秒级定位目标域与影响半径，以 API 契约为探针执行穿透闭环；一切需求终局 100% 收敛于真实 API 支撑。

## 8. 全工种四类契约族收敛 (All-Role Contract Families)
- 数据同步/ETL、BI 查询、运营编排、运维发布等非编码需求同样必须收敛为可审计契约——API 契约 / 数据契约 / 流程契约 / 预案契约四选一，并过专属质量门禁。

## 9. 全局高阶反向思维与 AI-Driven Harness 全程监督
- 严禁以初级外包码农视角就事论事贴补丁；敲代码必须业务对象溯源且由通用引擎展开；写单测必须状态机真实入库覆盖与反假 Mock；修改接口必须契约先验、零破坏性变更与挂载不可变操作审计！

## 10. 0-1 软件工程交付资产与 No Artifact, No Done 铁律 (Spec-First Artifacts)
- 严禁将上线运行期业务数据（订单数据、流水、日志）当成交付资产；严禁口头声明完工。
- 每个工单必须基于 8 要素 Brief 派发，且必须产出 7 类物理工程资产之一（SRS/RTM、OpenAPI 契约、0 报错源码、真实 DB 状态机单测报告、生产回滚 SOP、SRE 稳定性基线、持续运营对账平账单）！

## 11. 单一真源与全生命周期过程资产防污染铁律 (Single Source of Truth & Anti-Pollution)
- **技能唯一真源**：全仓唯一技能目录为 `.agents/skills/<name>/SKILL.md`，严禁在 `docs/skills` 等任何位置设立副本、镜像或重复目录！
- **规格按域垂直隔离与归档**：规格资产统一封装在 `docs/specs/<domain>/<name>/`（支持 feature/bugfix/enhancement/refactor 四态），割接后自动归档至 `docs/specs/archive/`，杜绝根目录散落与认知污染。
- **CMMI 01~09 资产标准化管理**：
  - 过程资产严格收敛于 `docs/01_management` ~ `09_operations`（涵盖 `08_sre` IaaS/PaaS/应用全栈可观测与 `09_operations` 业务持续运营对账）；
  - **三存三不存法则**：文本、Schema 契约与测试入 Git；海量二进制（大设计源文件、录音录像、盖章扫描件）存对象存储/Wiki，Git 内仅存受控索引编号与哈希。
