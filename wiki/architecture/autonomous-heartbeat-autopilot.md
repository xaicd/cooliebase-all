# 架构百科：自主巡检自愈守护中枢 (Agent Autopilot Daemon)

> 对应规则：AGENTS.md Rule 0.9 / Rule 0.13 / packages/shared/backend/lib/agent-autopilot.ts

## 一、 为什么必须有常驻自主巡检中枢？
传统生产系统通常处于被动状态，必须等发生故障、报警或用户投诉后人工介入排查。
自主巡检守护中枢将系统升级为具备**自主感知 (Autopoiesis)** 与主动自愈能力的生命体：
1. **全域微核健康探针**：每 10 秒主动对 17 个微内核领域与第一方插件进行连通性与清单完整性探测；
2. **双轨真实数据库体检**：探针直连 PostgreSQL/SQLite 双轨引擎，测量 `SELECT 1` 往返延迟 (RTT) 并告警高延迟；
3. **事务性发件箱 (Outbox) 积压检测与自愈**：主动侦测未投递消息，超过阈值时自动触发 Outbox 重试投递与失败消息清算；
4. **全域 326 份 Agent 契约健康度打分**：实时聚合各域实体就绪度，输出 0~100 综合健康评分 (🟢 OPTIMAL / 🟡 ATTENTION / 🔴 DEGRADED)。

## 二、 核心命令与服务入口
- 单次巡检与诊断：`pnpm run agent:autopilot`
- 常驻后台守护进程：`pnpm run agent:autopilot:daemon`
- 主动触发全栈自愈：`pnpm run agent:autopilot:heal`
- 内部 RPC 遥测接口：`GET /api/internal/autopilot` 与 `POST /api/internal/autopilot`
