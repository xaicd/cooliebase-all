---
name: devops
description: 容器化编排、Traefik 网关、SSL 证书自动签发轮换、平滑发布。融合云原生 CNCF 与 Docker 顶级标准。
---

# DevOps 运维部署与发布规范 (融合 CNCF 云原生标准)

## 1. 适用场景
- Docker Multi-Stage 极小化镜像构建。
- Traefik 边缘路由、Let's Encrypt SSL 证书自动签发与全自动轮换。
- 生产环境健康检查探针、平滑滚动发布与版本回滚。

## 2. 权威依据与吸收来源
- `AGENTS.md` §9, §10
- **Docker Multi-Stage Build**：多阶段构建极小化生产镜像（剥离 devDependencies，体积缩减 70%）
- **Traefik Proxy 3.x**：基于 Docker Label 的全自动服务发现与 ACME TLS 自动化
- **Kubernetes Pod Lifecycle Standards**：Startup / Liveness / Readiness 三探针体系

## 3. 多阶段构建极小化 Dockerfile 范式
```dockerfile
# 1. 依赖安装阶段
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 2. 源码构建阶段
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 3. 生产极小化运行阶段 (仅包含 Standalone 产物)
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3100
CMD ["node", "server.js"]
```

## 4. 容器健康检查三探针 SOP
1. **启动探针（Startup Probe）**：验证应用冷启动完成（端口监听就绪）。
2. **存活探针（Liveness Probe）**：定时请求 `GET /api/v1/open/health`，连续 3 次失败则自动重启容器。
3. **就绪探针（Readiness Probe）**：验证数据库与 Redis 连接池正常，就绪后才接入外部流量。

## 5. Traefik 生产级域名与 SSL 自动续期
- 配置文件中开启 ACME TLS Challenge，Let's Encrypt 证书在到期前 30 天由 Traefik 后台无感自动续签。
- 全站强制启用 **HSTS（HTTP Strict Transport Security）** 与 **TLS 1.3** 加密套件。

## 6. 绝对禁止项
- 严禁生产镜像以 `root` 超级用户权限运行主进程（必须使用 `USER node`）。
- 严禁把数据库密码或私钥打入 Docker 镜像层（必须通过环境变量或 Secret 挂载）。
- 严禁更新服务时直接 `down` 导致服务完全中断（必须使用滚动更新 `--no-deps -d app`）。

---

## 数据库只读工具（DBX MCP）—— 给 SRE / 运营数字员工

**场景**：排障时要查表结构、查流水、跑只读诊断 SQL。不要让 agent 靠人截图或贴结果 ——
那既慢又不可审计。

**接法与本仓约束**：见 `docs/guides/dbx-mcp-integration.md`。要点：

| 项 | 值 |
|---|---|
| 服务端 | `brew install t8y2/tap/dbx-mcp`（或官方安装器 / npm） |
| 接入 | 把 `deploy/dsh/mcp-dbx.patch.yml` 合并进 `$DSH_HOME/profiles/<profile>/cordis.patch.yml` |
| **硬约束** | 配置里**必须**有 `DBX_MCP_ALLOW_WRITES=0` —— 它会强制只读，并**覆盖** DBX 界面里已保存的写权限 |
| 门禁 | `pnpm run dbx:readonly:check`（注释里提到不算数，会先剥注释再判） |

**三条边界，别越界**：

1. **前置条件在 GUI 里** —— `dbx-mcp` 读的是 DBX 里**已保存的连接**；没有连接，工具列表是空的。
   "装个二进制"≠"能查库"。
2. **只读是下限，不是全部** —— 数据库账号仍应用最小权限（DBX 官方也这么说）。
3. **不能替代 `ephemeral-pg`** —— 我们的门禁需要**可编程的库实例**，DBX 是客户端。
