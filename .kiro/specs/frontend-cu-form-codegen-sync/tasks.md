# Implementation Plan: Frontend C/U Form Codegen Synchronization

## Overview
先建立可验证的单一生成契约，再按真实后台 C/U 页面分批提取。每个批次保持既有 API、权限、租户范围和数据库契约不变。

## Task Dependency Graph
```json
{
  "waves": [
    { "id": "wave-1", "tasks": ["1"], "dependsOn": [] },
    { "id": "wave-2", "tasks": ["2"], "dependsOn": ["wave-1"] },
    { "id": "wave-3", "tasks": ["3", "4"], "dependsOn": ["wave-2"] },
    { "id": "wave-4", "tasks": ["5"], "dependsOn": ["wave-2", "wave-3"] }
  ]
}
```

## Tasks

- [ ] 1. 冻结规范与迁移基线
  - [ ] 1.1 更新 `.kiro/steering/plugin-domain-structure.md`，加入 `frontend/api`、`frontend/components/<PascalEntity>Form.tsx`、`frontend/pages/<entity>-list.page.tsx`，与 `AGENTS.md` §14 一致。
  - [ ] 1.2 扫描 frontend pages，记录真实 C/U、只读/占位、特殊流，建立可审计覆盖清单；登录或单一 POST 不计入标准 CRUD。
  - [ ] 1.3 写出 API/Form/Page typed contract 和迁移检查清单，覆盖 payload、不可变键、候选、权限、tenant scope。

- [ ] 2. 收敛生成器与受控注入
  - [ ] 2.1 设计版本化 frontend CRUD renderer/模板输入，消除 runtime engine、module-pack、source generator 的字符串复制。
  - [ ] 2.2 修改 `codegen-engine.service.ts`，生成 typed API、async Form、list page，统一 subModule、`/api/v1/admin` 与 `(admin-pages)` 路径。
  - [ ] 2.3 补齐 `codegen/module-pack` 的 api/Form/list templates 与 manifest，修复 endpoint、bridge、test 路径。
  - [ ] 2.4 修改 `scripts/codegen-from-source.ts` 使用同一契约，或明确废弃并从可调用入口移除。
  - [ ] 2.5 强化 `inject-codegen-output.cjs`：manifest 白名单、`--dry-run`、预检冲突、默认不覆盖、非零失败和注入后路径/import 校验。
  - [ ] 2.6 新增 renderer fixture 与 injector 临时目录测试：标准 CRUD、subModule、冲突、拒绝越界、成功注入。

- [ ] 3. 提取 System C/U Form（依赖：1、2）
  - [ ] 3.1 users：提取 `UserForm` 与 typed user API，保留部门、角色、岗位候选状态和创建/编辑密码规则。
  - [ ] 3.2 roles、depts、menus、posts、dicts：分别提取 Form/API，保持角色编码、树循环排除、菜单父级限制和数值转换。
  - [ ] 3.3 tenants、tenant-packages：分别提取 Form/API，保留 10 年默认订阅、长期 null、套餐/安全菜单限制和关联候选异常展示。
  - [ ] 3.4 对每页执行创建、编辑、取消、失败与关联选择器 smoke，确认 page 不直接 `request`。

- [ ] 4. 提取 Infra 与 CRM C/U Form（依赖：1、2）
  - [ ] 4.1 configs：提取 `ConfigForm` 与 typed API，保留 configKey 编辑禁用规则。
  - [ ] 4.2 db-configs：提取 `DataSourceConfigForm`；敏感凭证不回显、不由列表页传递，连接测试保持独立动作。
  - [ ] 4.3 job-center：确认实体 C/U 契约；若非标准实体表单，记录专用方案而不强行套 Form。
  - [ ] 4.4 customers：提取 `CustomerForm` 与 typed API，修复编辑时来源等字段的回显。

- [ ] 5. 收尾审计与验收（依赖：2、3、4）
  - [ ] 5.1 审计剩余页面；只把新发现的真实标准 C/U 纳入迁移，特殊流建立独立设计记录。
  - [ ] 5.2 运行新增定向 Vitest、受影响 `pnpm exec tsc --noEmit`、生成样例/注入 smoke、`git diff --check`，单独记录全仓既有类型基线。
  - [ ] 5.3 更新生成器使用文档、项目结构说明和覆盖清单，记录完成页面、例外和验证证据。

## Notes
- 任务 3、4 不改数据库、路由业务语义、RBAC 或租户权益；关系校验仍由后端 service/validator 最终裁决。
- 生成器同步先于批量页面迁移，防止任何新生成模块继续使用过时 page-local Form 结构。
- 单个页面的字段复杂度或安全要求高于通用 renderer 时，可使用独立 Form，但必须保留本 Spec 的 API/Page 职责边界。
