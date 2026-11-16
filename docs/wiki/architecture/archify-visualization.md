# 架构百科：Archify 可机器验证与交互式架构图生成

> 对应规则：AGENTS.md §3 / .agents/skills/archify/SKILL.md (对标 tt-a1i/archify 47,000+★, MIT)

## 一、 核心痛点与 Validate-Preview-Deliver 范式
- 传统手绘图（Draw.io/Excalidraw）无法被 AI 机器验证，且随着代码演进而迅速失效漂移；
- 静态文本图（纯 Mermaid）在大规模微服务拓扑中经常因布局错乱、文字折行或 AI 幻觉导致“死连线”。
- **Archify 契约闭环**：
  1. **类型化 JSON Schema 结构化定义**：严格声明 `boundaries`、`components` 与 `connections`；
  2. **原子连线与边界校验**：严禁悬空未声明节点连线，杜绝 AI 架构幻觉；
  3. **编译输出交互式 HTML 制品**：支持缩放平移、暗黑模式切换与**全链路流动请求路径追踪 (Path Tracing)**。

## 二、 规范制品存放路径
- Schema 契约资产：`docs/03_design/diagrams/<name>.arch.json`
- 交互式 HTML 制品：`docs/03_design/diagrams/<name>.arch.html`
