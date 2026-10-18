# 踩坑实录：插件路由与 Admin BFF 鉴权策略差异

### 现象
直接访问 `/api/v1/plugins/cooliebase.xxx/api/...` 被误判为未鉴权或报 404。

### 规约
- `/api/v1/admin/**`：全部默认由 `withAdminRoute` 实施平台管理员鉴权；
- `/api/v1/plugins/**`：由插件内部根据 `plugin.manifest.json` 声明的 `auth.audience`（`operator` / `company` / `public`）分别走各自守卫。
