# 多端客户端工作区

本目录只放 **C 端与桌面壳**。管理端 PC 在 `src/app`，不要在这里再复制一套 Admin。

标准见 `docs/architecture/cooliebase-all-base-client-channels.md`。启动后先读：

- `GET /api/v1/open/meta/project-profile`
- `GET /api/v1/open/meta/client-channels`

| 目录 | 渠道 | 现状 |
|---|---|---|
| `expo/` | iOS / Android / **Web（可预览）** 一套代码 | Schema 驱动渲染器 + 会员登录/用户中心，`expo export -p web` 产出可预览网页 |

未实现前不要把这些目录标成已交付。

本目录当前只有 `expo/` 一个包（其源码为 `src/App.tsx` + `src/shared/`，共享 DTO/API 层放 `src/shared`）。域目录名跟后端 `domain-catalog` 走，新增模块不要往 `app` 或根 `pages` 里堆。细则见 [多端能力标准](../docs/architecture/cooliebase-all-base-client-channels.md)。
