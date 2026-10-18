---
name: agent-harness
description: 将 cooliebase-all-base 作为 DigitalStaff NPC 工作区模板，并按 DeepSeek Harness 思想做可组合、可追溯进化。接到「新业务项目底座 / NPC 模板 / deepseek-harness / 智能进化」时启用。
---

# Agent Harness 工作区进化规范

## 1. 何时启用

- 把本仓库当新业务项目底座或 GitHub Template。
- DigitalStaff NPC 员工孵化 / 开发独立项目。
- 用户提到 DeepSeek Harness、插件化 Agent、智能进化基座。
- 修改 `agent-profile.json`、`.agents/context/`、`project:create` 组合方式。

## 2. 权威依据

- `docs/architecture/cooliebase-all-base-harness-evolution.md`
- `packages/shared/contract/agent-profile.json`
- `.agents/context/ASSEMBLY.md`
- `AGENTS.md` §16（ProjectReactor）、§17（基座/业务边界）
- DigitalStaff：`docs/design/deepseek_harness_analysis.md`（Harness 侧，勿复制进本仓）

## 3. 角色铁律

```
NPC = Model + DigitalStaff Native + 本仓库 Workspace Bundle
```

本仓库只提供环境与契约。禁止在 `src/` 实现 Agent Loop、引入 Cordis、做运行时自挂载。

## 4. 检查清单

1. [ ] 原始需求已追加 `docs/features/sprint-prod/{MMDD}.md`。
2. [ ] 先读 `agent-profile.json`，确认 `kind=workspace-bundle`。
3. [ ] 孵化只走 `npm run project:create -- <路径> [--profile ...] [--bundle ...]`。
4. [ ] 身份只改 `project-profile.json` + `public/branding/`。
5. [ ] 业务改动留在 Business Zone；跨域走 Facade。
6. [ ] Prompt 按 ASSEMBLY.md 分段加载，不整篇灌 AGENTS.md。
7. [ ] 结束后 `npm run check`。通用能力反哺走五要素清单。

## 5. 从 dsh 只学这些

插件化域、Capability Seam 三角色、Profile/Bundle/Patch、Prompt 分段、RBAC+租户当 scoped tools、sprint-prod+门禁当 append-only 轨迹、Skill 按需 inject。

## 6. 门禁命令

```bash
npm run project:create -- <目标路径> [--profile minimal|standard|vertical|creator] [--bundle mall,crm]
npm run domain:seams
npm run harness:check
npm run check
```

`--profile/--bundle`、seam 图与门禁轨迹已落地。`minimal` 仍保留 online/ai/aigw 伴生域。P4 由 DigitalStaff 读取本仓契约。

## 7. 禁止项

1. 把 DeepSeek Harness / Cordis 当运行时依赖引入。
2. 在本仓库托管 LLM 循环或替换 DigitalStaff Native。
3. 在 catalog 之外另写一套域名。
4. 用 Skill 批准跳过 `npm run check`。
5. 业务项目改 Core Zone 冒充“智能进化”。
