import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import {
  filterUiSlots,
  pluginUiBundleUrl,
  resolveBundleFile,
  resolveUiSlots,
} from "../ui-slots"

const EXAMPLE_DIR = path.resolve(process.cwd(), "packages/shared/backend/plugins/__tests__/fixtures/hello-world")

const tempDirs: string[] = []
afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    id: "vendor.p",
    apiVersion: 1,
    version: "0.1.0",
    displayName: "P",
    description: "d",
    author: "a",
    categories: ["ui"],
    capabilities: ["ui.page.register"],
    entrypoints: { merged: "./merged.js", ui: "./ui" },
    ui: { slots: [{ type: "dashboardWidget", id: "w1", displayName: "W1", exportName: "W1" }] },
    ...overrides,
  }
}

function record(overrides: Record<string, unknown> = {}) {
  return { pluginKey: "vendor.p", packagePath: "/tmp/p", manifestJson: manifest(overrides), ...overrides }
}

describe("插件 UI 宿主（服务端解析与投送）", () => {
  it("bundle URL 按约定拼装", () => {
    expect(pluginUiBundleUrl("vendor.p")).toBe("/api/v1/plugins/vendor.p/ui")
    expect(pluginUiBundleUrl("vendor.p", "/HelloWidget.js")).toBe("/api/v1/plugins/vendor.p/ui/HelloWidget.js")
  })

  it("能读到插件包里真实存在的 bundle 文件", () => {
    const file = resolveBundleFile(EXAMPLE_DIR, "./ui", "HelloWidget.js")
    expect(file).toBe(path.join(EXAMPLE_DIR, "ui", "HelloWidget.js"))
  })

  it("路径穿越被挡住（URL 里的 ../ 读不走插件包外的文件）", () => {
    // 先造一个确凿存在于包外的文件
    const outside = path.resolve(EXAMPLE_DIR, "..", "outside-secret.txt")
    fs.writeFileSync(outside, "secret")
    tempDirs.push(outside)

    expect(resolveBundleFile(EXAMPLE_DIR, "./ui", "../outside-secret.txt")).toBeNull()
    expect(resolveBundleFile(EXAMPLE_DIR, "./ui", "../../examples/outside-secret.txt")).toBeNull()
    // 不存在的文件同样返回 null（与越界同一结果，不用错误差异探测包结构）
    expect(resolveBundleFile(EXAMPLE_DIR, "./ui", "nope.js")).toBeNull()
  })

  it("只有声明了 ui.page.register 能力的插件才被挂载（与 apiRoutes 同规则）", () => {
    const withoutCapability = record({ capabilities: [] }) as unknown as Parameters<typeof resolveUiSlots>[0][number]
    expect(resolveUiSlots([withoutCapability])).toEqual([])

    const withCapability = record() as unknown as Parameters<typeof resolveUiSlots>[0][number]
    expect(resolveUiSlots([withCapability])).toHaveLength(1)
  })

  it("没有 ui.slots 或没有 entrypoints.ui 的插件不产生槽位", () => {
    expect(resolveUiSlots([record({ ui: undefined }) as never])).toEqual([])
    expect(resolveUiSlots([record({ entrypoints: { merged: "./m.js" } }) as never])).toEqual([])
  })

  it("解析结果带上插件 key、bundle 目录与可加载 URL，并可按键排序", () => {
    const b = record({ id: "vendor.b" }) as unknown as Parameters<typeof resolveUiSlots>[0][number]
    b.pluginKey = "vendor.b"
    const a = record({ id: "vendor.a" }) as unknown as Parameters<typeof resolveUiSlots>[0][number]
    a.pluginKey = "vendor.a"

    const slots = resolveUiSlots([b, a])
    expect(slots.map((slot) => slot.pluginKey)).toEqual(["vendor.a", "vendor.b"])
    expect(slots[0]).toMatchObject({
      type: "dashboardWidget",
      exportName: "W1",
      bundleDir: "./ui",
      bundleUrl: "/api/v1/plugins/vendor.a/ui",
    })
  })

  it("routePath 只在声明时出现（其余槽位不带该字段）", () => {
    const withRoute = record({
      ui: { slots: [{ type: "page", id: "p1", displayName: "P1", exportName: "P1", routePath: "/hello" }] },
    }) as unknown as Parameters<typeof resolveUiSlots>[0][number]
    expect(resolveUiSlots([withRoute])[0].routePath).toBe("/hello")

    const slots = resolveUiSlots([record() as never])
    expect(slots[0]).not.toHaveProperty("routePath")
  })

  it("按类型过滤", () => {
    const slots = resolveUiSlots([record() as never])
    expect(filterUiSlots(slots, "dashboardWidget")).toHaveLength(1)
    expect(filterUiSlots(slots, "sidebar")).toHaveLength(0)
  })
})
