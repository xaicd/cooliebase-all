import path from "node:path"

import { describe, expect, it } from "vitest"

import { pluginScanRoots } from "../plugin-registry.service"

/**
 * 回归: 插件发现必须是**两个根**。
 *
 * 曾经的 bug: `syncFromDisk` 显式传了 `[pluginDir]`，把 `scanAllPluginPackages`
 * 的默认第二根整个覆盖掉 —— 仓内 `packages/plugins/**` 永远扫不到。
 * 症状很隐蔽: 注册表列表里**看得到** cooliebase.pay（builtin 预置），但 manifestJson 为空，
 * 挂载点报 "未找到插件"，而看列表的人以为一切正常。
 *
 * 所以这里钉死"根的数量与语义"，而不是钉死某个调用点的写法。
 */
describe("插件发现: 扫描根", () => {
  const roots = pluginScanRoots("/tmp/instance-plugins")

  it("同时包含实例目录与仓内第一方根", () => {
    expect(roots.map((root) => root.dir)).toEqual([
      "/tmp/instance-plugins",
      path.join(process.cwd(), "packages", "plugins"),
    ])
  })

  it("两个根的语义不同: 实例目录要报跳过，第一方根静默跳过", () => {
    // 实例目录里每个子目录都该是插件，不合格要报 rejected
    expect(roots[0].reportSkipped).toBe(true)
    // 第一方根同住 sdk 这类普通包，静默跳过
    expect(roots[1].reportSkipped).toBe(false)
  })
})
