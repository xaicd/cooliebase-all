# 多端客户端工作区 (Clients Workspace)

本目录承载 **C 端移动与小程序客户端渠道**。Admin 运营管理端与 2C 消费者门户位于 `src/app`（`src/app/(admin-pages)` 与 `src/app/(portal-pages)`），不要在本目录再复制一套 Admin。

标准见 [多端能力标准](../docs/architecture/cooliebase-all-client-channels.md)。启动后先读：

- `GET /api/v1/open/meta/project-profile`
- `GET /api/v1/open/meta/client-channels`

| 目录 | 工作区包名 | 渠道 | 现状与构建核验 |
|---|---|---|---|
| `expo/` | `@cooliebase/clients-expo` | iOS / Android / **Web（可预览）** | Schema 驱动渲染器 + 会员登录/用户中心（入口 `clients/expo/App.tsx`），`expo export -p web` 产出可预览网页 |
| `miniapp/` | `@cooliebase/clients-miniapp` | **微信小程序 (`mp-weixin`) / H5** | Uni-App Vue 3 + TypeScript + Vite（入口 `clients/miniapp/src/main.ts`），内置动态 `BASE_PATH` / `wx.login` 静默鉴权 / 安全区适配 / 4 极简 TabBar 页，`pnpm run build:miniapp` 产出 H5 构建 |

两套客户端渠道均由 `pnpm run clients:build:check`（`scripts/check-client-build.cjs`）统一执行静态类型与产物构建门禁核验，并由 `pnpm run project:init` 同源完成白标包名与 `BASE_PATH` 渲染。细则见 [多端能力标准](../docs/architecture/cooliebase-all-client-channels.md)。
