import { config as dotenvConfig } from "dotenv"
import fs from "node:fs"
import path from "node:path"
import { defineConfig } from "prisma/config"

// Prisma ORM v7 起, datasource 的 url 不再允许写在 schema.prisma 中, 统一由本文件承载。
// 遵循 12-factor 准则：仅在环境变量未显式传入时，才从 .env.local / .env 加载默认配置
if (!process.env.DATABASE_URL) {
  const envLocal = path.resolve(process.cwd(), ".env.local")
  if (fs.existsSync(envLocal)) {
    dotenvConfig({ path: envLocal })
  }
  dotenvConfig()
}

const pgHost = process.env.PGHOST || (fs.existsSync("/host-workspace") ? "172.19.0.1" : "localhost")
const defaultDbUrl = `postgresql://cooliebase:cooliebase123@${pgHost}:5433/cooliebase?schema=public`

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || defaultDbUrl,
    // 仅 `prisma migrate diff --to-migrations` 需要（它要重放迁移到影子库）。
    // 注意**必须条件式带上**：Prisma 会校验该字段不能为空字符串，
    // 写成 `shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL ?? ""` 会让
    // 未设置该变量的所有 prisma 命令（migrate status / resolve / deploy）直接报错。
    ...(process.env.SHADOW_DATABASE_URL ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL } : {}),
  },
})
