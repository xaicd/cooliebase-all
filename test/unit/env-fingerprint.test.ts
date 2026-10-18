import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = path.resolve(__dirname, "../..")
const ARTIFACT = path.join(ROOT, "docs", "architecture", "artifacts", "env-fingerprint.json")
const BUILD_FILE = path.join(ROOT, ".next-cooliebase", "standalone", "server.js")

/** 跑指纹脚本，返回退出码（不抛）。 */
function run(args: string[]): number {
  try {
    execFileSync("node", ["scripts/env-fingerprint.cjs", ...args], { cwd: ROOT, stdio: "pipe" })
    return 0
  } catch (error) {
    return (error as { status?: number }).status ?? 1
  }
}

let restore: { artifact: string | null; build: Buffer | null } = { artifact: null, build: null }
let hasBuild = false

beforeAll(() => {
  restore = {
    artifact: fs.existsSync(ARTIFACT) ? fs.readFileSync(ARTIFACT, "utf8") : null,
    build: fs.existsSync(BUILD_FILE) ? fs.readFileSync(BUILD_FILE) : null,
  }
  hasBuild = fs.existsSync(BUILD_FILE)
})

afterAll(() => {
  // 无论测试怎么跑，都把现场恢复 —— 否则这个测试会污染后续构建
  if (restore.artifact !== null) fs.writeFileSync(ARTIFACT, restore.artifact)
  else fs.rmSync(ARTIFACT, { force: true })
  if (restore.build !== null) fs.writeFileSync(BUILD_FILE, restore.build)
})

/**
 * 环境指纹握手 —— 对齐 coolie 的 G5「制品不可变、指纹一致」。
 *
 * 守的是一个真实的事故类别: 测试跑的是一份，上线部署的是另一份，
 * 而两边**都显示成功**。所以这里必须证明"篡改会被抓到"，否则机制是装饰。
 */
describe("环境指纹握手", { timeout: 25000 }, () => {
  it("没盖章就核对 → exit 2（不能默认放行）", () => {
    fs.rmSync(ARTIFACT, { force: true })
    expect(run(["--verify"])).toBe(2)
  })

  it("盖章后核对 → exit 0", () => {
    expect(run(["--write"])).toBe(0)
    expect(run(["--verify"])).toBe(0)
  })

  it("构建产物被改一个字节 → 核对必须失败（否则机制是装饰）", () => {
    if (!hasBuild) return // 未构建时跳过：没有产物就无所谓不可变
    run(["--write"])
    fs.appendFileSync(BUILD_FILE, "\n// tampered\n")
    expect(run(["--verify"])).toBe(1)
  })
})
