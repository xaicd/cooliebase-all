import { describe, expect, it } from "vitest"
import { projectProfile, projectProfileSchema } from "../project-profile"
import { overlayPackageName, overlayTenant, overlayUserNickname } from "../project-profile-overlay"

describe("projectProfile", () => {
  it("keeps the committed default identity valid", () => {
    expect(projectProfileSchema.parse(projectProfile).platformName).toBe("CoolieBase All")
    expect(projectProfile.packages.map((item) => item.id).sort()).toEqual(["111", "113"])
  })

  it("overlays package, tenant and user display names without changing ids", () => {
    expect(overlayPackageName("111", "fallback")).toBe("普通套餐")
    expect(overlayPackageName("missing", "fallback")).toBe("fallback")
    expect(overlayUserNickname("test", "原始昵称")).toBe("测试用户")
    expect(overlayUserNickname("admin", "原始昵称", "admin")).toBe("平台超级管理员")

    const tenant = overlayTenant({
      id: "1",
      tenantCode: "old",
      name: "旧名称",
      contactName: null,
      contactPhone: null,
      domain: "keep.example",
      packageId: "999",
    })
    expect(tenant).toMatchObject({ tenantCode: "default", name: "默认租户", packageId: "111" })
  })
})
