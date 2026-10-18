@echo off
setlocal enabledelayedexpansion
title CoolieBase All Base - Start Manager

cd /d "%~dp0"
set "PATH=%~dp0node_modules\.bin;%PATH%"

echo ================================================================
echo          CoolieBase All Base - Developer Launcher
echo ================================================================
echo.

REM 1. Check Node.js and npm
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js v20+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in PATH.
    echo.
    pause
    exit /b 1
)

REM 2. Auto Detect Directory & Sync Environment
node scripts/auto-detect-env.cjs

set "APP_PORT=3200"
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%A in (`findstr /r "^PORT=" .env 2^>nul`) do (
        if "%%A"=="PORT" set "APP_PORT=%%B"
    )
)

REM 3. Parse Command Line Arguments
if /I "%~1"=="help" goto :help
if /I "%~1"=="-h" goto :help
if /I "%~1"=="--help" goto :help
if /I "%~1"=="app" goto :app
if /I "%~1"=="dev" goto :dev
if /I "%~1"=="infra" goto :infra
if /I "%~1"=="docker" goto :docker
if /I "%~1"=="memory" goto :memory
if /I "%~1"=="check" goto :check
if /I "%~1"=="backup" goto :backup
if /I "%~1"=="status" goto :status
if /I "%~1"=="stop" goto :stop

if not "%~1"=="" (
    echo [ERROR] Unknown mode: %~1
    goto :help
)

REM 4. Interactive Menu Selection
echo Please select startup mode:
echo   [1] Fast Local Dev Mode - Next.js at http://localhost:%APP_PORT% [Recommended]
echo   [2] Full Docker Mode - PostgreSQL:5433 + Redis:6380 + Next.js
echo   [3] Infrastructure Only - Start DB + Redis containers
echo   [4] Architecture Governance Check - npm run check
echo   [5] Stop Project Docker Containers
echo   [6] Database Backup - npm run db:backup
echo.
set "CHOICE=1"
set /p "CHOICE=Enter number [default 1]: "

if "%CHOICE%"=="1" goto :app
if "%CHOICE%"=="2" goto :dev
if "%CHOICE%"=="3" goto :infra
if "%CHOICE%"=="4" goto :check
if "%CHOICE%"=="5" goto :stop
if "%CHOICE%"=="6" goto :backup

echo [WARN] Invalid option selected, defaulting to Fast Local Dev Mode...
goto :app

:app
echo [INFO] Starting Next.js development server...
echo [INFO] Access Homepage: http://localhost:%APP_PORT%
echo [INFO] Access Admin:    http://localhost:%APP_PORT%/login
echo.
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [TIP] If dependencies are missing, run: npm install
)
echo.
echo [INFO] Server process ended.
goto :end

:dev
echo [INFO] Checking Docker environment...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Docker is not installed or not in PATH.
    echo [WARN] Automatically falling back to Fast Local Dev Mode...
    echo.
    goto :app
)

docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] Docker daemon is not running.
    echo [WARN] Automatically falling back to Fast Local Dev Mode...
    echo.
    goto :app
)

echo [STEP] Starting PostgreSQL and Redis containers...
docker compose -f deploy/docker-compose.dev.yml up -d --wait postgres redis
if %errorlevel% neq 0 (
    echo [WARN] Docker containers failed to start. Falling back to local mode...
    goto :app
)

echo [STEP] Applying database migrations and seed data...
call npm run db:generate
call npm run db:migrate
call npm run db:seed
call npm run db:backup

echo [OK] Infrastructure is ready.
goto :app

:infra
echo [INFO] Starting PostgreSQL and Redis containers...
docker compose -f deploy/docker-compose.dev.yml up -d --wait postgres redis
call npm run db:generate
call npm run db:migrate
call npm run db:seed
call npm run db:backup
echo [OK] Infrastructure containers are running.
goto :end

:docker
echo [STEP] Building and starting complete Docker compose stack...
docker compose -f deploy/docker-compose.dev.yml up -d --build
echo [OK] App running in Docker at http://localhost:%APP_PORT%
goto :end

:memory
echo [INFO] Starting in pure in-memory mode...
set "DB_DRIVER=memory"
set "DATABASE_URL=memory://cooliebase-all-base"
set "REDIS_URL="
call npm run dev
goto :end

:check
echo [STEP] Running governance and lint checks...
call npm run check
echo.
goto :end

:backup
echo [STEP] Backing up PostgreSQL database...
call npm run db:backup
echo.
goto :end

:status
docker compose -f deploy/docker-compose.dev.yml ps
goto :end

:stop
echo [STEP] Stopping Docker services...
docker compose -f deploy/docker-compose.dev.yml down
echo [OK] Containers stopped.
goto :end

:help
echo Usage: start.bat [mode]
echo.
echo Available modes:
echo   app     - Fast local Next.js dev server: http://localhost:%APP_PORT%
echo   dev     - Start Docker DB/Redis, migrate, and run Next.js
echo   infra   - Start DB/Redis containers only
echo   docker  - Full Docker containerized deployment
echo   memory  - In-memory dev server
echo   check   - Run matrix, domain, and governance checks
echo   status  - Show Docker container status
echo   stop    - Stop all project containers
echo.
goto :end

:end
echo.
pause
endlocal
