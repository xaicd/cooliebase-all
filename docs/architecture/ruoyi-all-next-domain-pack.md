# 域独立打包、运行与部署

更新时间：2026-08-20

## 1. 目标

同一套代码支持两种运行时：

1. **all-in-one**：一个进程打进全部域，Facade 走 SDK 内存调用
2. **split**：按域拆出独立进程，浏览器 HTTP 路径不变，跨域 Facade 走 RPC

页面始终由 BFF 提供。拆出的域进程只承接该域 `/api/v1/**/<domain>` 以及内部 `POST /api/internal/rpc`。

## 2. 当前边界

已支持：

1. 一体：`npm run dev` / `npm run build` / `npm run runtime:all`
2. 按域生成 API-only 打包目录 `dist/domain-packs/<domain>`
3. 按域独立 `next dev` / `next build` / Docker 镜像
4. BFF 通过 `COOLIEBASE_DOMAIN_<DOMAIN>_UPSTREAM` 把该域 API 反代到独立进程
5. 跨域 Facade：一体 SDK；拆分后 `POST {upstream}/api/internal/rpc`
6. Compose profile 按域启停，参考域为 `pay`

尚未支持（仍属阶段 C）：

1. 按域独立数据库或独立 schema 所有权
2. 跨库拆分后的远程 outbox
3. Go upstream 与 canary 流量切分

## 3. 命令

```bash
# 一体：一个进程
npm run dev
npm run build && npm run start
npm run runtime:all
npm run domain:pack -- --all

# 拆分：BFF + pay（HTTP 反代 + Facade RPC）
npm run domain:list
npm run domain:pack -- pay --materialize
npm run domain:dev -- pay
COOLIEBASE_DOMAIN_PAY_UPSTREAM=http://127.0.0.1:3214 npm run dev
npm run runtime:split
npm run domain:up -- pay
```

## 4. 切流约定

1. 不设 `COOLIEBASE_PACK_DOMAIN`、也不设任何 `COOLIEBASE_DOMAIN_*_UPSTREAM` → 一体，全部 Facade 为 SDK。
2. BFF 设置 `COOLIEBASE_DOMAIN_PAY_UPSTREAM` 后：浏览器 `/api/v1/**/pay` 反代到 pay 进程；`payFacade.*` 走 RPC。
3. 域进程必须设置 `COOLIEBASE_PACK_DOMAIN=<domain>`，只本地执行本域 action。
4. 域进程回呼其它仍在 BFF 的域时，设置 `COOLIEBASE_RPC_GATEWAY=http://<bff>`。
5. 生产跨进程 RPC 必须设置 `COOLIEBASE_RPC_TOKEN`；浏览器契约不变。
6. RPC 契约仍由 `npm run domain:contracts` 生成，禁止手改。

## 5. 镜像

```bash
# 一体
docker build -t cooliebase-all-base .

# 拆出 pay
docker build -f Dockerfile.domain --build-arg COOLIEBASE_PACK_DOMAIN=pay -t cooliebase-domain-pay .
```

健康检查走匿名 `/healthz` 与 `/readyz`。liveness 会声明 `runtime=monolith|domain`。
