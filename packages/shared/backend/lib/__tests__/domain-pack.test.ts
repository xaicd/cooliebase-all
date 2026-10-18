import { describe, expect, it } from "vitest"
import { NATIVE_DOMAIN_NAMES, isFoundationModule, listDomainCatalog, listFoundationModules, listPlatformDomains, moduleLayerOf } from "../../constants/domain-catalog"
import {
  buildDomainPackPlan,
  matchPathToDomain,
  matchRemoteDomainUpstream,
} from "../domain-pack"

describe("domain pack catalog", () => {
  it("keeps catalog entries and layer declarations in sync", () => {
    const names = listDomainCatalog().map((domain) => domain.name)
    expect(names).toEqual(expect.arrayContaining([...NATIVE_DOMAIN_NAMES]))
    expect(new Set(names).size).toBe(names.length)

    const declared = new Set(NATIVE_DOMAIN_NAMES)
    expect(names.filter((name) => !declared.has(name))).toEqual([])

    for (const moduleName of listFoundationModules()) {
      expect(names).not.toContain(moduleName)
    }
  })

  it("separates foundation, platform, and business layers", () => {
    expect(isFoundationModule("shared")).toBe(true)
    expect(listPlatformDomains().map((domain) => domain.name)).toEqual(["system", "infra"])
    // pay 已改造成第一方插件: 保留域级特征但不属于任何模块层
expect(moduleLayerOf("pay")).toBeUndefined()
  })

  it("gives each packable domain a unique port, upstream env, and public prefix", () => {
    const domains = listDomainCatalog()
    const ports = domains.map((domain) => domain.defaultPort)
    const envs = domains.map((domain) => domain.upstreamEnv)
    expect(new Set(ports).size).toBe(ports.length)
    expect(new Set(envs).size).toBe(envs.length)
    for (const domain of domains) {
      expect(domain.packable).toBe(true)
      expect(domain.publicPrefixes.length).toBeGreaterThan(0)
      expect(domain.upstreamEnv).toBe(`COOLIEBASE_DOMAIN_${domain.name.toUpperCase()}_UPSTREAM`)
    }
  })
})

describe("domain pack routing", () => {
  it("matches the longest public prefix", () => {
    const matched = matchPathToDomain("/api/v1/admin/pay/pay-order/abc")
    expect(matched?.domain.name).toBe("pay")
    expect(matched?.prefix).toBe("/api/v1/admin/pay")
  })

  it("does not treat sibling domains as a match", () => {
    expect(matchPathToDomain("/api/v1/admin/payload")).toBeUndefined()
    expect(matchPathToDomain("/api/v1/admin/system-user")).toBeUndefined()
  })

  it("proxies only when an upstream is configured and the process is the BFF", () => {
    const env = { COOLIEBASE_DOMAIN_PAY_UPSTREAM: "http://pay:3100/" }
    const match = matchRemoteDomainUpstream("/api/v1/open/pay/notify", env)
    expect(match).toEqual({
      domain: "pay",
      prefix: "/api/v1/open/pay",
      baseUrl: "http://pay:3100",
      timeoutMs: 5000,
    })
    expect(matchRemoteDomainUpstream("/api/v1/admin/pay/orders", { ...env, COOLIEBASE_PACK_DOMAIN: "pay" })).toBeUndefined()
    expect(matchRemoteDomainUpstream("/api/v1/admin/mall/orders", env)).toBeUndefined()
  })
})

describe("domain pack plan", () => {
  it("builds an api-only plan for pay", () => {
    const plan = buildDomainPackPlan("pay")
    expect(plan.packKind).toBe("api-only")
    expect(plan.modules).toEqual(["pay", "shared"])
    expect(plan.apiRouteDirs).toEqual([
      "src/app/api/v1/admin/pay",
      "src/app/api/v1/app/pay",
      "src/app/api/v1/open/pay",
    ])
    expect(plan.independentDatabase).toBe(false)
  })

  it("rejects unknown domains", () => {
    expect(() => buildDomainPackPlan("unknown")).toThrow(/Unknown domain/)
  })
})
