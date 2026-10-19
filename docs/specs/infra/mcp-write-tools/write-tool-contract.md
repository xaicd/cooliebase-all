# 低代码 MCP 写类工具：边界与统一返回契约（T1）

> 本文件是 `docs/specs/infra/mcp-write-tools/` 规格的**手工撰写契约**，不是 `npm run speckit:build` 的生成物
> （生成物为 spec/requirements/plan/design/tasks 等 15 份，禁止手改）。
> 上游依据：`docs/features/sprint-prod/0918.md` 的 B1 二期未完成项；`AGENTS.md` §3 明确不引入第 5 条。

## 1. 定位

B1 一期已把 MCP 消费面做成 14 个只读工具，本批（B1 二期）补上**写类工具的「规划/预览」形态**。
命名沿用 0918 的原始设计（`scaffold.plan` / `codegen.preview`），MCP 工具名走既有 `cooliebase_` 前缀。

**本批不开放任何落盘通道。** MCP 面永远只产出"计划"，真正写盘仍由人（或后续独立批次）显式执行。

## 2. 不可动摇的边界（违反即视为缺陷）

1. **零落盘**：三个新工具一律 `plan` / `preview` 语义，调用后工作区必须无变化。
   验收方式：调用全部新工具后 `git status --porcelain` 输出为空。
2. **不外传 write 类入参**：`inputSchema` 不含 `write` / `apply` / `force` / `yes` 等入参；
   内部调用被封装脚本时**永不传递** `--write`。不靠"调用方守规矩"，靠签名与实现都不给入口。
3. **域名白名单**：域名一律经 `scripts/lib/domain-catalog.cjs` 解析并校验 catalog 登记状态；
   未登记域直接报错，不兜底、不推断、不生成"看起来对"的路径。
4. **不自判通过**：工具只返回"应跑哪条门禁"（`followUpGates`），绝不自称检查通过，
   也绝不代为执行门禁并宣布结果 —— 守 `AGENTS.md` §3 明确不引入第 5 条
   「绕过 `npm run check` 的『智能进化』」。
5. **薄封装**：只封装既有脚本与 `scripts/lib`，禁止在 MCP 层重写领域逻辑（会形成第二真源）。

## 3. 统一返回契约

三个工具返回同一形状，便于调用方统一处理：

```jsonc
{
  "tool": "cooliebase_scaffold_plan",
  "mode": "plan",                  // "plan" | "preview"
  "writes": false,                 // 恒为 false —— 本批的硬保证，不是提示
  "plannedWrites": ["..."],        // 真实执行时会创建/修改的路径（相对仓库根）
  "followUpGates": ["npm run check"], // 执行完该动作后应跑的门禁；工具不代跑、不代判
  "manualSteps": ["..."],          // 仍需人显式做的事（含真正的落盘命令）
  "details": {}                    // 工具特有证据（见下）
}
```

约定：

- `writes` 恒 `false`。若某工具无法在不写盘的前提下给出 `plannedWrites`，**允许给空数组并说明原因**，
  不允许为了"看起来有用"而落盘或猜测路径。
- `followUpGates` 只列命令字符串，工具不执行、不解释结果、不宣布通过。
- `manualSteps` 必须包含"如何真正落盘"的显式命令，使人不必回头读源码。

## 4. 三个工具与封装真源

CLI 形态均为本次阅读源码确认，非推测。

### 4.1 `cooliebase_scaffold_plan`

- **封装真源**：`scripts/create-business-domain.ts <域> [--tables <元数据文件>] [--export <导出名>] [--dry-run]`
- **实测行为**：`--dry-run` 分支（该文件第 80–84 行）**只校验表元数据并列出表名**，
  **不**执行后续第 2–5 步（生成迁移 / 生成全栈代码 / 注册插件 / 重生成契约）。
- **因此 `plannedWrites` 的能力边界**：dry-run 拿不到完整的文件清单。
  诚实做法是返回 `plannedWrites: []` 并在 `manualSteps` 中列出真实落盘会经过的 5 个步骤与其命令，
  而不是去猜一份文件列表。猜测路径在插件域上是**静默失效**的高发区（AGENTS.md §3.2）。
- `details`：校验到的表名与 className 列表、目标域真实目录（经 `domainDirOf`）。

### 4.2 `cooliebase_codegen_preview`

- **封装真源**：`scripts/inject-codegen-output.cjs <已解压目录> [--dry-run]`
  （需该目录内含 `codegen-manifest.json`，否则报错）
- **实测行为**：`--dry-run`（该文件第 41–43 行）打印 `WOULD COPY` 清单后 `exit(0)`，不复制；
  且**冲突检测先于 dry-run 分支**（第 39 行），所以预览能提前暴露"会覆盖既有文件"。
- **`plannedWrites`**：即 dry-run 输出的 `WOULD COPY` 清单（相对路径），这是本工具最有价值的部分。
- 目标域落点复用既有 `cooliebase_codegen_targets` 的域目录解析结果，不另写一套路径规则。
- `details`：解压目录、文件总数、是否存在冲突。

### 4.3 `cooliebase_table_migration_plan`

- **封装真源**：`scripts/generate-table-migration.ts --tables <模块> --export <导出名> --name <迁移名> [--write] [--check]`
- **实测行为**：**默认即 dry-run**（该文件第 71–74 行）：打印 SQL 并提示"加 `--write` 落盘"。天然满足零落盘。
- **`plannedWrites`**：将写入的迁移目录路径（由 `--name` 决定），无需真正写盘即可推导。
- `details`：生成的 SQL 全文（截断）、表数量、目标迁移路径。
- **禁止**：不得把 `--write` 透传给被封装的脚本。

## 5. 本轮明确的非目标

- 不实现任何自动落盘（`--write`）工具；落盘通道不开放给 MCP。
- 不把 Agent Loop / Cordis 引入本仓（维持 `agent-profile.json.forbidden` 与 harness 演进规范 §3）。
- 不打包 Skill Pack（属 B2 独立批次）。
- 不修改既有 14 个只读工具的名称、入参、返回结构（零破坏性）。

## 6. 与 compat-manifest 的关系（T3）

`packages/shared/contract/compat-manifest.json` 的 `consumptionSurface.mcp.tools` 是 MCP 工具清单的**声明面**，
`scripts/check-compat-manifest.cjs` 会与服务实际注册的工具做**交叉校验**（防第二真源）。
本批新增 3 个工具后必须同步该清单，否则 `npm run compat:check` 会失败 —— 这正是期望行为。

`compatibility.additive` 现写的是 `new read-only MCP tools`。本批工具**仍然不落盘**，但语义上不再是纯只读，
故 T3 需把该条改为能准确描述"plan/preview 形态"的措辞，避免声明与现实不符。
