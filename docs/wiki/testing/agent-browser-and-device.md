# 测试百科：Agent 契约驱动 UI 探针与无头接口运营

## 一、 机器可读契约 (Agent Contract)
由代码生成器同步产出于 `<插件根>/agent/<kebab>.agent.json`，记录页面路由、元素 `testid`、接口方法与权限码。

## 二、 两个消费轨
1. **`agent-browser` (UI 轨)**：
   - 驱动脚本：`test/agent/agent-contract.spec.ts`
   - 走 Playwright 无头浏览器，根据契约自动执行打开页面 ➔ 断言标题 ➔ 填写表单 ➔ 提交 ➔ 验证列表刷新。
2. **`agent-device` (接口轨)**：
   - 驱动脚本：`node scripts/agent/run-ops.cjs health`
   - 免开浏览器，直接打真实 HTTP API 执行批量体检、自动造测试数据 (`seed-sample`) 和清理数据 (`purge-sample`)。
