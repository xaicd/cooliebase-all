# @cooliebase/mcp-server

Model Context Protocol (MCP) stdio server for **cooliebase-all** enterprise fullstack framework and DigitalStaff NPC.

## 🚀 集成方式 (Integration)

在 Cursor、Windsurf、Claude Desktop 或 Cline 的配置文件中添加：

```json
{
  "mcpServers": {
    "cooliebase": {
      "command": "pnpm",
      "args": ["dlx", "@cooliebase/mcp-server"]
    }
  }
}
```

## 🛠️ 内置工具 (Exposed Tools)
- `cooliebase_domain_list`: 17 原生业务域编目与能力路由查询；
- `cooliebase_domain_seam`: 领域契约切面与 Facade 挂载点；
- `cooliebase_action_lookup`: RPC 方法名与 Zod Schema 检索；
- `cooliebase_skills_list`: 26 个专业 Agent Skills 技能清单；
- `cooliebase_standards_report`: 工程代码规范与质量门禁审计；
- `cooliebase_gate_run`: 运行指定的只读仓库治理门禁；
- `cooliebase_compat_info`: 兼容性版本与单体/微服务双模状态。

## 许可证
MIT License
