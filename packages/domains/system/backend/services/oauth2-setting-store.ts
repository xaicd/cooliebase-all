import type { Prisma } from "@prisma/client"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"
import { projectProfile } from "@/modules/shared/contract/project-profile"

export type Oauth2ClientItem = {
  id: string
  clientId: string
  clientSecret: string
  name: string
  status: "ACTIVE" | "DISABLED"
}

export type Oauth2TokenItem = {
  id: string
  clientId: string
  userId: string
  username: string
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export const CLIENTS_SETTING_KEY = "system.oauth2.clients"
export const TOKENS_SETTING_KEY = "system.oauth2.tokens"

export const DEFAULT_CLIENTS: Oauth2ClientItem[] = [
  {
    id: "oc-001",
    clientId: "admin-web",
    clientSecret: "admin-web-secret",
    name: `${projectProfile.shortName}管理后台`,
    status: "ACTIVE",
  },
  {
    id: "oc-002",
    clientId: "merchant-h5",
    clientSecret: "merchant-h5-secret",
    name: "商户 H5",
    status: "ACTIVE",
  },
]

function listValue<T>(items: T[]): Prisma.InputJsonValue {
  return { items: items as Prisma.InputJsonArray }
}

export async function readSettingList<T>(key: string, defaults: T[] = []): Promise<T[]> {
  const row = await cooliebasePrisma.setting.findUnique({ where: { key } })
  const items = (row?.value as { items?: T[] } | null)?.items
  if (Array.isArray(items)) {
    return items as T[]
  }

  if (defaults.length > 0) {
    await cooliebasePrisma.setting.upsert({
      where: { key },
      create: { key, value: listValue(defaults) },
      update: { value: listValue(defaults) },
    })
  }

  return defaults
}

export async function writeSettingList<T>(key: string, items: T[]) {
  await cooliebasePrisma.setting.upsert({
    where: { key },
    create: { key, value: listValue(items) },
    update: { value: listValue(items) },
  })
}