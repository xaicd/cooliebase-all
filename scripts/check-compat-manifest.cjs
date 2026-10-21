/**
 * Compatibility-manifest drift guard.
 *
 * The manifest declares what downstream projects and external agents may bind to.
 * This gate keeps it honest: every claim is checked against the real repository,
 * including the MCP tool list (which must match what the server actually exposes —
 * otherwise the manifest becomes a second source of truth).
 */

const fs = require("fs")
const path = require("path")
const { ROOT, loadCatalog } = require("./lib/domain-catalog.cjs")

const MANIFEST_REL = "packages/shared/contract/compat-manifest.json"

function fail(message) {
  throw new Error(`[compat-manifest] ${message}`)
}

function abs(rel) {
  return path.join(ROOT, ...rel.split("/"))
}

function readJson(rel) {
 const full = abs(rel)
  if (!fs.existsSync(full)) fail(`missing ${rel}`)
  return JSON.parse(fs.readFileSync(full, "utf8"))
}

const manifest = readJson(MANIFEST_REL)
if (manifest.kind !== "compat-manifest") fail(`${MANIFEST_REL} kind must be compat-manifest`)
if (!manifest.framework?.templateVersion) fail("framework.templateVersion is required")
if (!manifest.framework?.role) fail("framework.role is required")

const pkg = readJson("package.json")
const deps = { ...pkg.dependencies, ...pkg.devDependencies }

const declaredEngine = manifest.toolchain?.engine?.node
if (declaredEngine !== pkg.engines?.node) {
  fail(`toolchain.engine.node "${declaredEngine}" != package.json engines.node "${pkg.engines?.node}"`)
}

for (const [name, declared] of Object.entries(manifest.toolchain?.verified || {})) {
  const actual = deps[name]
  if (!actual) fail(`toolchain.verified declares "${name}" but package.json does not depend on it`)
  if (actual !== declared) {
    fail(`toolchain.verified["${name}"] is "${declared}" but package.json has "${actual}"`)
  }
}

const contracts = manifest.contracts || {}
for (const [key, spec] of Object.entries(contracts)) {
  if (!spec || typeof spec !== "object") continue
  if (spec.path && !fs.existsSync(abs(spec.path))) {
    fail(`contracts.${key}.path missing on disk: ${spec.path}`)
  }
}

const catalog = loadCatalog()
const declaredDomains = contracts.domainCatalog?.domains
if (declaredDomains !== catalog.domains.length) {
  fail(`contracts.domainCatalog.domains is ${declaredDomains} but catalog has ${catalog.domains.length}`)
}
if (contracts.domainCatalog?.version !== catalog.version) {
  fail(`contracts.domainCatalog.version is ${contracts.domainCatalog?.version} but catalog has ${catalog.version}`)
}
if (contracts.messagingProtocol !== catalog.messaging?.protocolVersion) {
  fail(
    `contracts.messagingProtocol "${contracts.messagingProtocol}" != catalog messaging.protocolVersion "${catalog.messaging?.protocolVersion}"`,
  )
}

const rpcActions = readJson(contracts.rpcActions?.path || "packages/shared/backend/constants/rpc-actions.json")
const rpcDomainCount = Object.keys(rpcActions.domains || {}).length
if (contracts.rpcActions?.domains !== rpcDomainCount) {
  fail(`contracts.rpcActions.domains is ${contracts.rpcActions?.domains} but rpc-actions.json has ${rpcDomainCount}`)
}

const agentProfile = readJson(contracts.agentProfile?.path || "packages/shared/contract/agent-profile.json")
if (agentProfile.version !== contracts.agentProfile?.version) {
  fail(`contracts.agentProfile.version is ${contracts.agentProfile?.version} but agent-profile.json has ${agentProfile.version}`)
}

const surface = manifest.consumptionSurface || {}
for (const rel of surface.discovery || []) {
  if (!fs.existsSync(abs(rel))) fail(`consumptionSurface.discovery path missing: ${rel}`)
}

const skillsDir = surface.skills?.sourceDir || ".agents/skills"
if (skillsDir !== agentProfile.npc?.skillsDir) {
  fail(`consumptionSurface.skills.sourceDir "${skillsDir}" != agent-profile npc.skillsDir "${agentProfile.npc?.skillsDir}"`)
}
const skillCount = fs
  .readdirSync(abs(skillsDir), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(abs(skillsDir), entry.name, "SKILL.md"))).length
if (surface.skills?.count !== skillCount) {
  fail(`consumptionSurface.skills.count is ${surface.skills?.count} but found ${skillCount} skills in ${skillsDir}`)
}
if (surface.skills?.mirrorDir) {
  fail("consumptionSurface.skills must not declare mirrorDir; .agents/skills is the single source of truth")
}
if (fs.existsSync(abs("docs/skills"))) {
  fail("duplicate skills directory docs/skills must not exist")
}

const mcp = surface.mcp || {}
if (!fs.existsSync(abs(mcp.server || ""))) fail(`consumptionSurface.mcp.server missing: ${mcp.server}`)
const server = require(abs(mcp.server))
const declaredTools = [...(mcp.tools || [])].sort()
const actualTools = [...server.TOOL_NAMES].sort()
if (declaredTools.join(",") !== actualTools.join(",")) {
  fail(
    `consumptionSurface.mcp.tools drifted from the server\n  manifest: ${declaredTools.join(", ")}\n  server:   ${actualTools.join(", ")}`,
  )
}
// 与 skills.count 同样的自我一致性校验 —— 此前**只查了 tools 数组、没查 count**，
// 于是 count 悄悄漂成 17 而 tools 已是 18，门禁全绿。
if (mcp.count !== (mcp.tools || []).length) {
  fail(`consumptionSurface.mcp.count is ${mcp.count} but consumptionSurface.mcp.tools has ${(mcp.tools || []).length} entries`)
}
for (const version of mcp.protocolVersions || []) {
  if (!server.SUPPORTED_PROTOCOL_VERSIONS.includes(version)) {
    fail(`consumptionSurface.mcp.protocolVersions lists "${version}" but the server does not support it`)
  }
}

const evolution = surface.evolution || {}
const evolutionBuilder = String(evolution.builder || "").replace(/^npm run\s+/, "")
if (!evolutionBuilder || !pkg.scripts?.[evolutionBuilder]) {
  fail(`consumptionSurface.evolution.builder must name an existing npm script, got "${evolution.builder}"`)
}
for (const [key, rel] of Object.entries({
  traceArtifact: evolution.traceArtifact,
  backlogArtifact: evolution.backlogArtifact,
})) {
  if (!rel) fail(`consumptionSurface.evolution.${key} is required`)
  // Declared artefacts are produced by the gate chain, so assert placement, not pre-existence:
  // compat:check runs before evolution:backlog in that chain.
  if (!rel.startsWith("docs/architecture/artifacts/")) {
    fail(`consumptionSurface.evolution.${key} must live under docs/architecture/artifacts/, got "${rel}"`)
  }
}

for (const gate of surface.gates || []) {
  if (!pkg.scripts?.[gate]) fail(`consumptionSurface.gates lists "${gate}" but package.json has no such script`)
}

// 非门禁类入口（分诊器 / 自检 / 安装器）单独声明 —— 它们不判质量分，但同样是"对外可调用的面"。
// 塞进 gates 会失真（gates 的语义是"能红的质量门禁"），所以单列并同样校验存在性。
for (const command of surface.commands || []) {
  if (!pkg.scripts?.[command]) fail(`consumptionSurface.commands lists "${command}" but package.json has no such script`)
}

const gateValues = new Set(Object.values(server.GATES))
for (const script of gateValues) {
  if (!pkg.scripts?.[script]) fail(`MCP server gate "${script}" is not a package.json script`)
}

console.log(
  `[compat-manifest] PASS: template ${manifest.framework.templateVersion}, ${catalog.domains.length} domains, ${skillCount} skills, ${actualTools.length} MCP tools, ${(surface.gates || []).length} gates`,
)
