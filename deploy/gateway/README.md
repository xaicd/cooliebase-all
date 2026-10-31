# deploy/gateway —— 四态网关挂载片段（层B 交付标准资产）

客户现场网关形态各异，本目录预置四套**即插即用**片段，交付时随源码一并移交：

| 目录 | 适用 | 关键防坑 |
|---|---|---|
| `caddy/` | 平台默认自测 / 现代微服务 | 未命中 API → 404 JSON，禁止 SPA 兜底伪 200 |
| `nginx/` | 经典政企 / 传统物理机 | `error_page 404` 返回 JSON；静态分支才 `try_files` |
| `apisix/` | 云原生 / 金融中台 | `proxy-rewrite` 去前缀 + 主动健康探针 |
| `kong/` | 跨集群多租户 | `strip_path: true` + correlation-id / rate-limiting |

占位符：`${slug}`（项目英文简称）· `${PORT}`（后端端口）· `${DIST_DIR}`（前端产物目录）
铁律：网关只做**微路由挂载**，绝不各自起独立网关守护进程（层A 公用网关统一承载）。
