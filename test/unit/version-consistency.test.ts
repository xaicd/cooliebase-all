import fs from "node:fs"
import path from "node:path"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * 版本一致性门禁：守的是**策略**，不是"把版本号对齐"。
 *
 * 本仓刻意区分「渠道版本（tag，可带语义后缀）」与「模板版本（package/compat）」，
 * 依据 `RELEASE_NOTES_v1.4.0-brand-shorthand.md` 的 R3/R11。故此处断言：
 *   ① 模板版本两处同步；
 *   ② 最新 tag 有发布说明；
 *   ③ tag 与模板版本不同时，发布说明必须记录策略。
 * 每条都要有**会失败**的反向对照 —— 否则就是又一个"看起来在跑"的空壳门禁。
 *
 * ## 为什么跑在**隔离根**上
 *
 * 反向对照要改 `package.json` 与 `docs/07_release/RELEASE_NOTES_v1.4.0*.md` 两处**真仓文件**；
 * 探针实测 `package.json` 在整套运行期间被改过，而别的测试会读到中间态
 * （见 `docs/specs/infra/test-shared-file-isolation/research.md` §7）。
 *
 * **特别注意**：本门禁依赖 **git tag**。隔离根用 `git clone --local` 建的，
 * 所以**历史与 tag 都是真的** —— `git describe --tags` 才能正确给出
 * `v1.4.0-brand-shorthand`。（早先用"拷文件 + 手工造提交 + 补 tag"时，
 * tag 全指向同一个提交，门禁挑到的是 `v1.0.0`，反向对照直接立不起来。）
 */

const GATE = "scripts/check-version-consistency.cjs"
const PKG = "package.json"
const RELEASE_DIR = "docs/07_release"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("version")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = () => root.run(GATE)

describe("版本一致性门禁（跑在隔离根上）", () => {
  it("正向：当前仓库通过", () => {
    const result = runGate()
    expect(result.code).toBe(0)
    expect(result.out).toMatch(/PASS/)
  }, 120_000)

  it("★ 反向 1：模板版本不同步 → 必须失败", () => {
    const original = root.read(PKG)
    try {
      const parsed = JSON.parse(original)
      parsed.version = "9.9.9"
      root.write(PKG, `${JSON.stringify(parsed, null, 2)}\n`)
      const result = runGate()
      expect(result.code).not.toBe(0)
      expect(result.out).toMatch(/template-version-desync/)
    } finally {
      root.write(PKG, original)
    }
    expect(runGate().code).toBe(0)
  }, 120_000)

  it("★ 反向 2：最新 tag 没有发布说明 → 必须失败", () => {
    // 通过里现拿文件清单（隔离根有真实 git 索引，`ls` 的语义与真仓一致）
    const notes = fs
      .readdirSync(path.join(root.dir, RELEASE_DIR))
      .filter((name) => /^RELEASE_NOTES_.*\.md$/.test(name) && name.includes("v1.4.0"))
    expect(notes.length, "缺少 v1.4.0 发布说明，反向对照无法成立").toBeGreaterThan(0)

    const target = path.posix.join(RELEASE_DIR, notes[0])
    const original = root.read(target)
    try {
      // 直接删掉（等价于"最新 tag 没有对应发布说明"），全程在隔离根内
      root.remove(target)
      const result = runGate()
      expect(result.code).not.toBe(0)
      expect(result.out).toMatch(/release-notes-missing/)
    } finally {
      root.write(target, original)
    }
    expect(runGate().code).toBe(0)
  }, 120_000)
})
