import type { CreateSocialUserInput, SystemModulePageQueryInput } from "../validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

type SocialUserItem = {
  id: string
  provider: "WECHAT" | "DOUYIN" | "WEIBO"
  nickname: string
  externalId: string
  status: "ACTIVE" | "DISABLED"
}

const SETTING_KEY = "system.social.users"

function parseItems<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is T => Boolean(item && typeof item === "object")) as T[]
}

export class SystemSocialService {
  static async listUsers(input: SystemModulePageQueryInput) {
    domainLog.event("system.social.user.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
    })

    const setting = await cooliebasePrisma.setting.findUnique({ where: { key: SETTING_KEY } })
    const items = parseItems<SocialUserItem>(setting?.value)
    const keyword = input.keyword?.trim().toLowerCase() ?? ""
    const filtered = keyword
      ? items.filter(
          (item) =>
            item.nickname.toLowerCase().includes(keyword) ||
            item.externalId.toLowerCase().includes(keyword) ||
            item.provider.toLowerCase().includes(keyword),
        )
      : items

    const start = (input.page - 1) * input.pageSize
    return {
      items: filtered.slice(start, start + input.pageSize),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  static async createUser(operatorId: string, input: CreateSocialUserInput) {
    const setting = await cooliebasePrisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: {},
      create: { key: SETTING_KEY, value: [] },
    })
    const items = parseItems<SocialUserItem>(setting.value)
    const created: SocialUserItem = {
      id: `soc-${Date.now()}`,
      provider: input.provider,
      nickname: input.nickname,
      externalId: input.externalId,
      status: input.status,
    }
    const nextItems = [created, ...items]

    await cooliebasePrisma.setting.update({
      where: { key: SETTING_KEY },
      data: { value: nextItems },
    })

    domainLog.audit("system.social.user.create", {
      operatorId,
      provider: input.provider,
      externalId: input.externalId,
    })

    return created
  }

  static async createSocialUser(input: CreateSocialUserInput & { operatorId?: string }) {
    const { operatorId, ...data } = input
    return this.createUser(operatorId ?? "system", data)
  }
}
