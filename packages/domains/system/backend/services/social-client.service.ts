import type { CreateSocialClientInput, SystemModulePageQueryInput, UpdateSocialClientInput } from "../validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

type SocialClientItem = {
  id: string
  name: string
  provider: "WECHAT" | "DOUYIN" | "WEIBO"
  clientId: string
  status: "ACTIVE" | "DISABLED"
}

const SETTING_KEY = "system.social.clients"

function parseItems(value: unknown): SocialClientItem[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is SocialClientItem => Boolean(item && typeof item === "object"))
}

async function load() {
  const setting = await cooliebasePrisma.setting.findUnique({ where: { key: SETTING_KEY } })
  return parseItems(setting?.value)
}

async function save(items: SocialClientItem[]) {
  await cooliebasePrisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: items },
    update: { value: items },
  })
}

export class SystemSocialClientService {
  static async listSocialClients(input: SystemModulePageQueryInput) {
    const items = await load()
    const keyword = input.keyword?.trim().toLowerCase() ?? ""
    const filtered = keyword
      ? items.filter((item) => item.name.toLowerCase().includes(keyword) || item.clientId.toLowerCase().includes(keyword) || item.provider.toLowerCase().includes(keyword))
      : items
    const start = (input.page - 1) * input.pageSize
    domainLog.event("system.socialClient.list", { total: filtered.length })
    return { items: filtered.slice(start, start + input.pageSize), total: filtered.length, page: input.page, pageSize: input.pageSize }
  }

  static async createSocialClient(input: CreateSocialClientInput) {
    const items = await load()
    if (items.some((item) => item.clientId === input.clientId && item.provider === input.provider)) throw new Error(`社交客户端已存在: ${input.provider}/${input.clientId}`)
    const created: SocialClientItem = {
      id: `socc-${Date.now()}`,
      name: input.name ?? "",
      provider: input.provider ?? "WECHAT",
      clientId: input.clientId ?? "",
      status: input.status ?? "ACTIVE",
    }
    await save([created, ...items])
    domainLog.audit("system.socialClient.create", { targetType: "SOCIAL_CLIENT", targetId: created.id })
    return created
  }

  static async getSocialClient(input: { id: string }) {
    const item = (await load()).find((row) => row.id === input.id)
    if (!item) throw new Error("社交客户端不存在")
    return item
  }

  static async updateSocialClient(input: UpdateSocialClientInput) {
    const items = await load()
    const idx = items.findIndex((item) => item.id === input.id)
    if (idx === -1) throw new Error("社交客户端不存在")
    const { id, ...patch } = input
    items[idx] = { ...items[idx], ...patch }
    await save(items)
    domainLog.event("system.socialClient.update", { id })
    return { id }
  }

  static async deleteSocialClient(input: { id: string }) {
    const items = await load()
    const next = items.filter((item) => item.id !== input.id)
    if (next.length === items.length) throw new Error("社交客户端不存在")
    await save(next)
    domainLog.event("system.socialClient.delete", { id: input.id })
    return { success: true }
  }
}
