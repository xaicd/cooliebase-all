# 版本发布说明书与版本策略台账 (Release Notes & Version Ledger)

- **模板基线版本 (`templateVersion`)**: `1.5.0`（对齐 `package.json#version` 与 `packages/shared/contract/compat-manifest.json`）
- **归属规范**: CMMI 07_release (TRANS) / `.agents/skills/cmmi-asset-authoring` / `.agents/skills/devops`
- **质量门禁要求**: `pnpm run check` 全量通过（Exit Code 0），真实数据库测试与制品指纹校验一致

---

## 1. 交付与审核签署矩阵 (RACI Sign-Off)

| 角色 | 责任团队 | 核验重点 |
|---|---|---|
| **编制人 (Author)** | 领域研发 / 数字员工 | 规格契约、代码实现与状态机单测闭环 |
| **架构审查人 (Architect)** | 技术委员会 | 跨域 Facade 契约与 DAG 无环依赖审查通过 |
| **质量合规人 (QA/PPQA)** | 质量保障组 | `pnpm run check` 全绿，FCA/PCA 配置审计合规 |
| **SRE 运维签署人 (SRE/Ops)** | 稳定性运维组 | `docs/07_release/rollback-runbook.json` 秒级回滚预案与压测护栏就绪 |

---

## 2. 版本与渠道标签策略台账 (Version & Channel Tag Policy)

本基座严格区分**模板基线版本 (`templateVersion`)** 与**发布渠道标签 (Git Tag)**：

- **模板版本 (`package.json.version` === `compat-manifest.json#framework.templateVersion` = `1.5.0`)**：代表下游派生工程继承的模板契约基线，两处必须始终同步。
- **渠道里程碑标签 (Git Tags)**：包含 `v1.0.0`、`v1.1.0`、`v1.2.0`、`v1.3.0-brand-neutralized`、`v1.4.0-brand-shorthand`、`v1.5.0`（详见 `docs/07_release/releases/v1.5.0.md`：四位一体终端 `Admin + 2C Portal + Expo App + MiniApp`、20 大原生域 `2 平台地基 + 18 第一方插件`、`oa/hrm/fms/pms` 补齐与非原生定制插件剥离、`docs/` 单目录收敛与跨底座 CLI 100% 同参对齐）。渠道标签与 `templateVersion` 策略由 `pnpm run version:check` 门禁机检守护。

---

## 3. 标准升级与发布核验步骤

```bash
# 1. 执行全量自动化门禁与契约校验
pnpm run check

# 2. 运行清洁环境全量测试套件
pnpm run test:clean

# 3. 生产构建与制品环境指纹生成/核验
pnpm run build
pnpm run fingerprint
pnpm run fingerprint:verify
```
