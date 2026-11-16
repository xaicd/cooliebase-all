# 架构百科：BaseMapper 与 QueryWrapper 链式语法

> 对应规则：AGENTS.md 核心铁律 Rule 0.2 / §4.7

## 一、 为什么杜绝手写重复 CRUD？
大模型为每个表生成数百行 `selectById`、`insert`、`update` 是严重的算力与 Token 浪费，且容易在审计字段和租户过滤上出现漏网之鱼。

## 二、 核心用法
```ts
import { BaseMapper, QueryWrapper, BaseService } from '@/shared/backend/lib/database';

// 1. 初始化通用 Mapper (支持表列能力自动探测)
const roleMapper = new BaseMapper('system_role');

// 2. 链式条件检索
const qw = new QueryWrapper()
  .eq('status', 'ACTIVE')
  .like('name', '管理员')
  .orderByDesc('created_at');

const list = await roleMapper.selectList(qw);

// 3. 分页查询 (SQL 级 count + limit/offset)
const pageData = await roleMapper.selectPage({ pageNum: 1, pageSize: 10 }, qw);
```

## 三、 表能力探测机制
`BaseMapper` 启动时通过 `db.introspection.getTables()` 动态缓存列元数据：
- 若表具备 `deleted` 列 ➔ 自动启用逻辑删除过滤 (`deleted = 0`)；
- 若表具备 `tenant_id` 列 ➔ 自动注入租户上下文；
- 写入时按列是否存在自动填充 8 大审计底座字段。
