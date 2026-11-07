#!/usr/bin/env node
/**
 * scripts/port-registry.cjs
 * 交付底座通用端口注册表管理库 (Port Registry Manager)
 * 路径真源: ~/.coolie/ports.json
 * 支撑指令: claim | check | release | list
 */

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const REGISTRY_DIR = path.join(os.homedir(), ".coolie");
const REGISTRY_FILE = path.join(REGISTRY_DIR, "ports.json");

function readRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) return { ports: {} };
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
  } catch {
    return { ports: {} };
  }
}

function writeRegistry(data) {
  fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), "utf8");
}

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

function claimPort(port, slug, pid) {
  const data = readRegistry();
  const existing = data.ports[port];
  if (existing && existing.pid && isPidAlive(existing.pid)) {
    if (existing.slug !== slug) {
      console.error(`[port-registry] ❌ 冲突: 端口 ${port} 已被项目 "${existing.slug}" (PID: ${existing.pid}) 独占监听！`);
      return false;
    }
  }
  data.ports[port] = {
    slug,
    pid: Number(pid),
    claimedAt: new Date().toISOString(),
  };
  writeRegistry(data);
  console.log(`[port-registry] ✅ 端口 ${port} 登记成功 (项目: ${slug}, PID: ${pid})`);
  return true;
}

function checkPort(port, slug) {
  const data = readRegistry();
  const existing = data.ports[port];
  if (existing && existing.pid && isPidAlive(existing.pid)) {
    if (existing.slug !== slug) {
      console.error(`[port-registry] ❌ 端口 ${port} 正由外部项目 "${existing.slug}" (PID: ${existing.pid}) 占用`);
      return false;
    }
  }
  return true;
}

function releasePort(port, slug) {
  const data = readRegistry();
  const existing = data.ports[port];
  if (existing) {
    if (!slug || existing.slug === slug) {
      delete data.ports[port];
      writeRegistry(data);
      console.log(`[port-registry] 🧹 端口 ${port} 已释放登记`);
      return true;
    }
  }
  return false;
}

function listPorts() {
  const data = readRegistry();
  console.log("=== Coolie 交付底座端口注册表 (~/.coolie/ports.json) ===");
  console.table(Object.entries(data.ports).map(([port, info]) => ({
    port,
    slug: info.slug,
    pid: info.pid,
    alive: isPidAlive(info.pid),
    claimedAt: info.claimedAt,
  })));
}

// CLI 路由
const [cmd, argPort, argSlug, argPid] = process.argv.slice(2);
switch (cmd) {
  case "claim":
    if (!argPort || !argSlug || !argPid) {
      console.error("用法: node port-registry.cjs claim <port> <slug> <pid>");
      process.exit(1);
    }
    process.exit(claimPort(argPort, argSlug, argPid) ? 0 : 1);
  case "check":
    if (!argPort || !argSlug) {
      console.error("用法: node port-registry.cjs check <port> <slug>");
      process.exit(1);
    }
    process.exit(checkPort(argPort, argSlug) ? 0 : 1);
  case "release":
    if (!argPort) {
      console.error("用法: node port-registry.cjs release <port> [slug]");
      process.exit(1);
    }
    process.exit(releasePort(argPort, argSlug) ? 0 : 1);
  case "list":
    listPorts();
    process.exit(0);
  default:
    console.log("支持命令: claim | check | release | list");
    process.exit(0);
}
