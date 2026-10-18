# CoolieBase-All-Next 全数据库类型、高可用集群、读写分离与分库分表权威技术手册
# (Enterprise Database HA, Read-Write Splitting, Multi-DataSource & Sharding Architecture)

> **版本**: 2026 Enterprise Edition  
> **适用范围**: 生产级 MySQL MHA、Pgpool-II/Patroni、openGauss、达梦 DM8/DM9 数据守护、分库分表与多数据源动态路由  
> **底层代码支撑**: `packages/shared/backend/lib/database/` (`read-write-router.ts`, `multi-datasource-manager.ts`, `sharding-engine.ts`, `kysely-client.ts`)

---

## 一、 支持的数据库类型与驱动支持全景

`cooliebase-all-base` 采用三层兼容等级（Tier-A / Tier-B / Tier-C）与驱动抽象层，全面支持主流商业数据库与信创国产数据库：

```
                      【数据库类型与兼容分级矩阵】

 ┌────────────────────────────────────────────────────────────────────────┐
 │ Tier-A（标准主干）：PostgreSQL、MySQL、MariaDB、SQLite、TiDB、OceanBase    │
 │   - 网络协议：标准 MySQL / PostgreSQL Wire Protocol                   │
 │   - 驱动实现：mysql2、pg、better-sqlite3                                │
 ├────────────────────────────────────────────────────────────────────────┤
 │ Tier-B（信创协议兼容）：openGauss、华为 GaussDB、人大金仓 KingbaseES (PG模式)│
 │   - 网络协议：PostgreSQL 前端协议                                       │
 │   - 驱动实现：pg (标准连接池 + SCRAM-SHA-256 密码适配)                  │
 ├────────────────────────────────────────────────────────────────────────┤
 │ Tier-C（信创专有/Oracle方言）：达梦 DM8/DM9、南大通用 GBase、神通、Oracle  │
 │   - 网络协议：专用网络协议或 ODBC                                       │
 │   - 驱动实现：dmdb 原生驱动适配 / Kysely 扩展 Dialect                     │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 二、 生产级高可用 (HA) 集群部署方案

### 1. MySQL 体系：MHA / Orchestrator / MGR 高可用

#### 架构拓扑
- **架构构成**：1 主库 (Primary) + N 从库 (Standby Replicas) + MHA Manager 节点 + Keepalived 虚拟 IP (VIP)。
- **切主机制**：
  1. MHA Manager 周期性探活主库；
  2. 当主库宕机，MHA 自动比对各从库的 relay log，选出最新的从库并补齐差异日志（差异补偿）；
  3. 执行 `master_ip_failover` 脚本将 VIP 漂移至新主库，并向其他从库发送 `CHANGE MASTER TO`；
  4. 切换耗时通常在 10~30 秒内完成。

```
              ┌────────────────────────┐
              │  cooliebase-all-base (App)  │
              └───────────┬────────────┘
                          │ 读写分离 / VIP
           ┌──────────────┴──────────────┐
           ▼                             ▼
    【Master (VIP)】              【Replica 1..N】
    192.168.1.100                192.168.1.102 / 103
           │ (半同步复制)                 │
           └─────────────────────────────┘
                          ▲
                 【MHA Manager 监控探活】
```

#### 应用端连接配置
应用端既可以通过 VIP 接入，也可以由底座的 `ReplicaClusterManager` 进行直连智能路由：
```bash
# 环境变量配置
DATABASE_URL="mysql://app_user:pass@192.168.1.100:3306/cooliebase_prod"
DB_REPLICAS="mysql://app_user:pass@192.168.1.102:3306/cooliebase_prod,mysql://app_user:pass@192.168.1.103:3306/cooliebase_prod"
```

---

### 2. PostgreSQL / openGauss / KingbaseES：Pgpool-II + Patroni 高可用

#### 架构拓扑
- **Patroni + DCS (etcd/Consul)**：负责分布式选举、健康心跳与自动切主。
- **Pgpool-II**：作为数据库中间件，负责连接池复用、自动识别 SELECT 语句并执行只读负载均衡。

```
              ┌────────────────────────┐
              │  cooliebase-all-base (App)  │
              └───────────┬────────────┘
                          │
                   【Pgpool-II 代理层】
                   (读写自动分发: 端口 9999)
                  ┌───────┴───────┐
                  ▼               ▼
           【Primary (写)】   【Standby (流复制读)】
              Port 5432       Port 5432
                  ▲               ▲
                  └───────┬───────┘
                          │
              【Patroni + etcd 状态守护】
```

#### Pgpool-II 关键配置 (`pgpool.conf`)
```ini
listen_addresses = '*'
port = 9999
backend_hostname0 = 'pg-master'
backend_port0 = 5432
backend_weight0 = 0
backend_flag0 = 'ALWAYS_MASTER'

backend_hostname1 = 'pg-replica-1'
backend_port1 = 5432
backend_weight1 = 1
backend_flag1 = 'DISALLOW_TO_FAILOVER'

load_balance_mode = on
master_slave_mode = on
master_slave_sub_mode = 'stream'
```

---

### 3. 达梦 DM8：数据守护集群 (DM Data Watch) 与 DMDSC 共享存储集群

达梦在党政军信创项目中具备最高的占有率。其官方推荐高可用形态为 **实时主备数据守护 (Data Watch)**。

#### 架构拓扑
- **构成**：1 个主库 (Primary) + 1~2 个实时备库 (Standby) + 守护进程 (dwwatcher) + 确认监视器 (dmmonitor)。
- **同步机制**：主库事务提交前，重做日志通过网络实时发送到备库并等待应答（实时归档模式），数据零丢失 (RPO = 0)。
- **故障自愈**：主库发生硬件故障时，确认监视器 (dmmonitor) 发起选举并将备库接管提升为主库。

```
              ┌────────────────────────┐
              │  cooliebase-all-base (App)  │
              └───────────┬────────────┘
                          │ (dm_svc.conf 服务名透明漂移)
           ┌──────────────┴──────────────┐
           ▼                             ▼
    【DM8 Primary】                【DM8 Standby】
    dwwatcher (守护)               dwwatcher (守护)
           │ (MAL 实时日志归档)           │
           └─────────────────────────────┘
                          ▲
                 【dmmonitor 确认监视器】
```

#### 客户端透明故障漂移配置 (`dm_svc.conf`)
达梦原生驱动支持通过 `dm_svc.conf` 实现客户端级别的自动负载均衡与重连切换：
```ini
# /etc/dm_svc.conf
COOLIEBASE_CLUSTER=(192.168.1.201:5236, 192.168.1.202:5236)
[COOLIEBASE_CLUSTER]
TIME_ZONE=(480)
LOGIN_MODE=(1)                # 1: 仅连接 Primary 主库；0: 优先连接 Primary
SWITCH_INTERVAL=(1000)        # 节点切换重试间隔 (ms)
SWITCH_TIMES=(30)             # 切换最大重试次数
EP_SELECTOR=(1)               # 1: 依次遍历连接
```
在应用端连接串中直接使用服务名：
```bash
DATABASE_URL="dm://SYSDBA:SYSDBA001@COOLIEBASE_CLUSTER"
```

---

## 三、 cooliebase-all-base 内置读写分离引擎使用指南

底座已在 `packages/shared/backend/lib/database/read-write-router.ts` 内置了生产级读写分离引擎：

### 1. 事务强一致安全机制（Read-Your-Writes Invariant）
传统的读写分离框架最致命的问题是**“主从同步延迟”**：用户在事务中插入了一条数据，紧接着一条 `SELECT` 被路由到了从库，由于延迟导致读取为空。
- **底座铁律**：一旦进入 `runInTransaction`，路由目标**硬性锁定为主库**，后续所有的读写全部由主库承载，杜绝脏读！

### 2. 代码调用实战

```ts
import {
  runWithMaster,
  runWithReplica,
  runInTransaction,
  replicaClusterManager
} from "@/modules/shared/backend/lib/database"

// 1. 初始化集群节点
replicaClusterManager.init({
  master: {
    name: "primary-master",
    driver: "mysql",
    url: "mysql://root:root@10.0.0.1:3306/cooliebase",
    tier: "A",
    protocolFamily: "mysql"
  },
  replicas: [
    { name: "slave-1", url: "mysql://root:root@10.0.0.2:3306/cooliebase", weight: 2, isHealthy: true },
    { name: "slave-2", url: "mysql://root:root@10.0.0.3:3306/cooliebase", weight: 1, isHealthy: true }
  ],
  loadBalancePolicy: "weighted" // 支持 round_robin / weighted / random
})

// 2. 强制读主库（如资金结算、对账等敏感计算）
const latestAccount = await runWithMaster(async () => {
  return await accountRepository.findById(userId)
})

// 3. 显式读从库（如大数据量报表查询、统计大屏）
const reportData = await runWithReplica(async () => {
  return await statReportRepository.findMany({ page: { page: 1, pageSize: 100 } })
})

// 4. 事务保护区（自动锁定主库）
await runInTransaction(async () => {
  await orderRepository.create({ ... })
  // 事务内的查询绝对不会走到从库，100% 读到刚插入的数据
  const order = await orderRepository.findById(orderId)
})
```

---

## 四、 动态多数据源引擎 (Multi-DataSource Engine)

底座支持多业务分库、多租户独占库与冷热分离库：

```ts
import {
  multiDataSourceManager,
  runWithDataSource,
  getKyselyDb
} from "@/shared/backend/lib/database"

// 1. 动态注册多个业务库
multiDataSourceManager.registerDataSource("pay_db", payDbKyselyInstance)
multiDataSourceManager.registerDataSource("crm_db", crmDbKyselyInstance)

// 2. 在业务上下文中透明路由
async function handleCrossDatabaseBiz() {
  // 默认上下文：主业务库
  const user = await userRepository.findById("1001")

  // 切换至 Pay 独立数据源
  await runWithDataSource("pay_db", async () => {
    // 此时 getKyselyDb() 与 BaseMapper 自动切换操作 pay_db
    const payOrders = await payOrderRepository.findMany({ ... })
  })

  // 自动恢复至原有数据源
}
```

---

## 五、 声明式分库分表引擎 (Sharding & Partitioning Engine)

当单表记录数超过数千万（如订单流水表、支付对账单、操作日志）时，底座提供声明式分表与跨分片聚合能力：

### 1. 声明哈希取模分表 (Hash Mod)
```ts
import { shardingEngine, createHashModShardingRule } from "@/shared/backend/lib/database"

// 将订单表 t_trade_order 按 order_id 哈希分成 4 张物理表：t_trade_order_0 .. 3
shardingEngine.registerRule(createHashModShardingRule({
  logicalTable: "t_trade_order",
  shardingKey: "order_id",
  tableCount: 4
}))
```

### 2. 声明时间范围分表 (Time Monthly)
```ts
import { shardingEngine, createTimeMonthlyShardingRule } from "@/shared/backend/lib/database"

// 将支付流水表 t_pay_record 按月分表
shardingEngine.registerRule(createTimeMonthlyShardingRule({
  logicalTable: "t_pay_record",
  shardingKey: "create_time",
  months: ["202601", "202602", "202603", "202604"]
}))
```

### 3. 跨分片聚合归并 (Scatter-Gather)
当查询条件**未携带分片键**时，分片引擎并发向所有物理表发起查询，并在内存中完成多维归并排序与精准分页截断：

```ts
const pagedResult = await shardingEngine.executeScatterGather({
  logicalTable: "t_trade_order",
  queryFn: async (physicalTable) => {
    // 物理表查询
    return await queryTable(physicalTable)
  },
  orderBy: [{ field: "create_time", order: "desc" }],
  offset: 0,
  limit: 20
})

console.log(pagedResult.total) // 全分片总数
console.log(pagedResult.items) // 精准排序后的前 20 条
```

---

## 六、 总结与最佳实践

1. **协议优先**：优先选用兼容 MySQL 或 PostgreSQL 协议的国产数据库（TiDB / OceanBase / openGauss / KingbaseES），零改造成本；
2. **达梦专适**：达梦 DM8 采用集群数据守护 + 客户端 `dm_svc.conf` 服务名透明漂移，由底座 Kysely 驱动无缝承接；
3. **事务安全**：写操作与事务内查询严格走主库，非事务只读操作通过 `runWithReplica` 由健康从库分担负载；
4. **分片收敛**：海量数据采用 `ShardingEngine` 声明式分表，跨片聚合由 `executeScatterGather` 统一收敛，避免业务层手写复杂的 UNION SQL。
