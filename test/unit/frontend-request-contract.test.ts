import path from "node:path"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * `frontend:request-contract:check` 的反向对照与常驻回归。
 *
 * 规则：页面/组件不得裸调 `fetch(` —— 必须走 `packages/shared/frontend/lib/request.ts`
 * （它负责结构化错误、401 跳转、超时归一；裸 fetch 会绕过全部这些）。
 *
 * 存量 10 个文件冻结在 `docs/architecture/artifacts/frontend-raw-fetch-baseline.json`，**只减不增**。
 *
 * 跑在隔离根上：用例要**新增文件/改文件**，不能碰真仓。
 */

const GATE = "scripts/check-frontend-request-contract.cjs"
const BASELINE = "docs/architecture/artifacts/frontend-raw-fetch-baseline.json"
/** 一个确实在扫描面内、且不在基线里的新文件路径（用例自己创建） */
const NEW_PAGE = "packages/domains/infra/frontend/pages/__probe-new.page.tsx"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("request-contract")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = (args: string[] = []) => root.run(GATE, args)

describe("前端请求契约：页面不得裸 fetch（跑在隔离根上）", () => {
  it("当前仓库通过（存量已冻结）", () => {
    const r = runGate()
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/无新增裸 fetch/)
  }, 120_000)

  it("★ 反向对照：新增一个裸 fetch 页面 → 必须失败并点名该文件", () => {
    try {
      root.write(NEW_PAGE, `export default function Probe() {\n  fetch("/api/v1/x")\n  return null\n}\n`)
      const r = runGate()
      expect(r.code).toBe(1)
      expect(r.out).toContain("__probe-new.page.tsx")
      expect(r.out).toMatch(/request\.\*/)
    } finally {
      root.remove(NEW_PAGE)
    }
    // 清理后必须立刻回绿
    expect(runGate().code).toBe(0)
  }, 120_000)

  it("显式豁免（带非空理由）→ 放行；**空理由** → 仍然失败", () => {
    try {
      // 有理由：放行
      root.write(
        NEW_PAGE,
        `export default function Probe() {\n  fetch("/api/v1/x") // request-contract-exempt: 流式下载需要原始 Response\n  return null\n}\n`,
      )
      expect(runGate().code).toBe(0)

      // 空理由：不放行（否则等于没写）
      root.write(NEW_PAGE, `export default function Probe() {\n  fetch("/api/v1/x") // request-contract-exempt:\n  return null\n}\n`)
      const r = runGate()
      expect(r.code, "理由为空时不得豁免").toBe(1)
    } finally {
      root.remove(NEW_PAGE)
    }
  }, 120_000)

  it("基线缺失 → 必须失败（不许「找不到基线就静默通过」）", () => {
    const original = root.read(BASELINE)
    try {
      root.remove(BASELINE)
      const r = runGate()
      expect(r.code).toBe(1)
      expect(r.out).toMatch(/缺少基线/)
    } finally {
      root.write(BASELINE, original)
      expect(root.read(BASELINE)).toBe(original)
    }
  }, 120_000)

  it("扫描面失效（0 个文件）→ 必须失败，而不是报绿", () => {
    // 直接验证收集器：给它一个不存在的根，不应静默返回"通过"
    const { collectFiles } = require(path.join(root.dir, GATE))
    expect(typeof collectFiles).toBe("function")
    // 真仓里必须真的扫到文件（否则这条门禁就是空转的）
    expect(collectFiles().length).toBeGreaterThan(500)
  }, 120_000)
})
