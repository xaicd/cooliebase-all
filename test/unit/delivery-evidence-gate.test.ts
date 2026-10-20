import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const GATE = "scripts/check-delivery.cjs"

function runDeliveryStrict(): { status: number; stdout: string } {
  try {
    const stdout = execFileSync("node", [GATE, "--strict"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, stdout }
  } catch (error) {
    const failure = error as { status?: number; stdout?: string }
    return { status: failure.status ?? 1, stdout: failure.stdout ?? "" }
  }
}

/** 任取一份带证据账本的规格作为对照载体（不写死规格名，规格会归档移位）。 */
function pickSpecEvidence(): string | null {
  for (const domain of fs.readdirSync(path.join(ROOT, "docs", "specs"))) {
    if (domain === "archive") continue
    const domainDir = path.join(ROOT, "docs", "specs", domain)
    if (!fs.statSync(domainDir).isDirectory()) continue
    for (const name of fs.readdirSync(domainDir)) {
      const file = path.join(domainDir, name, "evidence.json")
      if (fs.existsSync(file)) return file
    }
  }
  return null
}

/**
 * 交付证据门禁（AGENTS §3.4 第 7 步 / §6.1 G5_PRE）的反向对照。
 *
 * 为什么需要这条对照：该规则**曾经在 `check` 链里从不触发** ——
 * `check-delivery.cjs` 只在给了 `--feature` 时才算证据账本，而默认路径恒为 null；
 * 而脚本本身又**永远 exit 0**（纯报告），却被挂在 check 链里。
 * 代价是实测出来的：两个规格自报 `G5_PRE passed`，而其引用的压测产物已是 `failed=3/3`，
 * 没有任何门禁发现。
 */
describe("交付门禁: 自报 passed 必须凭当前证据", () => {
  it("--strict 在未给 --feature 时也会扫全部规格的证据账本", () => {
    const { status, stdout } = runDeliveryStrict()
    expect(status).toBe(0)
    expect(stdout).toContain("证据账本")
  })

  it("反向对照：把一份规格改回无证据支持的 passed，必须 exit 1", () => {
    const file = pickSpecEvidence()
    expect(file, "仓库里应至少有一份带 evidence.json 的规格").not.toBeNull()

    const original = fs.readFileSync(file!, "utf8")
    try {
      const data = JSON.parse(original)
      const gate = data?.gates?.G5_PRE
      expect(gate, "对照载体需要有 G5_PRE 这一段").toBeTruthy()
      gate.status = "passed"
      // 同时清空证据：否则若该 gate 本就带证据行，规则不会命中，对照就变成不确定的。
      gate.evidence = []

      fs.writeFileSync(file!, `${JSON.stringify(data, null, 2)}\n`, "utf8")

      const { status, stdout } = runDeliveryStrict()
      expect(status).toBe(1)
      expect(stdout).toContain("没有证据")
    } finally {
      fs.writeFileSync(file!, original, "utf8")
    }

    expect(runDeliveryStrict().status).toBe(0)
  })
})
