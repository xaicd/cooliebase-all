import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

declare global {
  // eslint-disable-next-line no-var
  var __cooliebaseAllBasePrisma__: PrismaClient | undefined
}

function createClient(): PrismaClient {
  try {
    // Prisma ORM v7 起, 连接不再由 schema 提供, 必须显式传入驱动适配器。
    // 适配器是惰性的: 缺少 DATABASE_URL 时构造仍会成功, 查询阶段才抛错 ——
    // 因此已不存在"无库时静默返回空结果"的路径, 配置错误会在使用点显性暴露。
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    })
  } catch (error) {
    // 构造失败属配置错误, 此处刻意不降级为空实现(mock): 静默返回空结果会把配置故障
    // 伪装成"没有数据", 比直接失败危险得多。
    throw new Error(`[cooliebasePrisma] PrismaClient 构造失败: ${String(error)}`)
  }
}

export const cooliebasePrisma = globalThis.__cooliebaseAllBasePrisma__ ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.__cooliebaseAllBasePrisma__ = cooliebasePrisma
}
