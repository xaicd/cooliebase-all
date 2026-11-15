---
description: 规格立项与需求初始化 (Spec-Kit Specify) - 自动创建按域隔离的 brief.json
---
请基于用户的输入参数或需求描述，执行新规格的立项初始化：
1. 提取参数：
   - 规格标识名 (`--name`)，如 `coupon-seckill`、`fix-cart-lock`
   - 业务领域 (`--domain`)，如 `mall`、`pay`、`system`、`mes` 等
   - 业务标题 (`--title`)
   - 规格类型 (`--type`): `feature` (默认) | `bugfix` | `enhancement` | `refactor` | `security`
2. 执行底层命令：
   `pnpm run speckit:new -- --name <name> --domain <domain> --title "<title>" --type <type>`
3. 按照 IEEE 29148 / EARS 句式与业务双核 (Object + Action) 引导用户完善 `docs/specs/<domain>/<name>/brief.json`。
