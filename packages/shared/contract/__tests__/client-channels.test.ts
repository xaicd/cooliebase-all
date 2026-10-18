import { describe, expect, it } from "vitest"
import { clientChannels, clientChannelsSchema, getClientChannel, listClientChannelsBySurface } from "../client-channels"
import { toPublicProjectProfile } from "../project-profile"

describe("clientChannels", () => {
  it("keeps the declared channels on the published API surfaces", () => {
    const catalog = clientChannelsSchema.parse(clientChannels)
    expect(catalog.channels.map((item) => item.id)).toEqual(["admin-web", "expo"])
    expect(catalog.surfaces.map((item) => item.prefix)).toEqual([
      "/api/v1/admin",
      "/api/v1/app",
      "/api/v1/open",
      "/api/internal",
    ])
    expect(getClientChannel("admin-web").status).toBe("ga")
    expect(listClientChannelsBySurface("app").map((item) => item.id)).toEqual(["expo"])
    // 只保留 expo 一个独立客户端包（h5/uniapp/flutter/desktop-pc 已删除）
    expect(catalog.channels.filter((item) => item.packageKind === "standalone").map((item) => item.id)).toEqual(["expo"])
    expect(catalog.packageLayout.requiredSourceDirs).toEqual(["app", "shared", "modules"])
  })

  it("does not publish bootstrap accounts in the public identity payload", () => {
    const published = toPublicProjectProfile()
    expect(published).toMatchObject({ platformName: "CoolieBase All Base", branding: { logoSrc: "/branding/logo.svg" } })
    expect(published).not.toHaveProperty("bootstrapAdmin")
    expect(published).not.toHaveProperty("tenants")
    expect(published).not.toHaveProperty("defaultUsers")
  })
})
