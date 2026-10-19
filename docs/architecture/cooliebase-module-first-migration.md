# cooliebase-all Module-First 迁移策略

更新时间：2026-08-02

## 1. 结论

你提到的风险成立：若长期共享顶层目录，后续微服务拆分会越来越难。

## 2. 对齐 CoolieBase 的做法

CoolieBase（Java）通常通过新增 module 承载新业务域，避免核心目录持续膨胀。

cooliebase-all 对齐策略：

1. 新业务域直接进入 `packages/domains/<domain>`。
2. 顶层 `src/backend/*` 只保留过渡门面。
3. 当域达到拆分阈值，直接从模块目录迁出为独立 app/service。

## 3. 已完成示例

1. mp：已目录化拆分（子服务 + 兼容门面）。
2. crm：已迁移到 `packages/domains/crm/backend/*`，旧路径保留 re-export。
3. erp：已迁移到 `packages/domains/erp/backend/*`，旧路径保留 re-export。

## 4. 拆分阈值建议

任一满足即可进入独立服务评估：

1. 单域发布频率高于其他域 2 倍以上。
2. 单域依赖独占中间件或独占数据库方言。
3. 压测显示单域扩容需求显著高于其余域。
4. 团队组织需要独立迭代节奏。
