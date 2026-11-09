# cooliebase-all 数据库设计规范 v1（草案）

> 2026-11-06 立规。背景：掌柜对标 yudao（遵循《阿里巴巴 Java 开发手册·泰山版》）指出本仓缺数据库设计规范专项——
> 实测同项目 VARCHAR(100)（手写）与 VARCHAR(255)（codegen 模板）两口径并存。本规范 = 阿里数据库规约的 TS/Prisma 转译 + 本仓低代码现状定口径。
> 状态：v1 草案（核心条款先行，standards:check 机检守卫待挂）。

## 0. 权威对标声明

- 继承《阿里巴巴 Java 开发手册（泰山版）》MySQL 数据库规约的设计精神：命名全小写下划线、表达不是注释、索引规范、字段类型够用就好。
- ORM 差异改写：Prisma 下不用存储过程/触发器（阿里同样禁用）；PG enum 改用 `varchar + 注释枚举值`（Prisma String 惯例，枚举演进不动 DDL）。

## 1. 命名规范（强制）

1. 表名/列名/索引名一律 `snake_case`，禁驼峰禁拼音混缩写。
2. 表名语义化名词：`meeting_room`、`booking`；**共享库/多项目场景表名带项目 slug 前缀**（如 `mrbs_meeting_room`），单项目独立库可不带（现状口径）。
3. 索引名：普通 `<table>_<col>_idx`；唯一 `<table>_<col>_uniq`。Prisma `@@index`/`@@unique` 自动生成即合规。
4. Boolean 语义列禁用 `is_xxx` 之外的否定式命名（阿里条款，同采）。

## 2. 字段类型口径（强制）

| 语义 | 类型 | 说明 |
|---|---|---|
| 主键 | `varchar(64)` + cuid / uuid | 底座惯例 cuid()，@map snake |
| 租户 | `varchar(64)` NOT NULL `company_id` | 必带 @@index；一律取会话禁信请求体 |
| 金额 | `Decimal` | 禁 float/double（阿里条款同采） |
| 时间 | `timestamp(3)`（Prisma DateTime） | 应用层统一存 UTC（A3 时间真理） |
| 枚举 | `varchar(20~32)` + 注释列全枚举值 | 例 `/// 状态: active\|inactive` |
| 短码/编号 | `varchar(32)` | |
| 名称/标题 | `varchar(100)`（人名/房间名）～`varchar(255)`（标题类） | **禁止无脑 255**：长度是约束不是默认 |
| 描述/备注 | `varchar(500)` 或 `text` | 500 内可检索，超 500 用 text |
| 布尔 | `boolean` NOT NULL DEFAULT | |

**长度裁决规则**：codegen 模板默认口径以本表为准——名称 255→100、描述 255→500 的模板校准在 v1.1 完成（当前模板遗留 255 全档，先成文后统一）。

## 3. 必备字段（强制）

1. 全表必备：`id` / `created_at` / `updated_at`（@default(now())/@@updatedAt）。
2. 租户业务表必备：`company_id`。
3. **软删口径定死：`status` 字段（active/inactive）**——本仓不引入阿里式 `deleted` 布尔列（低代码模板/在线表单均按 status 口径生成；历史一致性与生成器简单性优先）。已废弃数据语义 = `status=inactive` + 业务层过滤。
4. 审计字段（创建人/更新人）v1 暂不强制全表（当前底座走 API 访问日志审计），需要行级审计的表加 `creator_id/updater_id varchar(64)`，v1.1 评估是否升级为强制。

## 4. 索引规范（强制）

1. `company_id` 必索引（租户过滤全走它）。
2. 出现在 WHERE 高频/JOIN 的列建索引；低代码表用 `queryType` 声明的查询列由模板自动产出索引。
3. 单表索引建议 ≤5 个（阿里条款同采）；禁在超长 varchar(500+)/text 上建普通索引。

## 5. 迁移规范（强制）

1. 建表迁移一律产出物化路径：codegen `table-ddl`（含幂等跳过，2026-11-06 修）或 `scripts/generate-table-migration.ts`；**手写迁移的 CREATE TABLE 必须带 `IF NOT EXISTS`**（幂等红线）。
2. 迁移文件名 `<时间戳>_add_<表名>`（表名带 slug 则目录自动带）。
3. 高级约束（EXCLUDE USING gist 等）允许手写追加迁移，但必须注释业务理由与并发语义。

## 6. 机检守卫（已挂 standards:check）

- [x] 类型口径检查：金额列禁 double、时间列禁 varchar（`db-column-type-discipline`，enforce）
- [x] 长度口径检查：varchar(255) 用于名称类告警，校准默认名称 100、描述 500（`db-varchar-length-discipline`，enforce）
- [x] 租户列检查：含 tenant_id / company_id 必含其索引（`db-tenant-column-index`，enforce）
- [x] 幂等检查：迁移 CREATE TABLE 缺 IF NOT EXISTS 拦截（`db-migration-idempotency`，enforce）

> v1 落地状态：已完成成文、模板口径校准（`column-type.ts`）与 `standards:check` 四项机检守卫挂载。
