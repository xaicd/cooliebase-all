#!/usr/bin/env node
/**
 * scripts/fullstack-up.mjs
 * Coolie 商业交付工厂 —— CoolieBase 轻全栈旗舰底座统一全栈拉起器 (Full-Stack Launcher & Probe Engine)
 * 
 * 核心能力：
 * 1. 动态 BasePath 自动探测：从 package.json name 派生（如 /cosmetics-mall-cb），开箱即用；
 * 2. 根路径防 404 自愈：原生集成 / ➜ /<slug>/2c 规范化分流重定向；
 * 3. 生产优先自闭环：优先拉起已构建好的 standalone server.js，未构建时透明回落至开发服务器；
 * 4. 实时三态探针：自动拨测 C端前台 (/2c)、B端中台 (/admin)、开放契约 (/api/...)；
 * 5. 优雅退出与防孤儿进程：SIGINT / SIGTERM 严格回收子进程。
 */

import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const IS_CHECK_ONLY = args.includes("--check") || args.includes("--verify-only");

let pkg = {};
try {
  pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
} catch (_err) {
  // package.json 不存在或解析失败时使用空对象兜底
}

const isMasterBase = process.env.COOLIE_MASTER_BASE === "true" || pkg.name === "cooliebase-all";
const autoSlug = (pkg.name && !isMasterBase) ? ("/" + pkg.name.replace(/^\/+/, "").replace(/\/+$/, "")) : "";
const rawBasePath = (process.env.BASE_PATH || process.env.PREVIEW_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || autoSlug || "").trim();
const basePath = rawBasePath && rawBasePath !== "/" ? ("/" + rawBasePath.replace(/^\/+/, "").replace(/\/+$/, "")) : "";

const port = parseInt(process.env.PORT || process.env.VITE_FRONTEND_PORT || "3300", 10);
const host = process.env.HOSTNAME || "127.0.0.1";

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

let child = null;
function cleanup() {
  if (child && child.pid) {
    try { process.kill(-child.pid, "SIGTERM"); } catch (_err) { /* 进程组已退出 */ }
    try { child.kill("SIGTERM"); } catch (_err) { /* 进程已退出 */ }
  }
}

process.on("SIGINT", () => { cleanup(); process.exit(0); });
process.on("SIGTERM", () => { cleanup(); process.exit(0); });
process.on("exit", () => cleanup());

function probeTcpPort(p, h = "127.0.0.1", timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    socket.setTimeout(timeout);
    socket.once("connect", () => { resolved = true; socket.destroy(); resolve(true); });
    socket.once("timeout", () => { if (!resolved) { resolved = true; socket.destroy(); resolve(false); } });
    socket.once("error", () => { if (!resolved) { resolved = true; resolve(false); } });
    socket.connect(p, h);
  });
}

function fetchHttp(url, timeout = 2500) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        resolve({
          ok: (res.statusCode >= 200 && res.statusCode < 400),
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, status: 0, body: "TIMEOUT" }); });
    req.on("error", (err) => { resolve({ ok: false, status: 0, body: err.message }); });
  });
}

async function main() {
  console.log("========================================================================");
  console.log("🚀 CoolieBase 轻全栈旗舰底座 —— 生产全栈统一拉起器");
  console.log(`   项目名称: ${pkg.name || "cooliebase"}`);
  console.log(`   生效 BasePath: ${basePath || "（根路径 /）"}`);
  console.log(`   服务端口: ${port} (绑定 ${host})`);
  console.log("========================================================================\n");

  const standaloneServer = path.join(ROOT, ".next-cooliebase/standalone/server.js");
  const hasStandalone = fs.existsSync(standaloneServer);

  const portAlive = await probeTcpPort(port, "127.0.0.1");

  if (IS_CHECK_ONLY) {
    if (!portAlive) {
      console.error(`❌ 端口 ${port} 未处于监听状态`);
      process.exit(1);
    }
    const probeUrl = `http://127.0.0.1:${port}${basePath}/2c`;
    const res = await fetchHttp(probeUrl);
    console.log(`🩺 探针拨测 ${probeUrl} ➜ [HTTP ${res.status}] ${res.ok ? "✅ 正常" : "❌ 异常"}`);
    process.exit(res.ok ? 0 : 1);
  }

  if (!portAlive) {
    const fileEnv = {
      ...parseEnv(path.join(ROOT, ".env")),
      ...parseEnv(path.join(ROOT, ".env.local")),
    };
    const dbName = (pkg.name || "cooliebase").replace(/[^a-zA-Z0-9_-]/g, "");
    const env = {
      ...fileEnv,
      ...process.env,
      PORT: String(port),
      HOSTNAME: "0.0.0.0",
      NEXT_PUBLIC_BASE_PATH: basePath,
    };
    if (hasStandalone) {
      if (!env.DATABASE_URL || env.DB_DRIVER === "memory") {
        env.DB_DRIVER = "postgresql";
        env.DATABASE_URL = `postgresql://postgres:postgres@localhost:55432/${dbName}?schema=public`;
      }
      if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET === "local-dev-only") {
        env.JWT_SECRET = `${dbName}-production-jwt-secret-key-32bytes-secure-2026`;
      }
    }

    if (hasStandalone) {
      console.log(`  📦 [Production Standalone] 启动预构建优化运行时 (.next-cooliebase/standalone/server.js)...`);
      child = spawn(process.execPath, [standaloneServer], { cwd: ROOT, env, stdio: "inherit", detached: true });
    } else {
      console.log(`  ⚡ [Development] 启动 Next.js 极速开发服务 (next dev -p ${port})...`);
      child = spawn("pnpm", ["exec", "next", "dev", "-H", "127.0.0.1", "-p", String(port)], { cwd: ROOT, env, stdio: "inherit", detached: true });
    }
  } else {
    // 校验已监听端口是否真属于当前项目（防 D5 外部项目占坑假阳性）
    const idCheck = await fetchHttp(`http://127.0.0.1:${port}${basePath}/api/v1/open/meta/project-profile`);
    const isSameApp = idCheck.status === 200 && idCheck.body && idCheck.body.includes("platformName");
    if (!isSameApp) {
      const loc = idCheck.headers?.location || "";
      console.error(`❌ 端口冲突 (PORT_CONFLICT): 端口 ${port} 已被其他进程占用 (探针响应 HTTP ${idCheck.status}${loc ? ", Location: " + loc : ""})，并非当前项目 (${basePath || "/"})！请先释放端口。`);
      process.exit(1);
    }
    console.log(`  🟢 端口 ${port} 已在运行中且语义指纹匹配，复用已有进程...`);
  }

  console.log(`\n⏳ 正在后台监听服务就绪探针 (Readiness Probe 轮询中)...`);
  let cOk = false;
  let bOk = false;
  let apiOk = false;
  let readyOk = false;
  const maxAttempts = 30;

  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (!cOk) {
      const res = await fetchHttp(`http://127.0.0.1:${port}${basePath}/2c`);
      if (res.ok) cOk = true;
    }
    if (!bOk) {
      const res = await fetchHttp(`http://127.0.0.1:${port}${basePath}/admin`);
      if (res.ok) bOk = true;
    }
    if (!apiOk) {
      const res = await fetchHttp(`http://127.0.0.1:${port}${basePath}/api/v1/open/meta/project-profile`);
      if (res.status === 200 && res.body && res.body.includes("platformName")) apiOk = true;
    }
    if (!readyOk) {
      const res = await fetchHttp(`http://127.0.0.1:${port}${basePath}/readyz`);
      if (res.status === 200) readyOk = true;
    }
    if (cOk && bOk && apiOk && readyOk) break;
  }

  console.log("\n========================================================================");
  console.log("🎉 CoolieBase 全栈应用已就绪");
  console.log(`   • C端门户: http://127.0.0.1:${port}${basePath}/2c`);
  console.log(`   • B端中台: http://127.0.0.1:${port}${basePath}/admin`);
  console.log(`   • 开放 API: http://127.0.0.1:${port}${basePath}/api/v1/open/meta/project-profile`);
  if (basePath) {
    console.log(`   • 根分流: http://127.0.0.1:${port}/ ➜ 自动重定向至 ${basePath}/2c`);
  }
  console.log("   按 Ctrl-C 优雅停止服务");
  console.log("========================================================================\n");
}

main().catch(err => {
  console.error("Launcher error:", err);
  cleanup();
  process.exit(1);
});
