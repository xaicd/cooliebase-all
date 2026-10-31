# docs/ontology —— 层B 活体本体单一真源

本目录是**唯一真源**（层A 平台与层B 交付物规范绝对统一）：

| 文件 | 作用 |
|---|---|
| `domain.yaml` | 领域拓扑：域名 → 代码路径 → 实体键（由 `packages/domains/*` 真实文件推导） |
| `ontology.yaml` | 实体（M1_Objects）与动词（M_ActionTypes）注册表，供 G8 门禁与 Copilot 注入 |
| `copilot.yaml` | AI Copilot 抽屉与只读安全沙箱规范 |

## 硬约束（SOP Check 3 / 3.1 / 3.2）

1. **零软链**：`find docs/ontology -type l` 必须为空；根目录不得再出现第二个 `ontology/`。
2. **禁止臆造**：实体键必须能在 `packages/domains/*` 或 `apps/*` 中找到真实来源。
3. **动词不悬空**：`M_ActionTypes` 的每个动词必须对应真实 route / contract。
4. **Copilot 只读**：`forbiddenStatements` 命中即 HTTP 403，网关与后端双拦。

生成/校验：`node scripts/ontology-gate.mjs`（本仓 scripts 下，G8-1/G8-2/G8-3）。
