import { z } from "zod"
import rawClientChannels from "./client-channels.json"

const surfaceSchema = z.object({
  id: z.enum(["admin", "app", "open", "internal"]),
  prefix: z.string().startsWith("/api/"),
  auth: z.enum(["admin-jwt", "member-jwt", "public-or-signature", "service-token"]),
  audience: z.enum(["admin", "app", "open", "internal"]),
  usedBy: z.array(z.string().min(1)),
})

const channelSchema = z.object({
  id: z.enum(["admin-web", "expo", "miniapp"]),
  name: z.string().min(1).max(32),
  kind: z.enum(["web", "mini-program", "native", "desktop"]),
  surface: z.enum(["admin", "app", "open", "internal"]),
  workspace: z.string().min(1),
  runtime: z.string().min(1),
  status: z.enum(["ga", "standard-only"]),
  platforms: z.array(z.string().min(1)).min(1),
  tokenStore: z.string().min(1),
  packageKind: z.enum(["in-repo-admin", "standalone"]),
  notes: z.string().min(1),
  /** 覆盖 packageLayout.requiredSourceDirs（各渠道源码结构本就不同，默认仍是 app/shared/modules）。 */
  requiredSourceDirs: z.array(z.string().min(1)).optional(),
})

const packageLayoutSchema = z.object({
  requiredSourceDirs: z.tuple([z.literal("app"), z.literal("shared"), z.literal("modules")]),
  moduleSubdirs: z.tuple([z.literal("api"), z.literal("models"), z.literal("pages"), z.literal("components")]),
  sourceRootByRuntime: z.record(z.string(), z.string().min(1)),
  manifestByRuntime: z.record(z.string(), z.string().min(1)),
})

export const clientChannelsSchema = z.object({
  version: z.literal("v1"),
  channelHeader: z.literal("X-Client-Channel"),
  identity: z.object({
    profilePath: z.string().startsWith("/api/v1/open/"),
    channelsPath: z.string().startsWith("/api/v1/open/"),
    errorCatalogPath: z.string().startsWith("/api/v1/open/"),
    openapiPath: z.string().startsWith("/api/v1/open/"),
  }),
  surfaces: z.array(surfaceSchema).length(4),
  channels: z.array(channelSchema).min(1),
  rules: z.array(z.string().min(1)).min(1),
  packageLayout: packageLayoutSchema,
}).superRefine((catalog, ctx) => {
  for (const channel of catalog.channels) {
    if (!catalog.packageLayout.sourceRootByRuntime[channel.runtime]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `缺少 runtime 源码根: ${channel.id} / ${channel.runtime}` })
    }
    if (!catalog.packageLayout.manifestByRuntime[channel.runtime]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `缺少 runtime 包清单: ${channel.id} / ${channel.runtime}` })
    }
  }
})

export type ClientChannelsCatalog = z.infer<typeof clientChannelsSchema>
export type ClientChannel = ClientChannelsCatalog["channels"][number]
export type ApiSurface = ClientChannelsCatalog["surfaces"][number]
export type ClientPackageLayout = ClientChannelsCatalog["packageLayout"]

export const clientChannels: ClientChannelsCatalog = clientChannelsSchema.parse(rawClientChannels)

export function listClientChannelsBySurface(surface: ApiSurface["id"]): ClientChannel[] {
  return clientChannels.channels.filter((channel) => channel.surface === surface)
}

export function getClientChannel(id: ClientChannel["id"]): ClientChannel {
  const channel = clientChannels.channels.find((item) => item.id === id)
  if (!channel) throw new Error(`未知客户端渠道: ${id}`)
  return channel
}

export function listStandaloneClientChannels(): ClientChannel[] {
  return clientChannels.channels.filter((channel) => channel.packageKind === "standalone")
}

export function sourceRootForChannel(channel: ClientChannel): string {
  const root = clientChannels.packageLayout.sourceRootByRuntime[channel.runtime]
  if (!root) throw new Error(`未配置源码根: ${channel.runtime}`)
  return root
}

export function manifestForChannel(channel: ClientChannel): string {
  const manifest = clientChannels.packageLayout.manifestByRuntime[channel.runtime]
  if (!manifest) throw new Error(`未配置包清单: ${channel.runtime}`)
  return manifest
}
