import { describe, expect, it } from "vitest"
import rawProjectProfile from "../project-profile.json"
import { projectProfile, projectProfileSchema } from "../project-profile"
import { overlayPackageName, overlayTenant, overlayUserNickname } from "../project-profile-overlay"

describe("projectProfile", () => {
  it("keeps the committed default identity valid", () => {
    // **不写死品牌名**：派生工程会把它换成自己的（CI 里孵化出来的就是 "CI Demo"）。
    // 写死会让**每一个派生工程的 check 都红** —— 而孵化正是这套模板的主要用途。
    // 这里校验的是**不随品牌变**的东西：schema 解析不得篡改真源，且字段满足契约约束。
    const parsed = projectProfileSchema.parse(projectProfile)
    expect(parsed.platformName).toBe(rawProjectProfile.platformName)
    expect(parsed.platformName.length).toBeGreaterThan(0)
    expect(parsed.shortName.length).toBeLessThanOrEqual(16)
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
