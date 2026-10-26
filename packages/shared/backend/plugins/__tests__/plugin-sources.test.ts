import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { firstPartyPluginRoots, scanAllPluginPackages } from "../package-scanner"

const tempDirs: string[] = []
afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

/** 造一个最小合法插件包（带 cooliebasePlugin 指针 + manifest）。 */
function makePlugin(root: string, dirName: string, pluginId: string) {
  const dir = path.join(root, dirName)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "worker.js"), "// w\n")
  fs.writeFileSync(
    path.join(dir, "plugin.manifest.json"),
    JSON.stringify({
      id: pluginId,
      apiVersion: 1,
      version: "0.1.0",
      displayName: pluginId,
      description: "d",
      author: "a",
      categories: ["automation"],
      capabilities: [],
      entrypoints: { worker: "./worker.js" },
    }),
  )
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: `@test/${dirName}`, cooliebasePlugin: { manifest: "./plugin.manifest.json", worker: "./worker.js" } }),
  )
  return dir
}

function tempRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cooliebase-plugin-roots-"))
  tempDirs.push(dir)
  return dir
}

describe("插件多来源发现（实例目录 + 仓内第一方）", () => {
  it("两个根里的插件都能被发现", () => {
    const instance = tempRoot()
    const firstParty = tempRoot()
    makePlugin(instance, "third-party", "vendor.third")
    makePlugin(firstParty, "plugin-pay", "cooliebase.pay")

    const found = scanAllPluginPackages([{ dir: instance, reportSkipped: true }, { dir: firstParty, reportSkipped: false }])
    expect(found.map((item) => item.manifest?.id).sort()).toEqual(["cooliebase.pay", "vendor.third"])
  })

  it("没有 cooliebasePlugin 指针的目录被自然跳过（不做路径硬编码排除）", () => {
    const firstParty = tempRoot()
    makePlugin(firstParty, "plugin-pay", "cooliebase.pay")
    // 模拟 packages/plugins/sdk 这类"不是插件"的目录
    fs.mkdirSync(path.join(firstParty, "sdk", "src"), { recursive: true })
    fs.writeFileSync(path.join(firstParty, "sdk", "package.json"), JSON.stringify({ name: "@test/sdk" }))

    // 第一方根: sdk 这类普通包**静默跳过**（不报成 rejected）
    const found = scanAllPluginPackages([{ dir: firstParty, reportSkipped: false }])
    expect(found.map((item) => item.manifest?.id)).toEqual(["cooliebase.pay"])
  })

  it("嵌套目录（fixtures/hello-world 形态）也能被发现", () => {
    const firstParty = tempRoot()
    makePlugin(path.join(firstParty, "examples"), "hello-world", "vendor.hello")
    const found = scanAllPluginPackages([{ dir: firstParty, reportSkipped: false }])
    expect(found.map((item) => item.manifest?.id)).toEqual(["vendor.hello"])
  })

  it("同一个目录被多个根覆盖时只算一次（去重）", () => {
    const firstParty = tempRoot()
    makePlugin(firstParty, "plugin-a", "vendor.a")
    const found = scanAllPluginPackages([firstParty, firstParty])
    expect(found).toHaveLength(1)
  })

  it("跨来源的插件 id 冲突会被拦下（两个根放了同一个 id 是配置错误）", () => {
    const instance = tempRoot()
    const firstParty = tempRoot()
    makePlugin(instance, "a", "vendor.dup")
    makePlugin(firstParty, "b", "vendor.dup")

    // 先在扫描顺序里的那个保留 manifest, 后来的被判冲突（与单根扫描同一语义）
    const found = scanAllPluginPackages([instance, firstParty])
    expect(found.filter((item) => item.manifest)).toHaveLength(1)
    expect(found.flatMap((item) => item.errors).join(" ")).toMatch(/冲突/)
  })

  it("根不存在时返回空（不抛错）", () => {
    expect(scanAllPluginPackages([path.join(os.tmpdir(), "definitely-missing-root")])).toEqual([])
  })

  it("第一方插件根按约定落在 packages/plugins", () => {
    expect(firstPartyPluginRoots("/repo")).toEqual([path.join("/repo", "packages", "plugins")])
  })
})
