# CoolieBase 原生能力目录（all-next 只做这批）

更新时间：2026-08-02

## 1. 适用原则

1. 本目录只收录 cooliebase-vue-pro 与 yudao-ui-admin-vue3 原生自带能力。
2. all-next 的模块建设、模板生成、门禁检查，必须在本目录域内执行。
3. 不在目录内的能力，视为“非原生扩展”，当前阶段不进入 all-next。

## 2. 后端原生模块域

1. system
2. infra
3. bpm
4. pay
5. report
6. mp
7. mall
8. member
9. crm
10. erp
11. wms
12. mes
13. ai
14. iot
15. im

来源：cooliebase-vue-pro 根目录下 yudao-module-*。

## 3. 前端原生管理域

1. system
2. infra
3. bpm
4. pay
5. report
6. mp
7. mall
8. member
9. crm
10. erp
11. wms
12. mes
13. ai
14. iot
15. im

页面附加域（壳层）：Home、Login、Profile、IFrame、Error、Redirect。

来源：yudao-ui-admin-vue3 的 src/views 与 src/api。

## 4. all-next 升级方式（先学全，再升高）

以下命令统一在 `apps/cooliebase/cooliebase-all-base` 目录执行。

1. 每次迭代先运行一次全量扫描：npm run cooliebase:full:scan。
2. 再运行深度证据扫描：npm run cooliebase:deep:scan，拉齐域级 Controller/Service/Mapper/DO/Enum 与页面/API 明细。
3. 同步运行 yudao-boot-mini 核心扫描：npm run cooliebase:mini:scan，校准 framework/system/infra 的基础设施口径。
4. 以扫描产物为依据，先补文档映射，再补 API/Service/Page/Permission/Log/Test 六要素。
5. 先完成 system + infra 全闭环，再推进其余 13 域。
6. 每个域按“可运行最小闭环 + 可复用模板”落地，禁止一次性堆大而全空壳。

## 5. 配套产物

1. 全量扫描脚本：scripts/scan-cooliebase-full-capabilities.ts
2. 深度证据扫描脚本：scripts/scan-cooliebase-domain-evidence.ts
3. mini 核心扫描脚本：scripts/scan-yudao-boot-mini-core.ts
4. starter 覆盖扫描脚本：scripts/scan-all-next-starter-coverage.ts
5. 扫描报告输出：apps/cooliebase/cooliebase-all-base/docs/architecture/artifacts/
6. 全域迁移作战板：apps/cooliebase/cooliebase-all-base/docs/architecture/cooliebase-full-migration-board.md
7. mini 核心研究：apps/cooliebase/cooliebase-all-base/docs/architecture/yudao-boot-mini-core-foundation-study.md
8. mini 迁移计划：apps/cooliebase/cooliebase-all-base/docs/architecture/yudao-boot-mini-to-all-next-migration-plan.md
9. system/infra 任务拆解：apps/cooliebase/cooliebase-all-base/docs/architecture/yudao-mini-system-infra-task-breakdown.md
10. 能力矩阵：docs/architecture/cooliebase-all-base-capability-matrix.md
11. 域治理声明：docs/architecture/cooliebase-all-base-domain-governance.md
