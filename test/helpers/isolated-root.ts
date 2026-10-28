import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"

/**
 * **隔离根**：把仓库克隆到临时目录，在那边跑门禁。
 *
 * ## 为什么需要它（实测事故：`test-shared-file-isolation` 规格）
 *
 * 本仓有一批「验证门禁行为」的测试，做法是**临时改写仓库里的共享文件**
 * （`package.json` / `AGENTS.md` / `docs/architecture/artifacts/*baseline*.json`）。
 * 另有一批测试**通过 spawn 门禁脚本间接读**这些文件。探针实测到的窗口：
 *
 * ```
 * [+ 16789ms] deps-audit-baseline.json   存在 → 删除，7.5 秒后才恢复
 * [+ 93865ms] AGENTS.md 改 → 原（整套运行里 4 次）
 * [+104549ms] package.json 改 → 原
 * ```
 *
 * 而且**那一次套件是绿的** —— 说明 flake 取决于「读者有没有恰好落进窗口」，
 * 这解释了它为什么随机、为什么每次红的文件都不一样。
 *
 * ## 为什么用 `git clone --local`（走过的三个弯路）
 *
 * | 做法 | 实测结果 |
 * |---|---|
 * | 只读件用**软链** | **更糟**（3/7 红）：门禁顺着软链读回真仓，隔离名存实亡 |
 * | **拷文件 + `git init` + `add` + `commit` + `tag`** | 门禁能跑，但 **tag 全指向同一个提交** → `git describe` 挑错 tag（实测挑到 `v1.0.0`）→ 隔离根**失真**；且建根要 13 秒 |
 * | **`git clone --local`** | **0.955 秒**、工作区精确、**历史与 tag 完全真实**（`git describe` 正确给出 `v1.4.0-brand-shorthand`）—— 选它 |
 *
 * `--local` 对对象用硬链接（所以快），改工作区不会碰真仓的 `.git`。
 * 克隆还顺带解决了「隔离根不是 git 仓库」的问题 ——
 * `check-docs-commands.cjs` 按 `git ls-files` 取文件集，在非仓库目录里会**拒绝判定**。
 *
 * ## 为什么门禁不用加开关
 *
 * 门禁都按 `path.resolve(__dirname, "..")` 推根。**克隆出来的门禁**
 * 其 `__dirname` 自然就是隔离根 —— 不需要任何 `--root` 参数，
 * 也就不会留下「用开关放行」的后门（规格里的硬约束）。
 */

const REPO_ROOT = path.resolve(__dirname, "../..")

export interface IsolatedRoot {
  /** 隔离根目录（临时目录；测试一般不直接用，用 run/read/write/remove 即可） */
  dir: string
  /** 在隔离根里跑门禁脚本（相对路径，如 `scripts/check-engineering-standards.cjs`） */
  run(gateRelPath: string, args?: string[]): { code: number; out: string }
  /** 读隔离根里的文件 */
  read(relPath: string): string
  /** 写隔离根里的文件（注入违规用 —— 写的永远是临时根，不是真仓） */
  write(relPath: string, content: string): void
  /** 删掉隔离根里的文件（探针清理用） */
  remove(relPath: string): void
  /** 删掉整个临时根 */
  cleanup(): void
}

/** 建一个隔离根（克隆仓库）。调用方负责在 finally 里 cleanup()。 */
export function makeIsolatedRoot(label = "root"): IsolatedRoot {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `cooliebase-${label}-`))
  // mkdtempSync 已经建了目录，而 git clone 要求目标不存在或为空 —— 删掉再克隆最稳。
  fs.rmSync(dir, { recursive: true, force: true })
  // **`--no-hardlinks` 不能少**：`git clone --local` 默认用**硬链接**复用对象，
  // 而硬链接跨文件系统必然失败。CI 里仓库在 `/home/runner/work`、临时目录在 `/tmp`
  // （不同挂载点）→ `git clone --local` 直接报 Command failed，
  // **十几个用本 helper 的门禁探针测试一起红**；本地 macOS 同卷，所以一直看不出来。
  execFileSync("git", ["clone", "-q", "--local", "--no-hardlinks", REPO_ROOT, dir], { stdio: "ignore" })

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
      // **要建父目录**：隔离根里常用来造"新文件"（如新规格的 brief.json），
      // 而 writeFileSync 不会自动创建目录（实测 ENOENT）。
      const abs = path.join(dir, relPath)
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, content)
    },
    remove(relPath: string) {
      // `recursive` 必须开：用例常清的是**目录**（如造出来的规格目录），
      // 不带 recursive 会 EISDIR（实测）。
      fs.rmSync(path.join(dir, relPath), { recursive: true, force: true })
    },
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true })
    },
  }
}
