# Bugfix: 修复 6 条既存测试失败：退役脚本引用 + 过期断言

状态：`PLAN_APPROVED`

## 1. 现象 (Symptom)
`env -u DATABASE_URL -u DB_DRIVER -u NODE_ENV npx vitest run` 长期为 2 failed files / 6 failed tests。明细：`test/unit/spec-driven-agent-workflow.test.ts` 5 条，报 `Command failed: npx tsx scripts/spec-ops.ts new|build|archive …`；`scripts/lib/__tests__/agent-profile.test.ts` 1 条，报 `expected ['coding','automated-testing',…(2)] to deeply equal ['coding','automated-testing',…(1)]`。该 6 条在本次之前的多轮改动中都做过同环境前后对照，确认非新增，一直被当作 known pre-existing 记录。

## 2. 根因 (Root Cause)
两条独立根因：① 5 条（spec 闭环测试）：`scripts/spec-ops.ts` 已在提交 `d158d1f1` 被退役，统一收敛到 `scripts/speckit.ts`（`new` / `build` / `archive` 子命令齐备），但测试未跟改，仍在调已不存在的脚本 —— 属「改了生产侧、漏改测试侧」。5-Whys 到根因：服务入口改名/收敛后缺少「测试引用的脚本是否真实存在」这一层校验，于是断裂只能靠跑测试才发现，且被发现后又被记成「独立 ticket」搁置。② 第 6 条（agent-profile 测试）：该用例用 `toEqual` 精确断言 `npc.layers.L0.skills`，而 `agent-profile.json` 后来给 L0 补了 `project-init`（第 4 项）—— 测试编码的是改动前的世界。5-Whys 到根因：用「精确全等」断言一个会随能力增长而增长的列表，于是每次往角色里加技能都会把这条测试打红，而它红的意义（这几个核心技能必须在）与它断言的严格度（只能有这几个）并不一致。

## 3. 防御不变量 (Invariants)
1. **声明的技能必须真实存在** —— agent-profile 测试遍历全部分层，逐项校验 .agents/skills/<name>/SKILL.md 存在，缺失即失败并列出具体项
2. **测试零残留** —— beforeAll/afterAll 清理活跃区与归档区；用跑前跑后 git status 一致作为客观判据
