import { domainLog } from "@/modules/shared/backend/lib/domain-log"

type RedisKeyItem = { key: string; type: string; ttl: number; size: number }

const MOCK_KEYS: RedisKeyItem[] = [
  { key: "cooliebase:auth:token:1", type: "string", ttl: 86400, size: 256 },
  { key: "cooliebase:cache:dict:system_user_sex", type: "hash", ttl: -1, size: 64 },
  { key: "cooliebase:cache:config:sys.application.name", type: "string", ttl: -1, size: 32 },
  { key: "cooliebase:rate:limit:127.0.0.1", type: "string", ttl: 60, size: 8 },
]

export class RedisService {
  static async getInfo() {
    domainLog.event("infra.redis.info", {})
    return {
      version: "7.2.0",
      mode: "standalone",
      usedMemory: "12.5M",
      connectedClients: 3,
      uptimeInDays: 30,
      keyCount: MOCK_KEYS.length,
    }
  }

  static async listKeys(input: { page: number; pageSize: number; keyword?: string }) {
    let filtered = [...MOCK_KEYS]
    if (input.keyword) { const kw = input.keyword.toLowerCase(); filtered = filtered.filter((k) => k.key.toLowerCase().includes(kw)) }
    const total = filtered.length
    const start = (input.page - 1) * input.pageSize
    return { items: filtered.slice(start, start + input.pageSize), total, page: input.page, pageSize: input.pageSize }
  }

  static async deleteKey(key: string) {
    const idx = MOCK_KEYS.findIndex((k) => k.key === key)
    if (idx !== -1) MOCK_KEYS.splice(idx, 1)
    domainLog.event("infra.redis.deleteKey", { key })
    return { success: true }
  }

  // 兼容旧 route
  static async page(input: any) { return RedisService.listKeys(input) }
  static async get(id: string) { return MOCK_KEYS.find((k) => k.key === id) ?? null }
  static async create(input: any) { return { id: "mock" } }
  static async update(input: any) { return { id: "mock" } }
  static async delete(id: string) { return RedisService.deleteKey(id) }
}
