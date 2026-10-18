import type {
  Oauth2OpenTokenInput,
  Oauth2UserInfoInput,
  PageQueryInput,
} from "@/modules/system/backend/validators"
import { projectProfile } from "@/modules/shared/contract/project-profile"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"
import { comparePasswordMD5 } from "@/modules/shared/backend/lib/crypto"
import { cooliebasePrisma } from "@/modules/shared/backend/prisma"
import {
  readSettingList,
  writeSettingList,
  type Oauth2ClientItem,
  type Oauth2TokenItem,
  DEFAULT_CLIENTS,
  CLIENTS_SETTING_KEY,
  TOKENS_SETTING_KEY,
} from "./oauth2-setting-store"

function verifyStoredPassword(password: string, storedHash: string, salt?: string | null) {
  return comparePasswordMD5(password, storedHash, salt ?? undefined)
}

export class SystemOauth2Service {
  static async listClients(input: PageQueryInput) {
    domainLog.event("system.oauth2.client.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
    })

    const keyword = input.keyword?.toLowerCase() ?? ""
    const clients = await readSettingList<Oauth2ClientItem>(CLIENTS_SETTING_KEY, DEFAULT_CLIENTS)
    const filtered = keyword
      ? clients.filter(
          (item) =>
            item.clientId.toLowerCase().includes(keyword) ||
            item.name.toLowerCase().includes(keyword),
        )
      : clients

    const start = (input.page - 1) * input.pageSize
    return {
      items: filtered.slice(start, start + input.pageSize).map(({ clientSecret: _clientSecret, ...client }) => client),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  static async listTokens(input: PageQueryInput) {
    domainLog.event("system.oauth2.token.list", {
      page: input.page,
      pageSize: input.pageSize,
      hasKeyword: Boolean(input.keyword),
    })

    const keyword = input.keyword?.toLowerCase() ?? ""
    const tokens = await readSettingList<Oauth2TokenItem>(TOKENS_SETTING_KEY)
    const filtered = keyword
      ? tokens.filter(
          (item) =>
            item.clientId.toLowerCase().includes(keyword) ||
            item.userId.toLowerCase().includes(keyword),
        )
      : tokens

    const start = (input.page - 1) * input.pageSize
    return {
      items: filtered.slice(start, start + input.pageSize).map(({ accessToken: _accessToken, refreshToken: _refreshToken, ...token }) => token),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize,
    }
  }

  static async openToken(input: Oauth2OpenTokenInput) {
    domainLog.event("system.oauth2.open.token", {
      clientId: input.clientId,
      grantType: input.grantType,
    })

    const clients = await readSettingList<Oauth2ClientItem>(CLIENTS_SETTING_KEY, DEFAULT_CLIENTS)
    const client = clients.find(
      (item) => item.clientId === input.clientId && item.status === "ACTIVE",
    )
    if (!client) {
      throw new Error("客户端不存在或已禁用")
    }

    if (client.clientSecret !== input.clientSecret) {
      throw new Error("客户端密钥错误")
    }

    if (
      input.grantType === "password" &&
      (!input.username || !input.password)
    ) {
      throw new Error("用户名或密码错误")
    }

    let userId = "u-system"
    let username = "system-client"

    if (input.grantType === "password") {
      const admin = await cooliebasePrisma.admin.findFirst({
        where: {
          OR: [{ username: input.username }, { phone: input.username }],
        },
        select: { id: true, username: true, phone: true, password: true, salt: true, status: true },
      })
      if (!admin || admin.status !== "ACTIVE" || !verifyStoredPassword(input.password, admin.password, admin.salt)) {
        throw new Error("用户名或密码错误")
      }
      userId = admin.id
      username = admin.username ?? admin.phone
    }

    const accessToken = `oauth2-${input.clientId}-${Math.random().toString(36).slice(2, 10)}`
    const refreshToken = `refresh-${Math.random().toString(36).slice(2, 10)}`
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
    const tokens = await readSettingList<Oauth2TokenItem>(TOKENS_SETTING_KEY)

    domainLog.audit("system.oauth2.open.token.issue", {
      clientId: input.clientId,
      userId,
    })

    await writeSettingList(TOKENS_SETTING_KEY, [
      {
        id: `ot-${Date.now()}`,
        clientId: input.clientId,
        userId,
        username,
        accessToken,
        refreshToken,
        expiresAt,
      },
      ...tokens.filter((item) => item.accessToken !== accessToken),
    ])

    return {
      tokenType: "Bearer",
      accessToken,
      refreshToken,
      expiresIn: 3600,
      scope: "all",
    }
  }

  static async getUserInfo(input: Oauth2UserInfoInput) {
    domainLog.event("system.oauth2.user.get", {
      tokenPreview: input.accessToken.slice(0, 12),
    })

    const tokens = await readSettingList<Oauth2TokenItem>(TOKENS_SETTING_KEY)
    const user = tokens.find((item) => item.accessToken === input.accessToken)
    if (!user) {
      throw new Error("accessToken 无效")
    }

    if (new Date(user.expiresAt).getTime() < Date.now()) {
      throw new Error("accessToken 无效")
    }

    return {
      userId: user.userId,
      username: user.username,
      clientId: user.clientId,
      roles: user.userId === "u-001" ? ["PLATFORM_ADMIN"] : ["SYSTEM_CLIENT"],
      permissions: user.userId === "u-001" ? ["*"] : ["system:oauth2:open"],
    }
  }
}
