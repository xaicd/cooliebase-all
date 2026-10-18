import { afterEach, describe, expect, it } from "vitest"
import {
  isFoundationModule,
  listBusinessDomains,
  listFoundationModules,
  listPlatformDomains,
  moduleLayerOf,
  rpcPolicy,
} from "../../constants/domain-catalog"
import { registerService } from "../broker-invoke"
import { natsSubscribe, resetNatsFabric } from "../nats-fabric"
import { createDomainFacade } from "../rpc-facade"
import {
  assertSupportedRemoteProtocol,
  decodeRpcPayload,
  describeInvoke,
  encodeRpcPayload,
  resolveInvokeMode,
} from "../rpc-protocol"
import { broker, resetBroker } from "../service-broker"
import { runWithTenantContext } from "../biz-tenant"

describe("module layers", () => {
  it("keeps shared as undeployable foundation SDK", () => {
    expect(listFoundationModules()).toEqual(["shared"])
    expect(isFoundationModule("shared")).toBe(true)
    expect(moduleLayerOf("shared")).toBe("foundation")
    expect(rpcPolicy().local.mode).toBe("sdk")
  })

  it("classifies system/infra as platform and pay as a first-party plugin", () => {
    expect(listPlatformDomains().map((domain) => domain.name).sort()).toEqual(["infra", "system"])
    expect(moduleLayerOf("system")).toBe("platform")
    // pay 已改造成第一方插件: 保留域级特征（可独立打包/被 broker 寻址），但不属于模块层
    expect(moduleLayerOf("pay")).toBeUndefined()
    expect(listBusinessDomains().some((domain) => domain.name === "pay")).toBe(false)
  })
})

describe("rpc protocol and codec", () => {
  it("uses SDK in the same runtime and RPC when the domain is packed out", () => {
    expect(resolveInvokeMode("pay", {})).toBe("sdk")
    expect(resolveInvokeMode("pay", { COOLIEBASE_DOMAIN_PAY_UPSTREAM: "http://pay:3100" })).toBe("rpc")
    expect(describeInvoke("mall", { COOLIEBASE_PACK_DOMAIN: "pay" })).toEqual({
      mode: "rpc",
      protocol: "nats-rr",
      serialization: "json",
      facadeRequired: true,
    })
    expect(describeInvoke("pay", { COOLIEBASE_PACK_DOMAIN: "pay" }).mode).toBe("sdk")
    expect(describeInvoke("mall", { COOLIEBASE_PACK_DOMAIN: "pay", COOLIEBASE_RPC_PROTOCOL: "grpc" })).toEqual({
      mode: "rpc",
      protocol: "grpc",
      serialization: "protobuf",
      facadeRequired: true,
    })
  })

  it("rejects Dubbo/Thrift and JSON-clones remote payloads", () => {
    expect(() => assertSupportedRemoteProtocol("dubbo")).toThrow(/Rejected RPC protocol/)
    expect(() => assertSupportedRemoteProtocol("thrift")).toThrow(/Rejected RPC protocol/)
    const input = { amount: 9900, nested: { id: "1" } }
    const encoded = encodeRpcPayload(input) as { nested: { id: string } }
    expect(encoded).toEqual(input)
    expect(encoded).not.toBe(input)
    encoded.nested.id = "mutated"
    expect(input.nested.id).toBe("1")
    const frame = encodeRpcPayload({ amount: 9900 }, "protobuf")
    expect(frame).toBeInstanceOf(Uint8Array)
    expect(decodeRpcPayload(frame, "protobuf")).toEqual({ amount: 9900 })
  })

  it("refuses to treat shared as an RPC service", () => {
    expect(() => resolveInvokeMode("shared")).toThrow(/SDK-only/)
  })
})

describe("dual-mode broker invoke and facade", () => {
  afterEach(() => {
    resetBroker()
    resetNatsFabric()
  })

  it("calls colocated domains through in-memory SDK", async () => {
    registerService("pay", async (method, payload) => ({ method, payload }))
    broker.start({})
    const result = await broker.call("pay.ping", { n: 1 })
    expect(result.success).toBe(true)
    expect(result.invokeMode).toBe("sdk")
    expect(result.data).toEqual({ method: "ping", payload: { n: 1 } })
  })

  it("serializes remote calls through NATS request-reply", async () => {
    natsSubscribe("cooliebase.cmd.mall.>", async (message) => ({ echo: message.data }), { queue: "cooliebase.mall" })
    broker.start({ COOLIEBASE_PACK_DOMAIN: "pay" })
    broker.registerRemoteService("mall")
    const result = await broker.call("mall.ping", { n: 2 }, { caller: "pay.order" })
    expect(result.success).toBe(true)
    expect(result.invokeMode).toBe("rpc")
    expect(result.data).toEqual({ echo: { n: 2 } })
  })

  it("exposes RPC methods only through a domain facade", async () => {
    registerService("pay", async (method) => ({ ok: method }))
    broker.start({})
    const pay = createDomainFacade("pay", ["ping", "createOrder"] as const)
    const result = await pay.ping({ n: 1 })
    expect(pay.domain).toBe("pay")
    expect(result.success).toBe(true)
    expect(result.invokeMode).toBe("sdk")
    expect(result.data).toEqual({ ok: "ping" })
  })

  it("dispatches remote calls through in-house gRPC unary", async () => {
    const { decodeRpcPayload, encodeRpcPayload } = await import("../rpc-protocol")
    const { grpcBindService } = await import("../grpc-fabric")
    grpcBindService("mall", async (method, data) => {
      const payload = decodeRpcPayload(data, "protobuf") as { n: number }
      return encodeRpcPayload({ echo: payload, method }, "protobuf")
    })
    broker.start({ COOLIEBASE_PACK_DOMAIN: "pay", COOLIEBASE_RPC_PROTOCOL: "grpc" })
    broker.registerRemoteService("mall")
    const result = await broker.call("mall.ping", { n: 3 }, { caller: "pay.order" })
    expect(result.success).toBe(true)
    expect(result.invokeMode).toBe("rpc")
    expect(result.rpcProtocol).toBe("grpc")
    expect(result.data).toEqual({ echo: { n: 3 }, method: "ping" })
  })

  it("validates pay facade actions from the contract schema file", async () => {
    const { registerActionSchemas } = await import("@/modules/pay/contract/actions")
    const { payFacade } = await import("@/modules/pay/contract/pay.facade")
    registerActionSchemas()
    registerService("pay", async (method) => ({ ok: method }))
    broker.start({})
    const rejected = await payFacade.createOrder({ amount: 1 })
    expect(rejected.success).toBe(false)
    expect(rejected.error).toMatch(/ValidationError/)
    const ok = await payFacade.ping({ n: 1 })
    expect(ok.success).toBe(true)
    expect(ok.invokeMode).toBe("sdk")
    expect(ok.rpcProtocol).toBe("in-process")
  })

  it("routes pay.listRefunds onto PayRefundService by catalog target", async () => {
    const { registerActionSchemas } = await import("@/modules/pay/contract/actions")
    const { payFacade } = await import("@/modules/pay/contract/pay.facade")
    registerActionSchemas()
    broker.start({})
    const result = await payFacade.listRefunds({ page: 1, pageSize: 10 })
    expect(result.success, result.error).toBe(true)
    expect(result.invokeMode).toBe("sdk")
    const data = result.data as { items: unknown[]; total: number; page: number }
    expect(data.page).toBe(1)
    expect(Array.isArray(data.items)).toBe(true)
    expect(data.total).toBeGreaterThan(0)
  })

  it("routes pay facade methods onto the real PayService", async () => {
    const { payFacade } = await import("@/modules/pay/contract/pay.facade")
    broker.start({})
    const ping = await payFacade.ping({ n: 9 })
    expect(ping.success).toBe(true)
    expect(ping.data).toEqual({ pong: true, domain: "pay", n: 9 })
    const created = await payFacade.createOrder({
      appId: "app-facade",
      channelCode: "MOCK",
      merchantOrderId: `MO-FACADE-${Date.now()}`,
      subject: "facade create",
      amount: 100,
    })
    expect(created.success).toBe(true)
    expect(created.invokeMode).toBe("sdk")
    expect(created.data).toMatchObject({ status: "WAITING", amount: 100, appId: "app-facade" })
  })

  it("routes infra.updateConfig onto InfraConfigService by catalog service name", async () => {
    const { infraFacade } = await import("@/modules/infra/contract/infra.facade")
    broker.start({})
    const updated = await infraFacade.updateConfig({
      key: "sys.application.name",
      value: "cooliebase-all-base-facade",
    })
    expect(updated.success, updated.error).toBe(true)
    expect(updated.data).toMatchObject({ key: "sys.application.name", value: "cooliebase-all-base-facade" })
  })

  it("routes system.getDictDataByType onto SystemDictService", async () => {
    const { systemPublicFacade } = await import("@/modules/system/contract/system.public.facade")
    broker.start({})
    const result = await systemPublicFacade.getDictDataByType({ type: "system_user_sex" }, { caller: "online.definition" })
    expect(result.success, result.error).toBe(true)
    expect(result.invokeMode).toBe("sdk")
    const items = (result.data as Array<{ value: string; label: string; status: string }> | undefined) ?? []
    expect(items.length).toBeGreaterThan(0)
    expect(items[0]).toMatchObject({ value: expect.any(String), label: expect.any(String) })
  })

  it("exposes login user info on the system public facade", async () => {
    // 用户与权限是**租户作用域**的：必须在租户上下文里跑，否则真实库下
    // getPermissionInfoByUser 会因"账号未绑定租户"失败（内存模式恰好看不出来）。
    await runWithTenantContext({ tenantId: "1", isPlatform: true }, async () => {
      const { registerActionSchemas } = await import("@/modules/system/contract/actions")
      const { systemPublicFacade } = await import("@/modules/system/contract/system.public.facade")
      registerActionSchemas()
      broker.start({})
      const listed = await (await import("@/modules/system/contract/system.facade")).systemFacade.listUsers({ page: 1, pageSize: 1 })
      expect(listed.success, listed.error).toBe(true)
      const userId = (listed.data as { items: Array<{ id: string }> }).items[0]?.id
      expect(userId).toBeTruthy()
      const info = await systemPublicFacade.getPermissionInfoByUser({ userId }, { caller: "bff.auth" })
      expect(info.success, info.error).toBe(true)
      expect(info.data).toMatchObject({ user: { id: userId } })
    })
  })

  it("routes system.resolveTenantEntitlement through the domain facade", async () => {
    registerService("system", async (method, payload) => {
      expect(method).toBe("resolveTenantEntitlement")
      return { tenantId: (payload as { tenantId: string }).tenantId, accountLimit: 10 }
    })
    broker.start({})
    const { systemFacade } = await import("@/modules/system/contract/system.facade")
    const result = await systemFacade.resolveTenantEntitlement({ tenantId: "tenant-1" }, { caller: "shared.auth" })
    expect(result.success, result.error).toBe(true)
    expect(result.invokeMode).toBe("sdk")
    expect(result.data).toMatchObject({ tenantId: "tenant-1", accountLimit: 10 })
  })

  it("routes system.listUsers onto SystemUserService", async () => {
    const { registerActionSchemas } = await import("@/modules/system/contract/actions")
    const { systemFacade } = await import("@/modules/system/contract/system.facade")
    registerActionSchemas()
    broker.start({})
    const result = await systemFacade.listUsers({ page: 1, pageSize: 10 })
    expect(result.success, result.error).toBe(true)
    expect(result.invokeMode).toBe("sdk")
    const data = result.data as { items: unknown[]; total: number; page: number }
    expect(data.page).toBe(1)
    expect(Array.isArray(data.items)).toBe(true)
  })

  it("routes infra listConfigs and listJobs onto config/job services", async () => {
    // 同上一例: 配置查询也是租户作用域的。
    await runWithTenantContext({ tenantId: "1", isPlatform: true }, async () => {
    const { registerActionSchemas } = await import("@/modules/infra/contract/actions")
    const { infraFacade } = await import("@/modules/infra/contract/infra.facade")
    registerActionSchemas()
    broker.start({})
    // 用 keyword 精确过滤: 直接断言"第 1 页里有某条"依赖分页顺序，
    // 配置条数一多就会假失败（实测: 该 key 排在第 20 条之后）。
    const configs = await infraFacade.listConfigs({ page: 1, pageSize: 20, keyword: "sys.application.name" })
    expect(configs.success, configs.error).toBe(true)
    expect(configs.invokeMode).toBe("sdk")
    const configData = configs.data as { items: Array<{ configKey?: string }>; total: number }
    expect(configData.total).toBeGreaterThan(0)
    expect(configData.items.some((item) => item.configKey === "sys.application.name")).toBe(true)
    const jobs = await infraFacade.listJobs({ page: 1, pageSize: 10 })
    expect(jobs.success, jobs.error).toBe(true)
    const jobData = jobs.data as { items: unknown[]; page: number }
    expect(jobData.page).toBe(1)
    expect(Array.isArray(jobData.items)).toBe(true)
    })
  })

  it("routes system.getUser onto SystemUserService", async () => {
    const { registerActionSchemas } = await import("@/modules/system/contract/actions")
    const { systemFacade } = await import("@/modules/system/contract/system.facade")
    registerActionSchemas()
    broker.start({})
    const listed = await systemFacade.listUsers({ page: 1, pageSize: 1 })
    expect(listed.success, listed.error).toBe(true)
    const userId = (listed.data as { items: Array<{ id: string }> }).items[0]?.id
    expect(userId).toBeTruthy()
    const result = await systemFacade.getUser({ id: userId })
    expect(result.success, result.error).toBe(true)
    expect(result.invokeMode).toBe("sdk")
    expect(result.data).toMatchObject({ id: userId })
  })

  it("routes system tenant package and online user lists onto domain services", async () => {
    const { registerActionSchemas } = await import("@/modules/system/contract/actions")
    const { systemFacade } = await import("@/modules/system/contract/system.facade")
    registerActionSchemas()
    broker.start({})
    const packages = await systemFacade.listTenantPackages({ page: 1, pageSize: 10 })
    expect(packages.success, packages.error).toBe(true)
    expect(packages.invokeMode).toBe("sdk")
    const online = await systemFacade.listOnlineUsers({ page: 1, pageSize: 10 })
    expect(online.success, online.error).toBe(true)
    const onlineData = online.data as { items: unknown[]; page: number }
    expect(onlineData.page).toBe(1)
    expect(Array.isArray(onlineData.items)).toBe(true)
  })

  it("routes infra listCodegenTables onto CodegenTableService", async () => {
    const { registerActionSchemas } = await import("@/modules/infra/contract/actions")
    const { infraFacade } = await import("@/modules/infra/contract/infra.facade")
    registerActionSchemas()
    broker.start({})
    const result = await infraFacade.listCodegenTables({ page: 1, pageSize: 10 })
    expect(result.success, result.error).toBe(true)
    expect(result.invokeMode).toBe("sdk")
    const data = result.data as { items: unknown[]; page: number }
    expect(data.page).toBe(1)
    expect(Array.isArray(data.items)).toBe(true)
  })

  it("exposes system login schema and infra codegen catalog on the domain facade", async () => {
    const { registerActionSchemas: registerSystem } = await import("@/modules/system/contract/actions")
    const { systemFacade } = await import("@/modules/system/contract/system.facade")
    registerSystem()
    broker.start({})
    const listed = await systemFacade.listUsers({ page: 1, pageSize: 1 })
    expect(listed.success, listed.error).toBe(true)
    const userId = (listed.data as { items: Array<{ id: string }> }).items[0]?.id
    expect(userId).toBeTruthy()
    const sidebar = await systemFacade.getSidebarNav({ userId, isPlatformAdmin: true })
    expect(sidebar.success, sidebar.error).toBe(true)
    const { registerActionSchemas: registerInfra } = await import("@/modules/infra/contract/actions")
    const { infraFacade } = await import("@/modules/infra/contract/infra.facade")
    registerInfra()
    const catalog = await infraFacade.listCodegenCatalog({})
    expect(catalog.success, catalog.error).toBe(true)
    expect(Array.isArray((catalog.data as { templates?: unknown[] }).templates)).toBe(true)
  })

  it("routes infra getConfig and listPages onto config/page services", async () => {
    const { registerActionSchemas } = await import("@/modules/infra/contract/actions")
    const { infraFacade } = await import("@/modules/infra/contract/infra.facade")
    registerActionSchemas()
    broker.start({})
    const configs = await infraFacade.listConfigs({ page: 1, pageSize: 1 })
    expect(configs.success, configs.error).toBe(true)
    const configId = (configs.data as { items: Array<{ id: string; configKey?: string }> }).items[0]?.id
    expect(configId).toBeTruthy()
    const config = await infraFacade.getConfig({ id: configId })
    expect(config.success, config.error).toBe(true)
    expect(config.data).toMatchObject({ id: configId })
    const pages = await infraFacade.listPages({})
    expect(pages.success, pages.error).toBe(true)
    expect(Array.isArray(pages.data)).toBe(true)
    expect((pages.data as unknown[]).length).toBeGreaterThan(0)
  })

  it("exposes infra codegen preview on the domain facade", async () => {
    const { infraFacade } = await import("@/modules/infra/contract/infra.facade")
    broker.start({})
    const preview = await infraFacade.previewCodegen({
      moduleName: "infra",
      className: "DemoWidget",
      businessName: "演示部件",
      template: "CRUD",
      scene: "ADMIN",
      generateFrontend: false,
      generateTest: false,
      table: {
        name: "demo_widget",
        comment: "demo",
        schema: "public",
        type: "TABLE",
        columns: [
          { name: "id", type: "varchar", tsType: "string", nullable: false, isPrimary: true, isAutoIncrement: false, uiComponent: "HIDDEN" },
          { name: "name", type: "varchar", tsType: "string", nullable: false, isPrimary: false, isAutoIncrement: false, uiComponent: "INPUT" },
        ],
        primaryKey: ["id"],
        indexes: [],
      },
    })
    expect(preview.success, preview.error).toBe(true)
    expect(preview.invokeMode).toBe("sdk")
    const files = (preview.data as { files?: Array<{ path: string; content: string }> } | undefined)?.files ?? []
      // 派发契约: 生成物里带 actions（catalog 据此派发），且不再有已废弃的 rpc 绑定层
      expect(files.some((item) => item.path.endsWith("demo-widget.actions.ts"))).toBe(true)
      expect(files.some((item) => item.path.endsWith(".rpc.ts"))).toBe(false)
  })

  it("uses HTTP RPC when BFF splits pay via upstream", async () => {
    const payEnv = { COOLIEBASE_PACK_DOMAIN: "pay", COOLIEBASE_RPC_TOKEN: "secret" }
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("http://pay.test:3214/api/internal/rpc")
      const body = JSON.parse(String(init?.body))
      const headers: Record<string, string> = {}
      new Headers(init?.headers).forEach((value, key) => {
        headers[key.toLowerCase()] = value
      })
      const { handleInternalRpc } = await import("../rpc-http")
      const result = await handleInternalRpc({ ...body, headers, env: payEnv })
      return new Response(JSON.stringify(result.success ? { success: true, data: result.data } : { success: false, error: result.error }), {
        status: result.success ? 200 : result.status,
        headers: { "content-type": "application/json" },
      })
    }) as typeof fetch
    try {
      const { payFacade } = await import("@/modules/pay/contract/pay.facade")
      broker.start({
        COOLIEBASE_DOMAIN_PAY_UPSTREAM: "http://pay.test:3214",
        COOLIEBASE_RPC_TOKEN: "secret",
      })
      const ping = await payFacade.ping({ n: 4 })
      expect(ping.success, ping.error).toBe(true)
      expect(ping.invokeMode).toBe("rpc")
      expect(ping.rpcProtocol).toBe("nats-rr")
      expect(ping.data).toEqual({ pong: true, domain: "pay", n: 4 })
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
