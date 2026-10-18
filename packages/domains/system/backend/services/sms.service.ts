import type { CreateSmsChannelInput, SystemModulePageQueryInput } from "../validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"

type SmsChannelItem = {
  id: string
  name: string
  signName: string
  status: "ACTIVE" | "DISABLED"
}

type SmsLogItem = {
  id: string
  channelName: string
  mobileMask: string
  status: "SUCCESS" | "FAIL"
  sentAt: string
}

const CHANNELS_SETTING_KEY = "system.sms.channels"
const LOGS_SETTING_KEY = "system.sms.logs"

function parseItems<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is T => Boolean(item && typeof item === "object")) as T[]
}

export class SystemSmsService {
  static async listChannels(input: SystemModulePageQueryInput) {
    domainLog.event("system.sms.channel.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
    })

    const setting = await cooliebasePrisma.setting.findUnique({ where: { key: CHANNELS_SETTING_KEY } })
    const items = parseItems<SmsChannelItem>(setting?.value)
    const keyword = input.keyword?.trim().toLowerCase() ?? ""
    const filtered = keyword
      ? items.filter(
          (item) => item.name.toLowerCase().includes(keyword) || item.signName.toLowerCase().includes(keyword),
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

  static async createChannel(operatorId: string, input: CreateSmsChannelInput) {
    const setting = await cooliebasePrisma.setting.upsert({
      where: { key: CHANNELS_SETTING_KEY },
      update: {},
      create: { key: CHANNELS_SETTING_KEY, value: [] },
    })
    const items = parseItems<SmsChannelItem>(setting.value)
    const created: SmsChannelItem = {
      id: `smsc-${Date.now()}`,
      name: input.name,
      signName: input.signName,
      status: input.status,
    }
    const nextItems = [created, ...items]

    await cooliebasePrisma.setting.update({
      where: { key: CHANNELS_SETTING_KEY },
      data: { value: nextItems },
    })

    domainLog.audit("system.sms.channel.create", {
      operatorId,
      channelName: input.name,
    })

    return created
  }

  static async listLogs(input: SystemModulePageQueryInput) {
    domainLog.event("system.sms.log.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
    })

    const setting = await cooliebasePrisma.setting.findUnique({ where: { key: LOGS_SETTING_KEY } })
    const items = parseItems<SmsLogItem>(setting?.value)
    const keyword = input.keyword?.trim().toLowerCase() ?? ""
    const filtered = keyword
      ? items.filter(
          (item) => item.channelName.toLowerCase().includes(keyword) || item.mobileMask.toLowerCase().includes(keyword),
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

  static async createSmsChannel(input: CreateSmsChannelInput & { operatorId?: string }) {
    const { operatorId, ...data } = input
    return this.createChannel(operatorId ?? "system", data)
  }
}
