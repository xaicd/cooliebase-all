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
