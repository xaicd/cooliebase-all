# AI 网关（沉淀 new-api 能力到 cooliebase-all-base）

> 日期：2026-08-23  
> 范围：原生域 `ai`。**能力对齐** [new-api](https://github.com/QuantumNous/new-api)，**禁止拷贝其 AGPLv3 源码**。  
> 目的：所有基于 cooliebase-all-base 的项目（含应算通）共用同一套模型路由、鉴权与用量出口。

---

## 1. 为什么放在底座

后续业务项目都会调模型。若每个项目各接一套 new-api，会出现：密钥散落、计量口径不一、协议转换重复。

把网关放进 cooliebase-all-base 的 **`ai` 原生域**：

- 后台：渠道 / 模型 / 令牌 / 用量（四字菜单）
- 开放接口：OpenAI 兼容 `/api/v1/open/ai/v1/*`（Bearer 令牌，不走管理员 JWT）
- 跨域：其它域只许调 `aiFacade.relayChatCompletion`，禁止直连上游

应算通在此之上做企业额度池、分时段、分账，不重复实现渠道轮询。

---

## 2. 能力对照（学能力，自研实现）

| new-api | 本域对象 / 接口 | 一期 | 说明 |
|---|---|---|---|
| 渠道 Channel | `AiChannel` / 上游渠道 | 必做 | 多上游、权重、优先级、模型映射、失败重试、自动禁用 |
| 模型 Models | `AiChannel.models` + 模型目录 | 必做 | 对外名 → 上游名 |
| 令牌 Token | `AiAccessToken` / 调用令牌 | 必做 | 额度、模型限制、IP 白名单、过期 |
| 日志 Logs | `AiUsageLog` / 用量日志 | 必做 | 请求级；正文默认不落库 |
| 看板 Dashboard | 用量汇总 | 二期 | 可先用用量日志聚合 |
| 钱包 / 充值 | 额度字段 | 一期只记账 | C 端易支付/Stripe **不做**（底座不管 C 端售卖） |
| 兑换码 | 不进底座 | 不做 | 应算通预付额度另做 |
| Playground | 联调探测 | 必做 | 仅运维 |
| Chat 页 | — | 不做 | 聊天产品不是底座职责 |
| OpenAI / Claude / Gemini 互转 | `protocol` 字段 | 一期 OpenAI 兼容；Claude/Gemini 适配器二期 | 国内云大多已是 OpenAI 兼容 |
| Responses / Realtime / Embeddings / Rerank / Audio / Image | 开放路由占位 | Embeddings/Rerank 一期可 mock | 按调用量补 |
| 分组计费倍率 | `group` + `rate` | 二期 | |
| 缓存计费 | `cacheRatio` | 二期 | |
| Midjourney / Suno | — | 不做 | 非通用底座 |

许可：new-api 为 AGPLv3。本实现从零写 TypeScript，不 vendoring、不翻译其 Go 文件。

---

## 3. 调用关系

```
业务域 / Qoder / Trae / 自有应用
        │  Bearer sk-***  或  aiFacade.relayChatCompletion
        ▼
cooliebase-all-base  ai 域网关
        │  验令牌 → 选渠道（优先级+权重）→ 失败换渠
        ▼
上游（MoMA / 星辰 / 元景 / OpenAI 兼容 / 厂商 BYOM）
        │
        ▼
AiUsageLog  （应算通 meter 可订阅或拉取）
```

开放 Base URL 给企业应用：

```
{ORIGIN}/api/v1/open/ai
```

兼容路径：

- `POST /v1/chat/completions`
- `GET  /v1/models`
- `POST /v1/embeddings`
- `POST /v1/rerank`（占位）

---

## 4. 四字菜单（AI 中台）

目录名：**模型中台**

| 菜单 | 路径 | 权限前缀 |
|---|---|---|
| 上游渠道 | `/admin/ai/channels` | `ai:channel:*` |
| 模型目录 | `/admin/ai/models` | `ai:model:*` |
| 调用令牌 | `/admin/ai/tokens` | `ai:token:*` |
| 用量日志 | `/admin/ai/usages` | `ai:usage:query` |
| 联调探测 | `/admin/ai/playground` | `ai:playground:query` |
| 对话记录 | `/admin/ai/chats` | `ai:chat:*` |

原「AI中台 / 模型管理 / 对话管理」侧栏改为上表四字名。知识库、绘图、写作等应用功能仍保留路由，默认不进一级侧栏，避免和网关职责混在一起。

---

## 5. 与应算通的切分

| 放 cooliebase-all-base `ai` | 放应算通业务域 |
|---|---|
| 上游渠道、协议转发、重试 | 企业额度池、坐席、双轨限额 |
| 平台调用令牌 | 运营方案、货架资费、分账 |
| 原始用量日志 | 标准 Token 折算、分时段、清分批次 |
| 联调探测 | 厂商入驻、BOSS 出账 |

应算通网关入口 = 本域开放接口；计量事件从 `AiUsageLog` 归集后再跑 `meter` / `split`。

---

## 6. 落地状态

已落代码（内存存储，可先跑通）：

- 渠道 / 令牌 / 用量 CRUD
- `POST /api/v1/open/ai/v1/chat/completions` 鉴权 + 路由 + mock/上游转发
- `aiFacade.relayChatCompletion` 供其它域 SDK 调用
- 管理端四字菜单

后续：Prisma 表、Claude/Gemini 适配、限流器、渠道余额探测、与应算通 meter 的可靠事件。
