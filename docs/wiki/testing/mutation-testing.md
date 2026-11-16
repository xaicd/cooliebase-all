# 测试百科：变异测试 (Mutation Testing) 反假 Mock 与有效性打假

> 对应规则：AGENTS.md Rule 0.6 / .agents/skills/mutation-tester/SKILL.md (对标 Stryker / PIT / SpaceX 标准)

## 一、 为什么行覆盖率有欺骗性？
只写执行语句而不写深度断言，或者在单测中把被测核心逻辑自身全部 Mock 掉，行覆盖率依然可以达到 100%。

## 二、 变异测试原理 (Fault Injection)
- 向 AST 注入变异算子：
  - 边界偏移：`x > 0` $	o$ `x >= 0`
  - 逻辑反转：`status === 'PAID'` $	o$ `status !== 'PAID'`
  - 租户旁路：删除 `where tenant_id = ?` 过滤
  - CAS 旁路：删除 `where version = ?` 乐观锁
- **测试有效性判据**：
  - **Mutant Killed (击杀)**：测试套件因故障变异而红牌报错（单测有效）；
  - **Mutant Survived (存活)**：注入故障后测试依然全绿 ➔ **证明存在空断言或假 Mock，必须立即补测击杀！**
  - **变异得分要求**：核心业务状态机 MSI $ge 85%$。
