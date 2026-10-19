# cooliebase-all 多数据库与国产数据库兼容规范（v1.0）

更新时间：2026-08-02

## 1. 目标

建立与 CoolieBase 对齐的多数据库能力，并明确国产数据库可落地路径，确保 AI 与工程师在同一兼容口径下开发。

## 2. 数据库识别清单

### 2.1 通用数据库（基础支持）

1. PostgreSQL
2. MySQL
3. MariaDB
4. SQL Server
5. SQLite
6. Oracle（通过专用连接器）

### 2.2 国产数据库（必须识别并纳入）

1. OceanBase（MySQL 模式）
2. TiDB（MySQL 兼容）
3. openGauss
4. GaussDB（openGauss 生态）
5. KingbaseES（PostgreSQL 兼容生态）
6. 达梦 DM8
7. 人大金仓（Kingbase 系列已覆盖）
8. 神通数据库
9. GBase

## 3. 兼容分级策略

### 3.1 Tier-A：当前基座直接支持

判定条件：可直接通过 Prisma 或标准驱动接入，不需要额外协议转换。

1. PostgreSQL
2. MySQL
3. MariaDB
4. SQL Server
5. SQLite
6. TiDB（MySQL 兼容）
7. OceanBase（MySQL 模式）

### 3.2 Tier-B：协议兼容 + 方言适配

判定条件：总体兼容 MySQL/PostgreSQL 协议，但需要 SQL 方言、索引语法或类型映射适配。

1. openGauss
2. GaussDB
3. KingbaseES

### 3.3 Tier-C：专用连接器或独立服务

判定条件：不建议直接由 Next 应用主进程访问，需要单独数据库接入服务。

1. 达梦 DM8
2. 神通数据库
3. GBase
4. Oracle（若目标项目要求）

## 4. 标准化接入架构

## 4.1 数据访问抽象层

在 cooliebase-all 内强制分层：

1. Domain Service：业务逻辑
2. Repository Port：数据库无关接口
3. Adapter：按数据库实现
4. Migration Runner：按数据库方言执行迁移

## 4.2 数据库能力声明文件

每个域必须提交能力声明（建议路径）：

1. docs/architecture/db-profiles/<domain>.md

声明项最少包括：

1. 主数据库类型
2. 已验证数据库列表
3. 不兼容 SQL 特性
4. 回退策略

## 5. SQL 与模型约束

## 5.1 跨数据库 SQL 白名单

1. 禁止在业务层拼接方言 SQL
2. 聚合、分页、排序优先走 ORM
3. 原生 SQL 必须收敛在 Adapter 层
4. 任何原生 SQL 必须附兼容测试

## 5.2 数据类型映射约束

1. 金额：统一 Decimal 字符串处理
2. 时间：统一 UTC 存储 + 时区展示
3. JSON：对不原生支持的库使用 TEXT + codec
4. 布尔：统一通过 adapter 映射

## 6. 测试门禁

每个核心域至少通过以下检查：

1. Repository 单测（逻辑）
2. DB Adapter 集成测试（最少 2 种数据库）
3. 迁移前后兼容检查
4. 回滚脚本可执行检查

CI 建议分组：

1. db-matrix-basic：PostgreSQL + MySQL
2. db-matrix-domestic：TiDB/OceanBase/openGauss（按环境启用）

## 7. Agent 开发指令（硬约束）

1. 新增模块时必须先选择数据库兼容等级（Tier-A/B/C）
2. 未声明兼容等级的模块不得标记 DONE
3. 发现 Tier-C 需求时，必须同步输出微服务拆分建议
4. 所有 DB 相关 PR 必须更新兼容声明文件

## 8. 与微服务升级联动

当某域需要 Tier-C 数据库且核心交易强依赖时，优先拆分独立数据服务，避免主应用被单一数据库方言绑死。
