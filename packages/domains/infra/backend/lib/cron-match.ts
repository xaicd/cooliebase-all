/**
 * Minimal 5/6-field cron matcher. Supports Unix and Quartz `?` wildcards used by CoolieBase jobs.
 */
function fieldMatches(expr: string, value: number, min: number, max: number): boolean {
  if (expr === "*" || expr === "?") return true
  return expr.split(",").some((part) => {
    const stepMatch = /^(\*|\d+(?:-\d+)?)\/(\d+)$/.exec(part)
    if (stepMatch) {
      const range = stepMatch[1]
      const step = Number(stepMatch[2])
      if (range === "*") return (value - min) % step === 0
      const [from, to] = range.includes("-") ? range.split("-").map(Number) : [Number(range), max]
      return value >= from && value <= to && (value - from) % step === 0
    }
    if (part.includes("-")) {
      const [from, to] = part.split("-").map(Number)
      return value >= from && value <= to
    }
    return Number(part) === value
  })
}

export function cronMatches(expression: string, date: Date): boolean {
  const parts = expression.trim().split(/\s+/)
  if (parts.length === 6) {
    const [, minute, hour, day, month, weekday] = parts
    return fieldMatches(minute, date.getMinutes(), 0, 59)
      && fieldMatches(hour, date.getHours(), 0, 23)
      && fieldMatches(day, date.getDate(), 1, 31)
      && fieldMatches(month, date.getMonth() + 1, 1, 12)
      && fieldMatches(weekday, date.getDay(), 0, 7)
  }
  if (parts.length === 5) {
    const [minute, hour, day, month, weekday] = parts
    return fieldMatches(minute, date.getMinutes(), 0, 59)
      && fieldMatches(hour, date.getHours(), 0, 23)
      && fieldMatches(day, date.getDate(), 1, 31)
      && fieldMatches(month, date.getMonth() + 1, 1, 12)
      && fieldMatches(weekday, date.getDay(), 0, 7)
  }
  throw new Error(`不支持的 cron 表达式: ${expression}`)
}
