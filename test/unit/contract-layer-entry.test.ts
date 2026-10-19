import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const PKG = path.join(ROOT, "package.json")

type Resolution = { ok: boolean; dir: string; testFiles: string[]; reason: string }

/**
 * 解析 `test:contract` 的选择器，判断它是否真的命中"契约产物层"。
 *
 * 为什么需要这层守卫：一个**少选了文件**的入口比没有入口更危险 —— 它跑出绿色，
 * 让人以为契约层已被验证，实际只跑了其中一部分（这正是本仓反复在治的"假绿"）。
 * 所以约定是**目录即层次**：L3 = `packages/shared/contract/__tests__/`，且全仓只有这一处。
 */
function resolveContractLayer(script: string | undefined, root: string): Resolution {
  const empty = { ok: false, dir: "", testFiles: [], reason: "" }
  if (!script) return { ...empty, reason: "package.json 里没有 test:contract 脚本" }

  // 取 `vitest run <selector>` 的选择器
  const match = script.match(/^vitest\s+run\s+(\S+)\s*$/)
  if (!match) return { ...empty, reason: `test:contract 不是「vitest run <单一目录>」形式: ${script}` }

  const target = path.join(root, match[1])
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return { ...empty, reason: `选择器指向的目录不存在: ${match[1]}` }
  }

  const testFiles: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue
        walk(full)
      } else if (/\.(test|spec)\.tsx?$/.test(entry.name)) {
        testFiles.push(path.relative(root, full).split(path.sep).join("/"))
      }
    }
  }
  walk(target)

  if (testFiles.length === 0) {
    return { ok: false, dir: match[1], testFiles, reason: `目录 ${match[1]} 下没有任何测试文件（入口会空跑）` }
  }
  return { ok: true, dir: match[1], testFiles, reason: "" }
}

describe("L3 契约层入口（目录即层次）", () => {
  const pkg = JSON.parse(fs.readFileSync(PKG, "utf8")) as { scripts: Record<string, string> }

  it("正向：test:contract 命中非空的契约产物层", () => {
    const resolution = resolveContractLayer(pkg.scripts["test:contract"], ROOT)
    expect(resolution.reason).toBe("")
    expect(resolution.ok).toBe(true)
    expect(resolution.dir).toBe("packages/shared/contract")
    expect(resolution.testFiles.length).toBeGreaterThan(0)
  })

  it("正向：全仓只有这一个契约产物测试目录（约定唯一，避免各放一处）", () => {
    const found: string[] = []
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
        const full = path.join(dir, entry.name)
        if (entry.name === "contract") {
          const testsDir = path.join(full, "__tests__")
          if (fs.existsSync(testsDir)) {
            for (const f of fs.readdirSync(testsDir)) {
              if (/\.(test|spec)\.tsx?$/.test(f)) found.push(`${path.relative(ROOT, testsDir)}/${f}`)
            }
          }
        }
        walk(full)
      }
    }
    for (const top of ["packages", "test"]) {
      const dir = path.join(ROOT, top)
      if (fs.existsSync(dir)) walk(dir)
    }
    expect(found.length).toBeGreaterThan(0)
    for (const file of found) {
      expect(file, `契约产物测试必须放在 packages/shared/contract/__tests__/，实际在 ${file}`).toMatch(
        /^packages\/shared\/contract\/__tests__\//,
      )
    }
  })

  it("★ 反向 1：选择器指向没有测试文件的目录 → 必须判为不通过（空跑不能算绿）", () => {
    const emptyDir = path.join(ROOT, "test", "load")
    const resolution = resolveContractLayer(`vitest run test/load`, ROOT)
    // test/load 目录存在但里面没有测试文件 —— 这正是"入口空跑却报绿"的形态。
    if (fs.existsSync(emptyDir)) {
      expect(resolution.ok).toBe(false)
      expect(resolution.reason).toMatch(/没有任何测试文件/)
    }
  })

  it("★ 反向 2：选择器指向不存在的目录 → 必须判为不通过", () => {
    const resolution = resolveContractLayer("vitest run packages/does-not-exist", ROOT)
    expect(resolution.ok).toBe(false)
    expect(resolution.reason).toMatch(/不存在/)
  })
})
