# 任意终端 CLI 接入本仓 Harness / Spec-Kit 的落地说明

> 目标：**不管用 cmd、Claude Code、agy 还是 Hermes**，开发本仓时都自动走「需求分诊 → 规格 → 门禁」，
> 而不是靠每个 agent 自觉。
>
> 本文所有结论都标注了**取证来源**。查不到证据的地方明确写「未验证」，不猜。

---

## 1. 为什么不能只靠入口文件

规范文件（`AGENTS.md` / `CLAUDE.md` / `.cursorrules`…）只能**提醒模型**，模型可以无视。
真正的"自动"需要**不由模型决定**的层：

| 层 | 谁执行 | 能否被模型绕过 | 覆盖范围 |
|---|---|---|---|
| L0 仓内判定命令 | `npm run agent:route` | 可以（模型可以选择不跑） | 全部 |
| L1 各 CLI 的 hooks | **CLI 引擎** | **不能** | 单家 CLI |
| L2 git 钩子 | **git** | **不能** | **所有** CLI 与人 |
| L3 入口机检 | `npm run check`（CI） | 不能 | 全部（合并前） |

L1 各家配置格式不同；**L2 是唯一真正跨 CLI 的一层**，所以必须有。

---

## 2. 各家入口与 hooks（**取证表**）

| CLI | 读哪个指令文件 | hooks 支持 | 证据 |
|---|---|---|---|
| **Command Code (`cmd`)** | `AGENTS.md`（**不读 `CLAUDE.md`**） | ✅ `.commandcode/settings.json`，事件 `PreToolUse` / `PostToolUse` / `Stop` / `SessionStart` | 产品文档 `reference/memory.md`、`reference/hooks.md` |
| **Claude Code** | `CLAUDE.md`（仓内已有，且已补「第一步」） | ✅ `.claude/settings.json`（事件名以它自己的文档为准） | 未在本仓接入（schema 未取到实证，**不编**） |
| **Hermes** | **自动注入 `AGENTS.md`**（还有 `SOUL.md`） | ✅ `~/.hermes/config.yaml`，事件 `pre_tool_call` / `post_tool_call` / `pre_llm_call` / `subagent_stop` 等 | `hermes --help` 的 `--ignore-rules` 说明；源码 `agent/shell_hooks.py` |
| **agy（Antigravity CLI）** | **未验证** | **未验证** | `~/.local/bin/agy` 是启动器，把 Antigravity 跑在 Docker 容器里（宿主工作区映射为 `/host-workspace`）；容器当时不可达、宿主亦无 Antigravity 配置，**取不到证据** |

> 关于 agy：**它的入口文件是什么，我没有证据，所以不做断言**。
> 若它读 `AGENTS.md`（生态在收敛），则 L0 文本已覆盖；若读别的文件，把文件名告诉维护者即可补一个转发器。

---

## 3. 已落地的部分

### 3.1 L0：需求分诊（跨 CLI 通用）

```bash
npm run agent:route -- "<用户的原始需求原文>"
```

三值判定：

| 结论 | 含义 | 下一步 |
|---|---|---|
| `SPEC_REQUIRED` | 需要规格 | `npm run speckit:new -- --name <名> --domain <域> --type <类型> --title "<标题>"` |
| `DIRECT_OK` | 可直接改 | 直接改，改完 `npm run check` 必须全绿 |
| `NOT_A_REQUIREMENT` | **不是需求**（确认 / 授权 / 上下文陈述 / 调研提问 / 续作指令） | 什么都不做 |

- 规则真源：`scripts/lib/spec-necessity-rules.cjs`（**每条带理由，可审阅可改**）
- 判**不准**时宁严勿宽：是任务但没命中任何规则 → `SPEC_REQUIRED`
- 顺带兑现 AGENTS §15：原始输入自动记入 `docs/features/sprint-prod/{MMDD}.md`
- 机器可读记录：`docs/architecture/artifacts/agent-route-last.json`（**本机瞬时状态，已 gitignore** —— 每次运行都会变，追踪它只会让每次分诊都产生 diff；hooks 在无记录时按「不拦」处理，新建克隆不会因为没有它而卡死）

**回测证据**：拿 11 条真实历史输入验证，初版曾 **11/11 全部判 SPEC_REQUIRED**（连「干」都要求立规格），
修正后为 5 SPEC / 1 DIRECT / 5 非需求。相关用例已固化为 `test/unit/agent-route.test.ts`。

### 3.2 L1/L2：统一的守卫脚本（**exit 2 协议**）

`.agents/hooks/spec-gate.sh` —— **一份脚本，多家通用**。只用 `stdin JSON + exit 2 + stderr`：

- Command Code 文档：PreToolUse `exit 2` → 工具被跳过；
- Hermes 源码注释：`Exit code 2 blocks a pre_tool_call even without JSON (Claude-Code / Cursor)`。

载荷差异（**实测**，不是猜）：

| CLI | 文件路径字段 |
|---|---|
| cmd | `tool_input.file_path` |
| Claude Code | `tool_input.file_path` |
| Hermes | **`args.path`** |

脚本对三种都认 —— 只认一种就会在其中一家**静默失效**。

判定与 `.githooks/pre-commit` **同源**：写受保护路径（`packages/` · `prisma/` · `src/app/api/`）
且上一条分诊为 `SPEC_REQUIRED` 且尚无更新规格包 → 拦截。

### 3.3 已接入

- **cmd**：`.commandcode/settings.json`
  - `SessionStart` → `.commandcode/hooks/route-contract.sh`（把契约注入会话第一轮）
  - `PreToolUse(write|edit)` → `.agents/hooks/spec-gate.sh`
- **git（所有 CLI）**：`.githooks/pre-commit` + `git config core.hooksPath .githooks`
- **入口机检**：`npm run specs:health` 里「入口必须出现 `agent:route`」是 **error** 级

---

## 4. 尚未接入：Hermes（需要你自己加一次配置）

Hermes 的 hooks 配置在**用户级** `~/.hermes/config.yaml`（不在本仓），所以这里只给片段，不擅自改你的全局配置。

```yaml
hooks:
  pre_tool_call:
    - command: "/绝对路径/cooliebase-all/.agents/hooks/spec-gate.sh"
      matcher: "write_file|edit_file"
      timeout: 10
      fail_closed: true      # 规范写法；Cursor/Claude 兼容写法是 failClosed
```

注意（源码实证）：

1. **首次使用需要 allowlist**：`--accept-hooks`、`HERMES_ACCEPT_HOOKS=1` 或配置 `hooks_auto_accept: true`，
   否则 hook 会被跳过并打一条 warning；
2. `matcher` **只对** `pre_tool_call` / `post_tool_call` 生效；
3. `fail_closed` **只对**可阻塞事件生效；
4. 改完用 `hermes hooks list` 与 `hermes hooks test pre_tool_call --for-tool write_file` 验证。

---

## 5. 尚未接入：Claude Code

`CLAUDE.md` 已经带「第一步：需求分诊」，文本层已覆盖。
若要在 Claude Code 上也做到**引擎级**拦截，需要 `.claude/settings.json` 的 hooks。
**其 schema 我没有取到实证，故未写** —— 拿它官方文档来就能补（预期同样是 `PreToolUse` + `exit 2`）。

---

## 6. 怎么验证整套机制是活的

```bash
# ① 分诊器本身（含 7 条回测回归用例）
npx vitest run test/unit/agent-route.test.ts

# ② 守卫脚本（三种载荷 + 逃生阀 + 无记录）
npx vitest run test/unit/spec-gate-hook.test.ts

# ③ 入口一致性（6 个入口文件都必须出现 agent:route）
npm run specs:health

# ④ 真实拦截（会写一个探针并还原）
mkdir -p packages/__probe__ && echo x > packages/__probe__/p.ts
git add packages/__probe__/p.ts && bash .githooks/pre-commit   # 应 exit 1 并给出提示
git rm -q --cached packages/__probe__/p.ts && rm -rf packages/__probe__
```

---

## 7. 已知边界（不要假装它们不存在）

1. **模型可以不跑 L0** —— 所以才有 L1/L2；而 L1 是单家 CLI 的、L2 只覆盖到提交时。
2. **L2 是"提交时"拦截**，不是"写文件时"；工作区里仍可能先出现不合规改动。
3. **agy 未验证**；Claude Code 的 hooks 未接入。
4. **误判代价不对称**：漏判 → 该立规格的没立（返工）；误判 → 小改被拖住（烦）。
   当前用"宁严勿宽"，若觉得太吵，改规则表而不是绕过它。
