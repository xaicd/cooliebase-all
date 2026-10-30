"use client"

/**
 * 插件 UI 宿主（客户端）。
 *
 * 按 manifest 声明的 `ui.slots` 把插件的预构建组件挂进宿主页面：
 *   1. 从 /api/v1/admin/plugins 取槽位声明
 *   2. 按 slot 的 bundleUrl **动态 import** 插件的预构建 bundle（宿主不编译插件 UI）
 *   3. 取 `exportName` 指向的组件并渲染
 *
 * 三条设计约束：
 *   - **错误隔离**：单个插件加载失败/渲染抛错，只让那一个槽位降级为提示，
 *     **不拖垮整页** —— 这与 worker 侧的失败隔离是同一条原则。
 *   - **运行时 URL import 必须对打包器不可见**：bundle 地址是运行期才知道的，
 *     直接写 import(url) 会被 webpack 当作静态依赖去解析。用 new Function 包一层后
 *     打包器不再看到该表达式（浏览器运行时照常按 ESM 加载）。
 *     （注意：这个手法在 Vitest 的模块运行时下会失败，所以本组件不做单测，
 *      改由服务端的 ui-slots 解析与投送路由承担可测部分。）
 *   - 槽位 id 已由宿主按插件命名空间化，跨插件不会冲突。
 */
import { useEffect, useState, type ComponentType } from "react"
import { apiPath } from "../lib/request"

export type PluginUiSlotType =
  | "page"
  | "dashboardWidget"
  | "detailTab"
  | "settingsPage"
  | "sidebar"
  | "toolbarButton"

type SlotDescriptor = {
  pluginKey: string
  type: PluginUiSlotType
  id: string
  displayName: string
  exportName: string
  routePath?: string
  bundleUrl: string
}

/** 让动态 import 对打包器不可见（见文件头说明）。 */
const importFromUrl = new Function("url", "return import(url)") as (url: string) => Promise<Record<string, unknown>>

type SlotState =
  | { status: "loading" }
  | { status: "ready"; Component: ComponentType<Record<string, unknown>> }
  | { status: "error"; message: string }

export function PluginSlotHost({ type, className }: { type: PluginUiSlotType; className?: string }) {
  const [slots, setSlots] = useState<SlotDescriptor[] | null>(null)
  const [states, setStates] = useState<Record<string, SlotState>>({})

  useEffect(() => {
    let cancelled = false
    fetch(apiPath("/api/v1/admin/plugins"))
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return
        const all: SlotDescriptor[] = payload?.data?.uiSlots ?? []
        const mine = all.filter((slot) => slot.type === type)
        setSlots(mine)
        setStates(Object.fromEntries(mine.map((slot) => [slot.id, { status: "loading" } as SlotState])))
      })
      .catch(() => {
        if (!cancelled) setSlots([])
      })
    return () => {
      cancelled = true
    }
  }, [type])

  useEffect(() => {
    if (!slots?.length) return
    let cancelled = false
    for (const slot of slots) {
      importFromUrl(`${slot.bundleUrl}/${slot.exportName}.js`)
        .then((mod) => {
          if (cancelled) return
          const Component = (mod[slot.exportName] ?? mod.default) as ComponentType<Record<string, unknown>> | undefined
          setStates((prev) => ({
            ...prev,
            [slot.id]: Component
              ? { status: "ready", Component }
              : { status: "error", message: `bundle 未导出 ${slot.exportName}` },
          }))
        })
        .catch((error: unknown) => {
          if (cancelled) return
          setStates((prev) => ({
            ...prev,
            [slot.id]: { status: "error", message: error instanceof Error ? error.message : String(error) },
          }))
        })
    }
    return () => {
      cancelled = true
    }
  }, [slots])

  if (!slots?.length) return null

  return (
    <div className={className} data-plugin-slot-type={type}>
      {slots.map((slot) => {
        const state = states[slot.id] ?? { status: "loading" as const }
        if (state.status === "ready") {
          const Component = state.Component
          return <Component key={slot.id} pluginKey={slot.pluginKey} slotId={slot.id} />
        }
        if (state.status === "error") {
          // 单槽位降级：不抛给整页
          return (
            <div key={slot.id} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              插件 {slot.pluginKey} 的 {slot.displayName} 加载失败：{state.message}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
