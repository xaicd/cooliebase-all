import { type NextRequest } from "next/server"

export interface RealtimeSseMessage {
  id: string
  topic: string
  event: string
  payload: Record<string, unknown>
  publishedAt: string
}

type RealtimeSubscriber = (msg: RealtimeSseMessage) => void

const topicSubscribers = new Map<string, Set<RealtimeSubscriber>>()
const recentHistory: RealtimeSseMessage[] = []

/**
 * 向指定主题广播实时 SSE 消息（对标 Supabase Realtime / PocketBase SSE）
 */
export function publishRealtimeEvent(
  topic: string,
  event: string,
  payload: Record<string, unknown>,
): RealtimeSseMessage {
  const message: RealtimeSseMessage = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    topic,
    event,
    payload,
    publishedAt: new Date().toISOString(),
  }
  recentHistory.push(message)
  if (recentHistory.length > 100) recentHistory.shift()

  const subs = topicSubscribers.get(topic)
  if (subs) {
    for (const cb of subs) cb(message)
  }
  const wildcardSubs = topicSubscribers.get("*")
  if (wildcardSubs && topic !== "*") {
    for (const cb of wildcardSubs) cb(message)
  }
  return message
}

export function getRecentRealtimeEvents(topic?: string): RealtimeSseMessage[] {
  if (!topic || topic === "*") return [...recentHistory]
  return recentHistory.filter((m) => m.topic === topic)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get("topic") || "global"
  const once = searchParams.get("once") === "1"

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const handshake = {
        id: `handshake_${Date.now()}`,
        topic,
        event: "connected",
        recentCount: getRecentRealtimeEvents(topic).length,
        connectedAt: new Date().toISOString(),
      }
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify(handshake)}\n\n`))

      const history = getRecentRealtimeEvents(topic).slice(-5)
      for (const msg of history) {
        controller.enqueue(encoder.encode(`id: ${msg.id}\nevent: ${msg.event}\ndata: ${JSON.stringify(msg)}\n\n`))
      }

      if (once) {
        controller.close()
        return
      }

      const subscriber: RealtimeSubscriber = (msg) => {
        try {
          controller.enqueue(encoder.encode(`id: ${msg.id}\nevent: ${msg.event}\ndata: ${JSON.stringify(msg)}\n\n`))
        } catch {
          // 客户端断开连接时自动移除订阅
          topicSubscribers.get(topic)?.delete(subscriber)
        }
      }

      if (!topicSubscribers.has(topic)) {
        topicSubscribers.set(topic, new Set())
      }
      topicSubscribers.get(topic)!.add(subscriber)

      request.signal.addEventListener("abort", () => {
        topicSubscribers.get(topic)?.delete(subscriber)
      })
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
