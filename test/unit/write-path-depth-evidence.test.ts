import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, describe, expect, it } from "vitest"

/**
 * `write:path:depth:check` 的**证据**判定（`brief.depthTestFiles`）。
 *
 * ## 为什么必须有这个文件
 *
 * 实测：本仓当前**没有任何规格**触及写链路 ——
 * `docs/architecture/artifacts/write-path-depth-baseline.json` 与
 * `write-path-depth-evidence-baseline.json` 都是**空数组**。
 *
 * 也就是说门禁在真实数据上**永远绿**，光看它 pass 根本看不出它会不会失败 ——
 * 那正是本仓明令禁止的「假绿」。所以用探针把三种情形都**真跑一遍**：
 *
 * 1. 声明的文件不存在 → **必须 exit 1**；
 * 2. 声明的是**默认 skip 的模板**（`test.skip(!…)`）→ **必须 exit 1**（它一次都不会跑）；
 * 3. 声明的是真实存在、会跑的用例 → **必须 exit 0**。
 *
 * 探针写进 `docs/specs/infra/`，每个用例都在 `finally` 里删干净。
 */

const ROOT = path.resolve(__dirname, "../..")
const SCRIPT = path.join(ROOT, "scripts/check-write-path-depth.cjs")
const PROBE_DIR = path.join(ROOT, "docs/specs/infra/__depth-evidence-probe__")

/** 一个真实存在的写路由（含 `export async function POST`），用作「触及写链路」的靶子 */
const WRITE_ROUTE = (() => {
  const base = path.join(ROOT, "packages/plugins")
  for (const plugin of fs.readdirSync(base)) {
    const dir = path.join(base, plugin, "routes", "admin")
    if (!fs.existsSync(dir)) continue
    for (const entity of fs.readdirSync(dir)) {
      const f = path.join(dir, entity, "route.ts")
      if (fs.existsSync(f) && /export\s+(async\s+)?(function\s+)?POST\b/.test(fs.readFileSync(f, "utf8"))) {
        return path.relative(ROOT, f)
      }
    }
  }
  throw new Error("找不到任何含 POST 的插件路由 —— 探针无法构造")
})()

/** 真跑门禁，返回退出码（不抛异常） */
function runGate(): number {
  try {
    execFileSync("node", [SCRIPT], { cwd: ROOT, stdio: "pipe" })
    return 0
  } catch (error) {
    return (error as { status?: number }).status ?? 1
  }
}

function writeProbe(brief: Record<string, unknown>) {
  fs.mkdirSync(PROBE_DIR, { recursive: true })
  fs.writeFileSync(
    path.join(PROBE_DIR, "brief.json"),
    JSON.stringify(
      {
        name: "__depth-evidence-probe__",
        domain: "infra",
        // 一条深度测试声明（命中 E2E 标记）+ 一个真实的写路由 → 会进入证据判定
        acceptance: [{ id: "A1", check: "正向：E2E 真跑注册 → 断言落库" }],
        tasks: [{ id: "T1", files: [WRITE_ROUTE] }],
        ...brief,
      },
      null,
      2,
    ),
  )
}

afterAll(() => {
  fs.rmSync(PROBE_DIR, { recursive: true, force: true })
})

describe("write:path:depth 的证据判定", () => {
  it("基线确定是空的 —— 没有这个前提，下面的反向对照就没有意义", () => {
    for (const rel of [
      "docs/architecture/artifacts/write-path-depth-baseline.json",
      "docs/architecture/artifacts/write-path-depth-evidence-baseline.json",
    ]) {
      const data = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")) as { specs: string[] }
      expect(data.specs, `${rel} 应为空数组（若已非空，本文件的探针结论需重估）`).toEqual([])
    }
  })

  it("证明确实能失败：声明的证据文件不存在 → exit 1", () => {
    try {
      writeProbe({ depthTestFiles: ["test/e2e/这个文件不存在.spec.ts"] })
      expect(runGate(), "指向不存在的文件必须失败，否则门禁是装饰").toBe(1)
    } finally {
      fs.rmSync(PROBE_DIR, { recursive: true, force: true })
    }
  })

  it("证明确实能失败：证据是默认 skip 的模板 → exit 1", () => {
    const tpl = path.join(ROOT, "test/e2e/__skip-template-probe__.spec.ts")
    try {
      fs.writeFileSync(
        tpl,
        [
          'import { expect, test } from "@playwright/test"',
          "test.describe(\"probe\", () => {",
          '  test("x", async () => {',
          "    test.skip(!process.env.PROBE, \"默认跳过\")",
          "  })",
          "})",
          "",
        ].join("\n"),
      )
      writeProbe({ depthTestFiles: [path.relative(ROOT, tpl)] })
      expect(runGate(), "默认 skip 的模板一次都不会跑，不能算证据").toBe(1)
    } finally {
      fs.rmSync(PROBE_DIR, { recursive: true, force: true })
      fs.rmSync(tpl, { force: true })
    }
  })

  it("正向：证据真实存在且会跑 → exit 0", () => {
    try {
      writeProbe({ depthTestFiles: ["test/e2e/write-path.member.spec.ts"] })
      expect(runGate(), "真实会跑的用例应当通过").toBe(0)
    } finally {
      fs.rmSync(PROBE_DIR, { recursive: true, force: true })
    }
  })
})
