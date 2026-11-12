import { describe, expect, it } from "vitest"
import { projectProfile, type ProjectProfile } from "../project-profile"
import { NEUTRAL_FACADE, readFacadeIdentity } from "../facade"

describe("readFacadeIdentity", () => {
  it("无 facade 段 → 整体回落中立默认", () => {
    const profile: ProjectProfile = { ...projectProfile, facade: undefined }
    expect(readFacadeIdentity(profile)).toEqual(NEUTRAL_FACADE)
    // 读口默认参数（未传档案）走项目档案自身的 facade 段（孵化前后始终自洽）。
    expect(readFacadeIdentity()).toEqual(readFacadeIdentity(projectProfile))
  })

  it("有 facade 段 → 逐字段取到值（会议室预订验收样本）", () => {
    const profile: ProjectProfile = {
      ...projectProfile,
      facade: {
        siteName: "会议室预订",
        domainTagline: "企业会议室预订平台",
        cEndEntry: { label: "预订门户", href: "/2c" },
        bEndEntry: { label: "管理后台", href: "/admin" },
        heroTitle: "会议室预订",
        heroSubtitle: "一间好会议室，一键订好",
        loginSubtitle: "企业会议室预订平台",
        telemetryEnabled: true,
        devPort: 3501,
      },
    }
    expect(readFacadeIdentity(profile)).toEqual({
      siteName: "会议室预订",
      domainTagline: "企业会议室预订平台",
      cEndEntry: { label: "预订门户", href: "/2c" },
      bEndEntry: { label: "管理后台", href: "/admin" },
      heroTitle: "会议室预订",
      heroSubtitle: "一间好会议室，一键订好",
      loginSubtitle: "企业会议室预订平台",
      telemetryEnabled: true,
      devPort: 3501,
    })
  })

  it("部分填充 → 逐字段回落中立默认，其余取到值", () => {
    const profile: ProjectProfile = {
      ...projectProfile,
      facade: { siteName: "会议室预订", cEndEntry: { label: "预订门户" } },
    }
    const identity = readFacadeIdentity(profile)
    expect(identity.siteName).toBe("会议室预订")
    expect(identity.cEndEntry).toEqual({ label: "预订门户", href: NEUTRAL_FACADE.cEndEntry.href })
    // 未填字段一律回落，且遥测开关默认关（假面板不得带病出厂）。
    expect(identity.heroTitle).toBe(NEUTRAL_FACADE.heroTitle)
    expect(identity.bEndEntry).toEqual(NEUTRAL_FACADE.bEndEntry)
    expect(identity.telemetryEnabled).toBe(false)
    expect(identity.devPort).toBe(NEUTRAL_FACADE.devPort)
  })

  it("非法 devPort → 回落中立默认端口", () => {
    for (const devPort of [80, 99999, 3200.5]) {
      const profile: ProjectProfile = { ...projectProfile, facade: { devPort } }
      expect(readFacadeIdentity(profile).devPort).toBe(NEUTRAL_FACADE.devPort)
    }
  })
})
