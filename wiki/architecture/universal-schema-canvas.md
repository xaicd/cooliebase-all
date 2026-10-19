# 架构百科：通用动态本体画布 (Universal Schema Canvas)

> 对应规则：AGENTS.md Rule 0.1 / Rule 0.13 / packages/shared/frontend/components/universal-schema-canvas.tsx

## 一、 核心痛点与零样板代码理念
在传统后台工程中，通常为数百个实体人工手写数百个千篇一律的薄壳页面文件，不仅消耗几十万 Token，而且当后端接口或表结构变动时，页面极易发生漂移与死字段。

## 二、 动态本体画布架构
- **真源挂载**：直接消费 `packages/shared/contract/page-schemas.generated.ts` 中的 342 份机器可读 Schema 契约；
- **自适应渲染**：由 `UniversalSchemaCanvas` 通用组件根据字段类型（string, number, boolean, date, enum）自适应渲染检索过滤区、动态数据表格、分页区与快捷交互抽屉；
- **全息感知**：支持实体领域过滤（14 个域快速切换）、分类标签过滤、双向契约查看抽屉（API Mount、BFF Mount、权限码与字段元数据）；
- **动态派发**：Admin 路由派发器 (`src/app/(admin-pages)/admin/[...slug]/page.tsx`) 统一调度，支持通过 `?mode=canvas` 或 `/admin/canvas/[entity]` 毫秒级打开任意实体的动态本体操作面板。
