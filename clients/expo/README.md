# clients/expo — C 端移动应用（Expo / React Native）

一套 Expo 代码，**iOS / Android / Web 三端**。消费与 portal(Web) 完全相同的后端契约
（`open/meta/appearance`、`open/meta/page-schema/:entity`、`app/member/*`），各端各自渲染。

## 既要 Expo，又要能预览
- **移动真机预览**：`npm run start` → Expo Go 扫码。
- **浏览器/预览抽屉预览（无需模拟器）**：`npm run export:web` → 产出静态站点 `dist/`（`dist/index.html`），
  用任意静态服务器或平台预览抽屉直接打开。这是「既要 Expo 又要能预览」的关键——
  同一套 Expo 代码经 `react-native-web` 编译成网页。

## 快速开始
```bash
cd clients/expo
pnpm install
pnpm run web        # 开发：浏览器预览（Expo Web dev server）
pnpm run export:web # 产出可托管的静态站点 dist/（供预览抽屉/静态服务器）
pnpm run start      # 移动：Expo Go 扫码真机预览
```
后端地址：默认 `app.json > extra.apiBase`，可用 `EXPO_PUBLIC_API_BASE` 覆盖：
```bash
EXPO_PUBLIC_API_BASE=http://<host>:3000 npm run export:web
```

## Schema 驱动
`src/SchemaFieldRenderer.tsx` 消费 `open/meta/page-schema/member_user` 的字段定义 →
渲染成 RN 表单/详情。**后台在 online 加个字段，移动端自动多出一项，无需改代码**（与 portal Web 同协议）。

## 预览免输入登录
登录页默认预填演示凭据 `demo / demo123`（与 portal 一致），点「登录」即进。

## 关键依赖配方（Expo 52 Web export）
`@expo/metro-runtime` + `expo-asset` + `metro.config.js`(expo/metro-config) + `app.json > web.output: "single"`（SPA）。
