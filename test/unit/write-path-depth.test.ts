import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { makeIsolatedRoot, type IsolatedRoot } from "../helpers/isolated-root"

/**
 * `write:path:depth:check` 的反向对照。
 *
 * 规则：规格若触及**写链路**（写路由 / 表单页），必须在 acceptance 里**声明**深度测试
 * （正向写库断言 + 对抗 4xx），或写 `depthTestExempt: "<理由>"`。
 *
 * ## 它检查的边界（写清楚，别把它吹成"深度测试门禁"）
 *
 * ✅ 检查**声明**；❌ **不**证明测试真写了。本仓 E2E 目前只有 2 个 `status<500` 占位，
 * 真实深度靠 T4 的度量观察。
 *
 * ## 实测局限（必须诚实）
 *
 * 现役 20 个规格里 **0 个**触发本门禁 —— 因为它们任务白名单大多写 `-` 或不点名写路由。
 * 也就是说：这条规则对**未来**规格有效，对白名单含糊的规格抓不到。
 * 所以下面的反向对照是**必须**的：它证明「只要有人真的点名写路由又不声明深度，就会红」。
 */

const GATE = "scripts/check-write-path-depth.cjs"
const BASELINE = "docs/architecture/artifacts/write-path-depth-baseline.json"

/** 真实存在、且确实导出 POST 的路由（用它造"触及写链路"的规格） */
const WRITE_ROUTE = "packages/plugins/plugin-ai/routes/admin/ai-tool/route.ts"
/** 真实存在、且含提交动作的表单页 */
const FORM_PAGE = "packages/domains/infra/frontend/pages/configs.page.tsx"

let root: IsolatedRoot

beforeAll(() => {
  root = makeIsolatedRoot("write-depth")
}, 120_000)

afterAll(() => {
  root?.cleanup()
})

const runGate = (args: string[] = []) => root.run(GATE, args)
const specDir = (name: string) => `docs/specs/infra/${name}`

function writeSpec(name: string, brief: Record<string, unknown>) {
  root.write(`${specDir(name)}/brief.json`, JSON.stringify({ name, domain: "infra", tasks: [], ...brief }, null, 2) + "\n")
}

describe("写链路测试深度（跑在隔离根上）", () => {
  it("当前仓库通过（0 个规格触发，基线为空）", () => {
    const r = runGate()
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/扫描 \d+ 个规格/)
  }, 120_000)

  it("★ 反向对照①：新增规格点名写路由、却没声明深度测试 → 必须失败并点名规格", () => {
    writeSpec("probe-write-no-depth", {
      tasks: [{ id: "T1", parent: "main", title: "改一个写接口", files: [WRITE_ROUTE] }],
      acceptance: [{ check: "`pnpm run check` exit=0" }],
    })
    try {
      const r = runGate()
      expect(r.code).toBe(1)
      expect(r.out).toContain("probe-write-no-depth")
      expect(r.out).toMatch(/没声明深度测试/)
    } finally {
      root.remove(specDir("probe-write-no-depth"))
    }
    expect(runGate().code).toBe(0)
  }, 120_000)

  it("★ 反向对照②：表单页同样触发（不是只看 route.ts）", () => {
    writeSpec("probe-form-no-depth", {
      tasks: [{ id: "T1", parent: "main", title: "改表单", files: [FORM_PAGE] }],
      acceptance: [{ check: "`pnpm run check` exit=0" }],
    })
    try {
      expect(runGate().code).toBe(1)
    } finally {
      root.remove(specDir("probe-form-no-depth"))
    }
  }, 120_000)

  it("声明了深度测试（含「落库」）→ 放行", () => {
    writeSpec("probe-write-declared", {
      tasks: [{ id: "T1", parent: "main", title: "改一个写接口", files: [WRITE_ROUTE] }],
      acceptance: [
        { check: "`pnpm run check` exit=0" },
        { check: "正向：真实账户出价 → 真实写库 → 断言落库流水" },
        { check: "对抗：低价/越权 → 400 业务拦截 + 弹窗自愈" },
      ],
    })
    try {
      expect(runGate().code).toBe(0)
    } finally {
      root.remove(specDir("probe-write-declared"))
    }
  }, 120_000)

  it("显式豁免（非空理由）→ 放行", () => {
    writeSpec("probe-write-exempt", {
      tasks: [{ id: "T1", parent: "main", title: "改一个写接口", files: [WRITE_ROUTE] }],
      acceptance: [{ check: "`pnpm run check` exit=0" }],
      depthTestExempt: "纯契约字段改名，无行为变化；写链路测试由 spec-x 覆盖",
    })
    try {
      expect(runGate().code).toBe(0)
    } finally {
      root.remove(specDir("probe-write-exempt"))
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
})
