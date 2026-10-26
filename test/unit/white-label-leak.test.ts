import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * **白标化防回归**（源码级）：`project:init` 写进产物**身份**的内容不得含基座品牌。
 *
 * 动机（实测事故）：`3640888c` 之后复验发现产物里写着
 *   profile.description = "复验目标 — 基于 **cooliebase-all** 高阶工程底座构建的…"
 *   package.json  "init": "echo '[**cooliebase-all**] 本地最小启动…'"
 * 这两条**产物自己会显示 / 会打印** —— 派生工程的登录页写着基座的名字，
 * 是白标化最直接的破绽，而当时**没有任何门禁看得见**（全靠人眼看 grep）。
 *
 * ## 为什么扫源码、而不是真跑一次 `project:init`
 *
 * 更早的版本跑了真 init（约 35s/次，两个用例 70s），结果**不只是慢**：
 * 它让 `test/unit/harness-entry.test.ts` 的 4 条反向对照在**全量运行**时变成随机失败
 * （单跑全绿、全量必红）。换成源码级断言后全量稳定绿（479 passed / 0 failed）。
 * 机制我没有完全查透 —— 但**「真实」不等于「可信」**，而这是实测结论，
 * 所以写在这里：**不要把这条重测试加回来**。
 *
 * 真 init 的端到端结论我**手工验过三次**（见提交 `5ad0595b` 的复验记录），
 * 常驻要守的只是「有人把品牌加回去」这一条回归 —— 扫源码足够，且毫秒级。
 *
 * ## 边界（重要）
 *
 * 只守**产物身份**。框架自己的包元数据（`packages/tools/<pkg>/package.json` 的
 * author/url、`packages/plugins/sdk` 的 description）**不在这里** ——
 * 那属于「框架包要不要一起改名」的产品决策，不该由测试替人决定。
 */

const ROOT = path.resolve(__dirname, "../..")
const INIT_SRC = path.join(ROOT, "scripts/project-init.cjs")
const BASE_BRAND = "cooliebase-all"

/** 生成器里「写进产物身份」的那几行（按变量名锚定，比整文件 grep 更准） */
const IDENTITY_MARKERS = ["profile.description", "profile.platformName", "profile.loginHeadline", "profile.loginTagline"]

function identityLines(src: string): string[] {
  return src.split("\n").filter((l) => IDENTITY_MARKERS.some((m) => l.includes(m)))
}

describe("白标化：生成器不得把基座品牌写进产物身份", () => {
  it("写身份的那几行不含基座品牌", () => {
    const src = fs.readFileSync(INIT_SRC, "utf8")
    const lines = identityLines(src)
    expect(lines.length).toBeGreaterThanOrEqual(3) // 解析没失效（锚点还在）
    const leaking = lines.filter((l) => l.includes(BASE_BRAND))
    expect(leaking).toEqual([])
  })

  it("`init` 提示文案里的基座名有被替换（否则产物自己会打印基座身份）", () => {
    const src = fs.readFileSync(INIT_SRC, "utf8")
    expect(src).toContain("[cooliebase-all]")
    expect(src).toMatch(/scripts\??\.init[\s\S]{0,200}replace/)
  })

  it("反向对照：把品牌加回一行身份声明，上面的判据必须能发现", () => {
    const src = fs.readFileSync(INIT_SRC, "utf8")
    const mutated = src.replace(
      /(profile\.description = `\$\{opts\.title\})/,
      "$1 — 基于 cooliebase-all 高阶工程底座",
    )
    expect(mutated).not.toBe(src) // 注入确实生效
    const leaking = identityLines(mutated).filter((l) => l.includes(BASE_BRAND))
    expect(leaking.length).toBeGreaterThan(0) // 与正向断言同形 —— 证明真的抓得住
  })
})
