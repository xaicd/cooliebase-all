---
name: product-requirements
description: 需求与原型收敛。新功能、多端、业务项目初始化、空客户端补齐前先启用。
---

# 需求原型与产品设计规范

## 1. 适用场景与触发条件
- 用户提出新功能、业务域扩展或定制化业务需求时。
- 初始化新客户端（H5、UniApp、Flutter、Desktop-PC）或落地多端统一功能时。
- 需求描述模糊，需收敛范围、状态机、多租户边界或验收标准时。

## 2. 权威依据
- `AGENTS.md` §2 (15 原生域边界与定位)
- `AGENTS.md` §5 (Domain-First 研发流程六要素)
- `AGENTS.md` §15 (用户对话与需求必须实时记录至 `docs/features/sprint-prod/{MMDD}.md`)
- `docs/guides/project-profile-bootstrap.md` (品牌与项目元数据引导)
- `docs/architecture/cooliebase-all-client-channels.md` (多端渠道标准)
- `docs/architecture/cooliebase-all-capability-matrix.md` (能力矩阵权威清单)

## 3. 标准需求收敛六要素模板

每个需求产物必须完整包含以下 6 个维度：

```markdown
### 1. 业务背景与用户画像 (5W1H)
- 谁 (Who)：管理员 (Admin) / 普通会员 (Member) / 匿名访客 (Guest)
- 在哪 (Where)：admin-web / h5 / uniapp / flutter / desktop-pc
- 做什么 (What)：业务核心目标与操作路径
- 为什么 (Why)：业务价值与解决痛点

### 2. 渠道与客户端支持矩阵
- [ ] Admin Web (Next.js 管理后台)
- [ ] H5 移动端 (React + Vite)
- [ ] UniApp (Vue3 + TS 小程序/跨端)
- [ ] Flutter (移动原生 App)
- [ ] Desktop-PC (Tauri / Electron 桌面端)

### 3. API 面与权限隔离
- 接口分类：`admin` (/api/v1/admin) | `app` (/api/v1/app) | `open` (/api/v1/open)
- 权限标识码：`<domain>:<entity>:<action>` (例如 `mall:goods:create`)

### 4. 业务状态机与流转矩阵
| 当前状态 | 触发动作 | 目标状态 | 权限/角色 | 附加条件/校验 |
|---|---|---|---|---|
| DRAFT | SUBMIT | PENDING | 创建人 | 必填项完整 |
| PENDING | APPROVE | APPROVED | 审批人 | 具备审批权限 |
| PENDING | REJECT | REJECTED | 审批人 | 填写驳回原因 |

### 5. 验收标准 (Given-When-Then)
- 场景 1（正向路径）：Given 正常参数，When 提交保存，Then 创建成功并记录审计日志。
- 场景 2（权限拒绝）：Given 未授权用户，When 发起请求，Then 返回 403 Forbidden。
- 场景 3（异常回滚）：Given 仓储层写失败，When 事务抛错，Then 数据完整回滚无残留。

### 6. 非目标与边界 (Non-Goals)
- 明确本期迭代不做的事项，防止范围蔓延。
```

## 4. 检查清单 (Checklist)
1. [ ] 用户原始对话已追加至 `docs/features/sprint-prod/{MMDD}.md`。
2. [ ] 涉及的业务域在 15 原生域（`domain-catalog.json`）之内，无随意发明新域。
3. [ ] 明确了跨端渠道归属与端侧 API 契约面。
4. [ ] 状态机迁移规则具备前置条件和守卫判断。

## 5. 绝对禁止项
- 禁止将草稿原型直接当作 API 与数据库真源。
- 禁止为了“赶进度”跳过权限定义与验收标准。
- 禁止客户端直接依赖后端私有 Service 或数据表结构。
