# 代码审查与静态质量防线清单 (Code Review Checklist)

- **归属规范**: CMMI 04_implementation (TS) / `.agents/skills/coding`
- **编写原则**: 每条都标注**是否已有机器检查**。人只该花时间在"没有机器检查"的条目上 ——
  把人力重复投在 CI 已经拦住的事情上，是审查效率最大的浪费。

---

## 1. 已有机器拦截（人工只需确认"检查确实跑了"）

| 条目 | 判据 | 拦截者（真实存在，可复跑） |
|---|---|---|
| 跨域依赖 | 不得直接 import 其他域 Service/Repository，必须经 Domain Facade / broker | `npm run domain:check`、`npm run microservice:check` |
| 后端日志 | 禁止 `console.*`（测试与日志实现豁免） | `standards:check` 规则 `backend-no-console`（**enforce**） |
| 仓储/服务导出 | 对象单例须同时导出 PascalCase 与 camelCase | `standards:check` 规则 `repository-service-dual-export`（**enforce**） |
| 空转断言 | 禁止 `expect(true).toBe(true)` 这类字面恒真断言 | `standards:check` 规则 `no-vacuous-test-assertions`（**enforce**） |
| 断言杀伤力 | 关键模块的语义突变必须被测试杀死 | `npm run mutation:gate`（存活即失败） |
| 表定义覆盖 | 仓储在查的表必须有创建来源 | `standards:check` 规则 `table-definition-coverage`（**enforce**） |
| 目录分层 | 禁止平铺 `modules/<domain>/services`；顶层目录约束 | `standards:check` 规则 `no-flat-domain-services` / `src-top-level-layout`（**enforce**） |
| 基座边界 | 定制业务不得进基座原生域 | `standards:check` 规则 `base-native-domain-boundary`（**enforce**） |
| 依赖准入 | 新增运行时漏洞为 0；既有欠债冻结于基线 | `npm run deps:audit` |
| 物料清单 | SBOM 与锁文件一致 | `npm run sbom:check` |
| 文档事实 | 文档里的数字与真源一致 | `npm run llms:check` |

> 退出码为 0 才算通过。**不得**以"本地跑过了"替代，也不得用 `--no-verify` 绕过。

## 2. 需要人工判断（机器拦不住的部分）

- [ ] **租户隔离**：查询/写入是否继承租户作用域？跨租户读取是否可能发生？
      （`standards:check` 的 `business-repository-tenant-scope` 目前是 **report** 模式，
      只报告**不拦截** —— 这条**仍需人工确认**，别误以为有闸门。）
- [ ] **并发防护**：库存扣减、状态迁移是否使用 CAS 乐观锁/条件更新？幂等键是否带上？
- [ ] **事务边界**：失败是否回滚？跨域写是否走 `runUnitOfWork()` / 带幂等的重试？
- [ ] **审计**：审核、权限变更、资金与风控相关操作是否补了 audit？敏感字段是否进了日志？
- [ ] **例外路径**：是否有空 catch、静默 `return` 把异常吞掉？
- [ ] **接口兼容**：改动是否破坏既有入参/错误码/返回 DTO？旧接口是否 100% 向下兼容？
- [ ] **调用面影响**：改存量函数前是否 grep 过全部调用方，并跑通存量回归？
- [ ] **临时物**：调试输出、临时开关、注释掉的代码、`TODO` 是否被带进提交？

## 3. 提交前自检

```bash
npm run check          # 全量静态门禁（含上文所有 enforce 项）
npm run mutation:gate  # 断言杀伤力（独立跑，会临时改写源码再还原）
```

## 4. 已知的"检查在空转"风险（务必知情）

`standards:check` 有三条规则是 **ratchet** 或 **report** 模式 —— 它们**不会**因违规而失败：

| 规则 | 模式 | 含义 |
|---|---|---|
| `facade-method-dispatch-mapped` | ratchet | 既有欠债冻结，只拦新增 |
| `init-sql-seed-columns` | ratchet | 同上 |
| `business-repository-tenant-scope` | report | 只报告，永不失败 |

审查到这三块时请**当成没有机器检查**来对待。
