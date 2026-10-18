# 上游架构参考：yudao-cloud 与 yudao-mall-uniapp

本文记录从两个上游仓库学到的**架构范式**，并逐条映射到本仓的**具体差距**。
不搬代码 —— 本仓是 TypeScript / Next.js，上游是 Java 与 uni-app；学的是**分层与契约的组织方式**。

- `https://gitee.com/zhijiantianya/yudao-cloud.git` —— RPC / 微服务 / 网关
- `https://gitee.com/yudaocode/yudao-mall-uniapp.git` —— C 端（对应本仓 `clients/expo`）

---

## 一、yudao-cloud：RPC 与契约

### 1.1 它用什么做 RPC

**Spring Cloud OpenFeign**（+ `spring-cloud-starter-loadbalancer` + `feign-okhttp`），
即**声明式 HTTP 接口**，不是自研协议。

> 与本仓的关系：本仓按 AGENTS §3.3 **有意不同** —— 自研 NATS request-reply + JSON
> （`COOLIEBASE_RPC_PROTOCOL=grpc` 时走自研 gRPC unary），并明确不采用 Dubbo/Thrift。
> 所以这里**不学协议**，只学**契约的组织方式**。

### 1.2 契约是**代码**，放在提供方的 `-api` 模块

```java
@FeignClient(name = ApiConstants.NAME)          // NAME = "system-server"
public interface NotifyMessageSendApi {
    String PREFIX = ApiConstants.PREFIX + "/notify/send";   // "/rpc-api/system/notify/send"
    @PostMapping(PREFIX + "/send-single-admin")
    CommonResult<Long> sendSingleMessageToAdmin(@Valid @RequestBody NotifySendSingleToUserReqDTO reqDTO);
}
```

四个要点：

| 要点 | 说明 |
|---|---|
| **契约是编译期可检查的代码** | 接口方法 + DTO 类型，改错了编译不过 |
| **放在提供方的 `-api` 模块** | 消费方只依赖这个**薄契约模块**，不碰实现 —— 正是 AGENTS §3.3 的意图 |
| **服务名与路径前缀是常量** | `ApiConstants.NAME` / `PREFIX`，路径由常量派生，不散落字符串 |
| **调用点像本地方法** | 消费方注入接口即可，传输细节被代理吸收 |

### 1.3 本仓的对应物与差距

| 上游 | 本仓对应 | 差距 |
|---|---|---|
| `-api` 模块（接口 + DTO） | `contract/`（`actions.ts` schema + `<域>.facade.ts`） | ✅ 有 |
| `@FeignClient` 接口 | facade 的方法名数组 | ⚠️ **字符串数组**，payload 无类型约束 |
| 服务名/前缀常量 | `rpc-actions.json` 的域 + `subjectPrefix` | ✅ 有 |
| 编译期检查 | `rpc-actions.json` **手工维护** | ⚠️ **JSON 不是代码，改错要到运行时才炸** |

**要落地的改进（已定位，未做）**：把「提供方声明自己的 RPC 面」变成**每域一个
`rpc-contract.ts`（代码）**，再**生成** `rpc-actions.json` 与 `domain-service-loaders.ts`。
这样契约是代码、派发表是派生物 —— 与上游一致，也符合本仓「同一事实不能两处维护」。

现状（截至本次）：
- ✅ 派发链路已打通：facade → broker → `rpc-actions.json` → `DOMAIN_SERVICE_LOADERS` → 服务
- ✅ `domain-service-loaders.ts` 已改为**由 catalog 生成**（`generate-domain-service-loaders.cjs`，带 `--check` 门禁）
- ⚠️ `rpc-actions.json` 仍是手工维护 → 待改为由各域 `rpc-contract.ts` 生成
- ✅ 已删除 339 个坏的 `*.rpc.ts` 死绑定（模板调了不存在的 API，且全仓无人注册）

---

## 二、yudao-mall-uniapp：C 端（对应本仓 `clients/expo`）

### 2.1 目录组织

```
sheep/
  request/index.js     # 唯一请求封装
  api/<域>/<实体>.js   # 每实体一个文件，声明该实体的接口
  store/  platform/  hooks/  components/
pages/
  index/ goods/ order/ pay/ coupon/ activity/ chat/ commission/ user/ ...
```

### 2.2 请求层：**UI 反馈策略声明在 API 层**

```js
import request from '@/sheep/request';
const AuthUtil = {
  login: (data) => request({
    url: '/member/auth/login',
    method: 'POST',
    data,
    custom: {
      showSuccess: true,       // 成功提示
      loadingMsg: '登录中',     // 加载文案
      successMsg: '登录成功',
      // showError / showLoading / auth / isToken 均可按调用覆盖
    },
  }),
};
```

要点：
1. **一个 `request` 封装**统管 token、租户（`tenantId`）、loading、错误提示、鉴权弹窗
2. **每实体一个 api 文件**，只声明 url/method/data + **该调用的 UI 反馈策略**
3. 组件不关心 loading/提示 —— 策略在 api 层声明，**不在组件里散落**
4. `auth: true` 表示"需登录"，未登录时由封装统一弹授权框，而不是各处判断

### 2.3 本仓 `clients/expo` 的差距

实测：`clients/expo` 目前**只有 3 个 TS 文件**（`src/shared/api.ts` 等），几乎是空壳。

**要落地的改进（已定位，未做）**：
1. 建立 `clients/expo/src/api/<域>/<实体>.ts`，每实体一个文件
2. 建立唯一的 `request` 封装：注入 token / 租户 / 终端的平台标识
3. **UI 反馈策略在 api 层声明**（loading 文案、成功提示、是否需登录），组件不重复写
4. 与 Web 端共用契约：C 端打的接口应与 `agent` 契约里的 `api.methods` 一致
   （`<插件根>/agent/<kebab>.agent.json`），避免两套口径

---

## 三、跨端一致的接口口径（本仓已有的抓手）

本仓的 **Agent 操作契约**（`<插件根>/agent/<kebab>.agent.json`）已经声明了每个实体的
接口面（`api.pluginMount` / `api.methods.*`）与页面元素（`selectors` / `agentNative`）。

**它应当成为 Web、C 端、自动化测试、运营脚本的共用口径** —— 任一端的接口路径若与契约不符，
就是漂移。上游没有这一层，是本仓可以做得更好的地方。

---

## 四、学习结论（按可落地性排序）

| # | 学到的 | 本仓的落地动作 | 状态 |
|---|---|---|---|
| 1 | 契约是代码、派发表是派生物 | 每域 `rpc-contract.ts` → 生成 `rpc-actions.json` | 待做 |
| 2 | 契约放提供方的薄模块、消费方只依赖它 | 已有 `contract/` + facade；补 payload 类型约束 | 部分 |
| 3 | UI 反馈策略声明在 API 层 | `clients/expo` 建 `request` + 每实体 api 文件 | 待做 |
| 4 | 服务名/前缀用常量，不散落字符串 | 已有 `rpc-actions.json` 的域与前缀 | ✅ |
| 5 | 跨端共用一份接口口径 | 以 Agent 契约为准（上游无此层） | 部分 |

---

## 五、参考但不搬运的部分

- **协议**：上游用 Feign/HTTP；本仓按 §3.3 用自研 NATS/gRPC，**不改**
- **服务发现/注册中心**：上游用 Nacos 系；本仓当前是 catalog + 静态 loader，**不改**
- **uni-app 技术栈**：本仓 C 端是 `clients/expo`，**只学组织方式，不搬框架**

---

## 六、第二次深入：`protection` 与框架能力全景

### 6.1 yudao-cloud 的框架能力清单（starter 维度）

`common` / `biz-data-permission` / `biz-ip` / `biz-tenant` / `env` / `excel` / `job` /
`monitor` / `mq` / `mybatis` / **`protection`** / `redis` / `rpc` / `security` / `test` /
`web` / `websocket`

对照本仓:

| 上游 starter | 本仓对应 | 状态 |
|---|---|---|
| mybatis | `dynamic-table` / `base-mapper` | ✅ |
| rpc | `rpc-facade` / `service-bus` | ✅ |
| biz-tenant | `lib/biz-tenant` | ✅ |
| mq | `broker` / `serviceBus` / outbox | ✅ |
| job / monitor | infra 的 job、api-logs | ✅ |
| security | `lib` 鉴权 | ✅ |
| test | `TestingKit` | ✅ |
| **protection** | 原语有、**声明式入口缺** | ⚠️ 本轮补 |
| websocket / excel / env / redis | —— | 未评估 |

### 6.2 `protection` 的范式：**三件防护做成注解**

| 注解 | 作用 | key 解析可插拔 |
|---|---|---|
| `@RateLimiter` | 限流 | 默认/用户/IP/服务节点/SpEL 表达式 |
| `@Idempotent` | 防重复提交 | —— |
| `@ApiSignature` | 接口签名（防篡改/防重放） | —— |

**最值得学的一点不是这三件防护本身，而是它们"挂在方法上"** ——
哪些接口有防护在路由表上一眼可见，也不会有人漏写。

### 6.3 本仓的差距与落地

本仓 `rateLimiter` / `protection-idempotent` / `protection-signature` **原语早就有**，
但只有**命令式**入口（要在每个 handler 里手动调）—— 结果是很少被用上。

本轮补上声明式入口: `withAdminRoute(request, { rateLimit, idempotent })`，
**默认关闭**（这个包装器服务于所有 admin 路由，不能有隐式行为变化）。

途中抓到一个"看起来能用其实没用"的实现错误: 防护助手收了规则却**没传给限流器**
（它仍用内置 DEFAULT_RULES），规则被静默忽略、防护等于空转 —— 被测试当场抓到。
已给限流器加 `check(ctx, rules)` 入口（默认内置规则，向后兼容）。

**仍待做**: `withAppRoute` 同样接入；`signature` 尚未做成声明式选项。
