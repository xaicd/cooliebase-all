# 架构百科：第一方插件体系与模块化单体

> 对应规则：AGENTS.md §3.2 / §3.2.1 / §6.2

## 一、 为什么将业务域迁移为第一方插件？
1. **防止单体无限膨胀**：传统单体在 src 下堆放所有业务，耦合严重、无法独立拆分交付；
2. **域级自治**：每个业务域以插件形式存在（`packages/plugins/plugin-<domain>/`），拥有独立的 `plugin.manifest.json`、路由前缀、数据表迁移和 Agent 契约；
3. **双模运行**：
   - **单体形态 (Merged)**：同进程直调，零网络损耗；
   - **隔离形态 (Isolated)**：独立 Worker 进程或独立微服务部署，通过 RPC 转发。

## 二、 物理目录布局
```
packages/
├── domains/                  # 平台地基 (永不插件化: system, infra)
│   ├── system/
│   └── infra/
└── plugins/                  # 18 个第一方插件域 (含 oa/hrm/fms/pms/online)
    ├── plugin-wms/
    ├── plugin-mall/
    └── ...
```
