# clients/miniapp — 多端小程序与 H5 客户端（Uni-App Vue 3 + TypeScript + Vite）

基于 Uni-App Vue 3 + TypeScript + Vite 的第四终端工程，同时覆盖 **微信小程序 (`mp-weixin`)** 与 **移动 H5 (`h5`)**，与 Admin 管理后台、2C 门户及 Expo 原生 App 共享同一套后端契约（`/api/v1/app/*` 与 `/api/v1/open/*`）。

## 核心特性
- **动态网关前缀适配**：自动识别 `VITE_API_BASE_URL` 与 `VITE_BASE_PATH`（默认适配 `/${slug}/api` 与 `/api/v1/app`）。
- **静默登录与无感鉴权**：`src/utils/request.ts` 内置 `wx.login` (`wxSilentLogin`) 静默换取访问令牌、Bearer Token 自动挂载与 `X-Client-Channel: miniapp` 渠道标识。
- **分包加载 (`subPackages`)**：主包聚焦 4 大高频 TabBar 页面（`首页`、`分类`、`工作台`、`我的`），详情与扩展能力下沉至 `subpackages/`，严守微信小程序 2MB 主包体积红线。
- **全面屏安全区适配**：全局容器与底部导航栏内置 `env(safe-area-inset-bottom)` 适配，杜绝遮挡可交互区域。

## 快速开始
```bash
pnpm --filter @cooliebase/clients-miniapp run dev:h5
pnpm --filter @cooliebase/clients-miniapp run build:h5
```
