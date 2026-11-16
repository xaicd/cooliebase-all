# 架构百科：流式智能行动决策卡片中枢 (Action Decision Hub)

> 对应规则：AGENTS.md Rule 0.9 / Rule 0.13 / packages/shared/frontend/components/action-decision-hub.tsx

## 一、 变革：从“死数字报表”到“智能行动决策”
传统仪表盘充满折线图、柱状图与数字指标，运维人员看着指标不知所措。
智能行动中枢将其彻底重塑为 **Action Cards (智能行动卡片)**：
- **四级行动优先级**：`critical` (紧急需介入)、`warning` (预警中)、`opportunity` (性能与架构优化)、`resolved` (已平账/已闭环)；
- **2-字符专属决策动词**：严禁冗长表单，卡片提供极简 2-字符决策按钮：`平账`、`重发`、`自愈`、`体检`、`加固`；
- **端到端一键闭环**：点击动词直接调用后端自愈执行管线，自愈成功后自动记录不可变审计跟踪并更新健康指标。

## 二、 Server-Sent Events (SSE) 亚秒级流式感知
- **零长短轮询**：前端通过 `EventSource` 直连 `/api/internal/autopilot/stream`；
- **实时心跳流下发**：每 4 秒流式推送一次遥测脉冲帧 (`event: heartbeat`)；
- **自动降级保护**：当浏览器或代理限制 SSE 时，透明降级为 15 秒间隔轮询，保障全网环境 100% 鲁棒可用。
