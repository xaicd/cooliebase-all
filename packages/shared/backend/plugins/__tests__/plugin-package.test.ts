import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { parsePluginManifest } from "../manifest"
import { scanPluginPackages } from "../package-scanner"
import { PLUGIN_API_VERSION } from "../types"

/** 写一个最小可用的插件包，返回其目录。overrides 用于构造各种非法情形。 */
function writePluginPackage(
  root: string,
  dirName: string,
  options: {
    packageName?: string
    pointer?: unknown
    manifest?: unknown
    manifestFile?: string
    writeWorker?: boolean
  } = {},
): string {
  const packageDir = path.join(root, dirName)
  fs.mkdirSync(packageDir, { recursive: true })

  const pointer =
    options.pointer === undefined
      ? { manifest: "./plugin.manifest.json", worker: "./dist/worker.js" }
      : options.pointer
  fs.writeFileSync(
    path.join(packageDir, "package.json"),
    JSON.stringify({ name: options.packageName ?? `@test/${dirName}`, ...(pointer === null ? {} : { cooliebasePlugin: pointer }) }, null, 2),
  )

  if (options.manifest !== null) {
    const manifestFile = options.manifestFile ?? "plugin.manifest.json"
    const target = path.join(packageDir, manifestFile)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(
      target,
      JSON.stringify(
        options.manifest ?? {
          id: `test.${dirName}`,
          apiVersion: PLUGIN_API_VERSION,
          version: "0.1.0",
          displayName: `Test ${dirName}`,
          description: "test plugin",
          author: "tests",
          categories: ["automation"],
          capabilities: ["plugin.state.read"],
          entrypoints: { worker: "./dist/worker.js" },
        },
        null,
        2,
      ),
    )
  }

  if (options.writeWorker !== false) {
    const workerDir = path.join(packageDir, "dist")
    fs.mkdirSync(workerDir, { recursive: true })
    fs.writeFileSync(path.join(workerDir, "worker.js"), "export default {}\n")
  }

  return packageDir
}

describe("plugin manifest 校验", () => {
  const base = {
    id: "test.plugin",
    apiVersion: PLUGIN_API_VERSION,
    version: "1.2.3",
    displayName: "P",
    description: "d",
    author: "a",
    categories: ["automation"],
    capabilities: ["plugin.state.read"],
    entrypoints: { worker: "./dist/worker.js" },
  }

  it("合法 manifest 通过，并保留声明的 capability", () => {
    const result = parsePluginManifest(base)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.manifest.capabilities).toEqual(["plugin.state.read"])
  })

  it("apiVersion 不匹配即拒绝（精确匹配不做范围推断）", () => {
    const result = parsePluginManifest({ ...base, apiVersion: PLUGIN_API_VERSION + 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join()).toContain("不兼容")
  })

  it("禁忌能力被拒，且给出的是明确理由而非「未知能力」", () => {
    const result = parsePluginManifest({ ...base, capabilities: ["database.direct"] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.join()).toContain("禁忌能力")
      expect(result.errors.join()).not.toContain("不在宿主能力白名单")
    }
  })

  it("白名单外的能力被拒", () => {
    const result = parsePluginManifest({ ...base, capabilities: ["made.up.capability"] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join()).toContain("不在宿主能力白名单内")
  })

  it("同一 manifest 内重复 slot id 被拒", () => {
    const result = parsePluginManifest({
      ...base,
      entrypoints: { worker: "./dist/worker.js", ui: "./dist/ui" },
      ui: {
        slots: [
          { type: "page", id: "dup", displayName: "A", exportName: "A" },
          { type: "page", id: "dup", displayName: "B", exportName: "B" },
        ],
      },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join()).toContain("重复 id")
  })

  it("声明 ui.slots 但没有 entrypoints.ui 被拒（否则宿主无处加载）", () => {
    const result = parsePluginManifest({
      ...base,
      ui: { slots: [{ type: "page", id: "s", displayName: "S", exportName: "S" }] },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join()).toContain("entrypoints.ui")
  })

  it("非法 id / 非 semver 版本被拒", () => {
    expect(parsePluginManifest({ ...base, id: "Bad_ID" }).ok).toBe(false)
    expect(parsePluginManifest({ ...base, version: "v1" }).ok).toBe(false)
  })
})

describe("插件包扫描", () => {
  let root: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-plugins-"))
  })
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it("目录不存在时返回空数组（不是错误）", () => {
    expect(scanPluginPackages(path.join(root, "nope"))).toEqual([])
  })

  it("合法插件包被发现且校验通过", () => {
    writePluginPackage(root, "good")
    const found = scanPluginPackages(root)
    expect(found).toHaveLength(1)
    expect(found[0].errors).toEqual([])
    expect(found[0].manifest?.id).toBe("test.good")
  })

  it("缺少 cooliebasePlugin 指针的包被拒", () => {
    writePluginPackage(root, "nopointer", { pointer: null })
    const found = scanPluginPackages(root)
    expect(found[0].manifest).toBeUndefined()
    expect(found[0].errors.join()).toContain("缺少合法的 cooliebasePlugin 指针")
  })

  it("worker 入口文件不存在被拒（否则安装成功但启动必失败）", () => {
    writePluginPackage(root, "noworker", { writeWorker: false })
    const found = scanPluginPackages(root)
    expect(found[0].manifest).toBeUndefined()
    expect(found[0].errors.join()).toContain("worker")
  })

  it("manifest 指针用 ../ 逃出插件包目录被拒（指针来自包自己，必须防穿越）", () => {
    const outside = path.join(root, "outside-manifest.json")
    fs.writeFileSync(
      outside,
      JSON.stringify({
        id: "test.escape",
        apiVersion: PLUGIN_API_VERSION,
        version: "0.1.0",
        displayName: "E",
        description: "d",
        author: "a",
        categories: ["automation"],
        capabilities: [],
        entrypoints: { worker: "./dist/worker.js" },
      }),
    )
    writePluginPackage(root, "escape", {
      pointer: { manifest: "./../outside-manifest.json", worker: "./dist/worker.js" },
    })
    // 注意：outside-manifest.json 与插件包同级，位于扫描根内但在插件包目录之外
    const found = scanPluginPackages(root).find((item) => item.packageName === "@test/escape")
    expect(found?.manifest).toBeUndefined()
    expect(found?.errors.join()).toContain("越出插件包目录")
  })

  it("跨包插件 id 冲突被拒", () => {
    writePluginPackage(root, "a", { manifest: { id: "dup.id", apiVersion: PLUGIN_API_VERSION, version: "0.1.0", displayName: "A", description: "d", author: "a", categories: ["ui"], capabilities: [], entrypoints: { worker: "./dist/worker.js" } } })
    writePluginPackage(root, "b", { manifest: { id: "dup.id", apiVersion: PLUGIN_API_VERSION, version: "0.1.0", displayName: "B", description: "d", author: "a", categories: ["ui"], capabilities: [], entrypoints: { worker: "./dist/worker.js" } } })
    const found = scanPluginPackages(root)
    expect(found.filter((item) => item.manifest)).toHaveLength(1)
    expect(found.some((item) => item.errors.join().includes("冲突"))).toBe(true)
  })
})
