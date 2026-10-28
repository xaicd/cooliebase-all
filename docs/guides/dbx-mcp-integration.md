# DBX MCP 接入（**只读**）—— SRE / 运营数字员工的标准工具

> 本文规定：DBX 如何接进 agent（dsh），以及**为什么本仓只允许只读**。

## 1. 它解决什么问题

SRE / 运营 NPC 需要看数据库：查表结构、查流水、跑只读诊断 SQL。
没有它，agent 只能让人**截图或贴结果** —— 那既慢又不可审计。

DBX 提供 MCP 服务器（`dbx-mcp`），把 DBX 里已保存的连接暴露成工具：
`dbx_list_connections` / `dbx_list_tables` / `dbx_describe_table` /
`dbx_get_schema_context` / `dbx_execute_query` / `dbx_read_...` 等。

## 2. 与「本仓 MCP 只读零落盘」的关系（**必须先想清楚**）

本仓自己的 MCP 面（`scripts/mcp/cooliebase-mcp-server.cjs`）是**零落盘**：
只读查询 + plan/preview，**永不写盘**。这是硬约束。

DBX 的 MCP **默认能写**（`dbx_execute_query` 可以 INSERT/UPDATE/DDL）。
所以接它时有两条线，缺一不可：

| 线 | 谁负责 | 机制 |
|---|---|---|
| **配置下限**（本仓保证） | 本仓 | 我们发布的 patch 里**强制** `DBX_MCP_ALLOW_WRITES=0` |
| **人在机器上的设置** | 使用该机器的 SRE | DBX 界面 → Settings → MCP 的权限档位 |

第一条是**本仓能守住、且必须守住**的：`DBX_MCP_ALLOW_WRITES=0` 的语义是
**强制本次运行只读，并覆盖已保存的 group / connection / database 级写权限**
（官方 *Safety and Environment Variables*）。也就是说：**即使那台机器上有人把权限开到
Full access，我们这个配置仍然是只读的**。

第二条本仓**无法**保证 —— 它属于"那台机器的状态"，不是仓库约定。**不要把它当成已解决。**

## 3. 安装（服务端）

```bash
# 推荐：Homebrew（macOS/Linux，可 uninstall 撤回）
brew install t8y2/tap/dbx-mcp

# 或原生安装器（会校验签名，装到 ~/.dbx/bin）
curl -fsSL https://dbxio.com/install-mcp | sh

# 或 npm（需要 Node ≥ 18.18）
npm install -g @dbx-app/mcp-server
```

验证：

```bash
dbx-mcp --version      # 实测：dbx-mcp 0.4.134
command -v dbx-mcp     # 实测：/opt/homebrew/bin/dbx-mcp
```

> `dbx-mcp` **没有** `--help`（它是纯 stdio 服务器，参数只有 `--version` / 授权类命令）。
> 别拿 `--help` 判断它坏没坏。

## 4. 前置条件（**本仓无法自动化**）

`dbx-mcp` 读的是 **DBX 里已保存的连接**：

| 平台 | 默认连接库 |
|---|---|
| macOS | `~/Library/Application Support/com.dbx.app/dbx.db` |
| Linux | `~/.local/share/com.dbx.app/dbx.db` |

**没有 DBX 桌面端（或 DBX Web）配好的连接，MCP 的工具列表就是空的。**
"装个二进制"不等于"能查库" —— 这一步必须由人做。

## 5. 接入（本仓发布的配置）

见 `deploy/dsh/mcp-dbx.patch.yml` —— 把它**合并**进
`$DSH_HOME/profiles/<profile>/cordis.patch.yml`（顶层是 YAML 数组，用 `- insert:`）。

关键两行：

```yaml
command: dbx-mcp
env:
  DBX_MCP_ALLOW_WRITES: '0'      # ← 硬约束，删了门禁就红
```

> **坑（本项目实测）**：patch 写成 `- id: ...` 会被 dsh 当成"覆盖已有条目"，
> 报 `patch: entry "xxx" not found`。必须是 `- insert: [...]`。

## 6. 门禁

```bash
pnpm run dbx:readonly:check
```

它扫 `deploy/dsh/*.y(a)ml` 里所有 `serverName: dbx` 的条目，要求：

- **必须**有 `DBX_MCP_ALLOW_WRITES: '0'`（或 `0` / `false`）；
- 出现 `1` / `true` → 失败；
- **注释里提到不算数**（先剥注释再判 —— 第一版就栽在这：注释喂饱了正则，门禁假绿）。

它**不**检查：DBX 界面里那个人开的档位、连接范围、数据库账号自身权限。
**别把它当成完整安全边界。**

## 7. 验证（三步）

```bash
# ① 服务端在
dbx-mcp --version

# ② dsh 认到了这个 patch（composed 配置里应有 id: mcp-dbx）
dsh --profile web --dump-config | grep -A6 'mcp-dbx'

# ③ 起 dsh 后，真正能看到 dbx 工具（名字形如 mcp__dbx__<tool>）
#    没看到 = 没通，不要当成通了
pnpm harness agent status
```

## 8. 已知边界（老实写在这）

1. **连接配置在 GUI 里**：仓库只能保证"用哪份配置"，保证不了"DBX 里存了哪些连接"。
2. **只读是第一道闸，不是唯一**：数据库账号仍应使用最小权限（DBX 官方也这么说）。
3. **不用于 CI**：我们的门禁需要"可编程的库实例"（`ephemeral-pg`），DBX 是客户端，替代不了。
4. **本仓尚未在 dsh 里实测过工具可见性**：二进制与配置都就位了，但
   「起 dsh 后 `mcp__dbx__*` 是否出现」**没有验证**（本机 DBX 无连接，工具列表会是空的）。
   要真验，需要先有人在 DBX 里加至少一个连接。
