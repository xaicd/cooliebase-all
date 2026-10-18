@echo off
REM ============================================================
REM cooliebase-all-base 一键启动脚本（Windows）
REM 用法: scripts\quick-start.bat [mode]
REM mode: local(默认) | docker
REM ============================================================

setlocal enabledelayedexpansion
cd /d "%~dp0\.."

set MODE=%1
if "%MODE%"=="" set MODE=local

echo.
echo   ======================================
echo      cooliebase-all-base Quick Start
echo      Mode: %MODE%
echo   ======================================
echo.

REM Docker 模式
if "%MODE%"=="docker" (
  echo [STEP] 启动 Docker 容器...
  docker compose -f deploy/docker-compose.local.yml up --build -d
  echo [INFO] 容器已启动
  echo [INFO] 访问: http://localhost:3100
  echo [INFO] 登录: supervip (密码见 .env.local 或终端初始化日志)
  goto :end
)

REM 检查 Node.js
echo [STEP] 1/5 检查环境...
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js 未安装，请先安装 Node.js ^>= 20
  exit /b 1
)
for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_VER=%%a
set NODE_VER=%NODE_VER:v=%
echo [INFO] Node.js 已安装 ✓

REM 安装依赖
echo [STEP] 2/5 安装依赖...
if not exist "node_modules" (
  call npm install --legacy-peer-deps
  echo [INFO] 依赖安装完成 ✓
) else (
  echo [INFO] 依赖已存在，跳过 ✓
)

REM 环境配置
echo [STEP] 3/5 配置环境...
if not exist ".env.local" (
  (
    echo # cooliebase-all-base 本地开发配置
    echo DB_DRIVER=memory
    echo DATABASE_URL=file:./dev.db
    echo JWT_SECRET=cooliebase-all-base-dev-secret-key-2026
    echo JWT_EXPIRES_IN=86400
  ) > .env.local
  echo [INFO] .env.local 已生成 ✓
) else (
  echo [INFO] .env.local 已存在 ✓
)

REM Prisma
echo [STEP] 4/5 Prisma 初始化...
if exist "prisma\schema.prisma" (
  call npx prisma generate 2>nul
)
echo [INFO] Prisma ✓

REM 启动
echo [STEP] 5/5 启动开发服务器...
echo.
echo   ===================================
echo     应用地址: http://localhost:3100
echo     登录页面: http://localhost:3100/login
echo     平台账号: supervip (密码见 .env.local 或终端初始化日志)
echo     数据模式: 内存
echo   ===================================
echo.

call npm run dev

:end
endlocal
