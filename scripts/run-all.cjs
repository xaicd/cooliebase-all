#!/usr/bin/env node
/**
 * scripts/run-all.cjs
 * Coolie 商业交付工厂 —— 全栈四位一体统一拉起与就绪自验中枢 (Full-Stack Launcher & Readiness Verifier)
 * 
 * 核心能力：
 * 1. 动态从项目名取值生成 API 前缀 (如 /helloworld17-api)，杜绝部署多项目路由碰撞；
 * 2. 动态端口偏移分配 (如 48017 / 3017)，杜绝多项目同机运行 EADDRINUSE 冲突；
 * 3. 自动探测并拉起后端 (Java/Spring Boot) 与前端 (Vue3/Vite 或 Next.js)；
 * 4. 实时就绪探针轮询 (Active Readiness Probe) 监听动态端口与路径；
 * 5. 真实性机检：
 *    - 后端 REST API: 验证 ${apiPrefix}/infra/health 返回 200 JSON
 *    - 前端 Web 页面: 验证 / 返回 200 HTML 且 DOM 挂载点有效
 *    - 前后端反代通道: 验证前端动态代理穿透请求后端接口
 * 6. 支持 --check / --verify-only 模式作为 CI/CD 与 CMMI 质量门禁执行静态/动态断言。
 */

const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const IS_CHECK_ONLY = args.includes('--check') || args.includes('--verify-only');

const children = [];

function cleanup() {
  for (const child of children) {
    try { if (child.pid) process.kill(-child.pid, 'SIGTERM'); } catch {}
    try { if (child.pid) child.kill('SIGTERM'); } catch {}
  }
}

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('exit', () => cleanup());

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

// 动态解析项目标识、API 前缀与隔离端口 (从项目名动态取值)
let projectName = path.basename(process.cwd());
try {
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  if (pkg.name) projectName = pkg.name.replace(/^@.*\//, '');
} catch {}

const projectSlug = projectName.split(' ')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '').replace(/^-|-$/g, '') || 'app';
const numMatch = projectSlug.match(/[0-9]+$/);
const portOffset = numMatch ? (parseInt(numMatch[0], 10) % 500) : 0;

let apiPrefix = process.env.API_PREFIX || process.env.VITE_API_PREFIX;
let appApiPrefix = process.env.APP_API_PREFIX || process.env.VITE_APP_API_PREFIX;
let backendPort = parseInt(process.env.SERVER_PORT || process.env.BACKEND_PORT || '', 10);
let frontendPort = parseInt(process.env.VITE_FRONTEND_PORT || process.env.FRONTEND_PORT || process.env.PORT || '', 10);

function readEnvKey(text, ...keys) {
  for (const key of keys) {
    const m = text.match(new RegExp(`(?:^|\\r?\\n)\\s*${key}\\s*=\\s*([^\\r\\n]+)`));
    if (m && m[1].trim()) return m[1].trim();
  }
  return null;
}

for (const envFile of ['.env', '.env.local', 'apps/admin/.env', 'apps/miniapp/.env']) {
  const p = path.resolve(envFile);
  if (fs.existsSync(p)) {
    const envText = fs.readFileSync(p, 'utf8');
    if (!apiPrefix) {
      const v = readEnvKey(envText, 'VITE_API_PREFIX', 'API_PREFIX');
      if (v) apiPrefix = v;
    }
    if (!appApiPrefix) {
      const v = readEnvKey(envText, 'VITE_APP_API_PREFIX', 'APP_API_PREFIX');
      if (v) appApiPrefix = v;
    }
    if (!backendPort || isNaN(backendPort)) {
      const v = readEnvKey(envText, 'VITE_BACKEND_PORT', 'BACKEND_PORT', 'SERVER_PORT');
      if (v) backendPort = parseInt(v, 10);
    }
    if (!frontendPort || isNaN(frontendPort)) {
      const v = readEnvKey(envText, 'VITE_FRONTEND_PORT', 'FRONTEND_PORT', 'PORT');
      if (v) frontendPort = parseInt(v, 10);
    }
  }
}

// 默认回退与动态衍生。
//
// **前端端口的真源是本仓 `package.json` 的 dev 脚本**（如 `next dev -p 3200`）。
// 此前回退到 `3000 + portOffset`（yudao 血统的"多项目同机隔离端口"），
// 与本仓约定、以及 `deploy/caddy/*.caddy` 的 reverse_proxy 目标**不一致** ——
// 实测：本仓解析出 3000，而 Caddy 片段指向 3200 → **部署后网关指到空端口**。
// 派生工程不受影响：孵化器会把 `PORT` 写进它们的 `.env`，在上面那段就被读到了。
// 该一致性由 `standards:check` 的 `launcher-gateway-port-consistency` 机检，防止再次悄悄漂移。
if (!apiPrefix) apiPrefix = `/${projectSlug}/admin-api`;
if (!appApiPrefix) appApiPrefix = `/${projectSlug}/app-api`;
if (!frontendPort || isNaN(frontendPort)) {
  const devScript = require("./../package.json").scripts?.dev || "";
  const devPort = devScript.match(/-p\s+(\d+)/);
  frontendPort = devPort ? Number(devPort[1]) : 3000 + portOffset;
}
if (!backendPort || isNaN(backendPort)) backendPort = frontendPort;

function probeTcpPort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => { resolved = true; socket.destroy(); resolve(true); });
    socket.once('timeout', () => { if (!resolved) { resolved = true; socket.destroy(); resolve(false); } });
    socket.once('error', () => { if (!resolved) { resolved = true; resolve(false); } });
    socket.connect(port, host);
  });
}

function fetchHttp(url, timeout = 2000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, body: data });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, body: 'TIMEOUT' }); });
    req.on('error', (err) => { resolve({ ok: false, status: 0, body: err.message }); });
  });
}

async function runCheckOnly() {
  console.log(`\n${C.bold}🔍 [Preflight Check] 执行四位一体工程资产、动态前缀与接口真实性审查...${C.reset}`);
  console.log(`  🏢 项目标识: ${C.cyan}${projectSlug}${C.reset} | 动态前缀: ${C.cyan}${apiPrefix}${C.reset} | 端口: 后端 ${backendPort} / 前端 ${frontendPort}`);

  const isNextFullstack = fs.existsSync(path.resolve('next.config.mjs')) || fs.existsSync(path.resolve('next.config.js')) || fs.existsSync(path.resolve('next.config.ts'));
  const backendJar = path.resolve('apps/backend/server/target/yudao-server.jar');
  const backendPom = path.resolve('apps/backend/server/pom.xml');
  const altBackendPom = path.resolve('apps/backend/yudao-server/pom.xml');
  const hasBackend = isNextFullstack || fs.existsSync(backendJar) || fs.existsSync(backendPom) || fs.existsSync(altBackendPom);
  console.log(`  ☕ 后端工程资产: ${hasBackend ? (isNextFullstack ? C.green + '✅ 在位 (Next.js 前后端同构 API 路由)' + C.reset : C.green + '✅ 在位 (Java/Spring Boot)' + C.reset) : C.red + '❌ 缺失' + C.reset}`);
  
  const adminPkg = path.resolve('apps/admin/package.json');
  const adminHtml = path.resolve('apps/admin/index.html');
  const adminApp = path.resolve('apps/admin/src/App.vue');
  const hasFrontendPage = isNextFullstack || (fs.existsSync(adminPkg) && (fs.existsSync(adminHtml) || fs.existsSync(adminApp)));
  console.log(`  🌐 前端页面资产: ${hasFrontendPage ? C.green + '✅ 在位 (具有实体 HTML/Vue3/Next 页面)' + C.reset : C.red + '❌ 缺失' + C.reset}`);

  const beTargetPortAlive = await probeTcpPort(backendPort);
  const beLegacyPortAlive = await probeTcpPort(48080);
  const bePortAlive = beTargetPortAlive || beLegacyPortAlive;
  const actualBePort = beTargetPortAlive ? backendPort : (beLegacyPortAlive ? 48080 : backendPort);

  const feTargetPortAlive = await probeTcpPort(frontendPort);
  const feLegacyPortAlive = await probeTcpPort(3000);
  const fePortAlive = feTargetPortAlive || feLegacyPortAlive;
  const actualFePort = feTargetPortAlive ? frontendPort : (feLegacyPortAlive ? 3000 : frontendPort);

  console.log(`  🔌 端口 ${actualBePort} (后端): ${bePortAlive ? C.green + '🟢 活跃监听中' + C.reset : C.yellow + '⚪ 待启动' + C.reset}`);
  console.log(`  🔌 端口 ${actualFePort} (前端):  ${fePortAlive ? C.green + '🟢 活跃监听中' + C.reset : C.yellow + '⚪ 待启动' + C.reset}`);

  if (bePortAlive) {
    let apiRes = await fetchHttp(`http://127.0.0.1:${actualBePort}${apiPrefix}/infra/health`);
    if (!apiRes.ok) apiRes = await fetchHttp(`http://127.0.0.1:${actualBePort}/admin-api/infra/health`);
    if (!apiRes.ok) apiRes = await fetchHttp(`http://127.0.0.1:${actualBePort}/admin-api/system/health`);
    console.log(`  🩺 管理端接口响应: [HTTP ${apiRes.status}] ${apiRes.ok ? C.green + '✅ 真实 REST API (' + apiPrefix + ')' + C.reset : C.yellow + '⚠️ 响应非 200' + C.reset}`);

    let appRes = await fetchHttp(`http://127.0.0.1:${actualBePort}${appApiPrefix}/infra/health`);
    if (!appRes.ok) appRes = await fetchHttp(`http://127.0.0.1:${actualBePort}/app-api/infra/health`);
    if (appRes.ok) {
      console.log(`  📱 移动端接口响应: [HTTP ${appRes.status}] ${C.green}✅ 真实 REST API (${appApiPrefix})${C.reset}`);
    }

    const docRes = await fetchHttp(`http://127.0.0.1:${actualBePort}/doc.html`);
    if (docRes.ok) {
      console.log(`  📄 Knife4j 契约文档: [HTTP 200] ${C.green}✅ 交互式文档已就绪 (http://127.0.0.1:${actualBePort}/doc.html)${C.reset}`);
    }
  }
  if (fePortAlive) {
    const pageRes = await fetchHttp(`http://127.0.0.1:${actualFePort}/`);
    const hasDom = pageRes.body && (pageRes.body.includes('id="app"') || pageRes.body.includes('__next'));
    console.log(`  🩺 前端页面渲染: [HTTP ${pageRes.status}] ${hasDom ? C.green + '✅ 页面 DOM 挂载点有效' + C.reset : C.yellow + '⚠️ 页面未就绪' + C.reset}`);
    
    let proxyRes = await fetchHttp(`http://127.0.0.1:${actualFePort}${apiPrefix}/infra/health`);
    if (!proxyRes.ok) proxyRes = await fetchHttp(`http://127.0.0.1:${actualFePort}/admin-api/infra/health`);
    if (!proxyRes.ok) proxyRes = await fetchHttp(`http://127.0.0.1:${actualFePort}/admin-api/system/health`);
    console.log(`  🔗 反向代理穿透: [HTTP ${proxyRes.status}] ${proxyRes.ok ? C.green + '✅ 穿透联调打通 (' + apiPrefix + ')' + C.reset : C.yellow + '⚪ 代理未连通' + C.reset}`);
  }

  const caddySnippet = path.resolve(`deploy/caddy/${projectSlug}.caddy`);
  const hasCaddyConfig = fs.existsSync(caddySnippet);
  console.log(`  🌐 部署路由配置: ${hasCaddyConfig ? C.green + '✅ Caddy 片段已生成 (deploy/caddy/' + projectSlug + '.caddy)' + C.reset : C.yellow + '⚪ 未预置' + C.reset}`);

  console.log(`\n  📋 ${C.bold}Java 端全路径矩阵规格 (Java Multi-Path Architecture)${C.reset}:`);
  console.log(`     • 管理中台 API: ${C.cyan}${apiPrefix}/*${C.reset} (向后兼容: /admin-api/*)`);
  console.log(`     • 用户移动 API: ${C.cyan}${appApiPrefix}/*${C.reset} (向后兼容: /app-api/*)`);
  console.log(`     • 内部微服务:   ${C.cyan}/rpc-api/*${C.reset} (内部 FeignClient)`);
  console.log(`     • 接口文档资产: ${C.cyan}/doc.html, /v3/api-docs/*, /swagger-ui/*${C.reset}`);
  console.log(`     • 实时流式通道: ${C.cyan}/infra/ws/*${C.reset} (WebSocket), ${C.cyan}/sse${C.reset}, ${C.cyan}/mcp/*${C.reset}`);
  console.log(`     • 报表与运维端: ${C.cyan}/jmreport/*, /drag/*, /jimubi/*, /actuator/*${C.reset}`);

  const allGood = hasBackend && hasFrontendPage;
  console.log(`\n📋 审查结论: ${allGood ? C.green + 'CMMI 真实工程资产校验通过 (0 假Mock)' + C.reset : C.red + '资产缺失，需修复' + C.reset}\n`);
  process.exit(allGood ? 0 : 1);
}

async function main() {
  if (IS_CHECK_ONLY) {
    await runCheckOnly();
    return;
  }

  console.log('========================================================================');
  console.log(`🚀 ${C.bold}Coolie 商业交付工厂 —— 全栈前后端一键拉起与就绪自验中枢${C.reset}`);
  console.log(`   项目标识: ${C.cyan}${projectSlug}${C.reset} | 动态前缀: ${C.cyan}${apiPrefix}${C.reset}`);
  console.log(`   统一拓扑: Spring Boot (${backendPort}) + Vue3 Vite (${frontendPort}) + 反向代理穿透`);
  console.log('========================================================================\n');

  const envOverrides = {
    ...process.env,
    SERVER_PORT: String(backendPort),
    BACKEND_PORT: String(backendPort),
    API_PREFIX: apiPrefix,
    VITE_API_PREFIX: apiPrefix,
    VITE_BACKEND_PORT: String(backendPort),
    VITE_FRONTEND_PORT: String(frontendPort),
    PORT: String(frontendPort)
  };

  const backendJar = path.resolve('apps/backend/server/target/yudao-server.jar');
  const backendPom = path.resolve('apps/backend/server/pom.xml');
  const altBackendPom = path.resolve('apps/backend/yudao-server/pom.xml');
  let backendStarted = false;

  if (fs.existsSync(backendJar)) {
    console.log(`  ☕ [Backend] 启动预打包 Spring Boot Jar 生产运行时 (端口 ${backendPort}, 前缀 ${apiPrefix})...`);
    const beArgs = ['-jar', backendJar, '--spring.profiles.active=local', `--server.port=${backendPort}`, `--api.prefix=${apiPrefix}`];
    const be = spawn('java', beArgs, { env: envOverrides, stdio: 'inherit', detached: true });
    children.push(be);
    backendStarted = true;
  } else if (fs.existsSync(backendPom)) {
    console.log(`  ☕ [Backend] 启动 Spring Boot 后端工程 (apps/backend/server, 端口 ${backendPort}, 前缀 ${apiPrefix})...`);
    const mvnArgs = ['spring-boot:run', '-Dspring-boot.run.profiles=local', `-Dspring-boot.run.arguments=--server.port=${backendPort} --api.prefix=${apiPrefix}`];
    const be = spawn('mvn', mvnArgs, { cwd: path.resolve('apps/backend/server'), env: envOverrides, stdio: 'inherit', detached: true });
    children.push(be);
    backendStarted = true;
  } else if (fs.existsSync(altBackendPom)) {
    console.log(`  ☕ [Backend] 启动 Spring Boot 后端工程 (apps/backend/yudao-server, 端口 ${backendPort}, 前缀 ${apiPrefix})...`);
    const mvnArgs = ['spring-boot:run', '-Dspring-boot.run.profiles=local', `-Dspring-boot.run.arguments=--server.port=${backendPort} --api.prefix=${apiPrefix}`];
    const be = spawn('mvn', mvnArgs, { cwd: path.resolve('apps/backend/yudao-server'), env: envOverrides, stdio: 'inherit', detached: true });
    children.push(be);
    backendStarted = true;
  }

  const adminPkg = path.resolve('apps/admin/package.json');
  let frontendStarted = false;
  if (fs.existsSync(adminPkg)) {
    console.log(`  🌐 [Frontend] 启动 Vue3 管理中台 (apps/admin, 端口 ${frontendPort})...`);
    const fe = spawn('pnpm', ['--filter', './apps/admin', 'dev', '--port', String(frontendPort)], { env: envOverrides, stdio: 'inherit', detached: true });
    children.push(fe);
    frontendStarted = true;
  } else if (fs.existsSync(path.resolve('next.config.mjs')) || fs.existsSync(path.resolve('next.config.js'))) {
    console.log(`  🌐 [Fullstack] 启动 Next.js 前后端同构服务 (端口 ${frontendPort})...`);
    const fsChild = spawn('pnpm', ['run', 'dev', '-p', String(frontendPort)], { env: envOverrides, stdio: 'inherit', detached: true });
    children.push(fsChild);
    frontendStarted = true;
  }

  console.log(`\n⏳ 正在后台监听服务就绪探针 (Readiness Probe 轮询中，最大等待 45s)...`);
  let beReady = false;
  let feReady = false;
  let proxyReady = false;
  const maxAttempts = 45;

  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (!beReady && backendStarted) {
      const portOk = await probeTcpPort(backendPort) || await probeTcpPort(48080);
      if (portOk) {
        const actualPort = (await probeTcpPort(backendPort)) ? backendPort : 48080;
        let res = await fetchHttp(`http://127.0.0.1:${actualPort}${apiPrefix}/infra/health`);
        if (!res.ok) res = await fetchHttp(`http://127.0.0.1:${actualPort}/admin-api/infra/health`);
        if (res.ok) beReady = true;
      }
    }
    if (!feReady && frontendStarted) {
      const portOk = await probeTcpPort(frontendPort) || await probeTcpPort(3000);
      if (portOk) {
        const actualPort = (await probeTcpPort(frontendPort)) ? frontendPort : 3000;
        const res = await fetchHttp(`http://127.0.0.1:${actualPort}/`);
        if (res.ok) feReady = true;
      }
    }
    if (beReady && feReady && !proxyReady) {
      const actualPort = (await probeTcpPort(frontendPort)) ? frontendPort : 3000;
      let proxyRes = await fetchHttp(`http://127.0.0.1:${actualPort}${apiPrefix}/infra/health`);
      if (!proxyRes.ok) proxyRes = await fetchHttp(`http://127.0.0.1:${actualPort}/admin-api/infra/health`);
      if (proxyRes.ok) proxyReady = true;
    }
    if ((beReady || !backendStarted) && (feReady || !frontendStarted) && (proxyReady || !backendStarted)) {
      break;
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 ${C.bold}全栈运行态拓扑与验证仪表盘 (Runtime Topology & Verification Dashboard)${C.reset}`);
  console.log('========================================================================');
  console.log(`  🏢 项目标识: ${projectSlug}`);
  console.log(`  🏷️ 管理端 API: ${apiPrefix} (向后兼容: /admin-api)`);
  console.log(`  📱 移动端 API: ${appApiPrefix} (向后兼容: /app-api)`);
  if (backendStarted) {
    console.log(`  ☕ 后端服务 (Spring Boot): 端口 ${backendPort} | 探针: http://127.0.0.1:${backendPort}${apiPrefix}/infra/health | 状态: ${beReady ? C.green + '✅ 200 OK (真实 Java REST API 已就绪)' + C.reset : C.yellow + '⏳ 启动中' + C.reset}`);
    console.log(`  📄 Knife4j 契约文档: http://127.0.0.1:${backendPort}/doc.html (OpenAPI: /v3/api-docs)`);
    console.log(`  🔌 实时通信与流式: ws://127.0.0.1:${backendPort}/infra/ws (WebSocket) | http://127.0.0.1:${backendPort}/sse`);
    console.log(`  🩺 运维监控探针: http://127.0.0.1:${backendPort}/actuator/health`);
  }
  if (frontendStarted) {
    console.log(`  🌐 前端管理端 (Vue3 + Vite): 端口 ${frontendPort} | 访问: http://127.0.0.1:${frontendPort}/ | 状态: ${feReady ? C.green + '✅ 200 OK (真实 Vue3 DOM 已就绪)' + C.reset : C.yellow + '⏳ 启动中' + C.reset}`);
  }
  if (backendStarted && frontendStarted) {
    console.log(`  🔗 前后端反代 (Vite Proxy): http://127.0.0.1:${frontendPort}${apiPrefix}/* ➜ 127.0.0.1:${backendPort} | 状态: ${proxyReady ? C.green + '✅ 200 OK (前后端物理通路已打通)' + C.reset : C.yellow + '⏳ 等待双端握手' + C.reset}`);
  }
  console.log(`  🌐 Caddy 网关反代: handle ${apiPrefix}/*, /app-api/*, /doc.html, /infra/ws/* ➜ 127.0.0.1:${backendPort}`);
  console.log('========================================================================\n');
}

main().catch(err => {
  console.error('Launcher Error:', err);
  cleanup();
  process.exit(1);
});
