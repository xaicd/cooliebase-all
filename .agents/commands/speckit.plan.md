---
description: 规格编译与架构蓝图展开 (Spec-Kit Plan) - 展开 brief.json 为 8 份标准工程文档
---
请执行规格的自动化编译与展开：
1. 提取规格名 (`--name`)。若用户未提供，先列出 `docs/specs/` 下最近的活跃规格；
2. 执行底层命令：
   `pnpm run speckit:build -- --name <name>`
3. 检查展开生成的标准化工程资产：
   - `requirements.md` (EARS 5态需求矩阵)
   - `design.md` (整洁架构设计、状态机、Domain Facade 契约)
   - `tasks.md` (波次任务分解图)
   - `evidence.json` (SpaceX 级验证证据槽位)
   - `runbook.json` (生产上线与实施回滚预案)
4. 输出展开摘要与下一步原子任务指导。
