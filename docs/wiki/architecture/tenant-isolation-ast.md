# 架构百科：Kysely AST 语法树级全局多租户隔离

> 对应规则：AGENTS.md §4.8

## 一、 设计思想
多租户隔离绝不能依赖外包开发者的自觉性。一旦某条 SQL 漏写 `tenant_id = ?`，将发生毁灭性的跨租户数据穿透。

## 二、 实现原理
- 核心源码：`packages/shared/backend/lib/database/tenant-isolation-plugin.ts`
- 挂载于 Kysely 单例之上的 AST 拦截器：
  - 拦截 `SelectQueryNode`、`UpdateQueryNode`、`DeleteQueryNode` 树节点；
  - 自动向 `where` 子树注入 `tenant_id = <当前上下文租户ID>`；
  - 拦截 `InsertQueryNode`，自动追加 `tenant_id` 列和值；
  - 平台超级管理员上下文自动豁免。
