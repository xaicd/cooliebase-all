#!/usr/bin/env npx tsx
/**
 * Autonomous Heartbeat Daemon CLI (自主巡检与自愈守护中枢 CLI)
 *
 * 用法:
 *   npx tsx scripts/agent-autopilot-daemon.ts          # 单次主动巡检与自愈 (默认)
 *   npx tsx scripts/agent-autopilot-daemon.ts --heal   # 强制触发全面自愈动作
 *   npx tsx scripts/agent-autopilot-daemon.ts --json   # 仅以纯 JSON 形式输出遥测结果
 *   npx tsx scripts/agent-autopilot-daemon.ts --daemon # 常驻守护模式 (默认 30s 周期)
 */

import { runAutopilotCycle, type AutopilotHeartbeat } from "../packages/shared/backend/lib/agent-autopilot"

async function main() {
  const isJson = process.argv.includes("--json")
  const isDaemon = process.argv.includes("--daemon")
  const forceHeal = process.argv.includes("--heal")

  if (!isJson) {
    console.log("==================================================================")
    console.log("🤖 [cooliebase-all] 自主巡检守护中枢 (Autonomous Heartbeat Daemon)")
    console.log("==================================================================")
  }

  const executeOnce = async () => {
    const report = await runAutopilotCycle({ forceHeal })
    if (isJson) {
      console.log(JSON.stringify(report, null, 2))
      return report
    }

    const badge = report.status === "optimal" ? "🟢 OPTIMAL" : report.status === "degraded" ? "🟡 DEGRADED" : "🔴 CRITICAL"
    console.log(`[${report.timestamp}] 健康度评分: ${report.healthScore}/100 [${badge}] (耗时 ${report.durationMs}ms)`)
    console.log(`  💾 数据库: ${report.database.connected ? "✓ 已连接" : "✗ 异常"} (${report.database.driver}, 延迟 ${report.database.latencyMs}ms)`)
    console.log(`  🌐 领域网格: ${report.domains.healthy}/${report.domains.total} 域正常运行`)
    console.log(`  📬 发件箱: 积压 ${report.outbox.pendingCount} | 失败 ${report.outbox.failedCount} | 自愈修复 ${report.outbox.healedCount}`)
    console.log(`  📜 契约矩阵: ${report.contracts.total} 份契约在位 (${report.contracts.domainsCount} 域)`)

    if (report.healingActions.length > 0) {
      console.log("  🛠️ 执行自愈:")
      for (const act of report.healingActions) console.log(`     ${act}`)
    }
    return report
  }

  const initialReport = await executeOnce()

  if (isDaemon) {
    const intervalSec = Number(process.env.AUTOPILOT_INTERVAL_SEC || 30)
    console.log(`\n⏰ 守护进程已启动，巡检间隔: ${intervalSec}s (按 Ctrl+C 退出)...`)
    const timer = setInterval(async () => {
      await executeOnce()
    }, intervalSec * 1000)

    process.on("SIGINT", () => {
      clearInterval(timer)
      console.log("\n[agent:autopilot] 守护进程已安全优雅退出。")
      process.exit(0)
    })
    process.on("SIGTERM", () => {
      clearInterval(timer)
      process.exit(0)
    })
  } else {
    // 门禁判定: 评分低于 70 则判定不达标
    if (initialReport.healthScore < 70) {
      console.error(`\n✗ [agent:autopilot] 系统健康评分低于 70 (${initialReport.healthScore})，门禁拦截！`)
      process.exit(1)
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[agent:autopilot] 致命错误:", err)
    process.exit(1)
  })
}
