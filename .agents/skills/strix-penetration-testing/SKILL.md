---
name: strix-penetration-testing
description: 运行多智能体自主红队渗透测试与漏洞修补（对标 60k 星 usestrix/strix 标准）。接到“红队渗透 / 安全渗透演练 / 自动化渗透测试 / 验证安全 PoC / strix 扫描”时启用。
---

# Strix 自主红队渗透测试与漏洞修补规范

遵循开源顶流 `usestrix/strix` (60,000+ Stars, Apache-2.0) 工业级多智能体安全渗透测试标准。传统的静态代码扫描（SAST）往往产生海量误报（False Positives），而 Strix 扮演真实世界的“AI 白帽黑客”：在隔离沙箱环境中自主探测系统攻击面、制定攻击链、**必须生成可真实利用生效的漏洞证明（PoC - Proof of Concept）验证漏洞真实性（0 误报）**，并自动生成代码修复建议与回归测试验证，构筑 SpaceX 级别的生产发布防御纵深。

---

## 1. 何时启用

- **生产发布与重大版本交付前 (G5 门禁验收)**：在系统正式投产前进行全站模拟黑客攻击军演。
- **开放接口与跨域 RPC 暴露面变更**：新增 `/api/v1/open/**` 开放接口或修改 JWT / RBAC 鉴权拦截器。
- **高危业务上线前**：资金流转、支付结算、优惠券秒杀、多租户行级隔离升级。
- **合规审计与客户安全验收**：提供具备真实执行 PoC 证据的工业级渗透测试报告。

---

## 2. Strix 多智能体渗透协同架构

```mermaid
flowchart TD
    subgraph Strix_Sandbox ["Strix 独立沙箱容器 (ghcr.io/usestrix/strix-sandbox)"]
        Recon["1. Recon Agent (攻击面发现与 API 爬取)"]
        Planner["2. Strategy Planner (攻击路径规划与链条组装)"]
        Exploit["3. Exploit Agent (真实攻击注入与 PoC 验证)"]
        Reporter["4. Patch & Audit Agent (生成修复 PR 与审计报告)"]
    end
    Target["本地靶机 / 测试环境 (http://localhost:3200)"]
    
    Recon --> Target
    Recon --> Planner
    Planner --> Exploit
    Exploit -->|注入攻击 Payload| Target
    Target -->|返回响应/状态| Exploit
    Exploit -->|验证真实被打穿 (PoC Validated)| Reporter
    Reporter --> Report["渗透测试报告 + 漏洞修复建议"]
```

### 四大核心渗透阶段
1. **Reconnaissance (侦察与资产测绘)**：自动探测端点路由、Swagger/OpenAPI 契约、未授权暴露接口及敏感静态资源。
2. **Strategy Planning (攻击策略规划)**：根据应用技术栈（Next.js / Node / PostgreSQL / SQLite / JWT），组合定向攻击剧本（如租户提权、CAS 并发竞争、SQL 盲注、JWT None 算法绕过）。
3. **Exploitation & PoC Verification (实战攻击与 PoC 确证)**：向靶机发起攻击，只有在靶机返回了越权数据、发生了数据脏写或抛出崩溃堆栈时，才断定漏洞成立（杜绝纸面虚警）。
4. **Remediation & Patching (漏洞修补与回归)**：生成修复补丁（如补全 `tenant_id` 过滤、补充 CAS 乐观锁版本检查、强化输入 Zod Validator）。

---

## 3. 针对 cooliebase-all-base 核心工程底座的 4 大防御靶标

Strix 在对本系统进行红队演练时，重点检验以下 4 项不可动摇的工程铁律：

| 攻击类型 | 模拟黑客手段 | 本工程防御底座要求 | 必须阻断判据 |
|---|---|---|---|
| **1. 跨租户越权穿透 (Tenant Isolation)** | 登录租户 A 账号，篡改请求参数中的 `tenant_id` 或实体 ID，尝试读取/修改租户 B 的订单或敏感配置 | 必须依托 `withAdminRoute` 上下文及 Kysely AST 自动绑定，忽略外部传入的任意伪造租户标识 | Strix 无法获取非自身租户的数据，越权请求返回 HTTP 403 或 404 |
| **2. RBAC 权限码旁路 (Privilege Escalation)** | 伪造 Authorization Bearer Header 或调用未显式鉴权的内部 RPC 端点 | 边缘网关 Traefik 与 BFF 必须执行白名单机制；非公开接口强制核验 `permission code` | 伪造 Token 或无权限调用必报 401/403，严禁薄路由透传 |
| **3. CAS 并发超卖竞争 (Race Condition)** | 模拟 50~100 线程并发请求秒杀扣库存接口，利用时间窗口尝试超卖 | 底层仓储必须基于数据库原子 CAS (`WHERE version = ?`) 或事务行锁，禁止内存检查后更新 | 无论并发多高，库存扣减后剩余数量严格 $\ge 0$，无脏数据 |
| **4. 敏感堆栈信息泄露 (Information Disclosure)** | 构造恶意畸形 JSON/SQL 注入/类型溢出载荷，诱发系统 500 崩溃 | 统一全局错误处理器（ErrorHandler），生产模式下严禁将内部 SQL、DB 账号或异常调用栈回显 | 响应体必须为标准脱敏 JSON（仅含业务错误码和通用 Message），无任何 Stack Trace |

---

## 4. 执行与接入方式

遵循容器环境与宿主机穿透准则（Rule 2.1）：**严禁将 Strix 庞大的外部 Python 代码拷入代码库**，应作为外部工具通过 Docker 或 CLI 调度：

```bash
# 方式 1: 穿透至 Mac 宿主机通过 Docker 沙箱对本地测试服务发起自主红队渗透测试
host-exec "docker run --rm \
  -v $(pwd)/docs/08_sre/security-reports:/reports \
  ghcr.io/usestrix/strix-sandbox:latest \
  --target http://host.docker.internal:3200 \
  --report-dir /reports \
  --max-budget-usd 2.0"

# 方式 2: 使用 strix CLI 工具 (需 Python 3.12+ / pipx)
host-exec "strix --target http://localhost:3200 --deep"
```

---

## 5. 检查清单与门禁

- [ ] 是否在生产发版前执行了全站自动化渗透扫描？
- [ ] 报告中确认存在的高危漏洞（High / Critical）是否具备完整的 PoC 复现步骤？
- [ ] 针对已发现的漏洞，是否通过补全 Validator、CAS 锁或租户过滤器完成修复？
- [ ] 修复代码是否补充了真实数据库集成测试（`test/integration/`）防范再次退化？
- [ ] 门禁联动：结合基础渗透扫描 `npm run security:scan` 确保所有基线检查项 100% 通过。

---

## 6. 严禁事项

1. **严禁未经授权对外部生产系统扫描**：Strix 为进攻性极强的红队武器，严禁对非授权域名或第三方依赖系统发起探测。
2. **严禁在正式生产库上直接运行重度写攻击**：渗透演练必须在专用压测/演练靶机环境执行，避免对生产业务数据造成破坏性脏写。
3. **严禁忽略 PoC 报警**：任何被 Strix 验证成功的 PoC 均为确定性安全漏洞，严禁以“概率极低”为由放行上线。
