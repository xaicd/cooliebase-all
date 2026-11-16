# 架构百科：38 大工业级原生 Agent 技能矩阵与单一真源

> 对应规则：AGENTS.md Rule 0.11 / .agents/skills/README.md

## 一、 单一真源铁律 (Single Source of Truth)
- 全仓 38 个原生技能唯一真源收敛于 `.agents/skills/<name>/SKILL.md`；
- 严禁在 `docs/` 等目录创建镜像或副本目录，杜绝代码与认知污染；
- 下游兼容性清单 `compat-manifest.json` 自动校验技能数量与定义。

## 二、 深度吸收的两大全球顶流项目
1. **Archify (47,000+★, MIT)**：`archify/SKILL.md` 驱动可机器验证与交互式架构全景；
2. **Strix (60,000+★, Apache-2.0)**：`strix-penetration-testing/SKILL.md` 驱动多智能体自主红队渗透测试与真实生效 PoC 验证。
