import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-repository-column-coverage.ts"
/** 元数据里有、且当前生成物已覆盖的表 —— 拿它做注入探针。 */
const PROBE_REPO = "packages/plugins/plugin-ai/backend/repositories/ai-model.repository.ts"

function runGate(): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("npx", ["tsx", GATE], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" }
  }
}

function withInjected<T>(file: string, mutate: (source: string) => string, body: () => T): T {
  const target = path.join(ROOT, file)
  const original = fs.readFileSync(target, "utf8")
  try {
    fs.writeFileSync(target, mutate(original))
    return body()
  } finally {
    fs.writeFileSync(target, original)
    if (fs.readFileSync(target, "utf8") !== original) throw new Error(`${file} 未逐字还原`)
  }
}

/**
 * 生成仓储的列覆盖门禁。
 *
 * 守的是两类**内存回退下完全不可见**的缺陷（都实测过）：
 * 1. 元数据加了列，生成物没跟上 → 真实库 NOT NULL 违约
 *    （`ai_chat_message.role`、`ai_model.model_key`、`ai_chat_conversation.system_prompt`）；
 * 2. 可写列不在 `TABLE_COLUMNS` 里 → `dbValues()` 会在入库前**静默丢弃**它
 *    （只补 `WRITABLE_COLUMNS` 那一半时踩到过，比直接报错更难查）。
 */
describe("生成仓储列覆盖门禁", () => {
  it("正向：生成物列集合覆盖元数据，且可写列都能落库", () => {
    const result = runGate()
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/PASS/)
  })

  it("★ 反向：元数据有列而生成物缺列时必须 FAIL，并指名表与列", () => {
    const result = withInjected(
      PROBE_REPO,
      (source) => source.replace('"model_key",', ""), // 制造"元数据有、生成物没有"
      runGate,
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/FAIL/)
    expect(result.stderr).toMatch(/ai_model/)
    expect(result.stderr).toMatch(/model_key/)
  })

  it("★ 反向：可写列不在 TABLE_COLUMNS 里（会被静默丢弃）时必须 FAIL", () => {
    const result = withInjected(
      PROBE_REPO,
      (source) => source.replace('const WRITABLE_COLUMNS = [', 'const WRITABLE_COLUMNS = ["probe_dropped_column",'),
      runGate,
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/probe_dropped_column/)
    expect(result.stderr).toMatch(/丢弃/)
  })

  it("反向恢复后回到通过（探针不留痕）", () => {
    const result = runGate()
    expect(result.status).toBe(0)
  })
})
