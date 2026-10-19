# cooliebase-all Module-First Layout

每个业务域优先在 `packages/domains/<domain>/` 下实现，`src/backend/*` 仅保留兼容门面。

推荐结构：

```text
packages/domains/<domain>/
  backend/
    services/
    validators/
  frontend/
    pages/
    components/

packages/shared/
  frontend/
    templates/
```

过渡规则：

1. 旧路径文件允许 re-export 到模块目录。
2. 新增业务只允许落在模块目录。
3. 当模块稳定后，可按域拆分为独立 app 或 service。

模板约束：

1. 通用页面模板放 `packages/shared/frontend/templates`。
2. 历史写法 `src/frontend/templates`（**已不存在**，`src/` 下只允许 `app/` 与 `proxy.ts`，见 AGENTS §3.2）不得再引用。
