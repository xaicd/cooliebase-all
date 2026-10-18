const fs = require("node:fs")
const path = require("node:path")
const { execSync } = require("node:child_process")

const ROOT = path.resolve(__dirname, "..")
const BACKUP_DIR = path.join(ROOT, "backups")

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

function cleanOldBackups(maxKeep = 10) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("db_backup_") && f.endsWith(".sql"))
      .map((f) => ({
        name: f,
        fullPath: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime)

    if (files.length > maxKeep) {
      for (const item of files.slice(maxKeep)) {
        try {
          fs.unlinkSync(item.fullPath)
        } catch {}
      }
    }
  } catch {}
}

function runBackup() {
  ensureBackupDir()
  const pad = (n) => String(n).padStart(2, "0")
  const now = new Date()
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const outFile = path.join(BACKUP_DIR, `db_backup_${stamp}.sql`)

  // 1. 优先尝试从正在运行的 Docker 容器执行 pg_dump
  try {
    const containers = execSync("docker ps --filter \"status=running\" --format \"{{.Names}}\"", { stdio: ["pipe", "pipe", "ignore"], encoding: "utf8" })
    const candidateList = containers.split("\n").map((s) => s.trim()).filter((name) => name.includes("postgres") || name.includes("cooliebase"))
    for (const containerName of candidateList) {
      try {
        console.log(`[BACKUP] Attempting backup from active container: ${containerName}`)
        execSync(`docker exec -t ${containerName} pg_dump -U postgres -d cooliebase_next > "${outFile}"`, { stdio: ["pipe", "pipe", "ignore"], shell: true })
        if (fs.existsSync(outFile) && fs.statSync(outFile).size > 100) {
          console.log(`[OK] PostgreSQL database successfully backed up to: backups/db_backup_${stamp}.sql (${fs.statSync(outFile).size} bytes)`)
          cleanOldBackups(10)
          return
        }
      } catch {}
    }
  } catch {}

  // 2. 尝试通过本地 pg_dump 工具连接端口备份
  const ports = [5433, 5432]
  for (const port of ports) {
    try {
      execSync(`pg_dump -h localhost -p ${port} -U postgres -d cooliebase_next -f "${outFile}"`, {
        stdio: ["pipe", "pipe", "ignore"],
        env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || "postgres" },
      })
      if (fs.existsSync(outFile) && fs.statSync(outFile).size > 100) {
        console.log(`[OK] PostgreSQL database successfully backed up via localhost:${port} to: backups/db_backup_${stamp}.sql`)
        cleanOldBackups(10)
        return
      }
    } catch {}
  }

  console.log(`[BACKUP] Note: PostgreSQL database is not online yet; backup will execute when container is up.`)
}

if (require.main === module) {
  runBackup()
}

module.exports = { runBackup }
