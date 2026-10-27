import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"

/**
 * **隔离根**：把仓库整份真拷贝到临时目录，在那边跑门禁。
 *
 * ## 为什么需要它（实测事故：`test-shared-file-isolation` 规格）
 *
 * 本仓有一批「验证门禁行为」的测试，做法是**临时改写仓库里的共享文件**
 * （`package.json` / `scripts/harness.cjs` / `docs/architecture/artifacts/*baseline*.json`）。
 * 另有一批测试**通过 spawn 门禁脚本间接读**这些文件。于是：
 *
 * ```
 * 写方（6 个测试）改 package.json  →  读方（5 个测试）spawn 的门禁读到中间态
 * → pnpm run test:clean 间歇随机变红，红的文件每次都不一样
 * ```
 *
 * 实测闭环证据：**读者清单 = 实测 flaky 清单**
 * （`route-update-arity-rule` / `vacuous-assertion-rule` / `frontend-api-url-shape-rule` / `harness-entry`），
 * 而写者与读者的交集正是 `package.json`。
 *
 * ## 为什么不是软链
 *
 * 试过「只读件用软链」：**3/7 红，更糟** —— 门禁顺着软链读回了真仓，
 * 隔离名存实亡。所以这里**真拷**。
 *
 * ## 为什么门禁不用加开关
 *
 * 门禁都按 `path.resolve(__dirname, "..")` 推根。**拷过去的门禁**，
 * 其 `__dirname` 自然就是临时根 —— 不需要任何 `--root` 参数，
 * 也就不会留下「用开关放行」的后门（这条是规格里的硬约束）。
 *
 * 成本实测：**7276 文件 / 1250 MB / 约 3.5 秒**。所以**每个测试文件建一次**，
 * 不要每个用例建一次。
 *
 * ## 坑（都踩过）
 *
 * 仓里有 **socket**（实测 `.claude/commands`、`.kiro/workflows`）与符号链接，
 * `copyFileSync` 会抛 `ENOTSUP` —— 所以**只拷 `isFile()` 的真文件**。
 */

const REPO_ROOT = path.resolve(__dirname, "../..")
/**
 * 只跳过**明确无关**的重目录。
 * **不要**在这里跳过 `.claude` / `.kiro` —— 实测：门禁会读它们，
 * 跳过之后隔离根里门禁直接红（而真仓是绿的），排查成本很高。
 * 那些目录里的 socket 由 `isFile()` 判断挡掉，不需要按目录跳。
 */
const SKIP_DIRS = new Set(["node_modules", ".git", ".next-cooliebase", ".next-ruoyi", "gen", "scratch", ".turbo"])

export interface IsolatedRoot {
  dir: string
  /** 在隔离根里跑门禁脚本（相对路径，如 `scripts/check-engineering-standards.cjs`） */
  run(gateRelPath: string, args?: string[]): { code: number; out: string }
  /** 读隔离根里的文件（测试断言用） */
  read(relPath: string): string
  /** 写隔离根里的文件（注入违规用 —— 写的永远是临时根，不是真仓） */
  write(relPath: string, content: string): void
  /** 删掉整个临时根 */
  cleanup(): void
}

function copyRepo(dst: string): number {
  fs.mkdirSync(dst, { recursive: true })
  let files = 0
  const walk = (rel: string) => {
    const abs = rel ? path.join(REPO_ROOT, rel) : REPO_ROOT
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (SKIP_DIRS.has(e.name)) continue
      const r = rel ? path.join(rel, e.name) : e.name
      if (e.isDirectory()) {
        fs.mkdirSync(path.join(dst, r), { recursive: true })
        walk(r)
      } else if (e.isFile()) {
        fs.copyFileSync(path.join(REPO_ROOT, r), path.join(dst, r))
        files++
      }
      // 非普通文件（socket / symlink / fifo）跳过 —— 拷它们会 ENOTSUP
    }
  }
  walk("")
  return files
}

/** 建一个隔离根。调用方负责在 finally 里 cleanup()。 */
export function makeIsolatedRoot(label = "root"): IsolatedRoot {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cooliebase-${label}-`))
  copyRepo(dir)
  return {
    dir,
    run(gateRelPath: string, args: string[] = []) {
      try {
        return {
          code: 0,
          out: execFileSync(process.execPath, [path.join(dir, gateRelPath), ...args], { cwd: dir, encoding: "utf8" }),
        }
      } catch (e: any) {
        return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` }
      }
    },
    read(relPath: string) {
      return fs.readFileSync(path.join(dir, relPath), "utf8")
    },
    write(relPath: string, content: string) {
      fs.writeFileSync(path.join(dir, relPath), content)
    },
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true })
    },
  }
}
