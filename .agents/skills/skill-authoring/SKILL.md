---
name: skill-authoring
description: 编写、修改、评审本仓库 Agent Skill。接到“加 skill / skill 规范 / 全链路规范”时启用。
---

# Skill 编写规范

## 必须

1. 放 `.agents/skills/<name>/SKILL.md`（全仓唯一真源，严禁在 docs/ 等其他位置设立副本或镜像目录；视觉检索除外，仍用 `.kiro/steering/ui-ux-pro-max/`）。
2. YAML：`name`（小写连字符）、`description`（做什么 + 何时启用）。
3. 正文含：何时启用、权威文档、检查清单、门禁命令、禁止项。
4. 单文件尽量 < 200 行；细则链到现有 docs，不复制 AGENTS.md。
5. 在 [.agents/skills/README.md](../README.md) 注册阶段、启用条件和覆盖关系。
6. 与 `AGENTS.md`、域 catalog、client-channels 冲突时改 Skill，不改运行时契约迁就 Skill。

## 覆盖

外部 GitHub Skill 只能作参考。路径、权限码、租户、RPC subject、客户端目录以本仓库为准。

## 禁止

1. 把个人 `~/.cursor/skills` 当项目真源。
2. 一个 Skill 同时写 UI、SQL、K8s 细节。
3. 未注册就宣称“已有规范”。
4. 用 Skill 批准跳过 `pnpm run check`。
