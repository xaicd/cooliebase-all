import { afterEach, describe, expect, it } from "vitest"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"
import { InfraApiLogService } from "../api-log.service"
import { InfraConfigService } from "../config.service"
import { InfraJobCenterService } from "../job-center.service"

// 本文件是 PostgreSQL 集成测试: 服务层直接经 cooliebasePrisma 落库, 依赖真实数据库。
// 未配置 DATABASE_URL 时跳过, 否则在默认本地环境下必然红灯(并非真实缺陷)。
// 运行方式: DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db> npm test
const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase("infra services", () => {
  const createdKeys: string[] = []

  afterEach(async () => {
    await cooliebasePrisma.setting.deleteMany({
      where: { key: { in: createdKeys } },
    })
    createdKeys.length = 0
  })

  it("persists config items and lists them from the database", async () => {
    const key = `infra.test.config.${Date.now()}`
    createdKeys.push(key)

    const saved = await InfraConfigService.create({
      name: "测试配置",
      configKey: key,
      value: "persisted-value",
      remark: "from infra test",
    })

    expect(saved.id).toBeDefined()

    const result = await InfraConfigService.list({ page: 1, pageSize: 20, keyword: key })
    expect(result.items.some((item: { configKey: string }) => item.configKey === key)).toBe(true)
  })

  it("reads persisted api logs from the database", async () => {
    await cooliebasePrisma.setting.upsert({
      where: { key: "infra.api-logs" },
      create: {
        key: "infra.api-logs",
        value: {
          items: [
            {
              id: "api-log-1",
              method: "GET",
              path: "/api/admin/infra/configs",
              statusCode: 200,
              durationMs: 19,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
      update: {
        value: {
          items: [
            {
              id: "api-log-1",
              method: "GET",
              path: "/api/admin/infra/configs",
              statusCode: 200,
              durationMs: 19,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
    })

    const result = await InfraApiLogService.list({ page: 1, pageSize: 20, keyword: "configs" })
    expect(result.items.some((item) => item.path.includes("infra/configs"))).toBe(true)
  })

  it("updates a persisted job state and returns the new state", async () => {
    await cooliebasePrisma.setting.upsert({
      where: { key: "infra.jobs" },
      create: {
        key: "infra.jobs",
        value: {
          items: [
            {
              id: "job-001",
              name: "wallet-settlement",
              cron: "0 2 * * *",
              status: "RUNNING",
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      },
      update: {
        value: {
          items: [
            {
              id: "job-001",
              name: "wallet-settlement",
              cron: "0 2 * * *",
              status: "RUNNING",
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      },
    })

    const result = await InfraJobCenterService.trigger({
      id: "job-001",
      action: "PAUSE",
    })

    expect(result.status).toBe("PAUSED")
    expect(result.id).toBe("job-001")
  })
})
