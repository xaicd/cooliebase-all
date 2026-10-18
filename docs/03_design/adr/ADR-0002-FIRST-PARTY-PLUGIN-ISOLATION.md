# ADR-0002: 采用第一方业务插件架构解耦 15 个业务领域

- **状态**: ACCEPTED <!-- PROPOSED | ACCEPTED | REJECTED | SUPERSEDED | DEPRECATED -->
- **决策人**: @architect-team
- **决策日期**: 2026-09-02
- **关联需求/DAR**: DAR-20260828-PLUGIN-ARCHITECTURE, REQ-SYS-PLUGIN-001
- **归属规范**: CMMI 03_design (TS) / `.agents/skills/adr-architect`

---

## 1. 背景与问题阐述 (Context and Problem Statement)

系统初始阶段吸收了 CoolieBase 原生的 15 个业务域（`bpm`, `pay`, `report`, `mp`, `mall`, `member`, `crm`, `erp`, `wms`, `mes`, `ai`, `iot`, `im` 等）。在传统单体应用中，所有业务逻辑堆叠在单一工程目录或直接分散在 Next.js 的 `src/app/` 路由树下：
1. **构建体积失控**：单次构建拉起全量几十万行代码，Turbopack / Webpack 编译耗时严重劣化；
2. **域间边界模糊**：团队不同成员易发生跨模块直接 import，代码互相纠缠导致无法独立按需交付；
3. **微服务拆分困难**：无法在不改动前端与下游契约的前提下，将成熟高吞吐域（如 Mall、Pay）独立打包为独立服务或 Worker 进程。

---

## 2. 考虑的候选方案 (Considered Options)

1. **方案 A：基于 `@cooliebase/plugin-sdk` 的第一方业务插件化体系 (`packages/plugins/plugin-*`)**
   将 15 个业务域全部标准化为独立第一方插件（`cooliebase.<domain>`）。保留 `system` 与 `infra` 作为不可撼动的平台地基。插件具备独立的 `plugin.manifest.json`、`plugin-entry.ts`、路由注册与生命周期，支持在同一个主进程合并运行（`merged`）或以独立工作进程（`isolated`）/ 独立容器形式部署。
2. **方案 B：从第一天起直接物理拆分为 15 个独立 Git 仓库与微服务**
   直接建立 15 个独立仓库，各自独立构建部署，跨域纯走 HTTP/gRPC。
3. **方案 C：维持单一单体代码包平铺在 `src/modules/<domain>/` 下**
   不进行物理目录与包层面的解耦，仅依赖开发者代码规范自觉性约束。

---

## 3. 决策结果 (Decision Outcome)

**选用方案 A (第一方业务插件架构)**。

### 决策动因 (Justification)
1. **最佳工程 ROI 与低认知负荷**：
   方案 B（15 个独立微服务代码库）对于中小规模交付及初期孵化团队来说是“灾难级维护成本”（需要 15 套 CI/CD、15 组部署流水线与跨库调试地狱）；而方案 A 在单一 Monorepo（pnpm workspaces）内享受单体开发的高效与强类型共享，同时具备微服务级的物理物理隔离。
2. **双模运行能力 (Merged vs Isolated)**：
   在资源受限环境（如 1 核 2G 边缘节点），15 个插件与基座同进程直调，零序列化内存通信；在客户大规模并发场景，只需执行 `npm run domain:pack <domain>` 即可将单一插件打包为独立微服务或 Worker 进程，对外 API 契约和前端毫无感知。
3. **平台地基与业务域的清晰分工**：
   `system` 和 `infra` 作为平台地基永不插件化，专注于为所有插件提供租户鉴权、字典服务、代码生成与审计底层支持。

---

## 4. 后果与权衡 (Consequences)

### 积极影响 (Positive)
- **极速增量构建与裁剪**：商业客户不需要的业务域（如制造类客户不需要 `mp` 微信公众号插件），只需在 `pnpm-workspace.yaml` 或 manifest 中移除对应插件声明，构建体积即可立减 70%；
- **物理边界保障**：门禁 `npm run domain:check` 严格防御跨插件非法直接依赖，保证插件独立生命周期；
- **清爽的 Next.js BFF**：Next.js 路由层无需手写冗余转发代码，通过统一挂载点 `/api/v1/plugins/<pluginId>/api/**` 统一调度。

### 妥协与治理 (Trade-offs & Governance)
- **静态入口登记**：仓内第一方插件为 TypeScript，不能在运行期随意动态 `import()`，必须在 `packages/shared/backend/plugins/first-party-entries.ts` 显式静态注册。
  - *自动化保证*：提供 `scripts/migrate-domain-to-plugin.cjs` 脚本实现 100% 自动化无损迁移。

---

## 5. 合规与校验手段 (Compliance & Verification)

- **Manifest 验证**：`npm run domain:manifests:check` 校验所有插件元数据合规；
- **加载器审查**：`npm run domain:loaders:check` 确保静态入口完整注册；
- **独立打包演练**：`npm run domain:pack <domain>` 验证插件具备独立打包成独立产物的能力。
