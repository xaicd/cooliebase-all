> ⚠️ **ARCHIVED 2026-10-18**: 此文档为 2026 Q3 上游对标研究快照。
> 不再更新，所述上游项目（cooliebase-vue-pro / yudao-cloud / yudao-boot-mini 等）已不再作为本工程的事实来源。
> 历史对照参考保留，新读者请参考 `docs/specs/` 与 `.agents/rules/`。

# cooliebase-all 基础架构蓝图（v0.1）

更新时间：2026-08-02

## 1. 目标

建设一个可复用的企业级中后台基座 `cooliebase-all`，用于承载：

1. 当前乡村振兴业务系统
2. 后续新增的其他行业系统

并同时满足两类研发模式：

1. AI 快速生成（脚手架、模板、标准化 CRUD、测试骨架）
2. 工程师精细设计（复杂流程、高并发、风控、审计、跨域集成）

## 2. 对标与合并策略

来源代码：

1. `apps/cooliebase/cooliebase-vue-pro`：后端工程治理、系统通用能力、模块化思维
2. `apps/cooliebase/yudao-ui-admin-vue3`：后台 UI 交互范式、路由权限、页面结构

合并原则：

1. 保留 CoolieBase 的能力分层，不照搬 Java 技术栈
2. 落地到 Next.js + TypeScript + Prisma + RBAC 权限码体系
3. 把“功能模块”沉淀成可复制模板，而不是复制业务代码

## 3. cooliebase-all 分层

```text
apps/cooliebase/cooliebase-all/
  src/app/                    # Route 层（页面 + API 薄层）
  src/backend/services/       # 业务服务层（核心逻辑）
  src/backend/validators/     # 输入校验（Zod）
  src/frontend/templates/     # 页面模板（可复用）
```

架构约束：

1. Route 只做参数解析、鉴权、调用 Service、统一响应
2. Service 承担业务编排、事务、日志与审计
3. Validator 提供 schema + type 导出
4. 模板先行：先选模板再写业务

## 4. 首批基座模块（P0）

对标 CoolieBase 通用核心，优先补齐：

1. 在线用户（online-users）
2. 登录日志（login-logs）
3. 操作日志（operate-logs）

每个模块必须同时具备：

1. API：`/api/admin/system/*`
2. Service：`src/backend/services/*`
3. Validator：`src/backend/validators/*`
4. Page：`/admin/system/*`
5. 权限码：`system:*`
6. 事件日志：`logger.event` + `logger.audit`

## 5. AI + 工程师协同机制

### 5.1 AI 负责

1. 生成薄层路由、Service 骨架、Validator、页面 CRUD 框架
2. 批量补齐文档、测试骨架、菜单注册、权限码挂接
3. 执行巡检脚本并给出缺失项

### 5.2 工程师负责

1. 领域建模、边界设计、性能与一致性策略
2. 第三方集成（支付、IoT、工作流、风控）
3. 最终业务规则确认与验收

### 5.3 合作边界

1. AI 产出必须通过模板规范与检查脚本
2. 工程师只在复杂节点介入，不重复搭 CRUD 样板

## 6. 标准交付协议（每个新模块）

1. 路由薄层不超过 40 行
2. 统一响应 `{ success, data|error }`
3. 必须有 Zod 校验
4. 必须有权限码校验（禁用新增角色硬编码）
5. 必须有 event/audit 日志
6. 必须提供列表页筛选 + 分页 + 导出（如适用）
7. 必须包含至少 1 条服务层关键路径测试

## 7. 与当前主仓库对接方式

1. `cooliebase-all` 先作为独立应用骨架在 `apps/` 演进
2. 逐步把可复用模块反哺到主仓库 `src/` 目录
3. 统一保留一套 RBAC 权限码与日志规范，避免平行体系

## 8. 两周落地计划

### Week 1

1. 完成 `online-users`、`login-logs`、`operate-logs` 三模块 MVP
2. 打通菜单、权限码、API、页面、日志审计闭环
3. 发布第一版模板与开发规范

### Week 2

1. 增加参数管理、公告管理、任务调度中心模板
2. 增加模块生成命令与巡检脚本
3. 建立基座验收清单和 CI 门禁

## 9. 成功标准

1. 新业务模块从 0 到可用页面 <= 0.5 天
2. AI 生成代码一次通过率持续提升（lint/build/test）
3. 任何模块都能追溯：权限、日志、审计、数据边界
4. 新团队成员能在 1 天内完成一个标准模块开发

## 10. 横向治理能力（新增基线）

### 10.1 多数据库与国产数据库兼容

1. cooliebase-all 必须具备多数据库识别与分级策略。
2. 国产数据库必须纳入标准识别：OceanBase、TiDB、openGauss、GaussDB、KingbaseES、DM8、神通、GBase。
3. 详细规范见：docs/architecture/cooliebase-all-database-compatibility.md

### 10.2 通用 UI 框架治理

1. 后台开发统一纳入 antd、element 等通用框架治理口径。
2. 主应用通过 adapter + Token 保持一致体验。
3. 详细规范见：docs/guides/cooliebase-all-ui-framework-governance.md

### 10.3 微服务演进能力

1. 架构需支持从模块化单体演进到 Spring Cloud 类似微服务模式。
2. 所有核心域必须具备可拆分边界设计。
3. 详细规范见：docs/architecture/cooliebase-all-microservice-evolution.md

### 10.4 Agent Skill 制度

1. 重要核心能力必须有独立 Skill 记录，供 Agent 自动执行。
2. Skill 索引目录：.agents/skills
