# Quality Checklist & Acceptance Gate: 低代码 MCP 写类工具（B1 二期）：scaffold.plan / codegen.preview

> **Spec-Kit 质量验收与门禁自检清单 (Verification Checklist)**
> 所属领域：`infra` | 规格标识：`mcp-write-tools` | 阶段：`PLAN_APPROVED`
> 对应项目宪法：`.specify/memory/constitution.md` (Gate 1~6 物理门禁全覆盖)

---

## 1. 宪法与架构合规自检 (Constitutional & Architecture Compliance)
- [ ] **Rule 0.1 零 Token 浪费**：业务模型采用 Schema/DSL 驱动展开，无冗余手写样板代码。
- [ ] **Rule 0.2 模式极致复用**：已复用 `BaseMapper<T>`、`QueryWrapper<T>`，自动继承审计基础列。
- [ ] **Rule 0.4 真实数据库驱动**：100% 跑通真实 PostgreSQL/SQLite 状态机测试，0 内存伪造 Mock。
- [ ] **Rule 0.5 契约第一切入**：对外暴露版本化 API 契约，跨域调用 100% 走 Domain Facade。
- [ ] **Rule 0.7 权限与隔离合规 (多租户按需可选)**：接口配置严格权限码；多租户隔离仅作为底座可选能力按需开启（非强制，单租户/企业私有化交付项目严禁硬塞无用租户字段与过滤样板）。
- [ ] **Rule 0.8 交付 E2E 任务同等对齐律与零 DB Seed**：自动化运营配置与自动化测试 E2E 任务同等纳入 Spec 拆解与 1 Task = 1 Commit，严禁空洞 Mock，真实数据库初始化与全旅程拟人走查验收。

## 2. CMMI 五大核心流程实证自检 (CMMI Lifecycle Concrete Verification)
- [ ] **G1 需求立项 (RD/SRS)**：真实业务需求立项，明确业务对象、用户故事 (P0/P1/P2) 与多端建设范围（B端管理/C端门户/移动App/小程序），0 泛泛而谈。
- [ ] **G2 概要设计 (TS/HLD)**：技术选型明确（底座/数据库/多端方案），数据模型与持久化契约清晰，多租户按需开启，API 契约无二义性。
- [ ] **G3 详细实现 (SWE/LLD)**：1 Task = 1 Commit 增量提交，零编译报错，代码与契约严格映射。
- [ ] **G4 全栈验收 (VER/VAL)**：Spec 四波次任务等权矩阵严格落地（Wave 1 地基 ➜ Wave 2 业务 ➜ Wave 3 自动化运营配置与拟人走查 ➜ Wave 4 自动化测试与真库持久化断言），零空洞 Mock，机器证据与实机截屏齐备。
- [ ] **G5 投产割接 (CM/Release)**：制品指纹唯一，具备生产部署 SOP 与秒级回滚预案。

## 3. 验收标准逐项核验 (Acceptance Criteria Status)
- [ ] `pnpm run check` exit=0
- [ ] `pnpm run compat:check` exit=0（工具清单与 MCP 服务交叉校验一致）
- [ ] 每条新工具正反向测试通过：正常调用返回完整 plannedWrites/followUpGates/manualSteps；对未登记域或越权路径调用被拒
- [ ] 不落盘断言通过：调用全部新工具后 `git status --porcelain` 输出为空
