# 多端能力标准

权威契约：`packages/shared/contract/client-channels.json`  
公开查询：`GET /api/v1/open/meta/client-channels`、`GET /api/v1/open/meta/project-profile`

本底座的多端能力是**同一套版本化 API + 同一份品牌身份**，不是每个端再复制一套后台。当前已交付管理端 PC；H5、uni-app、Flutter、桌面客户端先落标准和工作区，未宣称功能完成。

## 1. 渠道与 API 面

| 渠道 | 工作区 | API 面 | 鉴权 | 状态 |
|---|---|---|---|---|
| 管理端 PC | `src/app` | `/api/v1/admin` | 管理员 JWT + 权限码 | 已交付 |
| Expo 移动端 | `clients/expo` | `/api/v1/app` | 会员 JWT | 仅标准 |

公开元数据、错误码、OpenAPI、支付回调走 `/api/v1/open`。服务间调用走 `/api/internal`，浏览器与 App 不得使用。

请求头 `X-Client-Channel` 取值必须是上表渠道 id：`admin-web`、`expo`。

## 2. 强制规则

1. 同一业务能力只定义一份 v1 DTO，多端不得分叉字段名。
2. 管理员 JWT 与会员 JWT 不得混用。
3. 客户端禁止 import Next Service、Repository 或 Prisma 类型，只调 HTTP / OpenAPI。
4. 平台名称、Logo、登录文案只来自 `project-profile.json`（公开接口不返回账号和租户密钥）。
5. 桌面客户端是壳：窗口、托盘、自动更新可本地实现，业务权限与管理端 PC 相同。
6. uni-app 可同时输出 H5；H5 工作区不得再维护第二套会员 API。
7. 每个渠道一个独立包，禁止把多端揉进同一个 folder。
8. 业务按后端域名落在 `modules/<domain>`，与 `domain-catalog.json` 同名；禁止把新域堆进 `app/`、`shared/` 或根 `pages/`。

## 3. 身份与契约入口

| 用途 | 路径 |
|---|---|
| 品牌 | `GET /api/v1/open/meta/project-profile` |
| 渠道目录 | `GET /api/v1/open/meta/client-channels` |
| 错误码 | `GET /api/v1/open/meta/error-catalog` |
| OpenAPI | `GET /api/v1/open/openapi` |

新业务项目初始化时：改 `project-profile.json` 和 `public/branding/`，各端启动时拉公开品牌，不要在 Flutter/uni-app 里写死平台名。

## 4. 客户端包与目录

每个渠道一个独立包，禁止把 H5/uni-app/Flutter/桌面代码揉进同一个 folder。

| 渠道 | 包 | 源码根 |
|---|---|---|
| admin-web | 仓库内 `packages/domains/<domain>/frontend` | 不进 `clients/` |
| expo | `@cooliebase/client-expo` | `clients/expo/src` |

包内固定三层：

```text
<sourceRoot>/
  app/          # 启动、路由、主题
  shared/       # http、登录态、错误码、品牌
  modules/
    <domain>/   # 与 domain-catalog 同名
      api/
      models/
      pages/
      components/
```

规则：

1. 后端新增域，只在实际用到该域的客户端包里加 `modules/<domain>`，不要一次建 15 个空目录。
2. 禁止把新域页面堆进 `app/`、`shared/`、uni-app 根 `pages/`（`pages/` 只允许路由壳）。
3. 域与域禁止互相 import 内部实现，只能依赖 `shared`。
4. 管理端继续走 `packages/domains/<domain>/frontend`，不要在 `clients/` 再复制 Admin。

磁盘布局由 `packages/shared/contract/client-package-layout.ts` 校验。

## 5. 尚未交付

H5 页面、uni-app 工程、Flutter 工程、Tauri/Electron 壳都还没有可运行实现。下一步按渠道工作区补工程骨架时，仍必须遵守本标准，不得另开 API 前缀。
