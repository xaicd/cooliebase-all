---
name: automated-testing
description: 单元测试、集成测试、契约测试、权限测试与门禁验证。
---

# 自动化测试与质量门禁规范

## 1. 适用场景
- 新增业务域或模块功能后的自动化测试补齐。
- 验证核心路径正确性、权限拒绝分支与事务回滚机制。
- 发布前的质量门禁检查。

## 2. 权威依据
- `AGENTS.md` §6 (能力同步与治理门禁)
- `AGENTS.md` §8 (测试规范：每个新域至少 1 条关键路径自动化测试)
- 域测试目录：`packages/domains/<domain>/backend/services/__tests__/`

## 3. 测试覆盖四必测用例

每个业务能力必须提供以下 4 类测试用例：

```typescript
describe("EntityService Core Capabilities", () => {
  // 1. 正向业务主流程测试
  it("should successfully create and query entity", async () => {
    const created = await EntityService.create({ name: "测试数据" })
    expect(created.id).toBeDefined()
    const found = await EntityService.getById(created.id)
    expect(found.name).toBe("测试数据")
  })

  // 2. 权限拒绝边界测试
  it("should reject unauthorized operations with 403 / ForbiddenError", async () => {
    await expect(
      EntityService.sensitiveAction({ role: "GUEST" })
    ).rejects.toThrow(/Forbidden|无权/)
  })

  // 3. 参数校验与异常拦截测试
  it("should reject invalid inputs with Zod validation error", async () => {
    await expect(
      EntityService.create({ name: "" }) // 空名称
    ).rejects.toThrow()
  })

  // 4. 事务失败回滚测试
  it("should rollback database changes when transactional step fails", async () => {
    await expect(
      EntityService.createWithFailingStep({ name: "回滚测试" })
    ).rejects.toThrow()
    const list = await EntityService.list({ keyword: "回滚测试" })
    expect(list.total).toBe(0) // 验证无脏数据残留
  })
})
```

## 4. 常用测试与门禁命令
```bash
# 运行指定测试文件
pnpm exec vitest run packages/domains/<domain>/backend/services/__tests__/

# 运行全量单元测试
npm test

# 运行全链路治理门禁检查
npm run check
```

## 5. 绝对禁止项
- 严禁使用“手工在界面点一下”代替自动化测试代码。
- 严禁将未通过测试或缺失测试的模块在矩阵中标记为 `DONE`。
- 严禁测试用例包含真实生产密钥或个人隐私数据。
