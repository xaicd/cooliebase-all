---
description: Spec-Kit 质量验收与门禁自检清单 (Checklist & Acceptance Criteria)
---
请基于当前规格与功能实现，执行 Spec-Kit 质量验收与验收标准核验：
1. 提取当前规格名称（`--spec` 或通过当前上下文推断）；
2. 逐项核对 `.specify/templates/checklist-template.md` 与该规格下的 `checklist.md` / `verification-report.md`：
   - 宪法合规：是否无新增重复手写 CRUD，继承 BaseMapper 与 8 大审计字段？
   - 真实数据库：是否 100% 跑通真实 PostgreSQL/SQLite 状态机测试？
   - 契约治理：跨域调用是否全部收敛于 Domain Facade？
   - Git 追踪：提交历史是否全部匹配 `[T<ID>]` 并符合白名单？
3. 执行自动化验证：
   `pnpm run spec:check -- --spec <name>`
4. 汇总验收状态（PASS / DEFECTS）并输出结构化自检报告。
