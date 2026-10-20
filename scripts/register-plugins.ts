#!/usr/bin/env pnpm exec tsx
/**
 * 把仓内**第一方插件**登记进 `plugin` 表。
 *
 * 为什么必须有这一步（实测发现的真阻塞）:
 *   挂载点 `/api/v1/plugins/<id>/api/**` **只看数据库里的 manifest_json** ——
 *   因为 `plugin-entry.ts` 的 `definePlugin()` **不含 manifest**，而 manifest 是
 *   `plugin.manifest.json` **文件**，构建后运行期读不到。
 *   于是**全新安装的库里 `plugin` 表为空 → 所有插件接口 404**，运营轨（打真实接口）跑不动。
 *   （孵化器警告过"登记前 404、登记后 200"，但**登记这一步此前没有落地实现**，
 *    静态入口 `FIRST_PARTY_PLUGIN_ENTRIES` 定义了却没人消费。）
 *
 * 用法: pnpm exec tsx scripts/register-plugins.ts [--dry-run]
 */
import fs from "node:fs"
import path from "node:path"
import { Client } from "pg"

const ROOT = path.resolve(__dirname, "..")
const dryRun = process.argv.includes("--dry-run")

interface Row {
  id: string
  pluginKey: string
  packageName: string
  packagePath: string
  version: string
  apiVersion: number
  categories: string[]
  manifest: unknown
}

const rows: Row[] = []
for (const base of ["packages/plugins", "packages/domains"]) {
  const dir = path.join(ROOT, base)
  if (!fs.existsSync(dir)) continue
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const full = path.join(dir, entry.name)
    const file = path.join(full, "plugin.manifest.json")
    if (!fs.existsSync(file)) continue
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"))
    rows.push({
      id: manifest.id,
      pluginKey: manifest.id,
      packageName: entry.name,
      packagePath: path.relative(ROOT, full),
      version: manifest.version ?? "0.0.0",
      apiVersion: Number(String(manifest.apiVersion ?? "v1").replace(/[^0-9]/g, "")) || 1,
      categories: manifest.categories ?? [],
      manifest,
    })
  }
}

if (rows.length === 0) {
  console.error("[plugins] 没找到任何 plugin.manifest.json")
  process.exit(1)
}
console.log(`[plugins] 找到 ${rows.length} 个第一方插件`)
for (const row of rows) console.log(`   ${row.pluginKey}  ${row.version}  ${row.packagePath}`)

if (dryRun) {
  console.log("[plugins] dry-run: 未写库")
  process.exit(0)
}

async function main(): Promise<void> {
  // 与 scripts/seed-postgresql.ts 同一模式: 脚本直连 pg（不经应用层）
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("[plugins] 缺 DATABASE_URL —— 插件登记只对真实库有意义")
    process.exit(2)
  }
  const client = new Client({ connectionString })
  await client.connect()
  try {
    for (const row of rows) {
      const json = JSON.stringify(row.manifest).replace(/'/g, "''")
      const categories = `ARRAY[${(row.categories ?? []).map((item) => `'${String(item).replace(/'/g, "''")}'`).join(",")}]::text[]`
      await client.query(
        `INSERT INTO plugin (id, plugin_key, package_name, package_path, version, api_version, categories, manifest_json, status, runtime_mode, kind, updated_at, deleted) ` +
          `VALUES ($1, $2, $3, $4, $5, $6, ${categories}, $7::jsonb, 'installed', 'merged', 'installed', now(), false) ` +
          `ON CONFLICT (plugin_key) DO UPDATE SET manifest_json = EXCLUDED.manifest_json, version = EXCLUDED.version, ` +
          `api_version = EXCLUDED.api_version, categories = EXCLUDED.categories, package_path = EXCLUDED.package_path, updated_at = now(), deleted = false`,
        [row.id, row.pluginKey, row.packageName, row.packagePath, row.version, row.apiVersion, json],
      )
    }
    const { rows: counted } = await client.query("SELECT count(*)::int AS n FROM plugin")
    console.log(`[plugins] 已登记 ${rows.length} 个插件（merged 形态），表内共 ${counted[0].n} 行`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(`[plugins] 登记失败: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
