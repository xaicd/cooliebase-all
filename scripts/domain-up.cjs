const { spawnSync } = require("child_process")
const { ROOT, getDomain } = require("./lib/domain-catalog.cjs")

const extraArgs = []
const names = []
for (const token of process.argv.slice(2)) {
  if (token === "--all") names.push("all")
  else if (token.startsWith("-")) extraArgs.push(token)
  else names.push(token)
}

const allInOne = names.length === 0 || names.includes("all") || names.includes("all-next")
const env = { ...process.env }
const profiles = []

if (!allInOne) {
  env.COOLIEBASE_RPC_TOKEN = env.COOLIEBASE_RPC_TOKEN || "dev-rpc-token"
  for (const name of names) {
    const domain = getDomain(name)
    env[domain.upstreamEnv] = env[domain.upstreamEnv] || `http://${domain.name}:3100`
    profiles.push("--profile", domain.name)
  }
}

const result = spawnSync(
  "docker",
  ["compose", "-f", "deploy/docker-compose.domains.yml", ...profiles, "up", "--build", ...extraArgs],
  { cwd: ROOT, env, stdio: "inherit", shell: true },
)
process.exit(result.status ?? 1)
