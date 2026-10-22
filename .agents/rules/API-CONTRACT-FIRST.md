# §21 业务域与全协议 API 契约驱动 —— 落地规则

> 对应 AGENTS.md **§21**（Ontology & Polyglot API-Contract-First Execution）。
> 本文件是该条款的**可执行落地形式**。本仓规矩：「新增规范条款时必须同时给出机检规则或说明
> 为何只能人工判断；**禁止口头规范**」——而"只能人工判断"这个出口已被收紧：**不能靠人工判断**。

## 条款要求 → 机检映射

| §21 要求 | 机检 | 模式 |
|---|---|---|
| 契约是**真实存在的行为契约**，不是装饰 | `pnpm run contracts:governance:check` | 路径类 enforce |
| 接口必须绑定 permission code（§4.4） | `pnpm run contracts:governance:check` | 权限前缀类 **ratchet** |
| 写路由且读 body 必须接 Zod 校验 | `pnpm run routes:validation:check` | ratchet |
| 契约声明的路由必须真实存在且导出对应方法 | `pnpm run agent:routes:check` | enforce + ratchet |
| 每个域至少 1 份 agent 契约 | `pnpm run agent:coverage:check` | ratchet |
| 契约定位选择器必须成立（无头探针靠它） | `pnpm run agent:selectors:check` | enforce |
| 跨域调用必须走 Domain Facade | `pnpm run microservice:check` | enforce |

## `contracts:governance:check` 具体查什么

1. **路径真实性**（enforce）：`api.methods.*.path` 拼上 `api.bffMount` 后，必须落在该域
   插件 manifest 的 `publicPrefixes` 之内 —— 否则契约描述的是**不存在的端点**，照它调必然 404。
2. **权限真实性**（ratchet）：`permissionPrefix` 必须在 `permissions.ts` 里有对应权限码 ——
   否则契约声明的权限**绑不上任何 RBAC 判定**。
3. **预案契约**（enforce）：每个活跃规格的 `runbook.json` 必须有非空 `steps` 与 `rollback`
   （§22 的"预案契约"，骨架不算完成）。

## 已知欠债（棘轮冻结，只拦新增）

基线：`docs/architecture/artifacts/contract-governance-baseline.json`。
修法：在 `permissions.ts` 登记权限码，然后 `node scripts/check-contract-governance.cjs --write-baseline` 收紧。

**为什么是棘轮而不是 enforce**：一次性让 `check` 全红会逼出无意义的豁免（本仓反复踩过）。
棘轮把"存量欠债"与"新增违规"分开 —— 后者必挡。

## 两个曾经的真实缺陷（已修，记在此防复发）

1. **路由模板兜底到无关权限**：`?? PERMISSIONS["INFRA_ONLINE_DEFINITION_QUERY"]` ——
   查不到本表权限就落到**别的**权限上，等于让持有无关权限的人通过本表鉴权。
   已删除；现在查不到就落到本表自己的码（fail-closed，仅超级管理员可用）。
2. **`PERM_PREFIX` 归一化漏了中划线**：`"WMS_INVENTORY-HISTORY"` 永远查不到
   `WMS_INVENTORY_HISTORY_VIEW`（该常量其实**存在**）。已改为 `[^A-Za-z0-9]+ → _`。

--- 回引：AGENTS.md §21 · 机检 `pnpm run contracts:governance:check`
