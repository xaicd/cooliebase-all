---
inclusion: auto
---

# 三端功能开发与脚手架规则

> **本文件曾是独立规则，现已被取代。** 它的内容已并入仓库级唯一真源
> `.agents/skills/new-feature/SKILL.md`（该 Skill 的 description 明确写着
> "融合 `.kiro/feature-development-workflow`"）。此处只保留指针，避免同一份指引存在两处、
> 然后各自漂移。

## 真源指向

| 事项 | 唯一真源 |
|---|---|
| 全链路新功能研发闭环（需求 → 表 → API/权限 → 程序 → 生成 → 多端配置 → 验收） | `.agents/skills/new-feature/SKILL.md` |
| 受控代码生成入口 | `npm run scaffold`（= `npx tsx ./scripts/scaffold-feature.ts`） |
| 接口/路由规范 | `docs/guides/api-route-conventions.md` |
| 特性规格与原型归类 | `.agents/rules/FEATURE-SPEC-AND-PROTOTYPE-STANDARD.md` |
| RBAC 角色默认基线 | `packages/shared/backend/lib/rbac-registry/role-permissions.ts` |

## 本文件此前引用过、但**并不存在**的东西（已全部移除，勿再照抄）

一次真实核查发现本文件整篇指向另一套工程结构（`scripts/check-docs-commands.cjs` 会拦这类漂移）：

| 曾经的引用 | 实际 |
|---|---|
| 技能 `/feature-development-workflow` | 真源是 `.agents/skills/new-feature/` |
| `feature:generate`（脚本名） | 真名是 `scaffold` |
| `src/shared/feature-scaffold/registry.ts` | **不存在**；且 `AGENTS.md` §3.2 规定 `src/` 下只允许 `app/` 与 `proxy.ts` |
| `permissions.registry.ts` | **不存在**（见上表 RBAC 真源路径） |
| `docs/api-routes.md` | **不存在**（真源是 `docs/guides/api-route-conventions.md`） |
| `docs/guides/feature-codegen.md` | **不存在** |
| `.kiro/skills/feature-development-workflow/SKILL.md` | **不存在** |

> 教训：**指向不存在的东西**与"编造出处"同族 —— 照着跑就是报错。
> 新增文档引用前先 `ls` 确认；这类漂移由 `docs:commands:check` 门禁机器拦截。
