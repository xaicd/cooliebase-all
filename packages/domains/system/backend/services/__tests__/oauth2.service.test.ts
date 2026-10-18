import { afterEach, describe, expect, it, vi } from "vitest"
import { hashPasswordMD5 } from "@/modules/shared/backend/lib/crypto"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"
import { SystemOauth2Service } from "../oauth2.service"

// 本文件是 PostgreSQL 集成测试: 服务层直接经 cooliebasePrisma 落库, 依赖真实数据库。
// 未配置 DATABASE_URL 时跳过, 否则在默认本地环境下必然红灯(并非真实缺陷)。
// 运行方式: DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db> npm test
const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeWithDatabase("SystemOauth2Service", () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await cooliebasePrisma.setting.deleteMany({ where: { key: { in: ["system.oauth2.clients", "system.oauth2.tokens"] } } })
    await cooliebasePrisma.admin.deleteMany({ where: { username: { startsWith: "oauth2-test-" } } })
  })

  it("opens tokens against persisted clients and admin credentials", async () => {
    const admin = await cooliebasePrisma.admin.create({
      data: {
        id: `oauth2-admin-${Date.now()}`,
        username: "oauth2-test-admin",
        phone: `139${Date.now().toString().slice(-8)}`,
        password: hashPasswordMD5("admin123"),
        status: "ACTIVE",
      },
    })

    await cooliebasePrisma.setting.upsert({
      where: { key: "system.oauth2.clients" },
      create: {
        key: "system.oauth2.clients",
        value: {
          items: [
            {
              id: "client-1",
              clientId: "admin-web",
              clientSecret: "admin-web-secret",
              name: "管理后台",
              status: "ACTIVE",
            },
          ],
        },
      },
      update: {
        value: {
          items: [
            {
              id: "client-1",
              clientId: "admin-web",
              clientSecret: "admin-web-secret",
              name: "管理后台",
              status: "ACTIVE",
            },
          ],
        },
      },
    })

    const token = await SystemOauth2Service.openToken({
      clientId: "admin-web",
      clientSecret: "admin-web-secret",
      grantType: "password",
      username: admin.username ?? admin.phone,
      password: "admin123",
    })

    const userInfo = await SystemOauth2Service.getUserInfo({ accessToken: token.accessToken })
    const tokens = await SystemOauth2Service.listTokens({ page: 1, pageSize: 20, keyword: "" })

    expect(token.tokenType).toBe("Bearer")
    expect(userInfo.userId).toBe(admin.id)
    expect(tokens.total).toBeGreaterThan(0)
  })

  it("lists persisted oauth2 clients from the database", async () => {
    await cooliebasePrisma.setting.upsert({
      where: { key: "system.oauth2.clients" },
      create: {
        key: "system.oauth2.clients",
        value: {
          items: [
            {
              id: "client-2",
              clientId: "merchant-h5",
              clientSecret: "merchant-h5-secret",
              name: "商户 H5",
              status: "ACTIVE",
            },
          ],
        },
      },
      update: {
        value: {
          items: [
            {
              id: "client-2",
              clientId: "merchant-h5",
              clientSecret: "merchant-h5-secret",
              name: "商户 H5",
              status: "ACTIVE",
            },
          ],
        },
      },
    })

    const result = await SystemOauth2Service.listClients({ page: 1, pageSize: 20, keyword: "merchant" })

    expect(result.items[0]?.clientId).toBe("merchant-h5")
  })
})
