import type { AiPageQueryInput, AiModelCreateInput, AiChatDeleteInput } from "../validators"
import { domainLog } from "@/modules/shared/backend/lib/domain-log"

const FORBIDDEN_RELAY_KEYWORDS = ["SQL注入测试", "<script>alert", "非法木马", "网络攻击脚本"]

function assertRelayApiKey(apiKey: string) {
  if (!apiKey || apiKey.trim().length < 4) {
    throw Object.assign(new Error("访问令牌无效或已过期"), { status: 401 })
  }
}

function assertRelayContentSafety(messages: { role: string; content: string }[]) {
  const text = messages.map((m) => m.content).join(" ")
  for (const kw of FORBIDDEN_RELAY_KEYWORDS) {
    if (text.includes(kw)) {
      throw Object.assign(new Error(`合规防线提示: 输入内容触发安全审计机制 (${kw})`), { status: 400 })
    }
  }
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 2))
}


type AiModel = {
  id: string
  name: string
  platform: string
  model: string
  apiUrl?: string
  temperature: number
  maxTokens: number
  enabled: boolean
  createdAt: string
}

type AiChat = {
  id: string
  modelId: string
  userId: string
  title: string
  messageCount: number
  createdAt: string
}

const MOCK_AI_MODELS: AiModel[] = [
  { id: "ai-model-001", name: "GPT-4o", platform: "OPENAI", model: "gpt-4o", temperature: 0.7, maxTokens: 4096, enabled: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "ai-model-002", name: "TongyiQianwen", platform: "TONGYI", model: "qwen-max", temperature: 0.8, maxTokens: 8192, enabled: true, createdAt: "2026-02-01T00:00:00.000Z" },
]

const MOCK_AI_CHATS: AiChat[] = [
  { id: "ai-chat-001", modelId: "ai-model-001", userId: "user-001", title: "ProductAnalysis", messageCount: 12, createdAt: "2026-08-01T10:00:00.000Z" },
  { id: "ai-chat-002", modelId: "ai-model-002", userId: "user-002", title: "CodeReview", messageCount: 5, createdAt: "2026-08-02T14:00:00.000Z" },
]

export class AiService {
  static async listModels(input: AiPageQueryInput) {
    domainLog.event("ai.model.list", { page: input.page, pageSize: input.pageSize, hasKeyword: Boolean(input.keyword) })
    let filtered = [...MOCK_AI_MODELS]
    if (input.keyword) {
      const kw = input.keyword.toLowerCase()
      filtered = filtered.filter((m) => m.name.toLowerCase().includes(kw) || m.platform.toLowerCase().includes(kw))
    }
    const start = (input.page - 1) * input.pageSize
    return { items: filtered.slice(start, start + input.pageSize), total: filtered.length, page: input.page, pageSize: input.pageSize }
  }

  static async createModel(input: AiModelCreateInput) {
    const exists = MOCK_AI_MODELS.find((m) => m.name === input.name)
    if (exists) throw new Error("模型名称已存在")
    const id = `ai-model-${Date.now()}`
    const model: AiModel = { id, name: input.name, platform: input.platform, model: input.model, apiUrl: input.apiUrl, temperature: input.temperature, maxTokens: input.maxTokens, enabled: true, createdAt: new Date().toISOString() }
    MOCK_AI_MODELS.push(model)
    domainLog.event("ai.model.create", { modelId: id, name: input.name, platform: input.platform })
    domainLog.audit("ai.model.create", { targetType: "AI_MODEL", targetId: id, name: input.name, platform: input.platform })
    return model
  }

  static async listChats(input: AiPageQueryInput) {
    domainLog.event("ai.chat.list", { page: input.page, pageSize: input.pageSize })
    let filtered = [...MOCK_AI_CHATS]
    if (input.keyword) {
      const kw = input.keyword.toLowerCase()
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(kw))
    }
    const start = (input.page - 1) * input.pageSize
    return { items: filtered.slice(start, start + input.pageSize), total: filtered.length, page: input.page, pageSize: input.pageSize }
  }

  static async deleteChat(input: AiChatDeleteInput) {
    const idx = MOCK_AI_CHATS.findIndex((c) => c.id === input.chatId)
    if (idx === -1) throw new Error("对话记录不存在")
    const [removed] = MOCK_AI_CHATS.splice(idx, 1)
    domainLog.event("ai.chat.delete", { chatId: input.chatId })
    domainLog.audit("ai.chat.delete", { targetType: "AI_CHAT", targetId: input.chatId, title: removed.title })
    return { chatId: input.chatId, deleted: true }
  }

  static async relayChatCompletion(input: {
    apiKey: string
    model: string
    messages: { role: string; content: string }[]
    stream?: boolean
    clientIp?: string
  }) {
    assertRelayApiKey(input.apiKey)
    assertRelayContentSafety(input.messages)
    if (input.stream) {
      throw Object.assign(new Error("流式输出一期未开放"), { status: 400 })
    }
    const last = input.messages[input.messages.length - 1]?.content ?? "Hello"
    const promptTokens = estimateTokens(input.messages.map((m) => m.content).join(" "))
    const reply = `[${input.model}] 收到: ${last.slice(0, 100)}`
    const completionTokens = estimateTokens(reply)
    domainLog.event("ai.relay.chat", { model: input.model, totalTokens: promptTokens + completionTokens })
    return {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: input.model,
      choices: [{ index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    }
  }

  static async listPublicModels(input?: { apiKey?: string }) {
    if (input?.apiKey !== undefined) {
      assertRelayApiKey(input.apiKey)
    }
    return {
      object: "list",
      data: MOCK_AI_MODELS.filter((m) => m.enabled).map((m) => ({
        id: m.model,
        object: "model",
        owned_by: m.platform.toLowerCase(),
      })),
    }
  }

  static async embed(input: { apiKey: string; model?: string; input: string | string[] }) {
    assertRelayApiKey(input.apiKey)
    const model = input.model || "text-embedding-3-small"
    const text = Array.isArray(input.input) ? input.input.join(" ") : input.input
    const promptTokens = estimateTokens(text)
    domainLog.event("ai.relay.embed", { model, totalTokens: promptTokens })
    return {
      object: "list",
      data: [{ object: "embedding", index: 0, embedding: [0.001, 0.002, 0.003] }],
      model,
      usage: { prompt_tokens: promptTokens, total_tokens: promptTokens },
    }
  }
}

export * from "./ai-api-key.service"
export * from "./ai-chat-conversation.service"
export * from "./ai-chat-message.service"
export * from "./ai-chat-role.service"
export * from "./ai-image.service"
export * from "./ai-knowledge-document.service"
export * from "./ai-knowledge-segment.service"
export * from "./ai-knowledge.service"
export * from "./ai-mind-map.service"
export * from "./ai-music.service"
export * from "./ai-tool.service"
export * from "./ai-workflow.service"
export * from "./ai-write.service"


