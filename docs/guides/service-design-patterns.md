# cooliebase-all-base Service 设计模式规范

更新时间：2026-08-03

本规范用于约束 all-next 的 Service 层实现方式，目标是让业务逻辑可扩展、可测试、可审计。

## 1. 适用范围

1. 适用于 apps/cooliebase/cooliebase-all-base 下所有 Service 实现。
2. 包含 packages/domains/<domain>/backend/services/** 与兼容门面 src/backend/services/**。
3. Route、Page、Validator 不直接承载本规范中的模式职责。

## 2. Service 层职责边界

1. 负责业务编排、事务边界、状态迁移、领域规则落地。
2. 负责关键日志 event 与审计日志 audit 输出。
3. 负责跨服务调用的超时、重试、幂等策略。
4. 不负责 HTTP 细节（状态码、Request/Response 组装）。

## 3. 必选模式与使用场景

### 3.1 Facade（门面模式，必选）

1. 每个域暴露一个稳定门面入口（如 DomainService 或 `createDomainFacade(domain, methods)`）。
2. 门面对外保持清晰方法名，对内可拆分子服务。
3. 跨域只依赖 Facade：同进程走 SDK 内存调用，跨服务走 RPC。禁止直接 import 其他域 Service / Repository。
4. 兼容层 re-export 只允许转发门面，不允许新增业务。

### 3.2 Strategy（策略模式，推荐）

1. 当同一业务有多算法路径时使用（如分配、定价、校验策略）。
2. 策略选择通过显式 key 或上下文，不允许 if/else 无限增长。
3. 策略实现必须可独立测试。

### 3.3 Template Method（模板方法，推荐）

1. 流程固定但步骤可替换时使用（如 create/update/audit 流）。
2. 固定主流程：validate -> authorize -> execute -> log -> return。
3. 子步骤通过受控扩展点实现，禁止破坏主流程一致性。

### 3.4 Repository Adapter（适配器模式，推荐）

1. Service 不直接耦合多数据源细节时引入仓储适配层。
2. 所有数据库方言差异收敛到 adapter/repository。
3. Service 只依赖领域语义方法，不依赖底层 SQL 细节。

### 3.5 State Guard（状态守卫，必选）

1. 涉及状态迁移的动作必须先做状态守卫。
2. 非法状态迁移必须 fail-closed，返回可追踪错误。
3. 状态迁移需记录前后状态和操作人上下文。

## 4. 目录与命名规范

1. 门面：<domain>.service.ts（或 index.ts 暴露 class）。
2. 子服务：<domain>-<capability>.service.ts。
3. 策略：strategies/<capability>/<name>.strategy.ts。
4. 仓储：repositories/<entity>.repository.ts。
5. 规则/守卫：guards/<name>.guard.ts。

## 5. 标准执行管道

每个写操作方法建议按以下顺序组织：

1. 输入验证（来自 Validator 的已解析类型）。
2. 权限校验（permission code）。
3. 状态守卫（旧状态 -> 新状态是否合法）。
4. 事务执行（prisma.$transaction）。
5. 事件日志（event）与审计日志（audit，若适用）。
6. 返回领域结果（非 HTTP Response）。

## 6. 代码骨架模板

```ts
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { Errors } from "@/lib/errors"

const log = logger.child("ExampleService", "biz")

export class ExampleService {
  static async execute(input: ExecuteInput, actor: ActorContext) {
    // 1) authorize
    if (!actor.permissions.includes("example:write")) {
      throw Errors.FORBIDDEN("权限不足")
    }

    // 2) guard
    const current = await prisma.example.findUnique({ where: { id: input.id } })
    if (!current) throw Errors.NOT_FOUND("资源")
    if (current.status !== "PENDING") throw Errors.CONFLICT("状态不允许")

    // 3) transaction
    const result = await prisma.$transaction(async (tx) => {
      return tx.example.update({
        where: { id: input.id },
        data: { status: "DONE" },
      })
    })

    // 4) logs
    log.event("example.execute.success", {
      resourceId: result.id,
      operatorId: actor.userId,
    })

    return result
  }
}
```

## 7. 反模式（禁止）

1. 大量 if/else 混在单个 Service 方法中不拆策略。
2. 在 Route 中直接写事务或状态机逻辑。
3. Service 直接拼接多数据库方言 SQL。
4. 无状态守卫直接更新状态字段。
5. 关键写操作无 event 日志。

## 8. 测试要求

1. 每个核心策略至少 1 条独立单测。
2. 每个状态迁移至少 1 条成功路径 + 1 条拒绝路径。
3. 门面 Service 至少 1 条事务回滚测试。
4. 关键动作必须断言 event/audit 是否触发。

## 9. 与治理门禁联动

1. 六要素中的 Service 与 Log/Test 必须对照本规范验收。
2. 代码评审时，若发现反模式，域状态不得升级为 DONE。
3. strict 门禁前必须完成本规范对应测试。
