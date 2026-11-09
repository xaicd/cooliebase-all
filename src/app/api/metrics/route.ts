import { NextResponse, type NextRequest } from "next/server"

interface SpanMetricStat {
  count: number
  totalDurationMs: number
  maxDurationMs: number
  slowCount: number
}

const spanStats = new Map<string, SpanMetricStat>()
let httpRequestsTotal = 0
let dbSlowQueriesTotal = 0

/**
 * 记录 HTTP / Service / SQL Span 耗时指标（供 OpenTelemetry & Prometheus `/api/metrics` 采集）
 */
export function recordSpanMetric(operation: string, durationMs: number, slowThresholdMs = 200) {
  httpRequestsTotal += 1
  const current = spanStats.get(operation) ?? {
    count: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
    slowCount: 0,
  }
  current.count += 1
  current.totalDurationMs += durationMs
  if (durationMs > current.maxDurationMs) current.maxDurationMs = durationMs
  if (durationMs >= slowThresholdMs) {
    current.slowCount += 1
    if (operation.startsWith("db.") || operation.startsWith("sql.")) {
      dbSlowQueriesTotal += 1
    }
  }
  spanStats.set(operation, current)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format")
  const mem = process.memoryUsage()
  const uptimeSeconds = Math.floor(process.uptime())

  const operations = Object.fromEntries(spanStats.entries())

  if (format === "json") {
    return NextResponse.json({
      uptimeSeconds,
      httpRequestsTotal,
      dbSlowQueriesTotal,
      memory: {
        rssBytes: mem.rss,
        heapUsedBytes: mem.heapUsed,
        heapTotalBytes: mem.heapTotal,
      },
      operations,
    })
  }

  const lines = [
    "# HELP cooliebase_process_uptime_seconds Process uptime in seconds",
    "# TYPE cooliebase_process_uptime_seconds gauge",
    `cooliebase_process_uptime_seconds ${uptimeSeconds}`,
    "# HELP cooliebase_memory_rss_bytes Resident set size in bytes",
    "# TYPE cooliebase_memory_rss_bytes gauge",
    `cooliebase_memory_rss_bytes ${mem.rss}`,
    "# HELP cooliebase_memory_heap_used_bytes V8 heap used in bytes",
    "# TYPE cooliebase_memory_heap_used_bytes gauge",
    `cooliebase_memory_heap_used_bytes ${mem.heapUsed}`,
    "# HELP cooliebase_http_requests_total Total instrumented operations",
    "# TYPE cooliebase_http_requests_total counter",
    `cooliebase_http_requests_total ${httpRequestsTotal}`,
    "# HELP cooliebase_db_slow_queries_total Total slow DB queries exceeding threshold",
    "# TYPE cooliebase_db_slow_queries_total counter",
    `cooliebase_db_slow_queries_total ${dbSlowQueriesTotal}`,
  ]

  for (const [op, stat] of spanStats.entries()) {
    const safeOp = op.replace(/[^a-zA-Z0-9_.:-]/g, "_")
    lines.push(
      `cooliebase_span_duration_ms_sum{operation="${safeOp}"} ${stat.totalDurationMs.toFixed(2)}`,
      `cooliebase_span_duration_ms_count{operation="${safeOp}"} ${stat.count}`,
      `cooliebase_span_duration_ms_max{operation="${safeOp}"} ${stat.maxDurationMs.toFixed(2)}`,
    )
  }

  return new NextResponse(`${lines.join("\n")}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
