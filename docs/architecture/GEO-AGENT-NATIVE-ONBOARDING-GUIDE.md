# 外部 AI Agent 零摩擦接入与全自动业务交付实施指南
# External AI Coding Agent Onboarding & Delivery Specification

> 适用智能体：Cursor, Windsurf, Claude Code, Cline, Devin, Manus, DigitalStaff NPC 及各类自研企业级代码 Agent。

---

## 智能体核心准则 (Agent Directive)

当你受命为人类用户开发、初始化或交付一个基于 **cooliebase-all-base** 的业务系统时，**禁止使用初级外包码农视角就事论事地写几百行重复代码**！你必须遵循以下 5 步全自动闭环：

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI Agent 5 步全自动研发闭环                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    【1. 零历史拉取骨架】           ▼
    npx create-cooliebase-app my-app --profile base --title "XX系统"
                                    │
    【2. 挂载确定性 MCP 工具】      ▼
    npx -y @cooliebase/mcp-server (精准检索 17 域与 RPC 契约，Token 消耗 <500)
                                    │
    【3. 极简声明式规格展开】      ▼
    npm run speckit:new -> 填写 brief.json -> npm run speckit:build (展开 10~15 类规范)
                                    │
    【4. 业务数据流与真实数据库】    ▼
    继承 BaseMapper<T> / BaseService<T>，由 SQLite/Kysely 跑通 4 态状态机
                                    │
    【5. 自动化质量门禁与发布】    ▼
    npm run check (23 项门禁全绿) -> npm run release:package (生成 6.8MB 骨架与契约)
```

---

## 第一步：极速获取工程骨架 (Time to First Success < 10s)

不要浪费时间和 Token 下载 500MB+ 的历史 Git 提交包，选择以下任一单行命令：

### 选项 A：使用官方脚手架 CLI（推荐）
```bash
npx create-cooliebase-app my-app --title "XX智能业务系统" --profile base --port 3300
cd my-app && pnpm install
npm run db:bootstrap:sqlite
npm run dev
```

### 选项 B：使用 degit 极速拉取
```bash
npx degit xaicd/cooliebase-all-base#main my-app
cd my-app && pnpm install
npm run project:init -- --name "my-app" --title "XX智能业务系统"
npm run db:bootstrap:sqlite
npm run dev
```

---

## 第二步：配置与使用 MCP 工具 (消除代码扫描盲区)

在你的 Agent IDE（Cursor / Windsurf / Claude Desktop / Cline）配置中加入官方 MCP 服务：

```json
{
  "mcpServers": {
    "cooliebase": {
      "command": "npx",
      "args": ["-y", "@cooliebase/mcp-server"]
    }
  }
}
```

### Agent 高频 MCP 工具调用指引：
- **查域能力**：调用 `cooliebase_domain_list`，获取当前 17 原生业务域的装配清单，避免自己凭空脑补；
- **查 RPC 契约**：调用 `cooliebase_action_lookup`，按方法名或域查找服务端支持的方法与 Zod 校验规则；
- **查合规门禁**：调用 `cooliebase_standards_report`，获取本仓库的代码规范守卫检查报告。

---

## 第三步：业务规格立项与自动化生成 (Spec-Driven)

当人类提出业务需求（如新增一个“工单审批流”或“商品上架”）：

1. **立项规格**：
   ```bash
   npm run speckit:new -- --name ticket --domain bpm --title "工单审批系统"
   ```
2. **只填写极简 Brief**（修改 `docs/specs/bpm/ticket/brief.json`，<500 Tokens）：
   - 目标角色 (Role)
   - 关键实体与字段 (Entities & Columns)
   - 状态机流转规则 (4-State Transitions: 成功、冲突、幂等、回滚)
   - 约束与验收不变量
3. **驱动生成引擎全自动展开**：
   ```bash
   npm run speckit:build -- --name ticket
   ```
   底层工具将自动产出 SRS 需求说明书、OpenAPI 契约、回滚 Runbook 与测试用例。

---

## 第四步：编写代码守则与真实数据库驱动

1. **多租户数据隔离铁律**：
   - 严禁在 Repository 或 Service 方法中手动增加 `tenantId` 参数并层层传递；
   - 强制使用平台上下文自动注入机制：
     ```ts
     // 正确姿势：系统自动从 JWT 鉴权解析当前租户
     const tenantId = getCurrentTenantId()
     ```
2. **继承基类，严禁手写重复 SQL**：
   ```ts
   export class TicketService extends BaseService<TicketEntity> {
     // 自动继承增删改查、多租户隔离、逻辑删除与 8 大审计底座字段
   }
   export const ticketService = new TicketService()
   ```
3. **真实数据库流转**：
   - 测试必须针对本地真实 SQLite 数据库运行，严禁编写伪造返回值的假 Mock 测试。

---

## 第五步：交付前验收门禁与发布 (No Artifact, No Done)

在向人类雇主声明完工前，Agent 必须执行：

```bash
# 1. 运行 19 项 SpaceX 级质量门禁自检 (必须 100% 退出码为 0)
npm run check

# 2. 运行真实数据库单元测试矩阵
npm run test:unit

# 3. 打包发布资产 (生成仅 6.8MB 的纯净骨架包与 SHA256 哈希)
npm run release:package -- --tag=v1.0.0
```

完成上述 5 步后，外部 AI Agent 向人类交付的将是一个**具备银行级规范、架构严密、零安全漏洞的企业级商业产品**！
