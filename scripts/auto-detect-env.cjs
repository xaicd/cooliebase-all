const fs = require("node:fs")
const path = require("node:path")

function fixBinShims(rootDir) {
  const binDir = path.join(rootDir, "node_modules", ".bin")
  if (!fs.existsSync(binDir)) return
  try {
    const files = fs.readdirSync(binDir)
    for (const file of files) {
      if (file.startsWith(".") && file.includes("-")) {
        const cleanName = file.replace(/^\./, "").replace(/-[a-zA-Z0-9]+$/, "")
        const targetPath = path.join(binDir, cleanName)
        const srcPath = path.join(binDir, file)
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(srcPath, targetPath)
        }
      }
    }
    const prismaCmd = path.join(binDir, "prisma.cmd")
    if (!fs.existsSync(prismaCmd)) {
      const content = `@ECHO off\nGOTO start\n:find_dp0\nSET dp0=%~dp0\nEXIT /b\n:start\nSETLOCAL\nCALL :find_dp0\nIF EXIST "%dp0%\\node.exe" (\n  SET "_prog=%dp0%\\node.exe"\n) ELSE (\n  SET "_prog=node"\n  SET PATHEXT=%PATHEXT:;.JS;=;%\n)\nendLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\..\\prisma\\build\\index.js" %*\n`
      fs.writeFileSync(prismaCmd, content, "utf8")
    }
  } catch {}
}

function autoDetectAndSyncEnv() {
  const rootDir = process.cwd()
  fixBinShims(rootDir)
  const dirName = path.basename(rootDir)
  
  // 从目录名推导数据库名 (如 agent-zqall -> agent_zqall, cooliebase-all-base -> cooliebase_next)
  let derivedDbName = dirName.toLowerCase().replace(/[^a-z0-9_]/g, "_")
  if (derivedDbName === "cooliebase_all_next") {
    derivedDbName = "cooliebase_next" // 兼容 cooliebase 默认库名
  }

  const envPath = path.join(rootDir, ".env")
  const envExamplePath = path.join(rootDir, ".env.example")
  const pkgPath = path.join(rootDir, "package.json")

  let envContent = ""
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8")
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf8")
  } else {
    envContent = `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/${derivedDbName}?schema=public"\nPORT=3100\n`
  }

  // 1. 如果没有 DATABASE_URL，注入推导出的数据库名
  if (!envContent.includes("DATABASE_URL=")) {
    envContent += `\nDATABASE_URL="postgresql://postgres:postgres@localhost:5433/${derivedDbName}?schema=public"\n`
  }

  // 2. 解析当前配置的数据库名
  const dbMatch = envContent.match(/DATABASE_URL=["']?postgresql:\/\/[^/]+\/([^?#"']+)/)
  const currentDb = dbMatch ? dbMatch[1] : derivedDbName

  // 3. 读取当前端口
  const portMatch = envContent.match(/^PORT=(\d+)/m)
  let currentPort = portMatch ? portMatch[1] : "3100"

  // 4. 同步 package.json 中的工程名
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
      if (pkg.name !== dirName && dirName !== "cooliebase-all-base") {
        pkg.name = dirName
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8")
      }
    } catch {}
  }

  // 写回 .env
  fs.writeFileSync(envPath, envContent, "utf8")

  console.log("----------------------------------------------------------------")
  console.log(`  📁 工程目录:  ${dirName}`)
  console.log(`  🗄️  数据库名:  ${currentDb} (自动匹配隔离)`)
  console.log(`  🌐 服务端口:  ${currentPort} (http://localhost:${currentPort})`)
  console.log("----------------------------------------------------------------")
}

autoDetectAndSyncEnv()
