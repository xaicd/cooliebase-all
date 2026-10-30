"use client"

import { AIGW_UNIMPLEMENTED_MESSAGE } from "../lib/unimplemented"

/**
 * 对话记录页。
 *
 * 原先是 `<AdminListPageTemplate endpoint="/api/v1/admin/aigw/chats" />` —— 但 aigw 插件
 * **没有声明** `/chats` 路由（`apiRoutes` 只有 channels / chat-completions / embeddings /
 * models / quota / tokens / usages），于是页面每次都打 404、列表永远空。
 * 现在如实说明缺口；等后端补上 `/chats` 再换回列表模板。
 */
export default function AigwChatsPage() {
  return (
    <div className="p-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-base font-bold text-amber-900">对话记录</h1>
        <p className="mt-2 text-sm text-amber-800">{AIGW_UNIMPLEMENTED_MESSAGE}</p>
        <p className="mt-1 text-xs text-amber-700">
          缺的接口：<code className="font-mono">GET /api/v1/plugins/cooliebase.aigw/api/chats</code>
        </p>
      </div>
    </div>
  )
}
