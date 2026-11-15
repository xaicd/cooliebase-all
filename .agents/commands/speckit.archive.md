---
description: 生产割接完毕后一键归档 (Spec-Kit Archive) - 移入 archive 杜绝认知污染
---
请执行已交付完成规格的归档操作：
1. 提取规格名 (`--name`)；
2. 执行归档脚本：
   `pnpm run speckit:archive -- --name <name>`
3. 验证规格已被移动至 `docs/specs/archive/<YYYY-Qx>/<domain>/<name>/`，且 `spec.json` 中已注入归档时间戳与季度标记；
4. 保持工作区活跃目录清爽整洁。
