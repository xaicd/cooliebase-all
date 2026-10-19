import { describe, expect, it } from "vitest"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const {
  parseArgv,
  resolveHatchPlan,
  shouldSkipRelPath,
  pruneCatalog,
  pruneRpcActions,
  buildHatchManifest,
  PLATFORM_COMPANIONS,
} = require("../hatch-profile.cjs")

const catalog = {
  layers: {
    platform: { domains: ["system", "infra"] },
    business: { domains: ["online", "ai", "aigw", "mall", "crm", "pay"] },
  },
  domains: [
    { name: "system" },
    { name: "infra" },
    { name: "online" },
    { name: "ai" },
    { name: "aigw" },
    { name: "mall" },
    { name: "crm" },
    { name: "pay" },
  ],
}

describe("hatch-profile", () => {
  it("parses profile and bundle flags", () => {
    const parsed = parseArgv(["node", "clone", "D:/tmp/app", "--profile", "vertical", "--bundle", "mall,crm"])
    expect(parsed.target).toBe("D:/tmp/app")
    expect(parsed.profile).toBe("vertical")
    expect(parsed.bundle).toEqual(["mall", "crm"])
  })

  it("promotes --bundle on standard to vertical", () => {
    const parsed = parseArgv(["node", "clone", "./out", "--bundle=mall"])
    expect(parsed.profile).toBe("vertical")
    expect(parsed.bundle).toEqual(["mall"])
  })

  it("minimal keeps platform companions and drops mall", () => {
    const plan = resolveHatchPlan(catalog, { profile: "minimal" })
    expect(plan.includeClients).toBe(false)
    expect(plan.domains).toEqual(["system", "infra", ...PLATFORM_COMPANIONS])
    expect(plan.excludedDomains).toEqual(["mall", "crm", "pay"])
    expect(shouldSkipRelPath("packages/domains/mall", plan)).toBe(true)
    expect(shouldSkipRelPath("packages/domains/system", plan)).toBe(false)
    // 原断言 clients/h5/... 应被跳过 —— h5/uniapp/flutter/desktop-pc 已删除，
    // 本仓只保留 clients/expo，故不再有客户端渠道级的跳过路径。
  })

  it("vertical requires bundle and always keeps companions", () => {
    expect(() => resolveHatchPlan(catalog, { profile: "vertical" })).toThrow(/--bundle/)
    const plan = resolveHatchPlan(catalog, { profile: "vertical", bundle: ["mall"] })
    expect(plan.domains).toContain("mall")
    expect(plan.domains).toContain("online")
    expect(plan.domains).not.toContain("pay")
    expect(shouldSkipRelPath("src/app/api/v1/admin/pay/orders/route.ts", plan)).toBe(true)
    expect(shouldSkipRelPath("src/app/(admin-pages)/admin/mall/page.tsx", plan)).toBe(false)
  })

  it("★ 裁剪不得裁掉门禁必需的已提交基线（目录前缀与文件名前缀语义不同）", () => {
    const plan = resolveHatchPlan(catalog, { profile: "minimal" })

    // 这三个是**门禁必需的已提交基线**，一旦被裁，新孵化工程的 `npm run check` 必红
    //（实测：socratic:check 报缺少 socratic-inquiry-latest.json）。
    for (const keep of [
      "docs/architecture/artifacts/socratic-inquiry-latest.json",
      "docs/architecture/artifacts/deps-audit-baseline.json",
      "docs/architecture/artifacts/engineering-standards-baseline.json",
    ]) {
      expect(shouldSkipRelPath(keep, plan), `${keep} 不应被裁剪`).toBe(false)
    }

    // 历史扫描报告按**文件名前缀**裁剪。目录前缀语义是
    // `rel === p || rel.startsWith(p + "/")`，对以 `-` 结尾的片段永远不会命中——
    // 这正是本仓踩过的坑（写成目录前缀后 8 个历史报告一个都没被裁掉）。
    expect(
      shouldSkipRelPath("docs/architecture/artifacts/all-next-starter-coverage-2026-08-02.json", plan),
    ).toBe(true)
    expect(shouldSkipRelPath("docs/architecture/artifacts/cooliebase-full-scan-2026-08-02.md", plan)).toBe(true)

    // 归档目录按目录前缀裁剪
    expect(shouldSkipRelPath("docs/architecture/archive/upstream-2026-Q3/README.md", plan)).toBe(true)
  })

  it("★ base 必须包含平台伴生域（地基对它们有静态依赖，裁掉会让产物构建失败）", () => {
    const base = resolveHatchPlan(catalog, { profile: "base" })
    const minimal = resolveHatchPlan(catalog, { profile: "minimal" })

    // 实测：裁掉 online 后，`src/app/api/v1/open/meta/page-schema/[entity]/route.ts`
    // 与 infra 的 codegen 模板仍静态 import 它，`npm run build` 直接 module-not-found。
    for (const companion of PLATFORM_COMPANIONS) {
      expect(base.domains, `base 缺少伴生域 ${companion}`).toContain(companion)
    }
    // 目前 base 与 minimal 等价；若将来把上述两处改为惰性加载，可再放开这条断言。
    expect(base.domains.slice().sort()).toEqual(minimal.domains.slice().sort())
    expect(base.includeClients).toBe(false)
  })

  it("prunes catalog and rpc-actions to the selected domains", () => {
    const plan = resolveHatchPlan(catalog, { profile: "minimal" })
    const nextCatalog = pruneCatalog(catalog, plan)
    expect(nextCatalog.domains.map((item) => item.name)).toEqual(plan.domains)
    expect(nextCatalog.layers.business.domains).toEqual(["online", "ai", "aigw"])
    const rpc = pruneRpcActions({ domains: { system: {}, pay: {}, mall: {} } }, plan)
    expect(rpc.domains).toEqual({ system: {} })
    expect(buildHatchManifest(plan).pruned).toBe(true)
  })

  it("rejects unknown bundle domains", () => {
    expect(() => resolveHatchPlan(catalog, { profile: "vertical", bundle: ["foo"] })).toThrow(/未知域/)
  })
})
