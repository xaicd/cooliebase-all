import { afterEach, describe, expect, it } from "vitest"

import { getReadinessDiagnostics } from "../../packages/shared/backend/lib/runtime-readiness"

/**
 * `/readyz` 的诊断载荷。
 *
 * 起因是一次**真实客户旅程**（degit → install → project:init → dev）：
 * 登录返回 401「用户名或密码错误」，而密码哈希其实是**对的** ——
 * 真正原因是调用方 shell 导出了 `DB_DRIVER` / `TENANT_*` / `NODE_ENV`，
 * 覆盖了工程内 `.env.local`，应用连到了内存库。
 *
 * 当时 `/readyz` 只回 `{"status":"ready"}`，等于"我很健康"，把人推向错误方向。
 * 现在它必须**说清自己在用什么库**，并在容易误导时给提示。
 */
const KEYS = ["DB_DRIVER", "DATABASE_URL", "NODE_ENV", "TENANT_MODE", "TENANT_PLATFORM_USERNAMES"] as const
const saved: Record<string, string | undefined> = {}
for (const k of KEYS) saved[k] = process.env[k]

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe("就绪诊断: 让客户看得出自己在用什么库", () => {
  it("内存库：报 persistent=false 并给出「先查 shell」的提示", () => {
    process.env.DB_DRIVER = "memory"
    delete process.env.DATABASE_URL
    const d = getReadinessDiagnostics()
    expect(d.db).toEqual({ driver: "memory", persistent: false })
    expect(d.hints.some((h) => h.includes("内存库"))).toBe(true)
  })

  it("sqlite：persistent=true，且**不**出现内存库提示", () => {
    process.env.DB_DRIVER = "sqlite"
    process.env.DATABASE_URL = "file:./data/x.db"
    process.env.TENANT_PLATFORM_USERNAMES = "supervip,admin"
    const d = getReadinessDiagnostics()
    expect(d.db).toEqual({ driver: "sqlite", persistent: true })
    expect(d.hints.some((h) => h.includes("内存库"))).toBe(false)
  })

  it("未配平台管理员：明确提示（该症状会被误读成密码错）", () => {
    process.env.DB_DRIVER = "sqlite"
    process.env.TENANT_PLATFORM_USERNAMES = ""
    const d = getReadinessDiagnostics()
    expect(d.tenant.platformUsers).toBe(0)
    expect(d.hints.some((h) => h.includes("TENANT_PLATFORM_USERNAMES"))).toBe(true)
  })

  it("反向对照：无问题时 hints 为空（避免刷屏，提示才有信号）", () => {
    process.env.DB_DRIVER = "sqlite"
    process.env.DATABASE_URL = "file:./data/x.db"
    process.env.NODE_ENV = "development"
    process.env.TENANT_PLATFORM_USERNAMES = "supervip"
    expect(getReadinessDiagnostics().hints).toEqual([])
  })

  it("绝不泄露敏感值（连接串 / 口令不得出现在载荷里）", () => {
    process.env.DB_DRIVER = "postgresql"
    process.env.DATABASE_URL = "postgresql://user:secret-pw@db:5432/app"
    const json = JSON.stringify(getReadinessDiagnostics())
    expect(json).not.toContain("secret-pw")
    expect(json).not.toContain("postgresql://")
  })
})
