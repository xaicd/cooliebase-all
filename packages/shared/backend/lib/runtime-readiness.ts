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
