# 生产环境安装部署与割接操作手册 (System Deployment SOP)

- **版本基准**: v1.1.0 Enterprise Baseline
- **生效日期**: 2026-10-09
- **归属规范**: CMMI 07_release (TRANS - 部署与交付)

---

## 1. 部署架构概览

```mermaid
flowchart TD
    Client["客户端 (浏览器 / Expo 移动端)"] --> Gateway["Traefik 边缘反向代理 (端口 80 / 443 / SSL)"]
    Gateway --> BFF["Next.js BFF 服务集群 (端口 3200)"]
    BFF --> Plugins["第一方业务插件 (15个)"]
    BFF --> Platform["平台地基 (system / infra)"]
    Plugins & Platform --> DB[(持久化存储: SQLite WAL / Postgres / MySQL)]
    Plugins & Platform --> NATS["自研 NATS 消息总线与 Outbox"]
```

---

## 2. 部署前置条件核验 (Pre-flight Checklist)

1. **操作系统**: Linux (Ubuntu 22.04 LTS / Debian 12 / Alpine 3.19) 或 macOS (darwin-arm64)；
2. **运行时环境**: Node.js $\ge 20.18.0$ (推荐 22.x LTS)；
3. **包管理器**: pnpm $\ge 9.x / 10.x$（锁文件强依赖 `pnpm-lock.yaml`）；
4. **环境变量注入**:
   ```bash
   NODE_ENV=production
   PORT=3200
   DB_DRIVER=postgresql
   # **必须是真实 PostgreSQL**：Prisma 的 provider 固定 postgresql，15 个业务域（ai/aigw/bpm/
   # crm/erp/im/iot/mall/member/mes/mp/pay/report/wms/online）全部走 Prisma。
   # `DATABASE_URL=file:*.db`(SQLite) 或 `DB_DRIVER=memory` 只能跑 system/infra 两个域，
   # 且 production 下 memory 会被 `datasource-manager` 直接拒绝。
   DATABASE_URL="postgresql://<user>:<password>@<pg-host>:5432/<db>?schema=public"
   # Redis（缓存/限流/会话）；生产 compose 会注入带密码的 REDIS_URL
   REDIS_URL="redis://:<password>@<redis-host>:6379"
   JWT_SECRET="<生产随机强密钥-至少32位>"
   COOLIEBASE_RPC_TOKEN="<内部RPC通信鉴权令牌>"
   TENANT_PLATFORM_USERNAMES="admin,platform_root"
   ```

   > **测试路径 ≠ 真运行路径（重要）**：`DB_DRIVER=memory`、`DATABASE_URL=file:*.db`（SQLite）
   > 与 `pnpm run db:embedded`（嵌入式 Postgres）都**只用于开发与验证**。
   > 真实部署必须接入**真实 PostgreSQL + Redis**（`deploy/docker-compose.prod.yml`，或客户自管的
   > 托管实例）。该 compose 里 `DATABASE_URL` 是 `${DATABASE_URL:?…}` 硬性必填，缺了就起不来。

---

## 3. 标准 6 步零停机割接流水线 (Deployment Pipeline)

### Step 1: 获取制品与锁定依赖
```bash
# 1. 克隆代码并检出已发布 Release Tag
git checkout v1.1.0

# 2. 冻结锁文件安装生产依赖 (严禁联网升级)
pnpm install --frozen-lockfile --prod=false
```

### Step 2: 质量门禁与指纹验证
```bash
# 验证代码基线完整度与数字指纹
npm run check
npm run fingerprint:verify
```

### Step 3: 生产产物编译
```bash
# 编译 Next.js 生产产物
pnpm run build
```

### Step 4: 数据库结构原子迁移
```bash
# 执行数据库幂等迁移
pnpm exec prisma migrate deploy
```

### Step 5: 第一方插件路由声明同步与静态注册
```bash
# 1. 让 plugin.manifest.json 的 apiRoutes 与真实路由文件一致
#    （它是脚手架时生成的一次性产物，新增路由不会自动回填 —— 不同步会让新接口 404/500）
pnpm run plugins:sync-routes

# 2. 注册 15 个业务域插件清单（运行期只读数据库里的 manifest_json）
pnpm run plugins:register
```

### Step 6: 启动服务与存活/就绪探针核验
```bash
# 启动生产服务
pnpm run start

# 存活探针（liveness）—— 进程活着即 200
curl -f http://localhost:3200/healthz || exit 1
# 就绪探针（readiness）—— 依赖（DB 等）可用才 200；生产 compose/Traefik 用的就是它
curl -f http://localhost:3200/readyz || exit 1
```

---

## 4. 异常回滚触发条件

若出现以下任一情况，立即停止割接并执行 `docs/07_release/rollback-runbook.json`：
1. `npm run check` 门禁退出码非 0；
2. 健康检查接口持续 3 次探针失败（HTTP 500 / 超时）；
3. 数据库迁移抛出不可恢复的语法异常。
