import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, describe, expect, it } from "vitest"

/**
 * CMMI「决策性留空」的理由必须**可回验**（反向对照）。
 *
 * ## 动机（实测踩到的）
 *
 * `scripts/cmmi-asset-scaffold.cjs` 的 `ACCEPTED_ABSENCES` 里，「02/srs」那条
 * 曾经写着「brief.json（**12 份**）+ sprint-prod（**5 份**）」—— 真源早已是 **20 / 9**。
 *
 * 为什么没人发现：它是**脚本**不是文档，`docs:claims:check` 扫的是 `docs/**`，扫不到它。
 * 于是这条写死的计数静默漂移，而它恰恰在解释「为什么这里可以没有 SRS」。
 *
 * 现在注释里那句「理由要指向依据」变成了两条机检：
 *   ① 理由里不许出现 `N 份` 这类计数（数字会漂、路径不会）；
 *   ② 理由必须至少指向一个**真实存在**的仓内路径。
 *
 * ## 为什么要复制一份脚本来测
 *
 * 原件不能改（改坏了整套流程都红）。副本放在**同一个目录** `scripts/` 下，
 * 这样脚本里 `path.resolve(__dirname, "..")` 解析出的 ROOT 仍是仓库根 —— 行为等价。
 */

const ROOT = path.resolve(__dirname, "../..")
const SRC = path.join(ROOT, "scripts/cmmi-asset-scaffold.cjs")
const PROBE = path.join(ROOT, "scripts/__probe__-cmmi-asset-scaffold.cjs")

function runProbe(): { code: number; out: string } {
  try {
    return { code: 0, out: execFileSync("node", [PROBE, "check"], { cwd: ROOT, encoding: "utf8", stdio: "pipe" }) }
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string }
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` }
  }
}

function writeProbe(mutate: (src: string) => string) {
  fs.writeFileSync(PROBE, mutate(fs.readFileSync(SRC, "utf8")))
}

afterAll(() => {
  fs.rmSync(PROBE, { force: true })
})

describe("CMMI「决策性留空」理由的可回验性", () => {
  it("正向：原样的脚本通过", () => {
    try {
      writeProbe((s) => s)
      const r = runProbe()
      expect(r.code, `原脚本应当通过，实际输出：\n${r.out.slice(0, 400)}`).toBe(0)
    } finally {
      fs.rmSync(PROBE, { force: true })
    }
  })

  it("反向：理由里写死计数 → 必须 exit 1 且点名「计数」", () => {
    try {
      writeProbe((s) => s.replace("零假 Demo 铁律", "零假 Demo 铁律（999 份）"))
      const r = runProbe()
      expect(r.code, "写死计数必须被拦下 —— 本表就因为这个漂过").toBe(1)
      expect(r.out).toContain("计数")
    } finally {
      fs.rmSync(PROBE, { force: true })
    }
  })

  it("反向：理由指向不存在的路径 → 必须 exit 1 且说「依据不能是空气」", () => {
    try {
      writeProbe((s) =>
        s.replace("（零假 Demo 铁律，AGENTS.md §25）", "（零假 Demo 铁律，docs/不存在的手册.md）"),
      )
      const r = runProbe()
      expect(r.code, "指向空气的依据必须被拦下").toBe(1)
      expect(r.out).toContain("依据不能是空气")
    } finally {
      fs.rmSync(PROBE, { force: true })
    }
  })
})
