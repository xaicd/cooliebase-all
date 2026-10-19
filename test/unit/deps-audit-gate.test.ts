import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-deps-audit.cjs"
const BASELINE = "docs/architecture/artifacts/deps-audit-baseline.json"

const baselineAbs = path.join(ROOT, BASELINE)
/** 反向对照期间基线的临时落点（与被测门禁同一目录，改完原样退回）。 */
const stashedAbs = `${baselineAbs}.test-stashed`

function runGate(args: string[] = []): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [GATE, ...args], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 180000,
    })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

/**
 * 依赖 CVE 门禁的棘轮语义。
 *
 * 注：本门禁需要联网查通告库（`pnpm audit`），所以本文件比纯静态单测慢一些。
 * 这是刻意的 —— 一条只在发布前跑的安全规则，挡不住"有漏洞的依赖在 main 上躺着"。
 */
describe("依赖 CVE 门禁（棘轮）", () => {
  it("基线存在时通过，且报告的是 frozen 既有欠债、不是「没问题」", () => {
    expect(fs.existsSync(baselineAbs), `${BASELINE} 应由脚本产出并提交`).toBe(true)

    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
    // 用词必须诚实：是"冻结的欠债 + 无新增"，不是"无漏洞"
    expect(result.stdout).toMatch(/frozen in baseline/)
    expect(result.stdout).toMatch(/no NEW advisory/)
    // 需要联网查通告库，默认 5s 不够
  }, 120_000)

  it("--audit 的分层自洽且与基线逐条对得上（棘轮不与扫描漂移）", () => {
    const result = runGate(["--audit"])
    expect(result.status).toBe(0)

    const report = JSON.parse(result.stdout)
    expect(report.totals.advisories).toBeGreaterThan(0)
    // 分层两半必须正好相加为全体 —— 否则分类有遗漏（漏掉的会静默不受管）
    expect(report.totals.runtime + report.totals.clientToolchain).toBe(report.totals.advisories)
    expect(Array.isArray(report.unfixable)).toBe(true)

    // 棘轮的价值完全取决于基线 == 当前扫描；不等就说明有人在裸改基线。
    const baseline = JSON.parse(fs.readFileSync(baselineAbs, "utf8"))
    expect(baseline.entries.length).toBe(report.totals.advisories)
    // 无新增时 newAdvisories 必须为空（有新增则应非空并据此失败）
    expect(report.newAdvisories).toEqual([])
  }, 120_000)

  it("★ 反向：基线被移开时必须失败；同条件下 --audit 仍不失败；恢复后回到通过", () => {
    /**
     * 该门禁读的是**仓库级产物**（基线）。在本机已经产出基线的情况下，不把它移开，
     * "有新增就失败"这条规则**永远不会触发** —— 那等于门禁没被验证过。
     */
    expect(fs.existsSync(baselineAbs)).toBe(true)
    fs.renameSync(baselineAbs, stashedAbs)
    try {
      const failing = runGate()
      expect(failing.status, "基线缺失时应判为「全部为新增」并失败").not.toBe(0)
      expect(failing.stderr).toMatch(/NEW dependency advisory/)
      expect(failing.stderr).toMatch(/deps-audit-baseline\.json/)

      // --audit 只报告、不判定：同一条件下必须仍然 exit 0
      const audit = runGate(["--audit"])
      expect(audit.status, "--audit 永不失败").toBe(0)
      expect(JSON.parse(audit.stdout).newAdvisories.length).toBeGreaterThan(0)
    } finally {
      fs.renameSync(stashedAbs, baselineAbs)
    }

    // 恢复现场后必须回到通过，否则门禁不可用（也证明上一步的失败不是"坏在那儿了"）
    const restored = runGate()
    expect(restored.status).toBe(0)
    expect(fs.existsSync(stashedAbs)).toBe(false)
  }, 300_000)

  it("★ 分层确定性 + 锚点正确性（修前同一状态连跑为 5/5/6，且把 postcss 标错）", () => {
    /**
     * 两次断言合并在同一次多次运行里 —— 每次 `--audit` 都要联网查通告库，分开写要重复付代价。
     *
     * 缺陷背景：分层原先取自 `pnpm audit` 的 findings[].paths，而 pnpm **对多父级包会截断
     * 该列表**（braces 有两个父级，截断时只剩 expo 那条）→ 同一状态连跑三次得 5/5/6。
     * 现改为从 pnpm-lock.yaml 离线推导，故这里断言"逐条结果必须完全一致"，而**不只是总数**：
     * 只看总数正是当初没看出是哪条在翻的原因。
     */
    const runs = [0, 1, 2].map(() => JSON.parse(runGate(["--audit"]).stdout))

    const fingerprint = (report: any) =>
      (report.advisories || [])
        .map((entry: any) => `${entry.key}=${entry.tier}`)
        .sort()
        .join("\n")

    expect(runs[0].advisories.length).toBeGreaterThan(0)
    expect(fingerprint(runs[1])).toBe(fingerprint(runs[0]))
    expect(fingerprint(runs[2])).toBe(fingerprint(runs[0]))
    expect(runs[1].totals.runtime).toBe(runs[0].totals.runtime)
    // 判据必须来自锁文件；回退到审计输出的采样字段就是退回那个缺陷
    expect(runs[0].tierSource).toBe("pnpm-lock.yaml")

    // 锚点：用真实答案反向校验解析器不是乱解析。key 形如 `<包名>@GHSA-xxxx`。
    const tierByPackage = new Map<string, string>(
      runs[0].advisories.map((entry: any) => [String(entry.key).replace(/@GHSA-.*$/, ""), entry.tier]),
    )
    const expectRuntime = ["braces", "mysql2", "deepmerge-ts", "postcss-selector-parser", "postcss", "source-map-js"]
    const expectClient = ["tar", "@xmldom/xmldom", "shell-quote", "node-forge", "sprintf-js", "uuid", "image-size"]

    // 通告会随升级消失（vitest 就是这样消失的），故缺席即跳过；但用"至少命中几条"防止整条用例空转。
    let checkedRuntime = 0
    let checkedClient = 0
    for (const name of expectRuntime) {
      if (!tierByPackage.has(name)) continue
      checkedRuntime++
      expect(tierByPackage.get(name), `${name} 应在 host 依赖图内`).toBe("runtime")
    }
    for (const name of expectClient) {
      if (!tierByPackage.has(name)) continue
      checkedClient++
      expect(tierByPackage.get(name), `${name} 应只在客户端工具链内`).toBe("client-toolchain")
    }
    expect(checkedRuntime, "锚点整组缺席说明用例已失效").toBeGreaterThanOrEqual(2)
    expect(checkedClient, "锚点整组缺席说明用例已失效").toBeGreaterThanOrEqual(2)
  }, 300_000)
})
