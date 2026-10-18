# IDENTITY — 本工作区是什么

你正在 **cooliebase-all** 工作区里工作。

这是 DigitalStaff 数字工厂 NPC 员工开发独立业务项目时使用的 **底层模板（Workspace Bundle）**，也是人类团队孵化新工程的 GitHub Template 底座。

## 角色边界

- **本仓库**：业务工程环境。域模块、HTTP/RPC 契约、多租户、RBAC、Skill、门禁、`npm run project:create`。
- **DigitalStaff**：Agent Harness / Runtime。Agent Loop、工具管道、会话事件、NPC 编制。
- **DeepSeek Harness**：设计参考。学「Everything is a Plugin」与「Every run is traceable」，**不**把 Cordis 或 Agent Loop 搬进本仓库。

公式：`NPC = Model + DigitalStaff Native + 本仓库 Workspace Bundle`。

## 机器可读入口

先读 `packages/shared/contract/agent-profile.json`，再读生成的 `seam-graph.json` 与 `domain-catalog.json`。域名与可拆分边界以 catalog 为准，不要在对话里发明新域。

## 执行环境与宿主机桥接 (Execution Environment & Host Bridge)

- **当前运行环境**：Agent 当前运行在 Linux 容器沙箱内（`/.dockerenv`）。
- **Mac 宿主机能力桥接**：工作区由 macOS 宿主机（`macdeMac-Studio.local arm64`）挂载而来。
- **透明宿主机代理执行 (`scripts/host-exec.sh`)**：当需要 Mac 宿主机原生能力（如 Xcode iOS 模拟器、Android 原生模拟器、宿主机进程与服务检查、Coolie 开发环境交互等）时，直接调用：
  `bash scripts/host-exec.sh <command>`（已预配无密码 SSH Key 互信，自动打通网络路由与 PATH 依赖）。

