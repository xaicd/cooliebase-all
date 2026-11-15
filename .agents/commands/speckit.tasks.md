---
description: 原子任务树与 Git 提交核对 (Spec-Kit Tasks) - 遵循 1 Task = 1 Commit
---
请核对规格的任务实施与提交证据链：
1. 提取特性/规格名 (`--spec` 或 `--name`)；
2. 执行任务面板与真实进度取证：
   `pnpm run speckit:tasks -- --spec <name>`
3. 单项任务核验（白名单与原子提交）：
   `pnpm run speckit:tasks -- --spec <name> --task T1`
4. 严格核对：
   - 每一个任务是否对应独立的 Git 提交 `[T<ID>]`；
   - 变更文件是否在任务声明的白名单内；
   - 杜绝口头声明完工，给出真实的物理进度。
