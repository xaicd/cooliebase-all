import { validateJwtConfiguration } from "@/modules/shared/backend/auth/jwt"
import {
  assertProductionDataSourceConfiguration,
  getKyselyDb,
  hasRealDatabase,
} from "@/modules/shared/backend/lib/database"
import { sql } from "kysely"
import { writeCompactError } from "./observability"

export type ReadinessResult = { ready: true } | { ready: false; reason: string }

/** Checks only process dependencies required before a replica receives traffic. */
export async function checkRuntimeReadiness(): Promise<ReadinessResult> {
  try {
    validateJwtConfiguration()
    assertProductionDataSourceConfiguration()

    if (process.env.NODE_ENV === "production" && !hasRealDatabase()) {
      return { ready: false, reason: "persistent database is required in production" }
    }

    if (hasRealDatabase()) {
      const db = await getKyselyDb()
      await sql`select 1`.execute(db)
    }

    return { ready: true }
  } catch (error) {
    writeCompactError("runtime.readiness.failed", error, { dependency: "database" })
    return { ready: false, reason: "required runtime dependency is unavailable" }
  }
}

/**
 * 就绪诊断（**非敏感**，面向"客户第一次跑不通"的自救）。
 *
 * 为什么需要：实测一次真实客户旅程（degit → install → project:init → dev），
 * 登录返回 401「用户名或密码错误」—— 而密码哈希其实是**对的**。
 * 真正原因是**调用方 shell 里导出了 `DB_DRIVER` / `TENANT_*` / `NODE_ENV`**，
 * 它们覆盖了工程内的 `.env.local`，于是应用连到了另一个库（内存库）。
 *
 * README 已写明这个陷阱，但**运行时完全不给线索** —— `/readyz` 当时只回
 * `{"status":"ready"}`，等于"我很健康"，把人推向"密码错了"的错误方向。
 *
 * 这里只暴露**非敏感**信息：驱动名、租户模式、NODE_ENV、是否配了平台账号。
 * 不返回连接串、口令、密钥。
 */
export function getReadinessDiagnostics() {
  const rawUrl = process.env.DATABASE_URL ?? ""
  const scheme = rawUrl.split(":")[0]?.toLowerCase() ?? ""
  const driver =
    process.env.DB_DRIVER?.trim() ||
    (scheme === "postgres" || scheme === "postgresql" ? "postgresql" : scheme === "file" || scheme === "sqlite" ? "sqlite" : "memory")
  const nodeEnv = process.env.NODE_ENV ?? "development"
  const tenantMode = process.env.TENANT_MODE === "required" ? "required" : "disabled"
  const platformUsers = (process.env.TENANT_PLATFORM_USERNAMES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length

  // 只在**真会误导人**的时候给提示，不刷屏。
  const hints: string[] = []
  if (driver === "memory") {
    hints.push("当前使用内存库：数据不落盘，且与 .env.local 里的库不是同一个 —— 若登录报「用户名或密码错误」，先检查 shell 是否导出了 DB_DRIVER/DATABASE_URL。")
  }
  if (nodeEnv === "production") {
    hints.push("NODE_ENV=production：生产分支对 JWT/数据源有额外要求；本地排查时请清掉该变量（它与 .env.local 的取值不同）。")
  }
  if (platformUsers === 0) {
    hints.push("未配置 TENANT_PLATFORM_USERNAMES：平台管理员会被当成租户账号，表现为登录失败。")
  }

  return {
    db: { driver, persistent: driver !== "memory" },
    nodeEnv,
    tenant: { mode: tenantMode, platformUsers },
    hints,
  }
}

export function getLivenessPayload() {
  // Liveness must not inspect configuration, network, or other dependencies.
  // An unready replica remains alive so its orchestrator can restart it safely.
  const domain = process.env.COOLIEBASE_PACK_DOMAIN?.trim()
  return {
    success: true,
    data: {
      status: "live",
      runtime: domain ? "domain" : "monolith",
      domain: domain || "all-next",
    },
  }
}
