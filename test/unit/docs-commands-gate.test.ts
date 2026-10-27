import fs from "node:fs"
import path from "node:path"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * 文档命令真实性门禁。
 *
 * 它守的是"文档里写的 `npm run X`，X 真的存在"。这类漂移不会让别的门禁变红，
 * 但照着文档操作就是报错 —— 已实证：`AGENTS.md` 的发布门禁让人跑不存在的
 * `docs:sync-context`，`.kiro/steering/feature-scaffold.md` 让人跑 `feature:generate`（真名 `scaffold`）。
 *
 * ## 为什么跑在**隔离根**上
 *
 * 本文件要往 `AGENTS.md` 里注入内容再跑门禁。早先直接改真仓 —— 探针实测
 * `AGENTS.md` 在整套运行期间被改了 4 次，而别的测试会读到中间态
 * （见 `docs/specs/infra/test-shared-file-isolation/research.md` §7）。
 * 现在改的是**临时根的拷贝**，真仓一个字节都不动。
 */

const GATE = "scripts/check-docs-commands.cjs"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("docs-commands")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = () => root.run(GATE)

describe("文档命令真实性门禁（跑在隔离根上）", () => {
  function withInjected<T>(file: string, injected: string, body: () => T): T {
    const original = root.read(file)
    try {
      root.write(file, `${original}\n\n${injected}\n`)
      return body()
    } finally {
      root.write(file, original)
      if (root.read(file) !== original) throw new Error(`${file} 未逐字还原`)
    }
  }

  it("正向：受检文档中的命令引用全部真实存在", () => {
    const result = runGate()
    expect(result.code).toBe(0)
    expect(result.out).toMatch(/PASS/)
  }, 120_000)

  it("★ 反向 1：受检文档里写入不存在的脚本 → 必须失败", () => {
    withInjected("AGENTS.md", "临时：`npm run __definitely_not_a_script__`", () => {
      const result = runGate()
      expect(result.code).toBe(1)
      expect(result.out).toMatch(/__definitely_not_a_script__/)
    })
  }, 120_000)

  it("★ 反向 2：历史/施工区（docs/specs）里写入不存在的脚本 → **不应**失败", () => {
    // 这条对照同样重要：它证明"跳过历史区"是**真实生效**的，
    // 而不是门禁其实什么都没检查却报绿。
    const probe = "docs/specs/infra/mcp-write-tools/__docs-cmd-probe__.md"
    try {
      root.write(probe, "临时：`npm run __also_not_a_script__`\n")
      expect(runGate().code).toBe(0)
    } finally {
      fs.rmSync(path.join(root.dir, probe), { force: true })
    }
  }, 120_000)

  it("★ 反向 3：`pnpm run X` 不应被误判为 `npm run X`", () => {
    // `(?<![pP])` 前瞻的真正用途：本仓大量使用 pnpm，若误判会逼出无意义豁免。
    withInjected("AGENTS.md", "临时：`pnpm run __pnpm_only_script__`", () => {
      expect(runGate().code).toBe(0)
    })
  }, 120_000)
})
