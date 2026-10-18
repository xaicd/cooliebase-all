# 老系统迁移方法论（Legacy Migration Playbook）

> **终局目标**：把一个 **100+ 微服务的老系统**（Spring Cloud / Node / Dubbo + MySQL / Redis / Kafka / Hazelcast）迁上 cooliebase-all-base 底座。
>
> **核心定位（务必先读）**：本体域是老系统的**数字镜像 + 体检报告**，**不是重写计划书**。把现实系统的实体/接口/事件**如实数字化映射**进来，目的是**看清全局：有什么、缺什么、乱在哪**——然后**只对产生经济价值的地方动手**。绝大多数服务 `valueTag=keep`（照原样映射、不动代码）。

---

## 1. 为什么用本体域做迁移锚

100+ 服务迁移的真正难点不是写代码，是**认知与对账**：哪个服务对应什么业务语义、边界怎么切、和目标差多少、怎么分批。本体域（DigitalStaff 平台 `ontology` 的种子域，如 `ecommerce` 17 实体/24 action）提供一个**稳定的语义坐标系**：每个老服务往本体域上一贴，就知道它是什么、缺什么。

- **映射真源**：`packages/shared/contract/ontology-mapping.schema.json`（契约 schema）+ `packages/shared/contract/mappings/<domain>.mapping.json`（每个本体域一个实例）。
- **首个样板**：`mappings/ecommerce.mapping.json`（ecommerce ↔ cooliebase mall/pay，已结构校验通过）。

---

## 2. 中间件锚点（老系统中间件 → 底座可切换驱动）

老系统的中间件**不重搭**，映射到 cooliebase 底座既有的可切换抽象（见导航总纲 §5），换环境只改 env：

| 老系统中间件 | 底座锚点 | env 开关 | 说明 |
|---|---|---|---|
| MySQL | database（Kysely + 全库方言） | `DB_DRIVER=mysql` | 直连；国产库同层可切 |
| Redis（缓存） | cache | `CACHE_DRIVER=redis` | 键值缓存 |
| Redis（Pub/Sub） / Kafka | mq | `MQ_DRIVER=redis`（Kafka 驱动按 mq-driver 范式扩展） | 消息/事件；Kafka 可新增 KafkaMqDriver |
| Hazelcast（分布式 Map/缓存） | cache（分布式档） | `CACHE_DRIVER=redis` 或新增 hazelcast 驱动 | 分布式缓存归 cache 抽象 |
| 文件/对象存储 | storage | `STORAGE_DRIVER=s3` | local↔s3(MinIO/OSS) |

> Kafka / Hazelcast 若需原生驱动，按 cache/mq 的 driver 六件套（接口→memory默认→prod驱动懒加载→manager→env→兜底）新增即可，不改业务代码。

---

## 3. 单个服务的 5 步迁移穿透（对齐 AGENTS.md Rule 20）

对 100+ 里的**每一个**老服务，执行：

1. **定位本体域**：这个服务属于哪个业务语义域？贴到对应 `<domain>.mapping.json`。找不到现成本体域 → 在平台 `ontology` 补种子域，或标 `crossDomainBaseline`（公共底座，如 system/infra）。
2. **如实映射**（不重写）：把老服务的**表→`entityMap`、接口→`actionMap`、Kafka topic→`eventMap`、中间件→§2 锚点**，逐条抄进契约。保真度标 `fidelity`：`as-is`（原样）/`adapted`（边界/形状不同）/`gap`（缺口）。
3. **登记契约**：写入 `mappings/<domain>.mapping.json`，跑结构校验（见 §5）。
4. **标价值** `valueTag`：`keep`（照搬跑着，**默认**）/ `optimize`（有经济价值才优化）/ `problem`（发现的问题，**仅记录不强制动**）。`migrationStatus` 记进度。
5. **只对 `optimize` 动手**：`keep` 的照原样迁（落 `packages/domains/<域>` 或保持老服务被绞杀者代理）；只有标了 `optimize` 的才投入改造，过门禁（tsc 零增量 / vitest / 真实数据库）。

---

## 4. gap 处置策略（体检发现的三类问题）

映射时暴露的差异，按类型处置，**不强制立即修**：

- **实体缺**（`entityMap.fidelity=gap`，如 ecommerce 的 Review 在模板无表）→ 迁入该服务时补 nodeType/表；不迁则仅登记。
- **事件形状不同**（本体域=状态机生命周期事件 `XActivated/Completed`；老系统=业务动词事件 `OrderPaid`）→ 在 `eventMap` 用 `derivedFromAction` 从本体 action 的 `stateTransition` **派生**语义事件，对齐老系统 Kafka topic（`legacyTopic`）。**这是最常见的 adapted。**
- **域边界不符**（如本体域把 pay 折进电商+fintech，老系统 pay 独立）→ 用 `crossDomainBaseline` 登记跨域关系/邻域，保留老系统的边界，不强行合并。

---

## 5. 分批盘点与校验

- **分批**：100+ 不一次迁。按本体域**成域推进**（先电商域 mall/pay，再下一域），每个 `mapping.json` 是一批的"完成定义"。
- **盘点即价值**：哪怕一个服务先只登记 `valueTag=keep / migrationStatus=planned`，它已进入数字镜像、可被全局检索——这就是本体域的即时收益（看清全貌），无需先重写。
- **校验**：每个 `mapping.json` 提交前跑结构校验（必填字段 + enum：stack/fidelity/valueTag/middleware/migrationStatus）。ecommerce 样板已通过（2 服务 / 16 实体映射 / 13 action 映射 / 8 事件映射 / 11 gaps 如实登记）。

---

## 6. 一句话方法论

> **本体域 = 老系统的数字镜像**：100+ 服务逐个『如实映射进契约』(默认 keep 不重写)，映射过程即『体检』暴露 gap/problem；**只对标了 `optimize`、能产生经济价值的地方投入改造**。中间件映射到底座可切换驱动、换环境只改 env。ecommerce↔mall/pay 是证明可行的首个样板。
