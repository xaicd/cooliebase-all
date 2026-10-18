import { describe, expect, it } from "vitest"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { loadCatalog } = require("../domain-catalog.cjs")
const { loadRpcActions } = require("../rpc-contracts.cjs")
const { buildSeamGraph, SEAM_GRAPH_REL } = require("../seam-graph.cjs")

// base profile 下没有插件域，本文件里"取图中第一个插件域"的用例不适用 —— 跳过。
const HAS_PLUGIN_DOMAIN = (() => {
  try {
    const catalog = loadCatalog()
    return (catalog.layers.plugin?.domains ?? []).length > 0
  } catch {
    return false
  }
})()

describe("seam-graph", () => {
  it.skipIf(!HAS_PLUGIN_DOMAIN)("uses catalog domain names in catalog order", () => {
    const catalog = loadCatalog()
    const rpc = loadRpcActions()
    const graph = buildSeamGraph({ catalog, rpcActions: rpc })
    expect(graph.kind).toBe("capability-seam-graph")
    expect(graph.generated).toBe(true)
    expect(graph.domains.map((item) => item.name)).toEqual(catalog.domains.map((item) => item.name))
    expect(graph.domains.every((item) => item.rolesComplete)).toBe(true)

    // 被测插件域**从图里取**，不写死 pay: 裁剪过的工程（profile/bundle）可能不含它，
    // 而"裁剪后是否仍然自洽"正是要检验的。取第一个在图中且属插件层的域。
    const pluginDomains = new Set(catalog.layers.plugin.domains)
    const entry = graph.domains.find((item) => pluginDomains.has(item.name))
    expect(entry, "图中应有至少一个插件域").toBeTruthy()
    const name = entry!.name
    expect(entry!.definition.facades.some((file) => file.endsWith(`${name}.facade.ts`))).toBe(true)
    // 插件化后目录随之迁移
    expect(entry!.provider.servicesDir).toBe(`packages/plugins/plugin-${name}/backend/services`)
    expect(entry!.provider.methods).toEqual(rpc.domains[name].actions.map((item) => item.method))
    // 插件化后 API 消费面是宿主的插件挂载点，不再是 Next 目录
    expect(entry!.consumer.adminApi).toBe(`src/app/api/v1/plugins/cooliebase.${name}/api`)
    expect(SEAM_GRAPH_REL).toBe("packages/shared/contract/seam-graph.json")
  })

  it("does not invent domains that are absent from catalog", () => {
    const catalog = {
      domains: [{ name: "system", kind: "platform", stage: "A" }],
    }
    const graph = buildSeamGraph({
      catalog,
      rpcActions: { domains: { system: { actions: [{ method: "ping" }] } } },
    })
    expect(graph.domains.map((item) => item.name)).toEqual(["system"])
  })
})
