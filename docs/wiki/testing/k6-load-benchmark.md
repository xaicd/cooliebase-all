# 测试百科：K6 真实并发压测场景与容量回归护栏

> 对应规则：AGENTS.md §3.3 / packages/shared/contract/load-baseline.json / test/load/k6-load-benchmark.js

## 一、 压测场景与阶梯并发
- 场景定义脚本：`test/load/k6-load-benchmark.js`
- 执行阶梯加压：10 VUs $	o$ 50 VUs (加压 15s) ➔ 保持 50 VUs 高负载 30s ➔ 平滑降压 15s。

## 二、 SRE 容量护栏底线
- `http_req_failed`: 失败率严格 $< 0.1%$；
- `http_req_duration`: p95 响应时间 $le 20	ext{ms}$ (健康检查/契约接口)；
- `http_reqs`: 单机吞吐量 $ge 2,000	ext{ RPS}$。
