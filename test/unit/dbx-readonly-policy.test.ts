import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * `dbx:readonly:check` 的反向对照。
 *
 * 规则：本仓发布的、含 `serverName: dbx` 的配置**必须**带 `DBX_MCP_ALLOW_WRITES=0`
 * —— 它会强制只读，并覆盖 DBX 界面里已保存的 group/connection/database 级写权限。
 *
 * ## 为什么这条门禁是必要的
 *
 * 本仓自己的 MCP 面是**零落盘**的；DBX 的 MCP 默认**能写**。
 * 把两者接起来时，"只读"必须在**配置层**被钉住 —— 而不是指望某台机器上某个人记得去点。
 */

const GATE = "scripts/check-dbx-readonly-policy.cjs"
const PATCH = "deploy/dsh/mcp-dbx.patch.yml"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("dbx-readonly")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = () => root.run(GATE)

/** 改 patch 跑一次，无论成败都还原 */
function withPatch<T>(mutate: (src: string) => string, body: (r: ReturnType<typeof runGate>) => T): T {
  const original = root.read(PATCH)
  try {
    root.write(PATCH, mutate(original))
    return body(runGate())
  } finally {
    root.write(PATCH, original)
    if (root.read(PATCH) !== original) throw new Error("patch 未逐字还原")
  }
}

describe("DBX MCP 只读策略（跑在隔离根上）", () => {
  it("当前仓库通过，且确实检查到了 DBX 配置（不是空转）", () => {
    const r = runGate()
    expect(r.code).toBe(0)
    expect(r.out).toContain(PATCH)
  }, 120_000)

  it("★ 反向对照①：删掉 DBX_MCP_ALLOW_WRITES → 必须失败并点名文件", () => {
    withPatch((src) => src.replace(/\n\s*DBX_MCP_ALLOW_WRITES: '0'\n/, "\n"), (r) => {
      expect(r.code).toBe(1)
      expect(r.out).toContain(PATCH)
      expect(r.out).toContain("缺少 DBX_MCP_ALLOW_WRITES")
    })
  }, 120_000)

  it("★ 反向对照②：把它改成 1（放开写）→ 必须失败", () => {
    withPatch((src) => src.replace("DBX_MCP_ALLOW_WRITES: '0'", "DBX_MCP_ALLOW_WRITES: '1'"), (r) => {
      expect(r.code).toBe(1)
      expect(r.out).toMatch(/取值不是只读/)
    })
  }, 120_000)

  it("★ 反向对照③：**只有注释里提到** 0、配置里没有 → 仍必须失败（第一版就栽在这）", () => {
    // 先删掉真实配置项，只在注释里留一句 "DBX_MCP_ALLOW_WRITES=0"
    withPatch(
      (src) => src.replace(/\n\s*DBX_MCP_ALLOW_WRITES: '0'\n/, "\n# 注释里提一句 DBX_MCP_ALLOW_WRITES=0 不算数\n"),
      (r) => {
        expect(r.code, "注释不能替代真实配置").toBe(1)
        expect(r.out).toContain("缺少 DBX_MCP_ALLOW_WRITES")
      },
    )
  }, 120_000)

  it("没有任何 DBX 条目时 → 通过，但**打印**扫描结果（不静默）", () => {
    withPatch((src) => "# 空文件，没有 dbx 条目\n", (r) => {
      expect(r.code).toBe(0)
      expect(r.out).toMatch(/未发现 DBX MCP 条目|无需检查/)
    })
  }, 120_000)
})
