# cooliebase-all-base 部署指南

## 环境说明

| 环境 | 文件 | 数据库 | 用途 |
|---|---|---|---|
| **local** | docker-compose.local.yml | 内存 | 快速验证，零依赖 |
| **dev** | docker-compose.dev.yml | PostgreSQL | 团队开发联调 |
| **test** | docker-compose.test.yml | MySQL（运行时兼容验证；Prisma 迁移需先提供独立 MySQL schema） | QA 兼容性验证 |
| **prod** | docker-compose.prod.yml | PostgreSQL + Nginx | 生产部署 |
| **domains** | docker-compose.domains.yml | PostgreSQL | BFF + 可选域独立进程 |

### 域独立部署

页面仍走 BFF（`:3100`）。某个域设置 `COOLIEBASE_DOMAIN_<NAME>_UPSTREAM` 后，对应 `/api/v1/**/<domain>` 由该域独立镜像承接。

```bash
# 查看可打包域
npm run domain:list

# 本地拆出 pay：BFF 3100 + pay 3214
npm run domain:dev -- pay
COOLIEBASE_DOMAIN_PAY_UPSTREAM=http://127.0.0.1:3214 npm run dev

# Compose 拆出 pay
npm run domain:up -- pay
```

详细约定见 `docs/architecture/cooliebase-all-base-domain-pack.md`。

## 快速启动

### Local（零配置）

```bash
docker compose -f deploy/docker-compose.local.yml up --build
# 访问 http://localhost:3100
```

### Dev（PostgreSQL）

```bash
# 仅启动默认 PostgreSQL：
npm run db:up
# 或启动完整开发联调环境：
docker compose -f deploy/docker-compose.dev.yml up -d
# 在宿主机执行版本化迁移：
npm run db:generate
npm run db:migrate
```

### Test（MySQL）

```bash
docker compose -f deploy/docker-compose.test.yml up -d
```

### Prod（生产）

```bash
# 1. 配置环境变量
cp deploy/.env.prod.example deploy/.env.prod

# 2. 编辑 .env.prod 修改密码和密钥

# 3. 启动
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d

# 4. 在宿主机执行一次版本化迁移（容器运行镜像不携带 Prisma CLI）
npm run db:generate
npm run db:migrate
```

## 常用运维命令

```bash
# 查看日志
docker compose -f deploy/docker-compose.prod.yml logs -f app

# 重启应用（不重启数据库）
docker compose -f deploy/docker-compose.prod.yml restart app

# 扩容到 3 副本
docker compose -f deploy/docker-compose.prod.yml up -d --scale app=3

# 数据库备份
docker compose -f deploy/docker-compose.prod.yml exec postgres pg_dump -U cooliebase cooliebase_next > backup.sql

# 进入应用容器
docker compose -f deploy/docker-compose.prod.yml exec app sh
```

## 目录结构

```
deploy/
├── docker-compose.local.yml    # 本地环境（内存模式）
├── docker-compose.dev.yml      # 开发环境（PostgreSQL）
├── docker-compose.test.yml     # 测试环境（MySQL）
├── docker-compose.domains.yml  # BFF + 可选域独立进程
├── docker-compose.prod.yml     # 生产环境（Traefik + PG + Redis）
├── .env.prod.example           # 生产环境变量模板
└── README.md                   # 本文件
```

## 数据库切换

项目支持多种数据库，切换只需修改环境变量：

```bash
# PostgreSQL
DB_DRIVER=postgresql
DATABASE_URL=postgresql://user:pass@host:5432/db

# MySQL
DB_DRIVER=mysql
DATABASE_URL=mysql://user:pass@host:3306/db

# TiDB（MySQL 兼容）
DB_DRIVER=tidb
DATABASE_URL=mysql://user:pass@tidb-host:4000/db

# OceanBase（MySQL 兼容）
DB_DRIVER=oceanbase
DATABASE_URL=mysql://user:pass@ob-host:2883/db

# openGauss（PostgreSQL 兼容）
DB_DRIVER=opengauss
DATABASE_URL=postgresql://user:pass@opengauss-host:5432/db
```
